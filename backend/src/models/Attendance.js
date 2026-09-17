import mongoose from "mongoose";

const breakSchema = new mongoose.Schema(
  {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      default: "Break",
      enum: ["Lunch", "Break"],
    },
  },
  {
    timestamps: false,
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

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    checkInLatitude: {
      type: Number,
      default: null,
    },
    checkInLongitude: {
      type: Number,
      default: null,
    },
    checkInAddress: {
      type: String,
      default: "",
    },
    checkInDevice: {
      type: String,
      default: "",
    },
    checkOutLatitude: {
      type: Number,
      default: null,
    },
    checkOutLongitude: {
      type: Number,
      default: null,
    },
    checkOutAddress: {
      type: String,
      default: "",
    },
    checkOutDevice: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Absent",
    },
    lunchBreakSeconds: {
      type: Number,
      default: 0,
    },
    otherBreakSeconds: {
      type: Number,
      default: 0,
    },
    totalBreakSeconds: {
      type: Number,
      default: 0,
    },
    totalWorkSeconds: {
      type: Number,
      default: 0,
    },
    halfSalaryDeduct: {
      type: Boolean,
      default: false,
    },
    otherBreakExceeded: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
    checkOutNote: {
      type: String,
      default: "",
    },
    isPenaltyAbsent: {
      type: Boolean,
      default: false,
    },
    penaltyLeaveRef: {
      type: String,
      default: null,
    },
    penaltyWaivedByAdmin: {
      type: Boolean,
      default: false,
    },
    breaks: [breakSchema],
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

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ status: 1, date: 1 });
attendanceSchema.index({ date: 1, checkOutNote: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
