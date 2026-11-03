import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userType: {
      type: String,
      enum: ["ADMIN", "SUPER_ADMIN", "HR", "EMPLOYEE", "VENDOR", "SYSTEM"],
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
        "Meeting",
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
      enum: ["ADMIN", "EMPLOYEE", "VENDOR", "ALL"],
      default: "ADMIN",
      index: true,
    },

    candidateId: {
      type: String,
      default: "",
      index: true,
    },
    candidateName: {
      type: String,
      default: "",
    },
    updatedByUserId: {
      type: String,
      default: "",
    },
    updatedByName: {
      type: String,
      default: "",
    },
    updatedByRole: {
      type: String,
      default: "",
    },
    vendorId: {
      type: String,
      default: "",
      index: true,
    },
    vendorName: {
      type: String,
      default: "",
    },
    actionType: {
      type: String,
      default: "",
      index: true,
    },
    previousStatus: {
      type: String,
      default: "",
    },
    newStatus: {
      type: String,
      default: "",
    },
    previousStage: {
      type: String,
      default: "",
    },
    newStage: {
      type: String,
      default: "",
    },
    previousMilestone: {
      type: String,
      default: "",
    },
    newMilestone: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      default: "",
    },
    time: {
      type: String,
      default: "",
    },
    meetingRef: {
      type: String,
      default: "",
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
activityLogSchema.index({ candidateId: 1, createdAt: -1 });
activityLogSchema.index({ vendorId: 1, createdAt: -1 });
activityLogSchema.index({ visibility: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
