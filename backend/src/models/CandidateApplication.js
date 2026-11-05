import mongoose from "mongoose";

const candidateApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
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
    jobId: {
      type: String,
      default: "",
      index: true,
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
    vendorHrId: {
      type: String,
      default: "",
      index: true,
    },
    vendorHrName: {
      type: String,
      default: "",
    },
    employeeHrId: {
      type: String,
      default: "",
      index: true,
    },
    employeeHrName: {
      type: String,
      default: "",
    },
    recruitmentStage: {
      type: String,
      enum: [
        "Applied",
        "Screening",
        "In Progress",
        "Shortlisted",
        "Interview Scheduled",
        "L1 Interview",
        "L2 Interview",
        "L3 Interview",
        "HR Interview",
        "Selected",
        "Offer Released",
        "Offer Accepted",
        "Visa Processing",
        "Visa Issued",
        "Joined",
        "Deployed",
        "Rejected",
        "On Hold",
      ],
      default: "Applied",
      index: true,
    },
    salary: {
      type: String,
      default: "",
    },
    offerDetails: {
      offerDate: { type: Date, default: null },
      salary: { type: String, default: "" },
      currency: { type: String, default: "AED" },
      joiningDate: { type: Date, default: null },
      offerStatus: { type: String, default: "Pending" },
      offerLetterUrl: { type: String, default: "" },
    },
    visaDetails: {
      visaType: { type: String, default: "Employment Visa" },
      applicationDate: { type: Date, default: null },
      visaStatus: { type: String, default: "Not Started" },
      visaNumber: { type: String, default: "" },
      visaIssuedDate: { type: Date, default: null },
      expiryDate: { type: Date, default: null },
      visaDocumentUrl: { type: String, default: "" },
      departureDate: { type: Date, default: null },
      flightDetails: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: [
        "Applied",
        "Screening",
        "In Progress",
        "Shortlisted",
        "Interview Scheduled",
        "Interview Rescheduled",
        "Interview Completed",
        "Selected",
        "Offer Released",
        "Offer Accepted",
        "Visa Processing",
        "Visa Issued",
        "Joined",
        "Deployed",
        "Rejected",
        "On Hold",
        "Withdrawn",
        "No Show",
        "Not Responding",
        "Offer Declined",
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
