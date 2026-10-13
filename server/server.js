import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { Server as IOServer } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import eventRoutes from "./routes/events.js";
import aiRoutes from "./routes/ai.js";
import mentorshipRoutes from "./routes/mentorship.js";
import notificationRoutes from "./routes/notifications.js";
import opportunityRoutes from "./routes/opportunities.js";
import { logError } from "./utils/logger.js";

dotenv.config();

const app = express();
const isDev = process.env.NODE_ENV !== "production";
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const corsOriginValidator = (origin, callback) => {
  if (!origin || (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    return callback(null, true);
  }
  if (origin === allowedOrigin) {
    return callback(null, true);
  }
  return callback(new Error("Not allowed by CORS"));
};

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: corsOriginValidator, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." }
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

connectDB();

app.get("/", (_req, res) => res.json({ status: "ok", message: "AI Alumni Nexus API" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/opportunities", opportunityRoutes);

app.use((err, req, res, _next) => {
  logError(err, { path: req.path, method: req.method, userId: req.user?._id });
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: corsOriginValidator, methods: ["GET", "POST"], credentials: true }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("user:online", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });

  socket.on("join", (room) => socket.join(room));
  socket.on("leave", (room) => socket.leave(room));
  socket.on("message:send", ({ room, message }) => io.to(room).emit("message:receive", message));
  socket.on("post:new", (post) => socket.broadcast.emit("post:created", post));
  socket.on("typing:start", ({ room, userName }) => socket.to(room).emit("typing:start", { userName }));
  socket.on("typing:stop", ({ room }) => socket.to(room).emit("typing:stop"));

  socket.on("disconnect", () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        break;
      }
    }
    io.emit("users:online", Array.from(onlineUsers.keys()));
  });
});

process.on("unhandledRejection", (reason) => {
  logError(reason instanceof Error ? reason : new Error(String(reason)), { context: "unhandledRejection" });
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  logError(error, { context: "uncaughtException" });
  console.error("Uncaught Exception:", error);
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
