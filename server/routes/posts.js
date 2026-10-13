import express from "express";
import { body } from "express-validator";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";
import { handleValidation, parsePagination } from "../middleware/validate.js";

const router = express.Router();

router.get("/feed", verifyToken, parsePagination, async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const [posts, total] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "fullName role avatar company verificationStatus")
      .populate("comments.author", "fullName avatar"),
    Post.countDocuments()
  ]);
  res.json({ posts, total, page, pages: Math.ceil(total / limit) });
});

router.post(
  "/",
  verifyToken,
  [body("content").trim().notEmpty().isLength({ max: 2000 }), body("type").optional().isIn(["general", "job", "event", "achievement"])],
  handleValidation,
  async (req, res) => {
    try {
      const { content, imageUrl, tags, type } = req.body;
      const post = await Post.create({ author: req.user._id, content, imageUrl, tags: tags || [], type: type || "general" });
      const populated = await post.populate("author", "fullName role avatar company verificationStatus");
      res.status(201).json(populated);
    } catch {
      res.status(500).json({ message: "Failed to create post" });
    }
  }
);

router.put("/:id/like", verifyToken, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  const userId = req.user._id.toString();
  const alreadyLiked = post.likes.map((id) => id.toString()).includes(userId);
  if (alreadyLiked) post.likes = post.likes.filter((id) => id.toString() !== userId);
  else post.likes.push(req.user._id);
  await post.save();
  res.json({ likes: post.likes.length, liked: !alreadyLiked });
});

router.post("/:id/comment", verifyToken, [body("text").trim().notEmpty().isLength({ max: 500 })], handleValidation, async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  post.comments.push({ author: req.user._id, text });
  await post.save();
  const updated = await Post.findById(post._id).populate("comments.author", "fullName avatar");
  res.json(updated.comments[updated.comments.length - 1]);
});

router.delete("/:id", verifyToken, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized" });
  }
  await post.deleteOne();
  res.json({ message: "Post deleted" });
});

router.get("/stats", verifyToken, async (_req, res) => {
  const total = await Post.countDocuments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPosts = await Post.countDocuments({ createdAt: { $gte: today } });
  res.json({ total, todayPosts });
});

export default router;
