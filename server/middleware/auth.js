import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.split(" ")[1];
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
};

export const verifyToken = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ message: "Unauthorized - No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden - Insufficient role" });
  }
  return next();
};

export const requireVerifiedAlumni = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "alumni") return res.status(403).json({ message: "Only alumni can access this resource" });
  if (!req.user.emailVerified || req.user.verificationStatus !== "verified") {
    return res.status(403).json({ message: "Only verified alumni can access this feature" });
  }
  return next();
};
