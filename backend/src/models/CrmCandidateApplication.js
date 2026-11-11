import mongoose from "mongoose";

const crmCandidateApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
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
    recruitmentStage: {
      type: String,
      default: "Submitted",
    },
    refundStatus: {
      type: String,
      default: "",
    },
    refundDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    didNotJoinReason: {
      type: String,
      default: "",
    },
    milestonesOverridden: {
      type: Boolean,
      default: false,
    },
    processMilestones: {
      type: Array,
      default: [],
    },
    paymentPlan: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ totalAmount: 0, currency: "INR", milestones: [] }),
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

crmCandidateApplicationSchema.index({ applicationId: 1 }, { sparse: true });
crmCandidateApplicationSchema.index({ candidateId: 1, projectId: 1 });
crmCandidateApplicationSchema.index({ vendorId: 1 });
crmCandidateApplicationSchema.index({ projectId: 1 });
crmCandidateApplicationSchema.index({ status: 1 });
crmCandidateApplicationSchema.index({ createdAt: -1 });

const CrmCandidateApplication = mongoose.model(
  "CrmCandidateApplication",
  crmCandidateApplicationSchema
);
export default CrmCandidateApplication;
