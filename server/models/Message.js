import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, index: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

messageSchema.index({ from: 1, createdAt: -1 });
messageSchema.index({ to: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
