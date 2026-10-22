import mongoose from "mongoose";

const candidateApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    },
    candidateId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    candidateObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
    },
    candidateName: {
      type: String,
      required: true,
    },
    candidateEmail: {
      type: String,
      required: true,
    },
    candidatePhone: {
      type: String,
      default: "",
    },
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    clientId: {
      type: String,
      default: "",
    },
    clientName: {
      type: String,
      default: "",
    },
    destinationCountry: {
      type: String,
      default: "",
    },
    position: {
      type: String,
      default: "",
    },
    salary: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "Applied",
        "Shortlisted",
        "Interview Scheduled",
        "Interview Rescheduled",
        "Interview Completed",
        "Selected",
        "Rejected",
        "No Show",
      ],
      default: "Applied",
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    interview: {
      scheduledDate: { type: String, default: "" },
      scheduledTime: { type: String, default: "" },
      mode: { type: String, default: "Video Call" },
      locationOrLink: { type: String, default: "" },
      interviewerName: { type: String, default: "" },
      remarks: { type: String, default: "" },
      updatedAt: { type: Date, default: null },
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    adminRemarks: {
      type: String,
      default: "",
    },
    processMilestones: {
      type: Array,
      default: [],
    },
    paymentPlan: {
      totalAmount: { type: Number, default: 40000 },
      currency: { type: String, default: "INR" },
      milestones: { type: Array, default: [] },
    },
    payments: {
      type: Array,
      default: [],
    },
    statusHistory: [
      {
        status: String,
        updatedBy: String,
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  {
    strict: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.applicationId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

candidateApplicationSchema.index({ candidateId: 1, projectId: 1 });
candidateApplicationSchema.index({ status: 1, createdAt: -1 });

const CandidateApplication = mongoose.model(
  "CandidateApplication",
  candidateApplicationSchema
);
export default CandidateApplication;
