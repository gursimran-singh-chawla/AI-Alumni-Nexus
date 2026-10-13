import express from "express";
import { body, query } from "express-validator";
import User from "../models/User.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { handleValidation, parsePagination } from "../middleware/validate.js";
import { createNotification } from "../utils/notify.js";

const router = express.Router();

router.get("/me", verifyToken, (req, res) => res.json(req.user));

router.put(
  "/me",
  verifyToken,
  [
    body("fullName").optional().trim().isLength({ min: 2 }).withMessage("Full name is too short"),
    body("mentorAvailabilityStatus").optional().isIn(["available", "busy", "unavailable"]),
    body("preferredCommunicationMethods").optional().isArray()
  ],
  handleValidation,
  async (req, res) => {
    try {
      const allowed = [
        "fullName", "bio", "college", "branch", "year", "company", "jobRole", "experience", "location", "skills", "interests",
        "github", "linkedin", "leetcode", "avatar", "mentorshipAvailability", "mentorAvailabilityStatus", "mentorTimeSlots",
        "preferredCommunicationMethods", "emailNotificationEnabled", "notificationPreferences"
      ];
      const updates = {};
      allowed.forEach((k) => {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      });

      const user = await User.findById(req.user._id);
      Object.assign(user, updates);
      user.calcProfileComplete();
      await user.save();

      res.json({ message: "Profile updated", user });
    } catch {
      res.status(500).json({ message: "Update failed" });
    }
  }
);

router.get(
  "/alumni",
  verifyToken,
  parsePagination,
  [query("available").optional().isBoolean().toBoolean()],
  handleValidation,
  async (req, res) => {
    const { search, skills, available, verificationStatus, expertise, location, yearsActive } = req.query;
    const { skip, limit, page } = req.pagination;

    const filter = { role: "alumni" };
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { college: { $regex: search, $options: "i" } },
        { jobRole: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } }
      ];
    }
    if (skills) filter.skills = { $in: skills.split(",") };
    if (expertise) {
      filter.skills = { $regex: expertise, $options: "i" };
    }
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }
    if (yearsActive) {
      if (yearsActive === "0-2") filter.experience = { $gte: 0, $lte: 2 };
      else if (yearsActive === "2-5") filter.experience = { $gte: 2, $lte: 5 };
      else if (yearsActive === "5-10") filter.experience = { $gte: 5, $lte: 10 };
      else if (yearsActive === "10+") filter.experience = { $gte: 10 };
    }
    if (available === true || available === "true") filter.mentorAvailabilityStatus = "available";

    const [alumni, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({ data: alumni, total, page, pages: Math.ceil(total / limit) });
  }
);

router.get("/students", verifyToken, requireRole(["admin"]), async (_req, res) => {
  const students = await User.find({ role: "student" }).select("-password").populate("mentor", "fullName company");
  res.json(students);
});

router.get("/all", verifyToken, requireRole(["admin"]), parsePagination, async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const [users, total] = await Promise.all([
    User.find().select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments()
  ]);
  res.json({ data: users, total, page, pages: Math.ceil(total / limit) });
});

router.get("/stats", verifyToken, requireRole(["admin"]), async (_req, res) => {
  const [totalUsers, alumni, students, admins] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "alumni" }),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "admin" })
  ]);
  const mentorsAvailable = await User.countDocuments({ role: "alumni", mentorAvailabilityStatus: "available" });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyReg = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  const skillsAgg = await User.aggregate([
    { $unwind: "$skills" },
    { $group: { _id: "$skills", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 }
  ]);

  const companiesAgg = await User.aggregate([
    { $match: { company: { $ne: "" } } },
    { $group: { _id: "$company", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 }
  ]);

  const pendingAlumniVerifications = await User.countDocuments({ role: "alumni", verificationStatus: "pending" });

  res.json({
    totalUsers,
    alumni,
    students,
    admins,
    mentorsAvailable,
    pendingAlumniVerifications,
    monthlyRegistrations: monthlyReg,
    topSkills: skillsAgg,
    topCompanies: companiesAgg
  });
});

router.get("/alumni-verifications", verifyToken, requireRole(["admin"]), parsePagination, async (req, res) => {
  const { status = "pending" } = req.query;
  const { skip, limit, page } = req.pagination;

  const filter = { role: "alumni", verificationStatus: status };
  const [rows, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({ data: rows, total, page, pages: Math.ceil(total / limit) });
});

router.put(
  "/alumni-verifications/:id/decision",
  verifyToken,
  requireRole(["admin"]),
  [body("decision").isIn(["verified", "rejected"]), body("reason").optional().isString()],
  handleValidation,
  async (req, res) => {
    const { decision, reason = "" } = req.body;
    const candidate = await User.findById(req.params.id);
    if (!candidate || candidate.role !== "alumni") return res.status(404).json({ message: "Alumni not found" });

    if (decision === "verified" && !candidate.emailVerified) {
      return res.status(400).json({ message: "Alumni college email must be verified before admin approval" });
    }

    candidate.verificationStatus = decision;
    candidate.verificationRejectionReason = decision === "rejected" ? reason : "";
    candidate.verificationReviewedAt = new Date();
    candidate.verificationReviewedBy = req.user._id;
    await candidate.save();

    await createNotification({
      userId: candidate._id,
      type: "system",
      title: `Alumni verification ${decision}`,
      text: decision === "verified"
        ? "Your alumni account is now verified. You can post opportunities and mentor students."
        : `Your alumni verification was rejected${reason ? `: ${reason}` : ""}.`
    });

    res.json({ message: `Alumni account marked as ${decision}` });
  }
);

router.get("/:id", verifyToken, async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").populate("connections", "fullName avatar role company");
  if (!user) return res.status(404).json({ message: "User not found" });

  if (req.user._id.toString() !== user._id.toString()) {
    await createNotification({
      userId: user._id,
      type: "profile_viewed",
      title: "Profile viewed",
      text: `${req.user.fullName} viewed your profile`,
      meta: { viewedBy: req.user._id }
    });
  }

  res.json(user);
});

router.post("/:id/connect", verifyToken, async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: "User not found" });
  if (target.connections.includes(req.user._id)) return res.status(400).json({ message: "Already connected" });

  if (!target.pendingRequests.includes(req.user._id)) {
    target.pendingRequests.push(req.user._id);
    await target.save();
    await createNotification({
      userId: target._id,
      type: "system",
      title: "New connection request",
      text: `${req.user.fullName} sent you a connection request`
    });
  }
  res.json({ message: "Connection request sent" });
});

router.post("/:id/accept", verifyToken, async (req, res) => {
  const requester = await User.findById(req.params.id);
  if (!requester) return res.status(404).json({ message: "User not found" });
  const me = await User.findById(req.user._id);

  me.pendingRequests = me.pendingRequests.filter((id) => id.toString() !== req.params.id);
  if (!me.connections.includes(req.params.id)) me.connections.push(req.params.id);
  if (!requester.connections.includes(me._id)) requester.connections.push(me._id);
  await Promise.all([me.save(), requester.save()]);

  await createNotification({
    userId: requester._id,
    type: "system",
    title: "Connection accepted",
    text: `${me.fullName} accepted your connection request`
  });

  res.json({ message: "Connected!" });
});

router.put("/:studentId/assign-mentor/:mentorId", verifyToken, requireRole(["admin"]), async (req, res) => {
  const student = await User.findById(req.params.studentId);
  const mentor = await User.findById(req.params.mentorId);
  if (!student || !mentor) return res.status(404).json({ message: "Not found" });
  student.mentor = mentor._id;
  if (!mentor.mentees.includes(student._id)) mentor.mentees.push(student._id);
  await Promise.all([student.save(), mentor.save()]);

  await Promise.all([
    createNotification({ userId: mentor._id, type: "system", title: "Mentor assignment", text: `You have been assigned as mentor to ${student.fullName}` }),
    createNotification({ userId: student._id, type: "system", title: "Mentor assigned", text: `${mentor.fullName} is now your mentor` })
  ]);

  res.json({ message: "Mentor assigned successfully" });
});

router.put("/:id/role", verifyToken, requireRole(["admin"]), [body("role").isIn(["student", "alumni", "admin"])], handleValidation, async (req, res) => {
  const { role } = req.body;
  await User.findByIdAndUpdate(req.params.id, { role });
  res.json({ message: "Role updated" });
});

// Backward compatibility endpoint
router.put("/me/notifications/read", verifyToken, async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $set: { "notifications.$[].read": true } });
  res.json({ message: "Marked read" });
});

export default router;
