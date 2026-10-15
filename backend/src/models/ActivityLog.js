import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ["ADMIN", "EMPLOYEE", "VENDOR", "SYSTEM"],
      default: "SYSTEM",
      index: true,
    },
    userId: {
      type: String,
      default: "",
    },
    userName: {
      type: String,
      default: "System",
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: function () {
        return this.action || "Activity";
      },
    },
    description: {
      type: String,
      default: "",
    },
    entityType: {
      type: String,
      enum: [
        "Client",
        "Vendor",
        "Project",
        "Candidate",
        "Payment",
        "Employee",
        "Leave",
        "Document",
        "System",
        "CLIENT",
        "VENDOR",
        "PROJECT",
        "CANDIDATE",
        "CLIENT_PAYMENT",
        "OTHER",
      ],
      default: "System",
      index: true,
    },
    entityId: {
      type: String,
      default: "",
    },
    entityName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "",
    },
    visibility: {
      type: String,
      enum: ["ADMIN", "EMPLOYEE", "ALL"],
      default: "ADMIN",
      index: true,
    },
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

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ visibility: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
