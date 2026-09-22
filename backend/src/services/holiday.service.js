import Holiday from "../models/Holiday.js";
import Attendance from "../models/Attendance.js";
import { ApiError } from "../utils/apiError.js";
import NotificationService from "./notification.service.js";

/**
 * Enterprise Holiday Management Service
 */
export class HolidayService {
  static formatHoliday(holiday) {
    if (!holiday) return null;
    return {
      ...holiday.toObject(),
      id: holiday._id.toString(),
      _id: holiday._id.toString(),
    };
  }

  static async getHolidays() {
    const holidays = await Holiday.find().sort({ date: 1 });
    return holidays.map((h) => this.formatHoliday(h));
  }

  static async createOrUpdateHoliday(date, title, description = "") {
    if (!date || !title) {
      throw new ApiError(400, "Date and title are required");
    }

    let holiday = await Holiday.findOne({ date });
    if (holiday) {
      holiday.title = title;
      holiday.description = description || "";
      await holiday.save();
    } else {
      holiday = await Holiday.create({
        date,
        title,
        description: description || "",
      });
    }

    // Policy: Update any existing attendance records for this date so employees are not penalized/absent
    try {
      await Attendance.updateMany(
        { date },
        {
          $set: {
            status: "Holiday",
            isPenaltyAbsent: false,
            halfSalaryDeduct: false,
            otherBreakExceeded: false,
            notes: `Official Holiday: ${title}`,
          },
        }
      );
    } catch (attErr) {
      console.error("Error updating attendance for declared holiday:", attErr);
    }

    // Broadcast official notification to all employees
    try {
      await NotificationService.createNotification({
        type: "HOLIDAY_ANNOUNCEMENT",
        title: `Official Holiday Declared: ${title}`,
        message: `Office will remain closed on ${date} (${title}). Attendance is not required. ${description || ""}`.trim(),
        targetRole: "ALL",
        targetType: "ALL",
        metadata: {
          holidayId: holiday._id.toString(),
          date,
          title,
        },
      });
    } catch (e) {
      console.error("Error broadcasting holiday notification:", e);
    }

    return this.formatHoliday(holiday);
  }

  static async deleteHoliday(id) {
    const holiday = await Holiday.findByIdAndDelete(id);
    if (!holiday) {
      throw new ApiError(404, "Holiday not found");
    }
    return holiday;
  }
}

export default HolidayService;
