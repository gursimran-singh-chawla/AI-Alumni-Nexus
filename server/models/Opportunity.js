import mongoose from "mongoose";

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["internship", "job", "referral", "hackathon"], required: true, index: true },
    department: { type: String, default: "", index: true },
    skills: [{ type: String, index: true }],
    location: { type: String, default: "", index: true },
    company: { type: String, default: "", index: true },
    applyUrl: { type: String, default: "" },
    deadline: { type: Date },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    referralsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

opportunitySchema.index({ createdAt: -1 });
opportunitySchema.index({ title: "text", description: "text", company: "text" });

const Opportunity = mongoose.model("Opportunity", opportunitySchema);
export default Opportunity;
