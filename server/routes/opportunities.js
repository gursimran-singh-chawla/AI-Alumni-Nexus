import express from "express";
import { body } from "express-validator";
import Opportunity from "../models/Opportunity.js";
import OpportunityApplication from "../models/OpportunityApplication.js";
import { verifyToken, requireVerifiedAlumni } from "../middleware/auth.js";
import { handleValidation, parsePagination } from "../middleware/validate.js";
import { createBulkNotification, createNotification } from "../utils/notify.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", verifyToken, parsePagination, async (req, res) => {
  const { search, type, skills, location, company } = req.query;
  const { skip, limit, page } = req.pagination;

  const filter = { isActive: true };
  if (type) filter.type = type;
  if (location) filter.location = { $regex: location, $options: "i" };
  if (company) filter.company = { $regex: company, $options: "i" };
  if (skills) filter.skills = { $in: skills.split(",") };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } }
    ];
  }

  const [data, total] = await Promise.all([
    Opportunity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("postedBy", "fullName company"),
    Opportunity.countDocuments(filter)
  ]);

  res.json({ data, total, page, pages: Math.ceil(total / limit) });
});

router.post(
  "/",
  verifyToken,
  requireVerifiedAlumni,
  [
    body("title").trim().notEmpty(),
    body("description").trim().notEmpty().isLength({ min: 20 }),
    body("type").isIn(["internship", "job", "referral", "hackathon"]),
    body("skills").optional().isArray()
  ],
  handleValidation,
  async (req, res) => {
    const payload = { ...req.body, postedBy: req.user._id };
    const opportunity = await Opportunity.create(payload);

    const studentIds = (await User.find({ role: "student", isActive: true }).select("_id")).map((u) => u._id);
    await createBulkNotification({
      userIds: studentIds,
      type: "new_opportunity",
      title: `New ${opportunity.type} opportunity`,
      text: `${opportunity.title} at ${opportunity.company || "a company"}`,
      meta: { opportunityId: opportunity._id }
    });

    res.status(201).json(opportunity);
  }
);

router.get("/mine/posted", verifyToken, requireVerifiedAlumni, parsePagination, async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const [data, total] = await Promise.all([
    Opportunity.find({ postedBy: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Opportunity.countDocuments({ postedBy: req.user._id })
  ]);
  res.json({ data, total, page, pages: Math.ceil(total / limit) });
});

router.get("/mine/applications", verifyToken, parsePagination, async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const [data, total] = await Promise.all([
    OpportunityApplication.find({ applicant: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("opportunity")
      .populate("referralBy", "fullName company"),
    OpportunityApplication.countDocuments({ applicant: req.user._id })
  ]);
  res.json({ data, total, page, pages: Math.ceil(total / limit) });
});

router.post(
  "/:id/apply",
  verifyToken,
  [body("coverLetter").optional().isString(), body("referralBy").optional().isMongoId()],
  handleValidation,
  async (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ message: "Only students can apply" });

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity || !opportunity.isActive) return res.status(404).json({ message: "Opportunity not found" });

    const application = await OpportunityApplication.create({
      opportunity: opportunity._id,
      applicant: req.user._id,
      coverLetter: req.body.coverLetter || "",
      referralBy: req.body.referralBy || null
    });

    if (req.body.referralBy) {
      opportunity.referralsCount += 1;
      await opportunity.save();
    }

    await createNotification({
      userId: opportunity.postedBy,
      type: "system",
      title: "New application",
      text: `${req.user.fullName} applied to ${opportunity.title}`,
      meta: { opportunityId: opportunity._id, applicationId: application._id }
    });

    res.status(201).json(application);
  }
);

router.get("/:id/applications", verifyToken, requireVerifiedAlumni, parsePagination, async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);
  if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
  if (opportunity.postedBy.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });

  const { skip, limit, page } = req.pagination;
  const filter = { opportunity: req.params.id };
  const [data, total] = await Promise.all([
    OpportunityApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("applicant", "fullName email college branch skills")
      .populate("referralBy", "fullName company"),
    OpportunityApplication.countDocuments(filter)
  ]);

  res.json({ data, total, page, pages: Math.ceil(total / limit) });
});

router.put(
  "/applications/:applicationId/status",
  verifyToken,
  requireVerifiedAlumni,
  [body("status").isIn(["applied", "reviewing", "shortlisted", "rejected", "selected"])],
  handleValidation,
  async (req, res) => {
    const application = await OpportunityApplication.findById(req.params.applicationId).populate("opportunity");
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (application.opportunity.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    application.status = req.body.status;
    await application.save();

    await createNotification({
      userId: application.applicant,
      type: "application_status",
      title: "Application status updated",
      text: `Your application for ${application.opportunity.title} is now ${application.status}`,
      meta: { applicationId: application._id }
    });

    res.json({ message: "Application status updated", application });
  }
);

export default router;
