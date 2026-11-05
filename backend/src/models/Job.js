import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    projectId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    projectName: {
      type: String,
      default: "",
    },
    clientId: {
      type: String,
      default: "",
    },
    clientRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    clientName: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      default: "",
    },
    openings: {
      type: Number,
      default: 1,
      min: 1,
    },
    filledPositions: {
      type: Number,
      default: 0,
      min: 0,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    experience: {
      type: String,
      default: "1-3 Years",
    },
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },
    location: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "India",
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contractual", "Overseas Deployment", "Permanent"],
      default: "Overseas Deployment",
    },
    description: {
      type: String,
      default: "",
    },
    requirements: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["Open", "In Progress", "Filled", "Closed", "On Hold"],
      default: "Open",
      index: true,
    },
    assignedVendors: [
      {
        vendorId: { type: String, trim: true },
        vendorName: { type: String, default: "" },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: String,
      default: "",
    },
    createdByName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ projectId: 1, status: 1 });
jobSchema.index({ createdAt: -1 });

export const Job = mongoose.model("Job", jobSchema);
export default Job;
