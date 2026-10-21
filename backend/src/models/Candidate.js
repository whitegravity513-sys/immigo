import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    termsAccepted: {
      type: Boolean,
      default: true,
    },
    accountStatus: {
      type: String,
      enum: ["Pending Approval", "Approved", "Rejected"],
      default: "Pending Approval",
      index: true,
    },
    documentStatus: {
      type: String,
      enum: ["Not Submitted", "Pending Verification", "Verified", "Re-upload Required", "Rejected"],
      default: "Not Submitted",
      index: true,
    },
    jobApplicationAccess: {
      type: String,
      enum: ["Locked", "Unlocked"],
      default: "Locked",
      index: true,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    internalRemarks: {
      type: String,
      default: "",
    },
    approvalEmailSent: {
      type: Boolean,
      default: false,
    },
    approvalEmailSentAt: {
      type: Date,
      default: null,
    },
    approvalEmailError: {
      type: String,
      default: "",
    },
    profile: {
      dob: { type: String, default: "" },
      gender: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      countryPreference: { type: [String], default: [] },
      education: { type: Array, default: [] },
      skills: { type: [String], default: [] },
      trade: { type: String, default: "" },
      experienceYears: { type: Number, default: 0 },
      currentOccupation: { type: String, default: "" },
      preferredJobRole: { type: String, default: "" },
      preferredCountries: { type: [String], default: [] },
      languages: { type: [String], default: [] },
      passportNumber: { type: String, default: "" },
      passportExpiry: { type: String, default: "" },
      passportIssueCountry: { type: String, default: "" },
      profileCompleted: { type: Boolean, default: false },
      profileCompletionPercent: { type: Number, default: 20 },
    },
    documents: [
      {
        id: { type: String, required: true },
        docType: { type: String, required: true },
        name: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileName: { type: String, default: "" },
        fileSize: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["Not Submitted", "Pending Verification", "Verified", "Re-upload Required", "Rejected"],
          default: "Pending Verification",
        },
        rejectionReason: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: { type: Date, default: null },
        verifiedBy: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.candidateId || ret._id.toString();
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

candidateSchema.index({ accountStatus: 1, createdAt: -1 });
candidateSchema.index({ documentStatus: 1 });
candidateSchema.index({ jobApplicationAccess: 1 });

const Candidate = mongoose.model("Candidate", candidateSchema);
export default Candidate;
