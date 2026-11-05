import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    role: { type: String, default: "" },
    code: { type: String, default: "" },
    companyName: { type: String, default: "" },
    designation: { type: String, default: "" },
    attendance: {
      type: String,
      enum: ["Present", "Absent", "Pending"],
      default: "Pending",
    },
  },
  { _id: false }
);

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
    meetingType: {
      type: String,
      enum: [
        "INTERNAL_HR",
        "EMPLOYEE",
        "CANDIDATE_INTERVIEW",
        "VENDOR_DISCUSSION",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, "Meeting date is required"],
      index: true,
    },
    startTime: {
      type: String, // HH:MM
      required: [true, "Meeting start time is required"],
    },
    endTime: {
      type: String, // HH:MM
      default: "",
    },
    meetingLink: {
      type: String,
      required: [true, "Meeting link is required"],
      trim: true,
    },
    platform: {
      type: String,
      enum: ["Google Meet", "Zoom", "Microsoft Teams", "In-Person", "Other"],
      default: "Google Meet",
    },

    // Meeting Organizer
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    createdByName: {
      type: String,
      default: "Admin",
    },
    organizerRole: {
      type: String,
      default: "ADMIN",
    },

    // Attendees list
    attendees: [attendeeSchema],

    // Target employees (for backward compatibility)
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
    targetVendors: [
      {
        type: String,
        trim: true,
      },
    ],
    targetHRs: [
      {
        type: String,
        trim: true,
      },
    ],

    // Candidate Reference
    candidateId: {
      type: String,
      default: "",
      index: true,
    },
    candidateName: {
      type: String,
      default: "",
    },
    candidateEmail: {
      type: String,
      default: "",
    },
    applicationId: {
      type: String,
      default: "",
    },

    // Vendor Reference
    vendorId: {
      type: String,
      default: "",
      index: true,
    },
    vendorName: {
      type: String,
      default: "",
    },

    // HR Reference
    hrId: {
      type: String,
      default: "",
      index: true,
    },
    hrName: {
      type: String,
      default: "",
    },

    // Status: Scheduled, Completed, Cancelled, Rescheduled
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"],
      default: "SCHEDULED",
      index: true,
    },

    // Meeting Attendance & Outcome
    attendance: {
      type: String,
      enum: ["Present", "Absent", "Pending"],
      default: "Pending",
    },
    outcome: {
      type: String,
      enum: [
        "Selected",
        "Rejected",
        "On Hold",
        "Next Round",
        "Reschedule Required",
        "Completed",
        "",
      ],
      default: "",
    },
    outcomeRemarks: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    // Reminder tracking: ['24h', '1h', '15m']
    remindersSent: [
      {
        type: String,
      },
    ],
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
meetingSchema.index({ status: 1, date: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);
export default Meeting;
