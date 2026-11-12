import Holiday from "../models/Holiday.js";
import Attendance from "../models/Attendance.js";
import { ApiError } from "../utils/apiError.js";
import NotificationService from "./notification.service.js";

export class HolidayService {
  static formatHoliday(holiday) {
    if (!holiday) return null;
    const plain = typeof holiday.toObject === "function" ? holiday.toObject() : holiday;
    return {
      ...plain,
      id: plain._id ? plain._id.toString() : (plain.id || ""),
      _id: plain._id ? plain._id.toString() : (plain.id || ""),
    };
  }

  static async getHolidays() {
    const holidays = await Holiday.find().sort({ date: 1 });
    return holidays.map((h) => this.formatHoliday(h));
  }

  static async createOrUpdateHoliday(date, title, description = "", actor = null) {
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

    try {
      await NotificationService.createNotification({
        type: "HOLIDAY_ANNOUNCEMENT",
        title: `Official Holiday Declared: ${title}`,
        message: `Office will remain closed on ${date} (${title}). Attendance is not required. ${description || ""}`.trim(),
        targetRole: "EMPLOYEE",
        targetRoles: ["EMPLOYEE"],
        targetType: "ALL",
        actor,
        moduleScope: "HOLIDAY",
        metadata: {
          holidayId: holiday._id.toString(),
          date,
          title,
        },
      });
      await NotificationService.notifyStaffAction({
        actor,
        type: "HOLIDAY_ANNOUNCEMENT",
        title: `Official Holiday Declared: ${title}`,
        message: `Official holiday declared for ${date} (${title}).`,
        moduleScope: "HOLIDAY",
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

  static async updateHoliday(id, { date, title, description }) {
    const holiday = await Holiday.findByIdAndUpdate(
      id,
      {
        ...(date ? { date } : {}),
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
      },
      { returnDocument: "after", runValidators: true }
    );
    if (!holiday) {
      throw new ApiError(404, "Holiday not found");
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
