import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Holiday from "../models/Holiday.js";
import { getTodayDateString, isWeeklyOff, getWorkingDays } from "../utils/dateUtils.js";
import { ApiError } from "../utils/apiError.js";
import { saveBase64File } from "../utils/fileStorage.js";
import NotificationService from "./notification.service.js";

const cleanObjectId = (id) => {
  const str = String(id || "").replace(/^virtual-/, "").trim();
  if (!str || !mongoose.Types.ObjectId.isValid(str)) return null;
  return str;
};

export class EmployeeService {
  static formatEmployee(employee) {
    if (!employee) return null;
    return {
      ...(employee.toObject ? employee.toObject() : employee),
      id: employee._id ? employee._id.toString() : (employee.id || ""),
      _id: employee._id ? employee._id.toString() : (employee.id || ""),
    };
  }

  static generateImmiEmployeeId(joiningDate, dob) {
    const formatPart = (dStr) => {
      if (!dStr) return null;
      const str = String(dStr).split("T")[0];
      const parts = str.split("-");
      if (parts.length === 3) {
        const yr = parts[0].slice(-2);
        const day = parts[2].padStart(2, "0");
        return `${day}${yr}`;
      }
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return null;
      const day = String(d.getDate()).padStart(2, "0");
      const yr = String(d.getFullYear()).slice(-2);
      return `${day}${yr}`;
    };

    const joinPart = formatPart(joiningDate) || formatPart(new Date());
    const dobPart = formatPart(dob);
    if (!dobPart) {
      return `IMMI-${joinPart}-DDYY`;
    }
    return `IMMI-${joinPart}-${dobPart}`;
  }

  static async getNextEmployeeId(joiningDate, dob) {
    let baseId = this.generateImmiEmployeeId(joiningDate, dob);
    let candidate = baseId;
    let counter = 1;
    while (await Employee.findOne({ employeeId: candidate })) {
      candidate = `${baseId}-${String(counter).padStart(2, "0")}`;
      counter++;
    }
    return candidate;
  }

  static async createEmployee(data) {
    const {
      name,
      email,
      personalEmail,
      password,
      role,
      designation,
      department,
      phone,
      address,
      emergencyContact,
      joiningDate,
      dob,
      employeeId,
      status,
      permissions,
      allocatedLeaves,
      leaveBalance,
      profileImage,
      previousCompany,
      previousPackage,
      currentPackage,
      monthlySalary,
      experience,
      documents,
    } = data;

    if (!name || !name.trim()) {
      throw new ApiError(400, "Employee full name is required");
    }

    if (!email || !email.trim()) {
      throw new ApiError(400, "Company email address is required");
    }

    if (!password || !password.trim()) {
      throw new ApiError(400, "Password is required");
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new ApiError(400, `"${cleanEmail}" is not a valid email address. Please use format name@company.com`);
    }

    let cleanPersonalEmail = "";
    if (personalEmail && personalEmail.trim()) {
      cleanPersonalEmail = personalEmail.trim().toLowerCase();
      if (!emailRegex.test(cleanPersonalEmail)) {
        throw new ApiError(400, `"${cleanPersonalEmail}" is not a valid personal email address.`);
      }
    }

    let cleanPhone = "";
    if (phone) {
      cleanPhone = String(phone).replace(/\s+/g, "").replace(/^(\+91|91)/, "").replace(/-/g, "").replace(/\D/g, "").trim();
      if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);
      if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
        throw new ApiError(400, "Mobile number must be a valid 10-digit number (e.g. 9876543210)");
      }
    }

    const existingEmployee = await Employee.findOne({ email: cleanEmail });
    if (existingEmployee) {
      throw new ApiError(400, `Company email "${cleanEmail}" already exists. Please use a different email.`);
    }

    let finalEmployeeId = employeeId?.trim();
    if (!finalEmployeeId || finalEmployeeId.startsWith("EMP-") || finalEmployeeId.startsWith("VESTA-") || finalEmployeeId.includes("XXXX")) {
      finalEmployeeId = await this.getNextEmployeeId(joiningDate, dob);
    } else {
      const existingId = await Employee.findOne({ employeeId: finalEmployeeId });
      if (existingId) {
        finalEmployeeId = await this.getNextEmployeeId(joiningDate, dob);
      }
    }

    const validStatus = status === "inactive" ? "inactive" : "active";

    const hashedPassword = await bcrypt.hash(password, 8);
    const initialLeaves = leaveBalance !== undefined ? Number(leaveBalance) : (allocatedLeaves !== undefined ? Number(allocatedLeaves) : 18);
    const initialAllocated = allocatedLeaves !== undefined ? Number(allocatedLeaves) : initialLeaves;

    let savedProfileImage = "";
    if (profileImage) {
      savedProfileImage = profileImage.startsWith("data:")
        ? saveBase64File(profileImage, "profiles")
        : profileImage;
    }

    const formattedDocs = Array.isArray(documents)
      ? documents
        .filter((d) => d && d.url)
        .map((d) => ({
          name: d.name || "Official Document",
          type: d.type || "Other",
          url: d.url.startsWith("data:") ? saveBase64File(d.url, "documents", d.name) : d.url,
          uploadedBy: "Admin",
          status: "Verified",
          uploadedAt: new Date(),
        }))
      : [];

    const newEmployee = await Employee.create({
      employeeId: finalEmployeeId,
      name: name.trim(),
      email: cleanEmail,
      personalEmail: cleanPersonalEmail,
      password: hashedPassword,
      rawPassword: password,
      department: department ? department.trim() : "General",
      designation: designation || role || "Employee",
      phone: cleanPhone,
      address: address ? address.trim() : "",
      previousCompany: previousCompany ? previousCompany.trim() : "",
      previousPackage: previousPackage ? previousPackage.trim() : "",
      currentPackage: currentPackage ? currentPackage.trim() : "",
      monthlySalary: monthlySalary ? Number(monthlySalary) : 0,
      experience: experience ? experience.trim() : "",
      emergencyContact: emergencyContact || { name: "", phone: "", relation: "" },
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      dob: dob ? String(dob).trim() : "",
      status: validStatus,
      role: role || "employee",
      permissions: Array.isArray(permissions) ? permissions : [],
      allocatedLeaves: initialAllocated,
      leaveBalance: initialLeaves,
      profileImage: savedProfileImage,
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
      personalEmail,
      password,
      department,
      designation,
      phone,
      address,
      emergencyContact,
      joiningDate,
      dob,
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
      monthlySalary,
      experience,
      employeeId,
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
    if (personalEmail !== undefined) {
      emp.personalEmail = personalEmail ? personalEmail.trim().toLowerCase() : "";
    }
    if (password) {
      emp.password = await bcrypt.hash(password, 10);
      emp.rawPassword = password;
    }
    if (department !== undefined) emp.department = department ? department.trim() : "General";
    if (designation !== undefined) emp.designation = designation;
    if (phone !== undefined) emp.phone = phone ? phone.trim() : "";
    if (address !== undefined) emp.address = address ? address.trim() : "";
    if (previousCompany !== undefined) emp.previousCompany = previousCompany ? previousCompany.trim() : "";
    if (previousPackage !== undefined) emp.previousPackage = previousPackage ? previousPackage.trim() : "";
    if (currentPackage !== undefined) emp.currentPackage = currentPackage ? currentPackage.trim() : "";
    if (monthlySalary !== undefined) emp.monthlySalary = Number(monthlySalary);
    if (experience !== undefined) emp.experience = experience ? experience.trim() : "";
    if (emergencyContact !== undefined) emp.emergencyContact = emergencyContact;
    if (joiningDate) emp.joiningDate = new Date(joiningDate);
    if (dob !== undefined) emp.dob = dob ? String(dob).trim() : "";
    if (employeeId && !employeeId.includes("XXXX")) emp.employeeId = employeeId.trim();
    if (leavingDate !== undefined) emp.leavingDate = leavingDate ? new Date(leavingDate) : null;
    if (status) emp.status = status;
    if (role) emp.role = role;
    if (permissions !== undefined && Array.isArray(permissions)) emp.permissions = permissions;
    if (allocatedLeaves !== undefined) emp.allocatedLeaves = Number(allocatedLeaves);
    if (leaveBalance !== undefined) emp.leaveBalance = Number(leaveBalance);
    if (profileImage !== undefined) {
      emp.profileImage = profileImage ? saveBase64File(profileImage, "profiles", "photo.png") : "";
    }

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

  static async getEmployeeProfile(id) {
    const cleanId = cleanObjectId(id);
    if (!cleanId) {
      throw new ApiError(404, "Employee not found");
    }
    const emp = await Employee.findById(cleanId).select("-password +documents");
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

    const storedPhotoUrl = saveBase64File(profileImage, "profiles", "photo.png");
    emp.profileImage = storedPhotoUrl;
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
    const emp = await Employee.findById(cleanId).select("+documents");
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    if (!Array.isArray(emp.documents)) {
      emp.documents = [];
    }

    const storedDocUrl = saveBase64File(url, "documents", name);

    const newDoc = {
      name: name.trim(),
      type: type || "Other",
      url: storedDocUrl,
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
    const emp = await Employee.findById(cleanId).select("+documents");
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

  static async getEmployeeMonthlyDetails(employeeId, month, year, customStartDate = null, customEndDate = null) {
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
    const monthStartDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const monthEndDate = `${y}-${String(m).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;

    const queryStartDate = customStartDate ? (customStartDate < monthStartDate ? customStartDate : monthStartDate) : monthStartDate;
    const queryEndDate = customEndDate ? (customEndDate > monthEndDate ? customEndDate : monthEndDate) : monthEndDate;

    const [holidays, attendances, leaves] = await Promise.all([
      Holiday.find().lean(),
      Attendance.find({
        employeeId,
        date: { $gte: queryStartDate, $lte: queryEndDate },
      }).sort({ date: 1 }).lean(),
      Leave.find({
        employeeId,
        status: "Approved",
        startDate: { $lte: new Date(queryEndDate) },
        endDate: { $gte: new Date(queryStartDate) },
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
      } catch { }
    }

    const todayStr = getTodayDateString();

    // Determine calculation range bounds
    let calcStartDate = customStartDate || monthStartDate;
    if (joiningDateStr && joiningDateStr > calcStartDate) {
      calcStartDate = joiningDateStr;
    }

    let calcEndDate = customEndDate || monthEndDate;
    if (!customEndDate && y === now.getFullYear() && m === (now.getMonth() + 1)) {
      if (todayStr < calcEndDate) {
        calcEndDate = todayStr;
      }
    }

    // Working days strictly within [calcStartDate, calcEndDate]
    const periodWorkingDays = workingDays.filter((d) => d >= calcStartDate && d <= calcEndDate);

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
        if (totalWorkSeconds > 0 && totalWorkSeconds < 14400) {
          halfSalaryDeduct = true;
        }

        if (["Present", "Active", "Checked Out", "On Break", "Half Day"].includes(record.status) || record.checkInTime) {
          presentCount++;
          if (halfSalaryDeduct) {
            halfDayCount++;
          }
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
    const absentCount = Math.max(
      0,
      periodWorkingDays.length - presentCount - totalLeaveDays
    );

    const totalWorkSecondsAll = dailyRecords.reduce((sum, r) => sum + (r.totalWorkSeconds || 0), 0);
    const totalBreakSecondsAll = dailyRecords.reduce((sum, r) => sum + (r.totalBreakSeconds || 0), 0);
    const fmtHours = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return `${h}h ${m}m`;
    };
    const workedDaysCount = presentCount;
    const avgSecondsPerDay = workedDaysCount > 0 ? Math.floor(totalWorkSecondsAll / workedDaysCount) : 0;

    const formattedLeaves = (leaves || []).map((l) => {
      const obj = typeof l.toObject === "function" ? l.toObject() : l;
      return {
        ...obj,
        id: (l._id || l.id || "").toString(),
        _id: (l._id || l.id || "").toString(),
      };
    });

    const monthlySalary = emp.monthlySalary || 0;
    const totalDaysInMonth = endDay;
    const perDaySalary = totalDaysInMonth > 0 ? (monthlySalary / totalDaysInMonth) : 0;

    let periodHolidays = 0;
    let periodWeeklyOffs = 0;
    dailyRecords.forEach((r) => {
      if (r.date >= calcStartDate && r.date <= calcEndDate) {
        if (r.status === "Holiday") periodHolidays++;
        if (r.status === "Weekly Off") periodWeeklyOffs++;
      }
    });

    // Pro-rate salary accurately for evaluated period
    const paidDays = Math.max(0, presentCount - (halfDayCount * 0.5) + totalLeaveDays + periodHolidays + periodWeeklyOffs);
    const earnedSalary = Math.round(paidDays * perDaySalary);

    // Filter out Upcoming dates: display past to today chronologically (upper sa niche)
    const displayDailyRecords = dailyRecords
      .filter((r) => r.status !== "Before Joining" && r.status !== "Upcoming" && (!r.date || r.date <= todayStr));

    const empObj = typeof emp.toObject === "function" ? emp.toObject() : emp;
    return {
      employee: {
        ...empObj,
        id: (emp._id || emp.id || "").toString(),
        _id: (emp._id || emp.id || "").toString(),
        nextMonthLeaves: 0,
      },
      month: m,
      year: y,
      calcStartDate,
      calcEndDate,
      workingDaysInMonth: workingDays.length,
      applicableWorkingDays: periodWorkingDays.length,
      summary: {
        present: presentCount,
        presentDays: presentCount,
        halfDay: halfDayCount,
        halfDays: halfDayCount,
        absent: absentCount,
        absentDays: absentCount,
        onLeave: totalLeaveDays,
        totalLeaveDays: totalLeaveDays,
        totalWorkingDays: periodWorkingDays.length,
        totalWorkHours: fmtHours(totalWorkSecondsAll),
        totalBreakHours: fmtHours(totalBreakSecondsAll),
        averageWorkHoursPerDay: fmtHours(avgSecondsPerDay),
        monthlySalary: monthlySalary,
        perDaySalary: perDaySalary,
        earnedSalary: earnedSalary,
        paidDays: paidDays,
      },
      leaves: formattedLeaves,
      dailyRecords: displayDailyRecords,
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

  static async getEmployeeProfile(id) {
    const cleanId = cleanObjectId(id) || id;
    const emp = await Employee.findById(cleanId).select("-password").lean();
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }
    return {
      ...emp,
      id: emp._id.toString(),
      _id: emp._id.toString(),
    };
  }

  static async updateContactDetails(id, data) {
    const cleanId = cleanObjectId(id) || id;
    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    if (data.phone !== undefined) emp.phone = String(data.phone).trim();
    if (data.address !== undefined) emp.address = String(data.address).trim();
    if (data.emergencyContact) {
      emp.emergencyContact = {
        name: data.emergencyContact.name || "",
        phone: data.emergencyContact.phone || "",
        relation: data.emergencyContact.relation || "",
      };
    }

    await emp.save();
    return this.formatEmployee(emp);
  }

  static async updateProfilePhoto(id, profileImage) {
    const cleanId = cleanObjectId(id) || id;
    const emp = await Employee.findById(cleanId);
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    const storedImage = profileImage ? saveBase64File(profileImage, "profiles", "photo") : "";
    emp.profileImage = storedImage;
    await emp.save();
    return this.formatEmployee(emp);
  }

  static async uploadDocument(id, docData, uploadedBy = "Employee") {
    const cleanId = cleanObjectId(id);
    if (!cleanId) {
      throw new ApiError(400, "Invalid employee ID");
    }

    const docName = String(
      docData?.name || docData?.type || "Document"
    ).trim();

    const rawFile = docData?.fileData || docData?.url || "";
    const docType = docData?.type || "Other";

    if (!rawFile) {
      throw new ApiError(400, "Document file content or URL is required");
    }

    const docUrl = saveBase64File(rawFile, "documents", docName);

    const emp = await Employee.findById(cleanId).select("+documents");

    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    if (!Array.isArray(emp.documents)) {
      emp.documents = [];
    }

    const newDoc = {
      name: docName,
      type: docType,
      url: docUrl,
      uploadedBy,
      status: uploadedBy === "Admin" ? "Verified" : "Submitted",
      verificationNote: "",
      uploadedAt: new Date(),
    };

    emp.documents.push(newDoc);

    console.log("5. Saving employee document");

    await emp.save();

    console.log("6. Document saved successfully");

    if (uploadedBy === "Employee") {
      try {
        await NotificationService.createNotification({
          type: "DOCUMENT_UPLOAD",
          title: "New Employee Document Submitted",
          message: `${emp.name} (${emp.employeeId}) uploaded compliance document "${docName}" (${docType}). Awaiting verification.`,
          targetRole: "ADMIN",
          targetType: "ALL",
          employeeId: emp._id,
          employeeName: emp.name,
          metadata: {
            employeeId: emp._id.toString(),
            docName,
            docType,
            uploadedAt: newDoc.uploadedAt,
          },
        });
      } catch (notifErr) {
        console.error("Failed to notify admin of document upload:", notifErr);
      }
    }

    return this.formatEmployee(emp);
  }

  static async reviewDocument(id, docId, { status, verificationNote, adminId = null }) {
    const cleanId = cleanObjectId(id) || id;
    if (!["Verified", "Rejected", "Submitted"].includes(status)) {
      throw new ApiError(400, "Invalid status. Use 'Verified' or 'Rejected'.");
    }

    const emp = await Employee.findById(cleanId).select("+documents");
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    if (!Array.isArray(emp.documents)) {
      emp.documents = [];
    }

    const doc = emp.documents.find(
      (d) => (d._id && d._id.toString() === docId.toString()) || d.id === docId
    );

    if (!doc) {
      throw new ApiError(404, "Document not found in employee vault");
    }

    doc.status = status;
    doc.verificationNote = verificationNote !== undefined ? String(verificationNote).trim() : doc.verificationNote;

    await emp.save();

    try {
      const isApproved = status === "Verified";
      await NotificationService.createNotification({
        type: "DOCUMENT_UPDATE",
        title: isApproved ? `Document Approved: ${doc.name}` : `Document Rejected: ${doc.name}`,
        message: isApproved
          ? `Your document "${doc.name}" (${doc.type}) has been verified and approved by HR.`
          : `Your document "${doc.name}" (${doc.type}) was rejected by HR. Reason: ${doc.verificationNote || "Please re-upload a clear and valid document."}`,
        targetRole: "EMPLOYEE",
        targetType: "SPECIFIC",
        targetEmployeeId: emp._id,
        employeeId: emp._id,
        employeeName: emp.name,
        metadata: {
          employeeId: emp._id.toString(),
          docId: doc._id?.toString(),
          docName: doc.name,
          docType: doc.type,
          status,
          verificationNote: doc.verificationNote,
        },
      });
    } catch (notifErr) {
      console.error("Failed to notify employee of document review:", notifErr);
    }

    return this.formatEmployee(emp);
  }

  static async deleteDocument(id, docId) {
    const cleanId = cleanObjectId(id) || id;
    const emp = await Employee.findById(cleanId).select("+documents");
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }

    emp.documents = (emp.documents || []).filter(
      (doc) => doc._id && doc._id.toString() !== docId.toString()
    );

    await emp.save();
    return this.formatEmployee(emp);
  }
}

export default EmployeeService;
