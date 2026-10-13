import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { body } from "express-validator";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { verifyToken } from "../middleware/auth.js";
import { handleValidation } from "../middleware/validate.js";
import { sendVerificationCodeHook } from "../utils/email.js";

const router = express.Router();

const ACCESS_TTL = "15m";
const REFRESH_DAYS = 14;

const commonCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
};

const isCollegeEmail = (email) => {
  const banned = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "proton.me", "icloud.com"];
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (!domain) return false;
  if (banned.includes(domain)) return false;
  return domain.includes("edu") || domain.includes("ac.") || domain.includes("college") || domain.includes("univ");
};

const buildSafeUser = (user) => ({
  _id: user._id,
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  college: user.college,
  branch: user.branch,
  year: user.year,
  company: user.company,
  jobRole: user.jobRole,
  skills: user.skills,
  bio: user.bio,
  profileComplete: user.profileComplete,
  mentorshipAvailability: user.mentorshipAvailability,
  mentorAvailabilityStatus: user.mentorAvailabilityStatus,
  mentorTimeSlots: user.mentorTimeSlots,
  preferredCommunicationMethods: user.preferredCommunicationMethods,
  verificationStatus: user.verificationStatus,
  emailVerified: user.emailVerified,
  registrationNumber: user.registrationNumber,
  passingYear: user.passingYear,
  verificationRejectionReason: user.verificationRejectionReason,
  emailNotificationEnabled: user.emailNotificationEnabled,
  connections: user.connections,
  experience: user.experience,
  location: user.location,
  github: user.github,
  linkedin: user.linkedin,
  leetcode: user.leetcode
});

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = crypto.randomBytes(40).toString("hex");
  return { accessToken, refreshToken };
};

const persistRefreshToken = async (userId, rawToken) => {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user: userId, tokenHash, expiresAt });
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    ...commonCookieOptions,
    maxAge: 15 * 60 * 1000
  });
  res.cookie("refreshToken", refreshToken, {
    ...commonCookieOptions,
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", commonCookieOptions);
  res.clearCookie("refreshToken", commonCookieOptions);
};

router.post(
  "/register",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password should be at least 6 characters"),
    body("role").optional().isIn(["student", "alumni"]).withMessage("Invalid role"),
    body("passingYear").optional().isLength({ min: 4, max: 4 }).withMessage("Passing year must be YYYY")
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { fullName, email, password, role = "student", college = "", branch = "", year = "", registrationNumber = "", passingYear = "" } = req.body;
      const normalizedEmail = String(email).toLowerCase();

      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) return res.status(400).json({ message: "Account already exists with this email" });

      if (role === "alumni") {
        if (!registrationNumber || !passingYear) {
          return res.status(400).json({ message: "Registration number and passing year are required for alumni" });
        }
        if (!isCollegeEmail(normalizedEmail)) {
          return res.status(400).json({ message: "Please use a valid college email for alumni verification" });
        }
      }

      const hash = await bcrypt.hash(password, 12);
      const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
      const user = new User({
        fullName,
        email: normalizedEmail,
        password: hash,
        role,
        college,
        branch,
        year,
        registrationNumber,
        passingYear,
        emailVerified: role === "alumni" ? false : true,
        emailVerificationCode: role === "alumni" ? verificationCode : "",
        emailVerificationExpiresAt: role === "alumni" ? new Date(Date.now() + 15 * 60 * 1000) : null,
        verificationStatus: role === "alumni" ? "pending" : "not_required"
      });
      user.calcProfileComplete();
      await user.save();

      if (role === "alumni") {
        await sendVerificationCodeHook({ to: normalizedEmail, code: verificationCode });
      }

      const { accessToken, refreshToken } = generateTokens(user._id);
      await persistRefreshToken(user._id, refreshToken);
      setAuthCookies(res, accessToken, refreshToken);

      res.status(201).json({
        token: accessToken,
        user: buildSafeUser(user),
        alumniVerification: role === "alumni" ? {
          emailVerificationRequired: true,
          adminApprovalPending: true
        } : null
      });
    } catch (err) {
      res.status(500).json({ message: "Server error during registration" });
    }
  }
);

router.post(
  "/login",
  [body("email").isEmail().withMessage("Valid email is required"), body("password").notEmpty().withMessage("Password is required")],
  handleValidation,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: String(email).toLowerCase() });
      if (!user) return res.status(400).json({ message: "No account found with this email" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ message: "Incorrect password" });

      user.lastSeen = new Date();
      await user.save();

      const { accessToken, refreshToken } = generateTokens(user._id);
      await persistRefreshToken(user._id, refreshToken);
      setAuthCookies(res, accessToken, refreshToken);

      res.json({
        token: accessToken,
        user: buildSafeUser(user),
        notices: user.role === "alumni" && (!user.emailVerified || user.verificationStatus !== "verified")
          ? ["Your alumni account has limited access until verification is completed."]
          : []
      });
    } catch (err) {
      res.status(500).json({ message: "Server error during login" });
    }
  }
);

router.post("/refresh", async (req, res) => {
  try {
    const incoming = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incoming) return res.status(401).json({ message: "Refresh token missing" });

    const tokenHash = crypto.createHash("sha256").update(incoming).digest("hex");
    const existing = await RefreshToken.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } });
    if (!existing) return res.status(401).json({ message: "Invalid refresh token" });

    const { accessToken, refreshToken } = generateTokens(existing.user);
    existing.revokedAt = new Date();
    await existing.save();
    await persistRefreshToken(existing.user, refreshToken);
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({ token: accessToken });
  } catch {
    return res.status(500).json({ message: "Unable to refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  const incoming = req.cookies?.refreshToken || req.body?.refreshToken;
  if (incoming) {
    const tokenHash = crypto.createHash("sha256").update(incoming).digest("hex");
    await RefreshToken.updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }
  clearAuthCookies(res);
  res.json({ message: "Logged out" });
});

router.post(
  "/verify-college-email",
  [body("code").isLength({ min: 6, max: 6 }).withMessage("Invalid verification code")],
  handleValidation,
  verifyToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user || user.role !== "alumni") return res.status(400).json({ message: "Only alumni need college email verification" });
      if (user.emailVerified) return res.json({ message: "Email already verified" });

      const now = new Date();
      if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < now) {
        return res.status(400).json({ message: "Verification code expired. Please request a new code." });
      }

      if (req.body.code !== user.emailVerificationCode) {
        return res.status(400).json({ message: "Incorrect verification code" });
      }

      user.emailVerified = true;
      user.emailVerificationCode = "";
      user.emailVerificationExpiresAt = null;
      await user.save();

      return res.json({ message: "College email verified. Awaiting admin approval.", user: buildSafeUser(user) });
    } catch {
      return res.status(500).json({ message: "Failed to verify email" });
    }
  }
);

router.post("/resend-college-verification", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== "alumni") return res.status(400).json({ message: "Only alumni can request verification" });
    if (user.emailVerified) return res.json({ message: "Email already verified" });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    user.emailVerificationCode = code;
    user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendVerificationCodeHook({ to: user.email, code });
    return res.json({ message: "Verification code sent to your college email" });
  } catch {
    return res.status(500).json({ message: "Failed to send verification code" });
  }
});

router.get("/me", verifyToken, (req, res) => {
  res.json({ user: buildSafeUser(req.user) });
});

export default router;
