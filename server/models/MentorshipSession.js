import mongoose from "mongoose";

const mentorshipSessionSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestedSlot: { type: Date, required: true },
    scheduledAt: { type: Date },
    durationMinutes: { type: Number, default: 30 },
    communicationMethod: {
      type: String,
      enum: ["in_app", "email", "video_call"],
      default: "in_app"
    },
    videoCallLink: { type: String, default: "" },
    agenda: { type: String, default: "" },
    status: {
      type: String,
      enum: ["requested", "accepted", "rejected", "upcoming", "completed", "cancelled"],
      default: "requested",
      index: true
    },
    mentorResponseNote: { type: String, default: "" },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, default: "" },
      submittedAt: { type: Date }
    }
  },
  { timestamps: true }
);

mentorshipSessionSchema.index({ mentor: 1, status: 1, scheduledAt: 1 });
mentorshipSessionSchema.index({ mentee: 1, status: 1, scheduledAt: 1 });

const MentorshipSession = mongoose.model("MentorshipSession", mentorshipSessionSchema);
export default MentorshipSession;
