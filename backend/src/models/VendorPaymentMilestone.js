import mongoose from "mongoose";
import { VENDOR_PAYMENT_STATUSES } from "../constants/recruitmentStages.js";

const vendorPaymentMilestoneSchema = new mongoose.Schema(
  {
    milestoneId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    milestoneName: {
      type: String,
      required: [true, "Milestone name is required"],
      trim: true,
    },
    vendorId: {
      type: String,
      required: [true, "Vendor ID is required"],
      index: true,
      trim: true,
    },
    vendorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    vendorName: {
      type: String,
      default: "",
    },
    projectId: {
      type: String,
      required: [true, "Project ID is required"],
      index: true,
      trim: true,
    },
    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    projectName: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: [true, "Milestone amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    conditions: {
      type: String,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: VENDOR_PAYMENT_STATUSES,
      default: "Pending",
      index: true,
    },
    paymentReference: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: "Bank Transfer",
      enum: ["Bank Transfer", "NEFT", "RTGS", "UPI", "Cheque", "Direct Deposit", "Other"],
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paidBy: {
      type: String,
      default: "",
    },
    paidByName: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: String,
      default: "",
    },
    approvedByName: {
      type: String,
      default: "",
    },
    paymentProofUrl: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    history: [
      {
        status: { type: String },
        amount: { type: Number },
        paidAmount: { type: Number },
        actorId: { type: String },
        actorName: { type: String },
        actorRole: { type: String },
        timestamp: { type: Date, default: Date.now },
        remarks: { type: String, default: "" },
      },
    ],
    createdBy: {
      type: String,
      default: "",
    },
    createdByName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

vendorPaymentMilestoneSchema.index({ vendorId: 1, projectId: 1 });
vendorPaymentMilestoneSchema.index({ status: 1, dueDate: 1 });

export const VendorPaymentMilestone = mongoose.model(
  "VendorPaymentMilestone",
  vendorPaymentMilestoneSchema
);
export default VendorPaymentMilestone;
