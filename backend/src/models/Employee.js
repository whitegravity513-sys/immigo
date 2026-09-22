import mongoose from "mongoose";

const employeeDocumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "Other",
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: String,
      enum: ["Employee", "Admin"],
      default: "Employee",
    },
    status: {
      type: String,
      enum: ["Submitted", "Verified", "Rejected"],
      default: "Submitted",
    },
    verificationNote: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    personalEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      default: "General",
      trim: true,
    },
    designation: {
      type: String,
      default: "Employee",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    previousCompany: {
      type: String,
      default: "",
      trim: true,
    },
    previousPackage: {
      type: String,
      default: "",
      trim: true,
    },
    currentPackage: {
      type: String,
      default: "",
      trim: true,
    },
    experience: {
      type: String,
      default: "",
      trim: true,
    },
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relation: { type: String, default: "" },
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    leavingDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "probation", "on_leave"],
    },
    role: {
      type: String,
      default: "employee",
      trim: true,
    },
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    allocatedLeaves: {
      type: Number,
      default: 18,
    },
    leaveBalance: {
      type: Number,
      default: 18,
    },
    documents: {
      type: [employeeDocumentSchema],
      select: false,
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

// High-performance database indexes for instant query resolution
employeeSchema.index({ status: 1 });
employeeSchema.index({ name: 1 });
employeeSchema.index({ joiningDate: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ createdAt: -1 });

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
