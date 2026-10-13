import express from "express";
import { body, query } from "express-validator";
import User from "../models/User.js";
import MentorshipSession from "../models/MentorshipSession.js";
import { verifyToken, requireVerifiedAlumni } from "../middleware/auth.js";
import { handleValidation, parsePagination } from "../middleware/validate.js";
import { createNotification } from "../utils/notify.js";

const router = express.Router();

router.get("/mentors", verifyToken, parsePagination, async (req, res) => {
  const { skills, department, availabilityStatus } = req.query;
  const { skip, limit, page } = req.pagination;
  const filter = {
    role: "alumni",
    verificationStatus: "verified",
    emailVerified: true
  };

  if (availabilityStatus) filter.mentorAvailabilityStatus = availabilityStatus;
  if (skills) filter.skills = { $in: skills.split(",") };
  if (department) filter.branch = { $regex: department, $options: "i" };

  const [data, total] = await Promise.all([
    User.find(filter)
      .select("fullName avatar company jobRole skills branch mentorAvailabilityStatus mentorTimeSlots preferredCommunicationMethods")
      .sort({ mentorAvailabilityStatus: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({ data, total, page, pages: Math.ceil(total / limit) });
});

router.get("/suggestions", verifyToken, async (req, res) => {
  const me = await User.findById(req.user._id);
  const skillSet = me.skills || [];

  const suggestions = await User.find({
    role: "alumni",
    verificationStatus: "verified",
    emailVerified: true,
    mentorAvailabilityStatus: { $in: ["available", "busy"] },
    $or: [{ branch: me.branch }, { skills: { $in: skillSet } }]
  })
    .select("fullName company jobRole skills branch mentorAvailabilityStatus")
    .limit(8);

  res.json({ data: suggestions });
});

router.put(
  "/availability",
  verifyToken,
  requireVerifiedAlumni,
  [
    body("mentorAvailabilityStatus").isIn(["available", "busy", "unavailable"]),
    body("mentorTimeSlots").optional().isArray(),
    body("preferredCommunicationMethods").optional().isArray()
  ],
  handleValidation,
  async (req, res) => {
    const { mentorAvailabilityStatus, mentorTimeSlots = [], preferredCommunicationMethods = ["in_app"] } = req.body;
    const user = await User.findById(req.user._id);
    user.mentorshipAvailability = mentorAvailabilityStatus === "available";
    user.mentorAvailabilityStatus = mentorAvailabilityStatus;
    user.mentorTimeSlots = mentorTimeSlots;
    user.preferredCommunicationMethods = preferredCommunicationMethods;
    await user.save();

    res.json({ message: "Mentor availability updated", user });
  }
);

router.post(
  "/sessions/request",
  verifyToken,
  [
    body("mentorId").isMongoId(),
    body("requestedSlot").isISO8601().toDate(),
    body("communicationMethod").isIn(["in_app", "email", "video_call"]),
    body("agenda").optional().isString()
  ],
  handleValidation,
  async (req, res) => {
    const { mentorId, requestedSlot, communicationMethod, agenda = "" } = req.body;

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== "alumni" || mentor.verificationStatus !== "verified") {
      return res.status(404).json({ message: "Mentor unavailable" });
    }

    const session = await MentorshipSession.create({
      mentor: mentorId,
      mentee: req.user._id,
      requestedSlot,
      communicationMethod,
      agenda,
      status: "requested"
    });

    await createNotification({
      userId: mentorId,
      type: "mentorship_request",
      title: "New mentorship request",
      text: `${req.user.fullName} requested a mentorship session`,
      meta: { sessionId: session._id }
    });

    res.status(201).json(session);
  }
);

router.put(
  "/sessions/:id/respond",
  verifyToken,
  [body("decision").isIn(["accept", "reject"]), body("scheduledAt").optional().isISO8601().toDate(), body("videoCallLink").optional().isString()],
  handleValidation,
  async (req, res) => {
    const { decision, scheduledAt, videoCallLink = "", note = "" } = req.body;
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.mentor.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Only assigned mentor can respond" });

    if (decision === "accept") {
      session.status = "upcoming";
      session.scheduledAt = scheduledAt || session.requestedSlot;
      session.videoCallLink = videoCallLink;
    } else {
      session.status = "rejected";
      session.mentorResponseNote = note;
    }
    await session.save();

    await createNotification({
      userId: session.mentee,
      type: decision === "accept" ? "mentorship_accepted" : "mentorship_rejected",
      title: `Mentorship request ${decision}ed`,
      text: decision === "accept" ? "Your mentorship request has been accepted" : "Your mentorship request was rejected",
      meta: { sessionId: session._id }
    });

    res.json({ message: `Session ${decision}ed`, session });
  }
);

router.put(
  "/sessions/:id/status",
  verifyToken,
  [body("status").isIn(["completed", "cancelled"])],
  handleValidation,
  async (req, res) => {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    const mine = [session.mentor.toString(), session.mentee.toString()].includes(req.user._id.toString());
    if (!mine) return res.status(403).json({ message: "Not authorized" });

    session.status = req.body.status;
    await session.save();
    res.json({ message: "Session status updated", session });
  }
);

router.post(
  "/sessions/:id/feedback",
  verifyToken,
  [body("rating").isInt({ min: 1, max: 5 }), body("comment").optional().isString()],
  handleValidation,
  async (req, res) => {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.mentee.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Only mentee can submit feedback" });
    if (session.status !== "completed") return res.status(400).json({ message: "Feedback can be submitted only for completed sessions" });

    session.feedback = {
      rating: req.body.rating,
      comment: req.body.comment || "",
      submittedAt: new Date()
    };
    await session.save();

    res.json({ message: "Feedback submitted", session });
  }
);

router.get("/sessions", verifyToken, parsePagination, [query("status").optional().isString()], handleValidation, async (req, res) => {
  const { status } = req.query;
  const { skip, limit, page } = req.pagination;

  const filter = {
    $or: [{ mentor: req.user._id }, { mentee: req.user._id }]
  };
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    MentorshipSession.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("mentor", "fullName company")
      .populate("mentee", "fullName college"),
    MentorshipSession.countDocuments(filter)
  ]);

  res.json({ data, total, page, pages: Math.ceil(total / limit) });
});

export default router;
