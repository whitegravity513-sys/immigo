import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: {
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
    },
    phone: {
      type: String,
      default: "",
    },
    company: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    directorName: {
      type: String,
      default: "",
    },
    directorEmail: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    directorMobile: {
      type: String,
      default: "",
    },
    gstPan: {
      type: String,
      default: "",
    },
    remark: {
      type: String,
      default: "",
    },
    paymentMilestones: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        amount: { type: Number, required: true, default: 0 },
        condition: { type: String, required: true },
        timeline: { type: String, default: "" },
        description: { type: String, default: "" },
        status: {
          type: String,
          enum: ["Pending", "Due", "Partially Paid", "Paid", "Overdue"],
          default: "Pending",
        },
        paidAmount: { type: Number, default: 0 },
        remainingBalance: { type: Number, default: 0 },
        dueDate: { type: Date, default: null },
        paidDate: { type: Date, default: null },
        relatedProjectId: { type: String, default: "" },
        relatedProjectName: { type: String, default: "" },
        relatedCandidateId: { type: String, default: "" },
        relatedCandidateName: { type: String, default: "" },
        remarks: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    totalAgreedAmount: {
      type: Number,
      default: 0,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
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
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

clientSchema.index({ name: 1 });
clientSchema.index({ createdAt: -1 });

const Client = mongoose.model("Client", clientSchema);
export default Client;
