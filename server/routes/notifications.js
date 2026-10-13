import express from "express";
import Notification from "../models/Notification.js";
import { verifyToken } from "../middleware/auth.js";
import { parsePagination } from "../middleware/validate.js";

const router = express.Router();

router.get("/", verifyToken, parsePagination, async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const { type, readStatus, read } = req.query;
  const filter = { user: req.user._id };

  if (type) filter.type = type;
  if (readStatus === "read" || read === "true") filter.read = true;
  if (readStatus === "unread" || read === "false") filter.read = false;

  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, read: false })
  ]);

  res.json({ data, total, page, pages: Math.ceil(total / limit), unreadCount });
});

router.put("/mark-all/read", verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});

router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const result = await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { $set: { read: true } });
    if (result.matchedCount === 0) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification marked as read" });
  } catch {
    res.status(400).json({ message: "Invalid notification ID" });
  }
});

router.put("/:id/unread", verifyToken, async (req, res) => {
  try {
    const result = await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { $set: { read: false } });
    if (result.matchedCount === 0) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification marked as unread" });
  } catch {
    res.status(400).json({ message: "Invalid notification ID" });
  }
});

router.delete("/batch", verifyToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "List of notification IDs required" });
    }
    const result = await Notification.deleteMany({ _id: { $in: ids }, user: req.user._id });
    res.json({ message: `Deleted ${result.deletedCount} notifications`, deletedCount: result.deletedCount });
  } catch {
    res.status(500).json({ message: "Failed to delete notifications" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const result = await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch {
    res.status(400).json({ message: "Invalid notification ID" });
  }
});

export default router;
