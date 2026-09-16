import mongoose from "mongoose";

const projectPaymentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
    },
    paymentMode: {
      type: String,
      default: "Bank Transfer",
    },
    tdsDeducted: {
      type: Number,
      default: 0,
    },
    igst: {
      type: String,
      default: "",
    },
    cgst: {
      type: String,
      default: "",
    },
    sgst: {
      type: String,
      default: "",
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

projectPaymentSchema.index({ projectId: 1, createdAt: -1 });
projectPaymentSchema.index({ paymentDate: -1 });
projectPaymentSchema.index({ createdAt: -1 });

const ProjectPayment = mongoose.model("ProjectPayment", projectPaymentSchema);
export default ProjectPayment;
