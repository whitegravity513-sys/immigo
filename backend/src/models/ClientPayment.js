import mongoose from "mongoose";

const clientPaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: true,
    },
    projectId: {
      type: String,
      default: "",
    },
    projectName: {
      type: String,
      default: "",
    },
    candidateId: {
      type: String,
      default: "",
    },
    candidateName: {
      type: String,
      default: "",
    },
    milestoneId: {
      type: String,
      required: true,
    },
    milestoneName: {
      type: String,
      required: true,
    },
    agreedMilestoneAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMilestoneAmount: {
      type: Number,
      default: 0,
    },
    previouslyReceivedAmount: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: [1, "Payment amount must be greater than zero"],
    },
    remainingMilestoneBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    remainingMilestoneAmount: {
      type: Number,
      default: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Other"],
      default: "Bank Transfer",
    },
    transactionReference: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    receivedBy: {
      type: String,
      default: "Admin",
    },
    gstApplicable: {
      type: Boolean,
      default: false,
    },
    gstTreatment: {
      type: String,
      enum: ["Not Applicable", "Included in Amount", "Added Separately"],
      default: "Not Applicable",
    },
    gstRate: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    totalTransactionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentProofUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Verified", "Pending Verification", "Received", "Completed", "Reversed", "Adjusted"],
      default: "Verified",
    },
    paymentStatus: {
      type: String,
      enum: ["Verified", "Pending Verification", "Received", "Completed", "Reversed", "Adjusted"],
      default: "Verified",
      index: true,
    },
    recordedBy: {
      type: String,
      default: "Admin",
    },
    recordedById: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    isReversed: {
      type: Boolean,
      default: false,
    },
    reversalReason: {
      type: String,
      default: "",
    },
    reversedBy: {
      type: String,
      default: "",
    },
    reversedAt: {
      type: Date,
      default: null,
    },
    auditTrail: [
      {
        action: String,
        performedBy: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

clientPaymentSchema.index({ clientId: 1, paymentDate: -1 });
clientPaymentSchema.index({ transactionReference: 1, clientId: 1 });

const ClientPayment = mongoose.model("ClientPayment", clientPaymentSchema);
export default ClientPayment;
