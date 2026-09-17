import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      default: () => new Date().toISOString().split("T")[0],
      index: true,
    },
    category: {
      type: String,
      enum: [
        "Company Notification",
        "Internal Updates",
        "Important Announcements",
        "General Notice",
      ],
      default: "Company Notification",
      index: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    targetType: {
      type: String,
      default: "ALL",
      enum: ["ALL"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
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

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
