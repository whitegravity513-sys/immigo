import mongoose from "mongoose";

const crmNotificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      sparse: true,
      trim: true,
    },
    recipientRole: {
      type: String,
      enum: ["ADMIN", "VENDOR", "ALL"],
      default: "ALL",
    },
    vendorId: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "info",
    },
    link: {
      type: String,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    strict: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.notificationId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

crmNotificationSchema.index({ recipientRole: 1, vendorId: 1 });
crmNotificationSchema.index({ createdAt: -1 });

const CrmNotification = mongoose.model("CrmNotification", crmNotificationSchema);
export default CrmNotification;
