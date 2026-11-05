import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    projectType: {
      type: String,
      default: "",
    },
    industryName: {
      type: String,
      default: "",
    },
    salesPerson: {
      type: String,
      default: "",
    },
    leadSource: {
      type: String,
      default: "",
    },
    remark: {
      type: String,
      default: "",
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    initialAmount: {
      type: Number,
      default: 0,
    },
    extendedAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "In Progress", "Completed", "Active", "On Hold"],
    },
    startDate: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    hiringRequirements: {
      type: String,
      default: "",
    },
    jobPositions: [
      {
        title: String,
        openings: { type: Number, default: 1 },
        filled: { type: Number, default: 0 },
        description: String,
      },
    ],
    totalHiringTarget: {
      type: Number,
      default: 0,
    },
    projectAdmin: {
      type: String,
      default: "",
    },
    assignedAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedEmployeeHRs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedVendors: [
      {
        vendorId: { type: String, trim: true },
        vendorName: { type: String, default: "" },
        assignedAt: { type: Date, default: Date.now },
        status: { type: String, default: "Active" },
      },
    ],
    assignedVendorHRs: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        vendorId: { type: String, default: "" },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    recruitmentConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
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

projectSchema.index({ clientId: 1, createdAt: -1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.model("Project", projectSchema);
export default Project;
