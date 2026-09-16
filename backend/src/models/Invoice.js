import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "Unpaid",
    },
    paymentStatus: {
      type: String,
      default: "Unpaid",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    date: {
      type: String,
      default: "",
    },
    items: {
      type: String, // Stored as JSON string
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
    clientName: {
      type: String,
      default: "",
    },
    companyName: {
      type: String,
      default: "",
    },
    clientContact: {
      type: String,
      default: "",
    },
    clientEmail: {
      type: String,
      default: "",
    },
    supplyAddress: {
      type: String,
      default: "",
    },
    gstn: {
      type: String,
      default: "",
    },
    adminCompanyName: {
      type: String,
      default: "",
    },
    adminAddress: {
      type: String,
      default: "",
    },
    adminContact: {
      type: String,
      default: "",
    },
    adminEmail: {
      type: String,
      default: "",
    },
    adminGstn: {
      type: String,
      default: "",
    },
    igstRate: {
      type: Number,
      default: 0,
    },
    cgstRate: {
      type: Number,
      default: 0,
    },
    sgstRate: {
      type: Number,
      default: 0,
    },
    remark: {
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

invoiceSchema.index({ clientId: 1, createdAt: -1 });
invoiceSchema.index({ projectId: 1, createdAt: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
