import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "new_message",
        "mentorship_request",
        "mentorship_accepted",
        "mentorship_rejected",
        "new_event",
        "new_opportunity",
        "profile_viewed",
        "application_status",
        "system"
      ],
      required: true,
      index: true
    },
    title: { type: String, required: true },
    text: { type: String, required: true },
    meta: { type: Object, default: {} },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
