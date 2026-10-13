import mongoose from "mongoose";

const opportunityApplicationSchema = new mongoose.Schema(
  {
    opportunity: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referralBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    coverLetter: { type: String, default: "" },
    status: {
      type: String,
      enum: ["applied", "reviewing", "shortlisted", "rejected", "selected"],
      default: "applied",
      index: true
    }
  },
  { timestamps: true }
);

opportunityApplicationSchema.index({ opportunity: 1, applicant: 1 }, { unique: true });
opportunityApplicationSchema.index({ applicant: 1, createdAt: -1 });

const OpportunityApplication = mongoose.model("OpportunityApplication", opportunityApplicationSchema);
export default OpportunityApplication;
