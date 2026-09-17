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

  // --- Employee Self Service ---
  static async getEmployeeStatus(employeeId) {
    const today = getTodayDateString();
    const record = await Attendance.findOne({ employeeId, date: today });
    const emp = await Employee.findById(employeeId).select("leaveBalance name employeeId designation");

    const holiday = await getHolidayForDate(today);
    const weeklyOff = isWeeklyOff(today);
    const isSundayToday = isSunday(today);
    const isOffSatToday = isSecondOrFourthSaturday(today);

    const leaveInfo = {
      leaveBalance: emp?.leaveBalance ?? 0,
      nextMonthLeaves: 0,
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
      ...leaveInfo,
    };
  }

  static async checkIn(employeeId, location = {}) {
    const emp = await Employee.findById(employeeId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    const today = getTodayDateString();

    // Business Rule: joing date ka badd hi attendence lage
    if (emp.joiningDate) {
      const joiningDateStr = new Date(emp.joiningDate).toISOString().split("T")[0];
      if (today < joiningDateStr) {
        throw new ApiError(
          400,
          `Attendance cannot be marked prior to employee joining date (${joiningDateStr})`
        );
      }
    }

    let record = await Attendance.findOne({ employeeId, date: today });

    if (record && record.status !== "Absent") {
      throw new ApiError(400, "Already checked in today");
    }

    const now = new Date();
    if (!record) {
      record = new Attendance({
        employeeId,
        date: today,
        checkInTime: now,
        status: "Active",
        checkInLatitude: location.latitude || null,
        checkInLongitude: location.longitude || null,
        checkInAddress: location.address || "",
        checkInDevice: location.device || "Browser",
      });
    } else {
      record.checkInTime = now;
      record.status = "Active";
      record.checkInLatitude = location.latitude || null;
      record.checkInLongitude = location.longitude || null;
      record.checkInAddress = location.address || "";
      record.checkInDevice = location.device || "Browser";
    }

    await record.save();

    // Trigger Admin Live Notification
    try {
      const emp = await Employee.findById(employeeId).select("name employeeId designation");
      const empIdCode = emp?.employeeId || "WG-EMP";
      const empName = emp?.name || "Employee";
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

    return this.formatAttendance(record);
  }

  static async startBreak(employeeId, breakType = "Other") {
    const today = getTodayDateString();
    const record = await Attendance.findOne({ employeeId, date: today });

    if (!record || record.status === "Absent") {
      throw new ApiError(400, "Must check in before taking a break");
    }

    if (record.status === "On Break") {
      throw new ApiError(400, "Already on a break");
    }

    if (record.status === "Checked Out") {
      throw new ApiError(400, "Cannot start break after check-out");
    }

    const breakStart = new Date();
    record.breaks.push({
      breakType,
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
        message: `Employee [${empIdCode}] ${empName} went on ${breakType} break at ${timeStr}`,
        employeeId,
        employeeName: `${empName} (${empIdCode})`,
        metadata: { employeeId: empIdCode, name: empName, breakType, startTime: breakStart },
      });
    } catch (e) {
      // Non-blocking
    }

    return this.formatAttendance(record);
  }

  static async endBreak(employeeId) {
    const today = getTodayDateString();
    const record = await Attendance.findOne({ employeeId, date: today });

    if (!record || record.status !== "On Break") {
      throw new ApiError(400, "Not currently on a break");
    }

    const currentBreak = record.breaks[record.breaks.length - 1];
    let breakType = "Break";
    if (currentBreak && !currentBreak.endTime) {
      currentBreak.endTime = new Date();
      breakType = currentBreak.breakType || "Break";
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
        message: `Employee [${empIdCode}] ${empName} resumed work after ${breakType} break`,
        employeeId,
        employeeName: `${empName} (${empIdCode})`,
        metadata: { employeeId: empIdCode, name: empName, breakType },
      });
    } catch (e) {
      // Non-blocking
    }

    return this.formatAttendance(record);
  }

  static async checkOut(employeeId, location = {}, checkOutNote = "") {
    const today = getTodayDateString();
    const record = await Attendance.findOne({ employeeId, date: today });

    if (!record || record.status === "Absent") {
      throw new ApiError(400, "Must check in before checking out");
    }

    if (record.status === "Checked Out") {
      throw new ApiError(400, "Already checked out today");
    }

    // Auto end open break if still on break
    if (record.status === "On Break") {
      const currentBreak = record.breaks[record.breaks.length - 1];
      if (currentBreak && !currentBreak.endTime) {
        currentBreak.endTime = new Date();
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

    const now = new Date();
    record.checkOutTime = now;
    record.status = "Checked Out";
    record.checkOutLatitude = location.latitude || null;
    record.checkOutLongitude = location.longitude || null;
    record.checkOutAddress = location.address || "";
    record.checkOutDevice = location.device || "Browser";
    if (checkOutNote) {
      record.checkOutNote = checkOutNote;
    }

    const totalSecondsElapsed = Math.floor(
      (now.getTime() - new Date(record.checkInTime).getTime()) / 1000
    );
    record.totalWorkSeconds = Math.max(0, totalSecondsElapsed - (record.totalBreakSeconds || 0));

    await record.save();

    // Trigger Admin Live Notification
    try {
      const emp = await Employee.findById(employeeId).select("name employeeId");
      const empIdCode = emp?.employeeId || "WG-EMP";
      const empName = emp?.name || "Employee";
      const hrs = Math.floor(record.totalWorkSeconds / 3600);
      const mins = Math.floor((record.totalWorkSeconds % 3600) / 60);
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

    return this.formatAttendance(record);
  }

  // --- Admin Attendance Reporting & Management ---
  static async getAttendanceReport() {
    const today = getTodayDateString();
    const [todayHoliday, employees, attendanceRecords] = await Promise.all([
      Holiday.findOne({ date: today }).lean(),
      Employee.find({ status: { $ne: "inactive" } }).lean(),
      Attendance.find({ date: today }).lean(),
    ]);

    const weeklyOff = isWeeklyOff(today);

    const activeEmployees = employees.filter((emp) => {
      if (!emp.joiningDate) return true;
      const joiningDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
        new Date(emp.joiningDate)
      );
      return joiningDateStr <= today;
    });

    return activeEmployees.map((emp) => {
      const record = attendanceRecords.find(
        (r) => r.employeeId?.toString() === emp._id.toString()
      );

      if (record) {
        let calculatedWorkSeconds = 0;

        if (record.checkInTime) {
          const endTime = record.checkOutTime
            ? new Date(record.checkOutTime).getTime()
            : Date.now();

          const checkIn = new Date(record.checkInTime).getTime();

          calculatedWorkSeconds =
            Math.floor((endTime - checkIn) / 1000) - (record.totalBreakSeconds || 0);

          if (calculatedWorkSeconds < 0) {
            calculatedWorkSeconds = 0;
          }
        }

        let currentStatus = record.status;
        if (currentStatus === "Absent") {
          if (todayHoliday) currentStatus = "Holiday";
          else if (weeklyOff) currentStatus = "Weekly Off";
        }

        if (currentStatus === "Active" && record.checkInTime) {
          const checkIn = new Date(record.checkInTime).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - checkIn) / 1000);
          calculatedWorkSeconds = elapsedSeconds - (record.totalBreakSeconds || 0);
          if (calculatedWorkSeconds < 0) calculatedWorkSeconds = 0;
        } else if (currentStatus === "On Break") {
          const lastBreak = record.breaks[record.breaks.length - 1];
          if (lastBreak && lastBreak.startTime && record.checkInTime) {
            const checkIn = new Date(record.checkInTime).getTime();
            const breakStart = new Date(lastBreak.startTime).getTime();
            const elapsedBeforeBreak = Math.floor((breakStart - checkIn) / 1000);

            const priorBreaksSum = record.breaks
              .slice(0, -1)
              .reduce((sum, b) => sum + (b.durationSeconds || 0), 0);

            calculatedWorkSeconds = elapsedBeforeBreak - priorBreaksSum;
            if (calculatedWorkSeconds < 0) calculatedWorkSeconds = 0;
          }
        }

        return {
          id: record._id.toString(),
          _id: record._id.toString(),
          employeeId: emp._id.toString(),
          employeeCode: emp.employeeId,
          name: emp.name,
          email: emp.email,
          designation: emp.designation,
          date: record.date,
          status: currentStatus,
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

      const defaultStatus = todayHoliday ? "Holiday" : weeklyOff ? "Weekly Off" : "Absent";
      return {
        id: `virtual-${emp._id}`,
        _id: `virtual-${emp._id}`,
        employeeId: emp._id.toString(),
        employeeCode: emp.employeeId,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        date: today,
        status: defaultStatus,
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
    const { employeeId, date, status, checkInTime, checkOutTime, note } = data;
    if (!employeeId || !date) {
      throw new ApiError(400, "Employee ID and date are required");
    }

    const emp = await Employee.findById(employeeId);
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

    let record = await Attendance.findOne({ employeeId, date });

    if (!record) {
      record = new Attendance({
        employeeId,
        date,
        status: status || "Present",
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        checkOutNote: note || "",
      });
    } else {
      if (status) record.status = status;
      if (checkInTime) record.checkInTime = new Date(checkInTime);
      if (checkOutTime) record.checkOutTime = new Date(checkOutTime);
      if (note !== undefined) record.checkOutNote = note;
    }

    if (record.checkInTime && record.checkOutTime) {
      const elapsed = Math.floor(
        (new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / 1000
      );
      record.totalWorkSeconds = Math.max(0, elapsed - (record.totalBreakSeconds || 0));
    }

    await record.save();
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
