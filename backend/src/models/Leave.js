import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      default: "Casual",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    deductedDays: {
      type: Number,
      default: 0,
    },
    deductionRate: {
      type: Number,
      default: 1,
    },
    reason: {
      type: String,
      required: true,
    },
    document: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approved", "Rejected"],
      index: true,
    },
    adminRemark: {
      type: String,
      default: "",
    },
    approvedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    lateApply: {
      type: Boolean,
      default: false,
    },
    penaltyAbsents: {
      type: Number,
      default: 0,
    },
    penaltyWaived: {
      type: Boolean,
      default: false,
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

leaveSchema.index({ employeeId: 1, startDate: 1 });
leaveSchema.index({ status: 1, startDate: 1 });

const Leave = mongoose.model("Leave", leaveSchema);
export default Leave;
