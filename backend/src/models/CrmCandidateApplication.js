import mongoose from "mongoose";

const crmCandidateApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      sparse: true,
      trim: true,
    },
    candidateId: {
      type: String,
      required: true,
    },
    candidateName: {
      type: String,
      required: true,
    },
    vendorId: {
      type: String,
      required: true,
    },
    vendorName: {
      type: String,
      default: "",
    },
    projectId: {
      type: String,
      required: true,
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
    position: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Submitted",
    },
    candidateData: {
      type: Object,
      default: {},
    },
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

crmCandidateApplicationSchema.index({ vendorId: 1 });
crmCandidateApplicationSchema.index({ projectId: 1 });
crmCandidateApplicationSchema.index({ status: 1 });

const CrmCandidateApplication = mongoose.model(
  "CrmCandidateApplication",
  crmCandidateApplicationSchema
);
export default CrmCandidateApplication;
