import mongoose from "mongoose";

const crmRefundSchema = new mongoose.Schema(
  {
    refundId: {
      type: String,
      sparse: true,
      trim: true,
    },
    applicationId: {
      type: String,
      required: true,
      trim: true,
    },
    candidateId: {
      type: String,
      default: "",
      trim: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    vendorId: {
      type: String,
      default: "",
      trim: true,
    },
    vendorName: {
      type: String,
      default: "",
      trim: true,
    },
    projectId: {
      type: String,
      default: "",
      trim: true,
    },
    projectName: {
      type: String,
      default: "",
      trim: true,
    },
    clientName: {
      type: String,
      default: "",
      trim: true,
    },
    position: {
      type: String,
      default: "",
      trim: true,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
      default: "",
    },
    refundDocument: {
      type: String,
      default: "",
    },
    refundDocumentData: {
      type: String,
      default: "",
    },
    refundStatus: {
      type: String,
      default: "Pending Admin Approval",
    },
    refundDate: {
      type: String,
      default: "",
    },
    paymentRef: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    requestedBy: {
      type: String,
      default: "Vendor",
    },
    processedBy: {
      type: String,
      default: "",
    },
    reassigned: {
      type: Boolean,
      default: false,
    },
    reassignedProjectId: {
      type: String,
      default: "",
    },
    reassignedProjectName: {
      type: String,
      default: "",
    },
    reassignedPosition: {
      type: String,
      default: "",
    },
    reassignedAt: {
      type: Date,
      default: null,
    },
  },
  {
    strict: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.refundId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

crmRefundSchema.index({ vendorId: 1 });
crmRefundSchema.index({ applicationId: 1 });
crmRefundSchema.index({ candidateId: 1 });
crmRefundSchema.index({ createdAt: -1 });

const CrmRefund = mongoose.model("CrmRefund", crmRefundSchema);
export default CrmRefund;

