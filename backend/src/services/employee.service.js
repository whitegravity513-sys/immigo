import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Holiday from "../models/Holiday.js";
import { getTodayDateString, isWeeklyOff, getWorkingDays } from "../utils/dateUtils.js";
import { ApiError } from "../utils/apiError.js";

const cleanObjectId = (id) => {
  const str = String(id || "").replace(/^virtual-/, "").trim();
  if (!str || !mongoose.Types.ObjectId.isValid(str)) return null;
  return str;
};

/**
 * Enterprise Employee Management & Directory Service
 */
export class EmployeeService {
  static formatEmployee(employee) {
    if (!employee) return null;
    return {
      ...(employee.toObject ? employee.toObject() : employee),
      id: employee._id ? employee._id.toString() : (employee.id || ""),
      _id: employee._id ? employee._id.toString() : (employee.id || ""),
    };
  }

  static async getNextEmployeeId() {
    const allEmps = await Employee.find({ employeeId: /^(VESTA|WG)-/i })
      .select("employeeId")
      .sort({ createdAt: -1 })
      .lean();
    let maxNum = 0;
    for (const e of allEmps) {
      const match = e.employeeId.match(/^(?:VESTA|WG)-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `VESTA-${(maxNum + 1).toString().padStart(3, "0")}`;
  }

  static async createEmployee(data) {
    const {
      name,
      email,
      password,
      role,
      designation,
      department,
      phone,
      address,
      emergencyContact,
      joiningDate,
      employeeId,
      status,
      permissions,
      allocatedLeaves,
      leaveBalance,
      profileImage,
      previousCompany,
      previousPackage,
      currentPackage,
      experience,
      documents,
    } = data;

    if (!name || !email || !password) {
      throw new ApiError(400, "Name, email, and password are required");
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingEmployee = await Employee.findOne({ email: cleanEmail });
    if (existingEmployee) {
      throw new ApiError(400, "Email already exists");
    }

    let finalEmployeeId = employeeId;
    if (!finalEmployeeId) {
      finalEmployeeId = await this.getNextEmployeeId();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const initialLeaves = leaveBalance !== undefined ? Number(leaveBalance) : (allocatedLeaves !== undefined ? Number(allocatedLeaves) : 18);
    const initialAllocated = allocatedLeaves !== undefined ? Number(allocatedLeaves) : initialLeaves;

    const formattedDocs = Array.isArray(documents)
      ? documents
          .filter((d) => d && d.url)
          .map((d) => ({
            name: d.name || "Official Document",
            type: d.type || "Other",
            url: d.url,
            uploadedBy: "Admin",
            status: "Verified",
            uploadedAt: new Date(),
          }))
      : [];

    const newEmployee = await Employee.create({
      employeeId: finalEmployeeId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      department: department ? department.trim() : "General",
      designation: designation || role || "Employee",
      phone: phone ? phone.trim() : "",
      address: address ? address.trim() : "",
      previousCompany: previousCompany ? previousCompany.trim() : "",
      previousPackage: previousPackage ? previousPackage.trim() : "",
      currentPackage: currentPackage ? currentPackage.trim() : "",
      experience: experience ? experience.trim() : "",
      emergencyContact: emergencyContact || { name: "", phone: "", relation: "" },
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: status || "active",
      role: role || "employee",
      permissions: Array.isArray(permissions) ? permissions : [],
      allocatedLeaves: initialAllocated,
      leaveBalance: initialLeaves,
      profileImage: profileImage || "",
      documents: formattedDocs,
    });

    return this.formatEmployee(newEmployee);
  }

  static async getEmployees() {
    const employees = await Employee.find().select("-password").sort({ createdAt: -1 }).lean();
    return employees.map((emp) => this.formatEmployee(emp));
  }

  static async updateEmployee(id, data) {
    const {
      name,
      email,
      password,
      department,
      designation,
      phone,
      address,
      emergencyContact,
      joiningDate,
      leavingDate,
      status,
      role,
      permissions,
      allocatedLeaves,
      leaveBalance,
      profileImage,
      previousCompany,
      previousPackage,
      currentPackage,
      experience,
    } = data;

    const cleanId = cleanObjectId(id);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }

    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    if (name) emp.name = name.trim();
    if (email) emp.email = email.trim().toLowerCase();
    if (password) {
      emp.password = await bcrypt.hash(password, 10);
    }
    if (department !== undefined) emp.department = department ? department.trim() : "General";
    if (designation !== undefined) emp.designation = designation;
    if (phone !== undefined) emp.phone = phone ? phone.trim() : "";
    if (address !== undefined) emp.address = address ? address.trim() : "";
    if (previousCompany !== undefined) emp.previousCompany = previousCompany ? previousCompany.trim() : "";
    if (previousPackage !== undefined) emp.previousPackage = previousPackage ? previousPackage.trim() : "";
    if (currentPackage !== undefined) emp.currentPackage = currentPackage ? currentPackage.trim() : "";
    if (experience !== undefined) emp.experience = experience ? experience.trim() : "";
    if (emergencyContact !== undefined) emp.emergencyContact = emergencyContact;
    if (joiningDate) emp.joiningDate = new Date(joiningDate);
    if (leavingDate !== undefined) emp.leavingDate = leavingDate ? new Date(leavingDate) : null;
    if (status) emp.status = status;
    if (role) emp.role = role;
    if (permissions !== undefined && Array.isArray(permissions)) emp.permissions = permissions;
    if (allocatedLeaves !== undefined) emp.allocatedLeaves = Number(allocatedLeaves);
    if (leaveBalance !== undefined) emp.leaveBalance = Number(leaveBalance);
    if (profileImage !== undefined) emp.profileImage = profileImage;

    await emp.save();
    return this.formatEmployee(emp);
  }

  static async toggleStatus(id) {
    const cleanId = cleanObjectId(id);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }
    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    emp.status = emp.status === "active" ? "inactive" : "active";
    await emp.save();
    return this.formatEmployee(emp);
  }

  static async setLeaveBalance(id, leaveBalance, allocatedLeaves) {
    if (leaveBalance === undefined) {
      throw new ApiError(400, "leaveBalance is required");
    }

    const cleanId = cleanObjectId(id);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }
    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    emp.leaveBalance = Number(leaveBalance);
    if (allocatedLeaves !== undefined) {
      emp.allocatedLeaves = Number(allocatedLeaves);
    }
    await emp.save();
    return this.formatEmployee(emp);
  }

  // --- Document Vault & Self-Service Methods ---
  static async getEmployeeProfile(id) {
    const cleanId = cleanObjectId(id);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }
    const emp = await Employee.findById(cleanId).select("-password");
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }
    return this.formatEmployee(emp);
  }

  static async updateContactDetails(id, contactData) {
    const cleanId = cleanObjectId(id);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }
    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    const { phone, address, emergencyContact } = contactData;
    if (phone !== undefined) emp.phone = phone.trim();
    if (address !== undefined) emp.address = address.trim();
    if (emergencyContact !== undefined) emp.emergencyContact = emergencyContact;

    await emp.save();
    return this.formatEmployee(emp);
  }

  static async updateProfilePhoto(id, profileImage) {
    if (!profileImage) {
      throw new ApiError(400, "profileImage is required");
    }

    const cleanId = cleanObjectId(id);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }
    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    emp.profileImage = profileImage;
    await emp.save();
    return this.formatEmployee(emp);
  }

  static async uploadDocument(id, docData, uploadedBy = "Employee") {
    const { name, type, url } = docData;
    if (!name || !url) {
      throw new ApiError(400, "Document name and file are required");
    }

    const cleanId = cleanObjectId(id);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }
    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    if (!Array.isArray(emp.documents)) {
      emp.documents = [];
    }

    const newDoc = {
      name: name.trim(),
      type: type || "Other",
      url,
      uploadedBy,
      status: uploadedBy === "Admin" ? "Verified" : "Submitted",
      uploadedAt: new Date(),
    };

    emp.documents.push(newDoc);
    await emp.save();
    return this.formatEmployee(emp);
  }

  static async deleteDocument(employeeId, docId) {
    const cleanId = cleanObjectId(employeeId);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }
    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    emp.documents = emp.documents.filter((d) => d._id.toString() !== docId && d.id !== docId);
    await emp.save();
    return this.formatEmployee(emp);
  }

  static async getEmployeeHistory(id, startDate, endDate) {
    const cleanId = String(id || "").replace(/^virtual-/, "").trim();
    if (!cleanId || !mongoose.Types.ObjectId.isValid(cleanId)) {
      return {
        employee: null,
        attendanceHistory: [],
        leaveHistory: [],
      };
    }

    const emp = await Employee.findById(cleanId).select("-password");
    const query = { employeeId: cleanId };
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendances = await Attendance.find(query).sort({ date: -1 });
    const leaves = await Leave.find({ employee: cleanId }).sort({ createdAt: -1 });

    const attendanceHistory = attendances.map((a) => ({
      ...(a.toObject ? a.toObject() : a),
      id: a._id.toString(),
      _id: a._id.toString(),
    }));

    const leaveHistory = leaves.map((l) => ({
      ...(l.toObject ? l.toObject() : l),
      id: l._id.toString(),
      _id: l._id.toString(),
    }));

    return {
      employee: emp ? this.formatEmployee(emp) : null,
      attendanceHistory,
      leaveHistory,
    };
  }

  static async getEmployeeMonthlyDetails(employeeId, month, year) {
    const cleanId = cleanObjectId(employeeId);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }
    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();

    const endDay = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const endDate = `${y}-${String(m).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

    const [holidays, attendances, leaves] = await Promise.all([
      Holiday.find().lean(),
      Attendance.find({
        employeeId,
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1 }).lean(),
      Leave.find({
        employeeId,
        status: "Approved",
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) },
      }).lean(),
    ]);

    const holidaysMap = {};
    const holidayDatesSet = new Set();
    holidays.forEach((h) => {
      if (!h || !h.date) return;
      const dStr = typeof h.date === "string" ? h.date.split("T")[0] : new Date(h.date).toISOString().split("T")[0];
      holidaysMap[dStr] = h.title;
      holidayDatesSet.add(dStr);
    });

    const workingDays = getWorkingDays(y, m, holidayDatesSet);
    let joiningDateStr = null;
    if (emp.joiningDate) {
      try {
        const d = new Date(emp.joiningDate);
        if (!isNaN(d.getTime())) {
          joiningDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
        }
      } catch {}
    }
    const applicableWorkingDays = workingDays.filter((d) => !joiningDateStr || d >= joiningDateStr);

    let presentCount = 0;
    let halfDayCount = 0;

    const dailyRecords = [];
    for (let d = 1; d <= endDay; d++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dt = new Date(y, m - 1, d);
      const dayOfWeek = dt.getDay();

      if (joiningDateStr && dateStr < joiningDateStr) {
        dailyRecords.push({
          date: dateStr,
          dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
          status: "Before Joining",
          checkInTime: null,
          checkOutTime: null,
          checkInLocation: null,
          checkOutLocation: null,
          checkOutNote: "",
          halfSalaryDeduct: false,
          breaks: [],
          totalWorkSeconds: 0,
          totalBreakSeconds: 0,
          workSeconds: 0,
          breakSeconds: 0,
          holidayTitle: null,
        });
        continue;
      }

      const record = attendances.find((a) => a.date === dateStr);
      const isHoliday = !!holidaysMap[dateStr];
      const holidayTitle = holidaysMap[dateStr] || null;
      const weeklyOff = isWeeklyOff(dateStr);

      let status = "Absent";
      let checkInTime = null;
      let checkOutTime = null;
      let checkInLocation = null;
      let checkOutLocation = null;
      let checkOutNote = "";
      let halfSalaryDeduct = false;
      let breaks = [];
      let totalWorkSeconds = 0;
      let totalBreakSeconds = 0;

      const todayStr = getTodayDateString();

      if (record) {
        status = record.status;
        checkInTime = record.checkInTime || null;
        checkOutTime = record.checkOutTime || null;
        checkInLocation = {
          latitude: record.checkInLatitude,
          longitude: record.checkInLongitude,
          address: record.checkInAddress,
          device: record.checkInDevice,
        };
        checkOutLocation = {
          latitude: record.checkOutLatitude,
          longitude: record.checkOutLongitude,
          address: record.checkOutAddress,
          device: record.checkOutDevice,
        };
        checkOutNote = record.checkOutNote || "";
        totalWorkSeconds = record.totalWorkSeconds || 0;
        totalBreakSeconds = record.totalBreakSeconds || 0;
        breaks = record.breaks || [];

        if (!totalWorkSeconds && checkInTime && checkOutTime) {
          const diff = Math.floor((new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / 1000);
          totalWorkSeconds = Math.max(0, diff - (totalBreakSeconds || 0));
        }
        if (totalWorkSeconds > 0 && totalWorkSeconds < 28800) {
          halfSalaryDeduct = true;
        }

        if (["Present", "Active", "Checked Out", "On Break"].includes(record.status)) {
          if (halfSalaryDeduct) halfDayCount++;
          else presentCount++;
        } else if (isHoliday) {
          status = "Holiday";
        } else if (weeklyOff) {
          status = "Weekly Off";
        }
      } else if (isHoliday) {
        status = "Holiday";
      } else if (weeklyOff) {
        status = "Weekly Off";
      } else {
        const onLeave = leaves.some((l) => {
          const lStart = new Date(l.startDate).toISOString().split("T")[0];
          const lEnd = new Date(l.endDate).toISOString().split("T")[0];
          return dateStr >= lStart && dateStr <= lEnd;
        });
        if (onLeave) {
          status = "On Leave";
        } else if (dateStr > todayStr) {
          status = "Upcoming";
        } else {
          status = "Absent";
        }
      }

      dailyRecords.push({
        date: dateStr,
        dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
        status,
        checkInTime,
        checkOutTime,
        checkInLocation,
        checkOutLocation,
        checkOutNote,
        halfSalaryDeduct,
        breaks,
        totalWorkSeconds,
        totalBreakSeconds,
        workSeconds: totalWorkSeconds,
        breakSeconds: totalBreakSeconds,
        holidayTitle,
      });
    }

    const totalLeaveDays = leaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
    const pastApplicableWorkingDays = applicableWorkingDays.filter((d) => d <= getTodayDateString());
    const absentCount = Math.max(
      0,
      pastApplicableWorkingDays.length - presentCount - halfDayCount - totalLeaveDays
    );

    const totalWorkSecondsAll = dailyRecords.reduce((sum, r) => sum + (r.totalWorkSeconds || 0), 0);
    const totalBreakSecondsAll = dailyRecords.reduce((sum, r) => sum + (r.totalBreakSeconds || 0), 0);
    const fmtHours = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return `${h}h ${m}m`;
    };
    const workedDaysCount = presentCount + halfDayCount;
    const avgSecondsPerDay = workedDaysCount > 0 ? Math.floor(totalWorkSecondsAll / workedDaysCount) : 0;

    const formattedLeaves = leaves.map((l) => ({
      ...l.toObject(),
      id: l._id.toString(),
      _id: l._id.toString(),
    }));

    return {
      employee: {
        ...emp.toObject(),
        id: emp._id.toString(),
        _id: emp._id.toString(),
        nextMonthLeaves: 0,
      },
      month: m,
      year: y,
      workingDaysInMonth: workingDays.length,
      applicableWorkingDays: applicableWorkingDays.length,
      summary: {
        present: presentCount,
        presentDays: presentCount,
        halfDay: halfDayCount,
        halfDays: halfDayCount,
        absent: absentCount,
        absentDays: absentCount,
        onLeave: totalLeaveDays,
        totalLeaveDays: totalLeaveDays,
        totalWorkingDays: applicableWorkingDays.length,
        totalWorkHours: fmtHours(totalWorkSecondsAll),
        totalBreakHours: fmtHours(totalBreakSecondsAll),
        averageWorkHoursPerDay: fmtHours(avgSecondsPerDay),
      },
      leaves: formattedLeaves,
      dailyRecords: dailyRecords.reverse(),
    };
  }

  static async getEmployeeNote(id, date) {
    const targetDate = date || getTodayDateString();
    const record = await Attendance.findOne({
      employeeId: id,
      date: targetDate,
      checkOutNote: { $nin: ["", null] },
    }).populate("employeeId", "employeeId name designation");

    if (!record) {
      throw new ApiError(404, "No checkout note found for this employee on the selected date");
    }

    return {
      employeeId: record.employeeId?.employeeId,
      name: record.employeeId?.name,
      designation: record.employeeId?.designation,
      checkOutTime: record.checkOutTime,
      checkOutNote: record.checkOutNote,
      date: record.date,
    };
  }

  static async getEmployeeLeaves(id) {
    const leaves = await Leave.find({ employeeId: id }).sort({ createdAt: -1 });
    return leaves.map((l) => ({
      ...l.toObject(),
      id: l._id.toString(),
      _id: l._id.toString(),
    }));
  }
}

export default EmployeeService;
