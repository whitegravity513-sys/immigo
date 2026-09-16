import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, "Meeting date is required"],
    },
    startTime: {
      type: String, // Format: HH:mm
      required: [true, "Meeting start time is required"],
    },
    endTime: {
      type: String, // Format: HH:mm
      default: "",
    },
    meetingLink: {
      type: String,
      required: [true, "Meeting link is required"],
      trim: true,
    },
    platform: {
      type: String,
      enum: ["Google Meet", "Zoom", "Microsoft Teams", "Other"],
      default: "Google Meet",
    },
    targetType: {
      type: String,
      enum: ["ALL", "SPECIFIC"],
      default: "ALL",
    },
    targetEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    createdByName: {
      type: String,
      default: "Admin",
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

meetingSchema.index({ date: 1, startTime: 1 });
meetingSchema.index({ targetType: 1 });
meetingSchema.index({ targetEmployees: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);
export default Meeting;
