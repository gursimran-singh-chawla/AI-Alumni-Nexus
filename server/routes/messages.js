import express from "express";
import { body } from "express-validator";
import Message from "../models/Message.js";
import { verifyToken } from "../middleware/auth.js";
import { handleValidation, parsePagination } from "../middleware/validate.js";
import { createNotification } from "../utils/notify.js";

const router = express.Router();

router.get("/conversations/list", verifyToken, async (req, res) => {
  const userId = req.user._id.toString();
  const msgs = await Message.find({ $or: [{ from: req.user._id }, { to: req.user._id }] })
    .sort({ createdAt: -1 })
    .populate("from", "fullName avatar")
    .populate("to", "fullName avatar");

  const convMap = {};
  msgs.forEach((m) => {
    if (!m.from) return;
    const fromId = m.from._id ? m.from._id.toString() : m.from.toString();
    const partner = fromId === userId ? m.to : m.from;
    if (!partner || !partner._id) return;
    const pid = partner._id.toString();
    if (!convMap[pid]) {
      convMap[pid] = { partner, lastMessage: m.text, time: m.createdAt };
    }
  });
  res.json(Object.values(convMap));
});

router.get("/:room", verifyToken, parsePagination, async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const [msgs, total] = await Promise.all([
    Message.find({ room: req.params.room })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("from", "fullName avatar")
      .populate("to", "fullName avatar"),
    Message.countDocuments({ room: req.params.room })
  ]);

  res.json({ data: msgs.reverse(), total, page, pages: Math.ceil(total / limit) });
});

router.post(
  "/",
  verifyToken,
  [body("room").notEmpty(), body("text").trim().notEmpty().isLength({ max: 1000 }), body("to").optional().isMongoId()],
  handleValidation,
  async (req, res) => {
    const { room, to, text } = req.body;
    const msg = await Message.create({ room, from: req.user._id, to, text });
    const populated = await msg.populate("from", "fullName avatar");

    if (to && to !== req.user._id.toString()) {
      await createNotification({
        userId: to,
        type: "new_message",
        title: "New message",
        text: `${req.user.fullName} sent you a message`,
        meta: { room }
      });
    }

    res.status(201).json(populated);
  }
);

export default router;
