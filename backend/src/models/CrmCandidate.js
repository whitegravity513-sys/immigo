import mongoose from "mongoose";

const crmCandidateSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      sparse: true,
      trim: true,
    },
    vendorId: {
      type: String,
      required: true,
    },
    vendorName: {
      type: String,
      default: "",
    },
    fullName: {
      type: String,
      required: true,
    },
    passportNumber: {
      type: String,
      default: "",
    },
    currentPosition: {
      type: String,
      default: "",
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    qualification: {
      type: String,
      default: "",
    },
    skills: {
      type: Array,
      default: [],
    },
    preferredCountry: {
      type: String,
      default: "",
    },
    verificationStatus: {
      type: String,
      default: "Pending",
    },
    documents: {
      type: Array,
      default: [],
    },
  },
  {
    strict: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.candidateId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

crmCandidateSchema.index({ vendorId: 1 });
crmCandidateSchema.index({ candidateId: 1 });

const CrmCandidate = mongoose.model("CrmCandidate", crmCandidateSchema);
export default CrmCandidate;
