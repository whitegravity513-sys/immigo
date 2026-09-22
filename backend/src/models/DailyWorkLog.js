import mongoose from "mongoose";

const dailyWorkLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: String, // "YYYY-MM-DD" in IST
      required: true,
    },
    logText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// One log per employee per day
dailyWorkLogSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyWorkLog", dailyWorkLogSchema);
