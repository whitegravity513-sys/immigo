import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    signature: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
    },
    amountPaise: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "verified", "consumed", "failed"],
      default: "created",
    },
    applicationId: {
      type: String,
      default: "",
      trim: true,
    },
    milestoneId: {
      type: String,
      default: "",
      trim: true,
    },
    actorId: {
      type: String,
      default: "",
    },
    actorRole: {
      type: String,
      default: "",
    },
    receipt: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
    gatewayPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentTransactionSchema.index({ applicationId: 1, milestoneId: 1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });

const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  mongoose.model("PaymentTransaction", paymentTransactionSchema);

export default PaymentTransaction;

