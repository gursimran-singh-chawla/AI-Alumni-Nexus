import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: Date, required: true },
    location: { type: String, default: "Online" },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    type: { type: String, enum: ["webinar", "meetup", "workshop", "hackathon"], default: "webinar" },
    imageUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });
eventSchema.index({ type: 1, date: 1 });

const Event = mongoose.model("Event", eventSchema);
export default Event;
