import mongoose from "mongoose";

const mentorSlotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "alumni", "admin"], default: "student", index: true },

    emailVerified: { type: Boolean, default: false, index: true },
    emailVerificationCode: { type: String, default: "" },
    emailVerificationExpiresAt: { type: Date },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected", "not_required"],
      default: "not_required",
      index: true
    },
    registrationNumber: { type: String, default: "", index: true },
    passingYear: { type: String, default: "", index: true },
    verificationRejectionReason: { type: String, default: "" },
    verificationReviewedAt: { type: Date },
    verificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    college: { type: String, default: "", index: true },
    branch: { type: String, default: "", index: true },
    year: { type: String, default: "" },
    skills: [String],
    interests: [String],
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    leetcode: { type: String, default: "" },
    company: { type: String, default: "", index: true },
    jobRole: { type: String, default: "" },
    experience: { type: Number, default: 0 },
    location: { type: String, default: "" },

    mentorshipAvailability: { type: Boolean, default: false },
    mentorAvailabilityStatus: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "unavailable",
      index: true
    },
    mentorTimeSlots: [mentorSlotSchema],
    preferredCommunicationMethods: {
      type: [String],
      enum: ["in_app", "email", "video_call"],
      default: ["in_app"]
    },

    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    mentees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Kept for backward compatibility with old UI. New system uses Notification model.
    notifications: [
      {
        text: String,
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ],

    emailNotificationEnabled: { type: Boolean, default: false },
    notificationPreferences: {
      new_message: { type: Boolean, default: true },
      mentorship: { type: Boolean, default: true },
      opportunities: { type: Boolean, default: true },
      events: { type: Boolean, default: true }
    },

    profileComplete: { type: Number, default: 20 },
    isActive: { type: Boolean, default: true, index: true },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, verificationStatus: 1, mentorAvailabilityStatus: 1 });
userSchema.index({ fullName: "text", company: "text", skills: "text", college: "text" });

userSchema.methods.calcProfileComplete = function () {
  const fields = ["fullName", "email", "bio", "college", "branch", "year", "company", "jobRole", "github"];
  const filled = fields.filter((f) => this[f] && this[f] !== "").length;
  const skillBonus = this.skills.length > 0 ? 1 : 0;
  this.profileComplete = Math.round(((filled + skillBonus) / (fields.length + 1)) * 100);
  return this.profileComplete;
};

const User = mongoose.model("User", userSchema);
export default User;
