import express from "express";
import { body } from "express-validator";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { handleValidation, parsePagination } from "../middleware/validate.js";
import { createBulkNotification } from "../utils/notify.js";

const router = express.Router();

router.get("/", verifyToken, parsePagination, async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const [events, total] = await Promise.all([
    Event.find().sort({ date: 1 }).skip(skip).limit(limit).populate("organizer", "fullName"),
    Event.countDocuments()
  ]);
  res.json({ data: events, total, page, pages: Math.ceil(total / limit) });
});

router.post(
  "/",
  verifyToken,
  requireRole(["admin"]),
  [body("title").trim().notEmpty(), body("date").isISO8601().toDate(), body("type").optional().isIn(["webinar", "meetup", "workshop", "hackathon"])],
  handleValidation,
  async (req, res) => {
    const { title, description, date, location, type } = req.body;
    const event = await Event.create({ title, description, date, location, type, organizer: req.user._id });

    const userIds = (await User.find({ isActive: true }).select("_id")).map((u) => u._id);
    await createBulkNotification({
      userIds,
      type: "new_event",
      title: "New event announced",
      text: `${title} has been announced. Check details and register!`,
      meta: { eventId: event._id }
    });

    res.status(201).json(event);
  }
);

router.post("/:id/register", verifyToken, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (!event.registrations.includes(req.user._id)) {
    event.registrations.push(req.user._id);
    await event.save();
  }
  res.json({ message: "Registered", count: event.registrations.length });
});

router.delete("/:id", verifyToken, requireRole(["admin"]), async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: "Event deleted" });
});

export default router;
