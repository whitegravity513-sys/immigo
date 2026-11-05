import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    interviewId: {
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
    candidateRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
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
    applicationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CandidateApplication",
    },
    projectId: {
      type: String,
      default: "",
      index: true,
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
      index: true,
    },
    vendorName: {
      type: String,
      default: "",
    },
    round: {
      type: String,
      default: "L1 Interview",
    },
    scheduledDate: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      default: "",
    },
    interviewMode: {
      type: String,
      enum: ["Google Meet", "Zoom", "Microsoft Teams", "In-Person / Office", "Telephonic"],
      default: "Google Meet",
    },
    interviewLink: {
      type: String,
      default: "",
    },
    interviewerName: {
      type: String,
      default: "",
    },
    interviewerEmail: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Rescheduled", "Completed", "Cancelled", "No Show"],
      default: "Scheduled",
      index: true,
    },
    feedback: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    recommendation: {
      type: String,
      enum: ["Pending", "Selected", "Next Round", "On Hold", "Rejected"],
      default: "Pending",
    },
    scheduledBy: {
      type: String,
      default: "",
    },
    scheduledByName: {
      type: String,
      default: "",
    },
    scheduledByRole: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

interviewSchema.index({ candidateId: 1, scheduledDate: 1 });
interviewSchema.index({ applicationId: 1, round: 1 });

export const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;
