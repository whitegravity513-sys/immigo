import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Holiday from "../models/Holiday.js";
import {
  getTodayDateString,
  isSunday,
  isSecondOrFourthSaturday,
  isWeeklyOff,
  getHolidayForDate,
  getWorkingDays,
} from "../utils/dateUtils.js";
import { ApiError } from "../utils/apiError.js";
import NotificationService from "./notification.service.js";

/**
 * Enterprise Attendance & Timesheet Processing Service
 */
export class AttendanceService {
  static formatAttendance(record) {
    if (!record) return null;
    return {
      ...record.toObject(),
      id: record._id.toString(),
      _id: record._id.toString(),
    };
  }

  // --- Lifetime Attendance Summary since Joining Date ---
  static async getLifetimeAttendanceStats(employeeId, empDoc = null) {
    try {
      const emp = empDoc || (await Employee.findById(employeeId).select("joiningDate createdAt").lean());
      if (!emp) return { presentDays: 0, absentDays: 0, leaveDays: 0, halfDays: 0, totalWorkingDays: 0 };

      const todayStr = getTodayDateString();
      let joiningDateStr = todayStr;
      if (emp.joiningDate) {
        try {
          const jd = new Date(emp.joiningDate);
          if (!isNaN(jd.getTime())) {
            joiningDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(jd);
          }
        } catch {}
      } else if (emp.createdAt) {
        try {
          const cd = new Date(emp.createdAt);
          if (!isNaN(cd.getTime())) {
            joiningDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(cd);
          }
        } catch {}
      }

      if (joiningDateStr > todayStr) {
        joiningDateStr = todayStr;
      }

      const [attendances, approvedLeaves, holidays] = await Promise.all([
        Attendance.find({
          employeeId,
          date: { $gte: joiningDateStr, $lte: todayStr },
        }).lean(),
        Leave.find({
          employeeId,
          status: "Approved",
        }).lean(),
        Holiday.find().lean(),
      ]);

      const holidaysSet = new Set(
        holidays
          .filter((h) => h && h.date)
          .map((h) => (typeof h.date === "string" ? h.date.split("T")[0] : new Date(h.date).toISOString().split("T")[0]))
      );

      let presentDays = 0;
      let halfDays = 0;

      attendances.forEach((rec) => {
        const isHalf =
          rec.halfSalaryDeduct ||
          (rec.totalWorkSeconds > 0 && rec.totalWorkSeconds < 28800);

        if (["Present", "Active", "Checked Out", "On Break"].includes(rec.status)) {
          if (isHalf) {
            halfDays++;
          } else {
            presentDays++;
          }
        }
      });

      // Calculate working days & leaves since joining date
      let cur = new Date(`${joiningDateStr}T00:00:00`);
      const todayDate = new Date(`${todayStr}T00:00:00`);
      let applicableWorkingDays = 0;
      let leaveDays = 0;

      while (cur <= todayDate) {
        const dStr = cur.toISOString().split("T")[0];
        const dayOfWeek = cur.getDay(); // 0 is Sunday, 6 is Saturday
        const dayOfMonth = cur.getDate();
        const satCount = Math.ceil(dayOfMonth / 7);
        const isOffSat = dayOfWeek === 6 && (satCount === 2 || satCount === 4);
        const isSundayDay = dayOfWeek === 0;
        const isOffDay = isSundayDay || isOffSat || holidaysSet.has(dStr);

        if (!isOffDay) {
          applicableWorkingDays++;
          const isOnLeave = approvedLeaves.some((l) => {
            const start = new Date(l.startDate).toISOString().split("T")[0];
            const end = new Date(l.endDate).toISOString().split("T")[0];
            return dStr >= start && dStr <= end;
          });

          if (isOnLeave) {
            leaveDays++;
          }
        }

        cur.setDate(cur.getDate() + 1);
      }

      const workedDays = presentDays + halfDays;
      const absentDays = Math.max(0, applicableWorkingDays - workedDays - leaveDays);

      return {
        joiningDate: joiningDateStr,
        presentDays,
        absentDays,
        leaveDays,
        halfDays,
        totalWorkingDays: applicableWorkingDays,
      };
    } catch (e) {
      console.error("Error calculating lifetime attendance stats:", e);
      return { presentDays: 0, absentDays: 0, leaveDays: 0, halfDays: 0, totalWorkingDays: 0 };
    }
  }

  // --- Employee Self Service ---
  static async getEmployeeStatus(employeeId) {
    const today = getTodayDateString();
    const [record, emp, holiday] = await Promise.all([
      Attendance.findOne({ employeeId, date: today }),
      Employee.findById(employeeId).select(
        "leaveBalance name employeeId designation department profileImage joiningDate createdAt"
      ).lean(),
      getHolidayForDate(today),
    ]);

    const weeklyOff = isWeeklyOff(today);
    const isSundayToday = isSunday(today);
    const isOffSatToday = isSecondOrFourthSaturday(today);
    const attendanceStats = await this.getLifetimeAttendanceStats(employeeId, emp);

    const leaveInfo = {
      leaveBalance: emp?.leaveBalance ?? 0,
      nextMonthLeaves: 0,
      attendanceStats,
    };

    let defaultStatus = "Absent";
    let offReason = "";
    if (holiday) {
      defaultStatus = "Holiday";
    } else if (isSundayToday) {
      defaultStatus = "Weekly Off";
      offReason = "Sunday Off";
    } else if (isOffSatToday) {
      defaultStatus = "Weekly Off";
      offReason = "2nd/4th Saturday Off";
    }

    if (!record) {
      return {
        status: defaultStatus,
        holidayTitle: holiday ? holiday.title : null,
        isOffDay: Boolean(holiday || weeklyOff),
        offReason,
        checkInTime: null,
        checkOutTime: null,
        breaks: [],
        lunchBreakSeconds: 0,
        otherBreakSeconds: 0,
        totalBreakSeconds: 0,
        totalWorkSeconds: 0,
        profileImage: emp?.profileImage || "",
        department: emp?.department || "",
        employeeName: emp?.name || "",
        ...leaveInfo,
      };
    }

    let effectiveStatus = record.status;
    if (record.status === "Absent") {
      if (holiday) effectiveStatus = "Holiday";
      else if (weeklyOff) effectiveStatus = "Weekly Off";
    }

    return {
      ...this.formatAttendance(record),
      status: effectiveStatus,
      holidayTitle: holiday ? holiday.title : null,
      isOffDay: Boolean(holiday || weeklyOff),
      offReason,
      profileImage: emp?.profileImage || "",
      department: emp?.department || "",
      employeeName: emp?.name || "",
      ...leaveInfo,
    };
  }

  static async checkIn(employeeId, location = {}) {
    const emp = await Employee.findById(employeeId).select("name employeeId").lean();
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    const today = getTodayDateString();

    // Business Policy: If today is a declared holiday, clock-in is disabled and attendance is not required
    const todayHoliday = await Holiday.findOne({ date: today }).lean();
    if (todayHoliday) {
      throw new ApiError(
        400,
        `Today is an official company holiday: "${todayHoliday.title}". Attendance check-in is not required.`
      );
    }

    let record = await Attendance.findOne({ employeeId, date: today });
    const now = new Date();

    // Business Policy: If employee has already checked out today, lock re-checking in until next date
    if (record && record.checkOutTime) {
      throw new ApiError(
        400,
        "You have already checked out for today. Multiple check-ins are not permitted. Please contact Admin if you need time adjustments."
      );
    }

    if (!record) {
      record = new Attendance({
        employeeId,
        date: today,
        checkInTime: now,
        status: "Active",
        checkInLatitude: location.latitude || null,
        checkInLongitude: location.longitude || null,
        checkInAddress: location.address || "Web Portal",
        checkInDevice: location.device || "Browser",
      });
    } else {
      // If was on break, auto-close current open break
      if (record.status === "On Break" && record.breaks?.length > 0) {
        const currentBreak = record.breaks[record.breaks.length - 1];
        if (currentBreak && !currentBreak.endTime) {
          currentBreak.endTime = now;
          const dur = Math.floor(
            (currentBreak.endTime.getTime() - new Date(currentBreak.startTime).getTime()) / 1000
          );
          currentBreak.durationSeconds = Math.max(0, dur);
          record.totalBreakSeconds = (record.totalBreakSeconds || 0) + currentBreak.durationSeconds;
        }
      }
      if (!record.checkInTime) {
        record.checkInTime = now;
      }
      record.status = "Active";
      record.checkOutTime = null;
      record.checkInLatitude = location.latitude || record.checkInLatitude || null;
      record.checkInLongitude = location.longitude || record.checkInLongitude || null;
      record.checkInAddress = location.address || record.checkInAddress || "Web Portal";
      record.checkInDevice = location.device || record.checkInDevice || "Browser";
    }

    await record.save();

    // Trigger Admin Live Notification
    try {
      const empName = emp?.name || "Employee";
      const empIdCode = emp?.employeeId || "WG-EMP";
      const timeStr = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

      NotificationService.createNotification({
        type: "CHECK_IN",
        title: `Check-In: ${empName} (${empIdCode})`,
        message: `Employee [${empIdCode}] ${empName} checked in at ${timeStr}`,
        employeeId,
        employeeName: `${empName} (${empIdCode})`,
        metadata: { employeeId: empIdCode, name: empName, date: today, time: now, location },
      });
    } catch (e) {
      // Non-blocking notification
    }

    return await this.getEmployeeStatus(employeeId);
  }

  static async startBreak(employeeId, breakType = "Break") {
    const today = getTodayDateString();
    let record = await Attendance.findOne({ employeeId, date: today });
    const now = new Date();

    if (record && record.checkOutTime) {
      throw new ApiError(400, "Shift is already completed for today. Breaks cannot be started.");
    }

    if (!record) {
      // Auto check-in if not checked in yet
      record = new Attendance({
        employeeId,
        date: today,
        checkInTime: now,
        status: "Active",
        checkInAddress: "Web Portal",
        checkInDevice: "Browser",
      });
      await record.save();
    }

    if (record.status === "On Break") {
      // Already on break, return status smoothly
      return await this.getEmployeeStatus(employeeId);
    }

    const breakStart = new Date();
    // Policy: Employees only have general Break (no Lunch break)
    const normalizedType = "Break";
    if (!record.breaks) record.breaks = [];
    record.breaks.push({
      type: normalizedType,
      breakType: normalizedType,
      startTime: breakStart,
    });
    record.status = "On Break";
    await record.save();

    // Trigger Admin Live Notification
    try {
      const emp = await Employee.findById(employeeId).select("name employeeId");
      const empIdCode = emp?.employeeId || "WG-EMP";
      const empName = emp?.name || "Employee";
      const timeStr = breakStart.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

      NotificationService.createNotification({
        type: "BREAK_START",
        title: `Break Start: ${empName} (${empIdCode})`,
        message: `Employee [${empIdCode}] ${empName} went on ${normalizedType} break at ${timeStr}`,
        employeeId,
        employeeName: `${empName} (${empIdCode})`,
        metadata: { employeeId: empIdCode, name: empName, breakType: normalizedType, startTime: breakStart },
      });
    } catch (e) {
      // Non-blocking
    }

    return await this.getEmployeeStatus(employeeId);
  }

  static async endBreak(employeeId) {
    const today = getTodayDateString();
    const record = await Attendance.findOne({ employeeId, date: today });

    if (!record) {
      return await this.getEmployeeStatus(employeeId);
    }

    if (record.breaks?.length > 0) {
      const currentBreak = record.breaks[record.breaks.length - 1];
      let breakType = "Break";
      if (currentBreak && !currentBreak.endTime) {
        currentBreak.endTime = new Date();
        breakType = currentBreak.type || currentBreak.breakType || "Break";
        const dur = Math.floor(
          (currentBreak.endTime.getTime() - new Date(currentBreak.startTime).getTime()) / 1000
        );
        currentBreak.durationSeconds = Math.max(0, dur);

        if (breakType === "Lunch") {
          record.lunchBreakSeconds = (record.lunchBreakSeconds || 0) + currentBreak.durationSeconds;
        } else {
          record.otherBreakSeconds = (record.otherBreakSeconds || 0) + currentBreak.durationSeconds;
        }
        record.totalBreakSeconds = (record.totalBreakSeconds || 0) + currentBreak.durationSeconds;
      }
    }

    record.status = "Active";
    await record.save();

    // Trigger Admin Live Notification
    try {
      const emp = await Employee.findById(employeeId).select("name employeeId");
      const empIdCode = emp?.employeeId || "WG-EMP";
      const empName = emp?.name || "Employee";

      NotificationService.createNotification({
        type: "BREAK_END",
        title: `Break End: ${empName} (${empIdCode})`,
        message: `Employee [${empIdCode}] ${empName} resumed work after break`,
        employeeId,
        employeeName: `${empName} (${empIdCode})`,
        metadata: { employeeId: empIdCode, name: empName },
      });
    } catch (e) {
      // Non-blocking
    }

    return await this.getEmployeeStatus(employeeId);
  }

  static async checkOut(employeeId, location = {}, checkOutNote = "") {
    const today = getTodayDateString();
    let record = await Attendance.findOne({ employeeId, date: today });
    const now = new Date();

    if (!record) {
      record = new Attendance({
        employeeId,
        date: today,
        checkInTime: now,
        checkOutTime: now,
        status: "Checked Out",
        checkInLatitude: location.latitude || null,
        checkInLongitude: location.longitude || null,
        checkInAddress: location.address || "Web Portal",
        checkInDevice: location.device || "Browser",
        checkOutLatitude: location.latitude || null,
        checkOutLongitude: location.longitude || null,
        checkOutAddress: location.address || "Web Portal",
        checkOutDevice: location.device || "Browser",
        totalWorkSeconds: 0,
        checkOutNote: checkOutNote || "",
      });
      await record.save();
    } else {
      // Auto end open break if still on break
      if (record.status === "On Break" && record.breaks?.length > 0) {
        const currentBreak = record.breaks[record.breaks.length - 1];
        if (currentBreak && !currentBreak.endTime) {
          currentBreak.endTime = now;
          const dur = Math.floor(
            (currentBreak.endTime.getTime() - new Date(currentBreak.startTime).getTime()) / 1000
          );
          currentBreak.durationSeconds = Math.max(0, dur);

          if (currentBreak.breakType === "Lunch" || currentBreak.type === "Lunch") {
            record.lunchBreakSeconds = (record.lunchBreakSeconds || 0) + currentBreak.durationSeconds;
          } else {
            record.otherBreakSeconds = (record.otherBreakSeconds || 0) + currentBreak.durationSeconds;
          }
          record.totalBreakSeconds = (record.totalBreakSeconds || 0) + currentBreak.durationSeconds;
        }
      }

      record.checkOutTime = now;
      record.status = "Checked Out";
      record.checkOutLatitude = location.latitude || null;
      record.checkOutLongitude = location.longitude || null;
      record.checkOutAddress = location.address || "Web Portal";
      record.checkOutDevice = location.device || "Browser";
      if (checkOutNote) {
        record.checkOutNote = checkOutNote;
      }

      const checkInMs = record.checkInTime ? new Date(record.checkInTime).getTime() : now.getTime();
      const totalSecondsElapsed = Math.max(0, Math.floor((now.getTime() - checkInMs) / 1000));
      record.totalWorkSeconds = Math.max(0, totalSecondsElapsed - (record.totalBreakSeconds || 0));

      await record.save();
    }

    // Trigger Admin Live Notification
    try {
      const emp = await Employee.findById(employeeId).select("name employeeId");
      const empIdCode = emp?.employeeId || "WG-EMP";
      const empName = emp?.name || "Employee";
      const hrs = Math.floor((record.totalWorkSeconds || 0) / 3600);
      const mins = Math.floor(((record.totalWorkSeconds || 0) % 3600) / 60);
      const timeStr = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

      NotificationService.createNotification({
        type: "CHECK_OUT",
        title: `Check-Out: ${empName} (${empIdCode})`,
        message: `Employee [${empIdCode}] ${empName} checked out at ${timeStr} (Total Work: ${hrs}h ${mins}m)`,
        employeeId,
        employeeName: `${empName} (${empIdCode})`,
        metadata: { employeeId: empIdCode, name: empName, date: today, time: now, checkOutNote, totalWorkSeconds: record.totalWorkSeconds },
      });
    } catch (e) {
      // Non-blocking
    }

    return await this.getEmployeeStatus(employeeId);
  }

  // --- Admin Attendance Reporting & Management ---
  static async getAttendanceReport(targetDate = null) {
    const queryDate = targetDate || getTodayDateString();
    const queryDateObj = new Date(`${queryDate}T00:00:00`);
    const queryDateEndObj = new Date(`${queryDate}T23:59:59`);

    const [todayHoliday, employees, attendanceRecords, approvedLeaves] = await Promise.all([
      Holiday.findOne({ date: queryDate }).lean(),
      Employee.find().lean(),
      Attendance.find({ date: queryDate }).lean(),
      Leave.find({
        status: "Approved",
        startDate: { $lte: queryDateEndObj },
        endDate: { $gte: queryDateObj },
      }).lean(),
    ]);

    const weeklyOff = isWeeklyOff(queryDate);

    const activeEmployees = employees.filter((emp) => {
      if (!emp.joiningDate) return true;
      const joiningDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
        new Date(emp.joiningDate)
      );
      if (joiningDateStr > queryDate) return false;

      if (emp.leavingDate) {
        const leavingDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
          new Date(emp.leavingDate)
        );
        if (leavingDateStr < queryDate) return false;
      }
      return true;
    });

    const isToday = queryDate === getTodayDateString();

    return activeEmployees.map((emp) => {
      const record = attendanceRecords.find(
        (r) => r.employeeId?.toString() === emp._id.toString()
      );

      const empLeave = approvedLeaves.find(
        (l) => l.employeeId?.toString() === emp._id.toString()
      );

      if (record) {
        let calculatedWorkSeconds = record.totalWorkSeconds || 0;

        if (record.checkInTime) {
          const endTime = record.checkOutTime
            ? new Date(record.checkOutTime).getTime()
            : isToday
            ? Date.now()
            : new Date(record.checkInTime).getTime();

          const checkIn = new Date(record.checkInTime).getTime();

          calculatedWorkSeconds =
            Math.floor((endTime - checkIn) / 1000) - (record.totalBreakSeconds || 0);

          if (calculatedWorkSeconds < 0) {
            calculatedWorkSeconds = 0;
          }
        }

        let currentStatus = record.status;
        if (currentStatus === "Absent") {
          if (empLeave) currentStatus = "On Leave";
          else if (todayHoliday) currentStatus = "Holiday";
          else if (weeklyOff) currentStatus = "Weekly Off";
        }

        if (isToday && currentStatus === "Active" && record.checkInTime) {
          const checkIn = new Date(record.checkInTime).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - checkIn) / 1000);
          calculatedWorkSeconds = elapsedSeconds - (record.totalBreakSeconds || 0);
          if (calculatedWorkSeconds < 0) calculatedWorkSeconds = 0;
        } else if (isToday && currentStatus === "On Break") {
          const lastBreak = record.breaks?.[record.breaks.length - 1];
          if (lastBreak && lastBreak.startTime && record.checkInTime) {
            const checkIn = new Date(record.checkInTime).getTime();
            const breakStart = new Date(lastBreak.startTime).getTime();
            const elapsedBeforeBreak = Math.floor((breakStart - checkIn) / 1000);

            const priorBreaksSum = (record.breaks || [])
              .slice(0, -1)
              .reduce((sum, b) => sum + (b.durationSeconds || 0), 0);

            calculatedWorkSeconds = elapsedBeforeBreak - priorBreaksSum;
            if (calculatedWorkSeconds < 0) calculatedWorkSeconds = 0;
          }
        }

        const isUserActive = Boolean(
          record.checkInTime ||
          ["Present", "Active", "Checked Out", "On Break"].includes(currentStatus)
        );

        return {
          id: record._id.toString(),
          _id: record._id.toString(),
          employeeId: emp._id.toString(),
          employeeCode: emp.employeeId,
          name: emp.name,
          email: emp.email,
          personalEmail: emp.personalEmail || "",
          phone: emp.phone || "",
          department: emp.department || "General",
          designation: emp.designation || "Employee",
          employeeStatus: emp.status || "active",
          date: record.date,
          status: currentStatus,
          isActiveOnDate: isUserActive,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          checkInLocation: {
            latitude: record.checkInLatitude,
            longitude: record.checkInLongitude,
            address: record.checkInAddress,
            device: record.checkInDevice,
          },
          checkOutLocation: {
            latitude: record.checkOutLatitude,
            longitude: record.checkOutLongitude,
            address: record.checkOutAddress,
            device: record.checkOutDevice,
          },
          checkOutNote: record.checkOutNote || "",
          totalWorkSeconds: calculatedWorkSeconds,
          halfSalaryDeduct: calculatedWorkSeconds > 0 && calculatedWorkSeconds < 28800,
          totalBreakSeconds: record.totalBreakSeconds || 0,
          lunchBreakSeconds: record.lunchBreakSeconds || 0,
          otherBreakSeconds: record.otherBreakSeconds || 0,
          breaks: record.breaks || [],
        };
      }

      let defaultStatus = "Absent";
      if (empLeave) {
        defaultStatus = "On Leave";
      } else if (todayHoliday) {
        defaultStatus = "Holiday";
      } else if (weeklyOff) {
        defaultStatus = "Weekly Off";
      }

      return {
        id: `virtual-${emp._id}`,
        _id: `virtual-${emp._id}`,
        employeeId: emp._id.toString(),
        employeeCode: emp.employeeId,
        name: emp.name,
        email: emp.email,
        personalEmail: emp.personalEmail || "",
        phone: emp.phone || "",
        department: emp.department || "General",
        designation: emp.designation || "Employee",
        employeeStatus: emp.status || "active",
        date: queryDate,
        status: defaultStatus,
        isActiveOnDate: false,
        checkInTime: null,
        checkOutTime: null,
        checkInLocation: null,
        checkOutLocation: null,
        checkOutNote: "",
        totalWorkSeconds: 0,
        halfSalaryDeduct: false,
        totalBreakSeconds: 0,
        lunchBreakSeconds: 0,
        otherBreakSeconds: 0,
        breaks: [],
      };
    });
  }

  static async getAttendanceCalendarMonth(month, year) {
    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();

    const totalDays = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const endDate = `${y}-${String(m).padStart(2, "0")}-${String(totalDays).padStart(2, "0")}`;

    const [employees, records, leaves, holidays] = await Promise.all([
      Employee.find().lean(),
      Attendance.find({ date: { $gte: startDate, $lte: endDate } }).lean(),
      Leave.find({
        status: "Approved",
        startDate: { $lte: new Date(`${endDate}T23:59:59`) },
        endDate: { $gte: new Date(`${startDate}T00:00:00`) },
      }).lean(),
      Holiday.find().lean(),
    ]);

    const holidayMap = new Map();
    holidays.forEach((h) => {
      if (!h || !h.date) return;
      const dStr = typeof h.date === "string" ? h.date.split("T")[0] : new Date(h.date).toISOString().split("T")[0];
      holidayMap.set(dStr, h.title || "Holiday");
    });

    const todayStr = getTodayDateString();
    const days = [];

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayDate = new Date(`${dateStr}T00:00:00`);
      const isOff = isWeeklyOff(dateStr);
      const isHoliday = holidayMap.has(dateStr);
      const holidayTitle = isHoliday ? holidayMap.get(dateStr) : null;

      // Filter employees who had joined by dateStr and had not left
      const eligibleEmployees = employees.filter((emp) => {
        if (!emp.joiningDate) return true;
        const jd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(emp.joiningDate));
        if (jd > dateStr) return false;
        if (emp.leavingDate) {
          const ld = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(emp.leavingDate));
          if (ld < dateStr) return false;
        }
        return true;
      });

      const dayRecords = records.filter((r) => r.date === dateStr);

      let presentCount = 0;
      let halfDayCount = 0;
      let onBreakCount = 0;

      dayRecords.forEach((r) => {
        if (["Present", "Active", "Checked Out", "On Break"].includes(r.status) || r.checkInTime) {
          const workSec = r.totalWorkSeconds || 0;
          if (r.halfSalaryDeduct || (workSec > 0 && workSec < 28800)) {
            halfDayCount++;
          } else {
            presentCount++;
          }
          if (r.status === "On Break") {
            onBreakCount++;
          }
        }
      });

      // Count leaves for this day
      let leaveCount = 0;
      eligibleEmployees.forEach((emp) => {
        const hasRec = dayRecords.some((r) => r.employeeId?.toString() === emp._id.toString() && r.checkInTime);
        if (!hasRec) {
          const onLeave = leaves.some((l) => {
            if (l.employeeId?.toString() !== emp._id.toString()) return false;
            const lStart = new Date(l.startDate).toISOString().split("T")[0];
            const lEnd = new Date(l.endDate).toISOString().split("T")[0];
            return dateStr >= lStart && dateStr <= lEnd;
          });
          if (onLeave) leaveCount++;
        }
      });

      const totalActiveEmployees = eligibleEmployees.length;
      let absentCount = 0;
      if (!isOff && !isHoliday && dateStr <= todayStr) {
        absentCount = Math.max(0, totalActiveEmployees - presentCount - halfDayCount - leaveCount);
      }

      days.push({
        date: dateStr,
        day,
        isWeeklyOff: isOff,
        isHoliday,
        holidayTitle,
        isFuture: dateStr > todayStr,
        totalStaff: totalActiveEmployees,
        presentCount,
        halfDayCount,
        leaveCount,
        absentCount,
        onBreakCount,
      });
    }

    return {
      month: m,
      year: y,
      totalDays,
      days,
    };
  }

  static async getAttendanceByDate(startDate, endDate) {
    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(query)
      .populate("employeeId", "employeeId name email designation")
      .sort({ date: -1 })
      .lean();

    return records.map((r) => this.formatAttendance(r));
  }

  static async updateAttendance(data) {
    const { employeeId, date, status, checkInTime, checkOutTime, note, halfSalaryDeduct } = data;
    if (!employeeId || !date) {
      throw new ApiError(400, "Employee ID and date are required");
    }

    const cleanId = String(employeeId || "").replace(/^virtual-/, "").trim();
    let emp = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      emp = await Employee.findById(cleanId);
    }
    if (!emp) {
      emp = await Employee.findOne({ employeeId: cleanId });
    }
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    // Business Rule: joing date ka badd hi attendence lage
    if (emp.joiningDate) {
      const joiningDateStr = new Date(emp.joiningDate).toISOString().split("T")[0];
      if (date < joiningDateStr) {
        throw new ApiError(
          400,
          `Attendance date (${date}) cannot be earlier than employee joining date (${joiningDateStr})`
        );
      }
    }

    let record = await Attendance.findOne({ employeeId: emp._id, date });

    if (!record) {
      record = new Attendance({
        employeeId: emp._id,
        date,
        status: status || "Present",
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        checkOutNote: note || "",
        halfSalaryDeduct: Boolean(halfSalaryDeduct),
      });
    } else {
      if (status) record.status = status;
      if (checkInTime !== undefined) record.checkInTime = checkInTime ? new Date(checkInTime) : null;
      if (checkOutTime !== undefined) record.checkOutTime = checkOutTime ? new Date(checkOutTime) : null;
      if (note !== undefined) record.checkOutNote = note;
      if (halfSalaryDeduct !== undefined) record.halfSalaryDeduct = Boolean(halfSalaryDeduct);
    }

    if (record.checkInTime && record.checkOutTime) {
      const elapsed = Math.floor(
        (new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / 1000
      );
      record.totalWorkSeconds = Math.max(0, elapsed - (record.totalBreakSeconds || 0));
    } else if (record.checkInTime && !record.checkOutTime) {
      if (record.status !== "Active" && record.status !== "On Break") {
        record.status = "Active";
      }
    }

    await record.save();

    // Trigger Employee Live Notification
    try {
      NotificationService.createNotification({
        type: "ATTENDANCE_UPDATE",
        title: `Attendance Updated for ${date}`,
        message: `Admin updated your attendance for ${date} to status "${record.status}".`,
        targetRole: "EMPLOYEE",
        targetType: "SPECIFIC",
        targetEmployeeId: emp._id,
        metadata: { date, status: record.status },
      });
    } catch (e) {
      // Non-blocking
    }

    return this.formatAttendance(record);
  }

  static async getAttendanceSummary(month, year) {
    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();

    const startDay = 1;
    const endDay = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const endDate = `${y}-${String(m).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
    const [employees, records, leaves, holidays] = await Promise.all([
      Employee.find().lean(),
      Attendance.find({ date: { $gte: startDate, $lte: endDate } }).lean(),
      Leave.find({
        status: "Approved",
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) },
      }).lean(),
      Holiday.find().lean(),
    ]);

    const holidayDatesSet = new Set();
    holidays.forEach((h) => {
      if (!h || !h.date) return;
      const dStr = typeof h.date === "string" ? h.date.split("T")[0] : new Date(h.date).toISOString().split("T")[0];
      holidayDatesSet.add(dStr);
    });

    const workingDays = getWorkingDays(y, m, holidayDatesSet);
    const todayStr = getTodayDateString();

    const summary = employees.map((emp) => {
      const empRecords = records.filter((r) => r.employeeId?.toString() === emp._id.toString());
      const empLeaves = leaves.filter((l) => l.employeeId?.toString() === emp._id.toString());

      let joiningDateStr = null;
      if (emp.joiningDate) {
        try {
          const d = new Date(emp.joiningDate);
          if (!isNaN(d.getTime())) {
            joiningDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
          }
        } catch {}
      }

      // Applicable working days: strictly days on or after joiningDate, excluding weekends & holidays
      const applicableWorkingDays = workingDays.filter((d) => !joiningDateStr || d >= joiningDateStr);
      const pastApplicableWorkingDays = applicableWorkingDays.filter((d) => d <= todayStr);

      let presentCount = 0;
      let halfDayCount = 0;

      empRecords.forEach((r) => {
        if (["Present", "Active", "Checked Out", "On Break"].includes(r.status)) {
          let totalWorkSeconds = r.totalWorkSeconds || 0;
          if (!totalWorkSeconds && r.checkInTime && r.checkOutTime) {
            const diff = Math.floor((new Date(r.checkOutTime).getTime() - new Date(r.checkInTime).getTime()) / 1000);
            totalWorkSeconds = Math.max(0, diff - (r.totalBreakSeconds || 0));
          }
          if (totalWorkSeconds > 0 && totalWorkSeconds < 28800) {
            halfDayCount++;
          } else {
            presentCount++;
          }
        }
      });

      const leaveDays = empLeaves.reduce((acc, l) => acc + (l.totalDays || 0), 0);
      const absentDays = Math.max(0, pastApplicableWorkingDays.length - presentCount - halfDayCount - leaveDays);

      return {
        _id: emp._id.toString(),
        id: emp._id.toString(),
        employeeId: emp.employeeId,
        employeeCode: emp.employeeId,
        name: typeof emp.name === "string" ? emp.name : (emp.name?.first ? `${emp.name.first} ${emp.name.last}` : String(emp.name || "")),
        designation: emp.designation,
        status: emp.status || "active",
        joiningDate: emp.joiningDate,
        leaveBalance: emp.leaveBalance ?? 0,
        nextMonthLeaves: emp.nextMonthLeaves ?? 0,
        nextMonthLeaveEarned: 1.5,
        summary: {
          applicableWorkingDays: applicableWorkingDays.length,
          totalMonthWorkingDays: workingDays.length,
          presentDays: presentCount,
          halfDays: halfDayCount,
          absentDays,
          leaveDays,
        },
        applicableWorkingDays: applicableWorkingDays.length,
        totalMonthWorkingDays: workingDays.length,
        totalPresent: presentCount,
        totalLeaves: leaveDays,
      };
    });

    return { month: m, year: y, summary };
  }

  static async getDailyNotes(date) {
    const targetDate = date || getTodayDateString();
    const records = await Attendance.find({
      date: targetDate,
      checkOutNote: { $nin: ["", null] },
    })
      .populate("employeeId", "employeeId name designation")
      .lean();

    return records.map((r) => ({
      employeeId: r.employeeId?.employeeId,
      name: r.employeeId?.name,
      designation: r.employeeId?.designation,
      checkOutTime: r.checkOutTime,
      checkOutNote: r.checkOutNote,
      date: r.date,
    }));
  }
}

export default AttendanceService;
