import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import NotificationService from "../services/notification.service.js";
import { logger } from "./logger.js";

const NINE_HOURS_MS = 9 * 60 * 60 * 1000;
const NINE_HOURS_SECONDS = 9 * 60 * 60; // 32400

export const startCronJobs = () => {
  // Run every 5 minutes
  setInterval(async () => {
    try {
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - NINE_HOURS_MS);

      // Find open attendances checked in more than 9 hours ago
      const overdueAttendances = await Attendance.find({
        status: { $in: ["Present", "On Break"] },
        checkInTime: { $lte: cutoffTime },
      }).populate("employeeId", "name employeeId");

      for (const record of overdueAttendances) {
        // Auto end open break if still on break
        if (record.status === "On Break") {
          const currentBreak = record.breaks[record.breaks.length - 1];
          if (currentBreak && !currentBreak.endTime) {
            currentBreak.endTime = now;
            const dur = Math.floor(
              (currentBreak.endTime.getTime() - new Date(currentBreak.startTime).getTime()) / 1000
            );
            currentBreak.durationSeconds = Math.max(0, dur);

            if (currentBreak.breakType === "Lunch") {
              record.lunchBreakSeconds = (record.lunchBreakSeconds || 0) + currentBreak.durationSeconds;
            } else {
              record.otherBreakSeconds = (record.otherBreakSeconds || 0) + currentBreak.durationSeconds;
            }
            record.totalBreakSeconds = (record.totalBreakSeconds || 0) + currentBreak.durationSeconds;
          }
        }

        record.checkOutTime = now;
        record.status = "Checked Out";
        record.checkOutNote = "System Auto Checkout (9+ hours)";

        const totalSecondsElapsed = Math.floor(
          (now.getTime() - new Date(record.checkInTime).getTime()) / 1000
        );
        record.totalWorkSeconds = Math.max(0, totalSecondsElapsed - (record.totalBreakSeconds || 0));
        record.halfSalaryDeduct = record.totalWorkSeconds > 0 && record.totalWorkSeconds < 28800;

        await record.save();

        // Notify Admin
        const empName = record.employeeId?.name || "Employee";
        const empCode = record.employeeId?.employeeId || "EMP";
        
        NotificationService.createNotification({
          type: "SYSTEM_ALERT",
          title: `Auto Checkout: ${empName}`,
          message: `System automatically checked out ${empName} (${empCode}) after 9 hours of shift.`,
          targetType: "ROLE",
          targetRole: "admin",
        });

        logger.info(`Auto checked out employee ${empCode}`);
      }
    } catch (err) {
      logger.error("Error in auto-checkout cron job:", err);
    }
  }, 5 * 60 * 1000); // 5 minutes
};
