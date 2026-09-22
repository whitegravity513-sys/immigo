import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "CHECK_IN",
        "CHECK_OUT",
        "BREAK_START",
        "BREAK_END",
        "LEAVE_APPLY",
        "SYSTEM",
        "MEETING",
        "ANNOUNCEMENT",
        "UPDATE",
        "ATTENDANCE_UPDATE",
        "LEAVE_UPDATE",
        "EXPENSE_UPDATE",
        "EXPENSE_CLAIM",
        "HOLIDAY_ANNOUNCEMENT",
        "DOCUMENT_UPLOAD",
        "DOCUMENT_UPDATE",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // Target audience: ADMIN, EMPLOYEE, or ALL
    targetRole: {
      type: String,
      enum: ["ADMIN", "EMPLOYEE", "ALL"],
      default: "ADMIN",
    },
    // Target distribution: ALL or SPECIFIC
    targetType: {
      type: String,
      enum: ["ALL", "SPECIFIC"],
      default: "ALL",
    },
    // Specific employee recipient (if targetType === "SPECIFIC")
    targetEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    // Legacy / sender employee reference
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    employeeName: {
      type: String,
      default: "",
    },
    // Read status for single recipient
    read: {
      type: Boolean,
      default: false,
    },
    // For targetType === "ALL", track which employees have marked it as read
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
  }
);

// Indexes for high performance notification queries
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ read: 1, createdAt: -1 });
notificationSchema.index({ targetRole: 1, targetType: 1, createdAt: -1 });
notificationSchema.index({ targetEmployeeId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
