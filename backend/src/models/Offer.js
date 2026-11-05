import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    offerId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    candidateId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    candidateName: {
      type: String,
      required: true,
    },
    candidateEmail: {
      type: String,
      default: "",
    },
    applicationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    projectId: {
      type: String,
      default: "",
    },
    projectName: {
      type: String,
      default: "",
    },
    jobId: {
      type: String,
      default: "",
    },
    jobTitle: {
      type: String,
      default: "",
    },
    vendorId: {
      type: String,
      default: "",
    },
    vendorName: {
      type: String,
      default: "",
    },
    offeredDesignation: {
      type: String,
      required: true,
    },
    offeredSalary: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: "SAR",
    },
    offerDate: {
      type: Date,
      default: Date.now,
    },
    expectedJoiningDate: {
      type: Date,
      default: null,
    },
    actualJoiningDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Draft", "Released", "Accepted", "Declined", "Withdrawn", "Joined"],
      default: "Released",
      index: true,
    },
    offerLetterUrl: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    releasedBy: {
      type: String,
      default: "",
    },
    releasedByName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

offerSchema.index({ candidateId: 1, applicationId: 1 });

export const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
