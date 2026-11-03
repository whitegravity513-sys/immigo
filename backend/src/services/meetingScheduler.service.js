import Meeting from "../models/Meeting.js";
import Notification from "../models/Notification.js";

class MeetingSchedulerService {
  constructor() {
    this.interval = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("⏰ Meeting Reminder Scheduler initialized (1-minute tick).");

    // Run first check after 10 seconds
    setTimeout(() => this.checkMeetingReminders(), 10000);

    // Then check every 60 seconds
    this.interval = setInterval(() => {
      this.checkMeetingReminders();
    }, 60 * 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isRunning = false;
    }
  }

  parseMeetingDateTime(dateStr, timeStr) {
    try {
      if (!dateStr) return null;
      // Handle "14:30" or "02:30 PM"
      let hours = 0;
      let minutes = 0;

      const timeClean = String(timeStr || "09:00").trim();
      const is12Hour = /am|pm/i.test(timeClean);

      if (is12Hour) {
        const parts = timeClean.split(/[:\s]/);
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10) || 0;
        const ampm = (parts[2] || "").toLowerCase();
        if (ampm === "pm" && hours < 12) hours += 12;
        if (ampm === "am" && hours === 12) hours = 0;
      } else {
        const parts = timeClean.split(":");
        hours = parseInt(parts[0], 10) || 0;
        minutes = parseInt(parts[1], 10) || 0;
      }

      const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    } catch {
      return null;
    }
  }

  async checkMeetingReminders() {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const tomorrowStr = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Find active meetings scheduled within next 48 hours
      const meetings = await Meeting.find({
        status: { $in: ["SCHEDULED", "RESCHEDULED"] },
        date: { $gte: todayStr, $lte: tomorrowStr },
      });

      for (const meeting of meetings) {
        const meetingDate = this.parseMeetingDateTime(meeting.date, meeting.startTime);
        if (!meetingDate) continue;

        const diffMinutes = Math.floor((meetingDate - now) / (60 * 1000));
        if (diffMinutes < 0) continue; // Past meeting

        const remindersSent = meeting.remindersSent || [];
        let updated = false;

        // 1. 24 Hours Reminder (between 23h 30m and 24h 30m)
        if (diffMinutes <= 1470 && diffMinutes >= 1350 && !remindersSent.includes("24h")) {
          await this.sendMeetingReminder(meeting, "24 Hours Reminder", `Upcoming meeting in 24 hours: "${meeting.title}" on ${meeting.date} at ${meeting.startTime}.`);
          remindersSent.push("24h");
          updated = true;
        }

        // 2. 1 Hour Reminder (between 50m and 75m)
        if (diffMinutes <= 75 && diffMinutes >= 45 && !remindersSent.includes("1h")) {
          await this.sendMeetingReminder(meeting, "1 Hour Reminder", `Your meeting "${meeting.title}" begins in 1 hour at ${meeting.startTime}. Click to prepare and join.`);
          remindersSent.push("1h");
          updated = true;
        }

        // 3. 15 Minutes Urgent Reminder (between 1m and 20m)
        if (diffMinutes <= 20 && diffMinutes >= 1 && !remindersSent.includes("15m")) {
          await this.sendMeetingReminder(meeting, "🚨 Starting in 15 Minutes", `Meeting "${meeting.title}" starts in 15 minutes! Click below to join now.`);
          remindersSent.push("15m");
          updated = true;
        }

        if (updated) {
          meeting.remindersSent = remindersSent;
          await meeting.save();
        }
      }
    } catch (err) {
      console.error("Meeting scheduler error:", err.message);
    }
  }

  async sendMeetingReminder(meeting, prefix, message) {
    const meetingMetadata = {
      meetingId: meeting._id.toString(),
      meetingLink: meeting.meetingLink,
      date: meeting.date,
      startTime: meeting.startTime,
      platform: meeting.platform,
      title: meeting.title,
      isReminder: true,
    };

    try {
      // 1. Send to Admin / Organizer
      await Notification.create({
        type: "MEETING_REMINDER",
        title: `⏰ [${prefix}] ${meeting.title}`,
        message,
        targetRole: meeting.organizerRole || "ADMIN",
        targetUserId: meeting.createdBy ? String(meeting.createdBy) : null,
        metadata: meetingMetadata,
      });

      // 2. Send to Vendor if applicable
      if (meeting.vendorId) {
        await Notification.create({
          type: "MEETING_REMINDER",
          title: `⏰ [${prefix}] ${meeting.title}`,
          message,
          targetRole: "VENDOR",
          targetVendorId: meeting.vendorId,
          metadata: meetingMetadata,
        });
      }

      // 3. Send to target employees if applicable
      if (Array.isArray(meeting.targetEmployees) && meeting.targetEmployees.length > 0) {
        await Promise.all(
          meeting.targetEmployees.map((empId) =>
            Notification.create({
              type: "MEETING_REMINDER",
              title: `⏰ [${prefix}] ${meeting.title}`,
              message,
              targetRole: "EMPLOYEE",
              targetEmployeeId: empId,
              metadata: meetingMetadata,
            })
          )
        );
      }
    } catch (err) {
      console.error("Failed to dispatch meeting reminder notification:", err.message);
    }
  }
}

export const meetingScheduler = new MeetingSchedulerService();
export default meetingScheduler;

