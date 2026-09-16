import Holiday from "../models/Holiday.js";
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

    try {
      NotificationService.createNotification({
        type: "HOLIDAY_ANNOUNCEMENT",
        title: `Announcement: ${title}`,
        message: `Date: ${date}. ${description}`,
        targetType: "ALL",
      });
    } catch (e) {
      // non-blocking
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
