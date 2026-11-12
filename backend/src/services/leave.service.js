import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import { ApiError } from "../utils/apiError.js";
import NotificationService from "./notification.service.js";
import { getTodayDateString, normalizeDateString } from "../utils/dateUtils.js";

export class LeaveService {
  static formatLeave(leave, includeInternalRemark = true) {
    if (!leave) return null;
    const obj = leave.toObject ? leave.toObject() : { ...leave };
    if (!includeInternalRemark) {
      delete obj.adminRemark;
    }
    return {
      ...obj,
      id: leave._id.toString(),
      _id: leave._id.toString(),
      employee: leave.employeeId
        ? {
            ...(leave.employeeId.toObject ? leave.employeeId.toObject() : leave.employeeId),
            id: leave.employeeId._id?.toString() || leave.employeeId.toString(),
            _id: leave.employeeId._id?.toString() || leave.employeeId.toString(),
          }
        : null,
    };
  }

  static async getLeaves() {
    const leaves = await Leave.find()
      .populate("employeeId", "id employeeId name email leaveBalance allocatedLeaves department designation")
      .sort({ createdAt: -1 });

    return leaves.map((l) => this.formatLeave(l));
  }

  static async updateLeaveStatus(id, status, adminRemark = "", actor = null) {
    if (!["Approved", "Rejected"].includes(status)) {
      throw new ApiError(400, "Invalid status value. Use 'Approved' or 'Rejected'");
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      throw new ApiError(404, "Leave application not found");
    }

    const previousStatus = leave.status;
    leave.status = status;
    leave.adminRemark = adminRemark || "";
    leave.approvedAt = new Date();
    await leave.save();
    await leave.populate("employeeId", "id employeeId name email leaveBalance allocatedLeaves");

    try {
      const emp = await Employee.findById(leave.employeeId._id || leave.employeeId);
      if (emp) {
        if (status === "Approved" && previousStatus !== "Approved") {
          emp.leaveBalance = Math.max(0, (emp.leaveBalance || 0) - (leave.totalDays || 1));
          await emp.save();
        } else if (status === "Rejected" && previousStatus === "Approved") {
          emp.leaveBalance = (emp.leaveBalance || 0) + (leave.totalDays || 1);
          await emp.save();
        }
      }
    } catch (e) {
      console.warn("Leave balance sync warning:", e.message);
    }

    try {
      const empId = leave.employeeId?._id || leave.employeeId;
      await NotificationService.notifyStaffAction({
        actor,
        type: "LEAVE_UPDATE",
        title: `Leave ${status}`,
        message: `Your leave application has been ${status.toLowerCase()}.`,
        moduleScope: "WORKFORCE",
        targetEmployeeId: empId,
        employeeId: empId,
        employeeName: leave.employeeId?.name || "",
        metadata: { leaveId: leave._id, status },
      });
    } catch {
    }

    return this.formatLeave(leave);
  }

  static async applyLeave(employeeId, data) {
    const emp = await Employee.findById(employeeId).select("name employeeId status").lean();
    if (!emp) {
      throw new ApiError(404, "Employee not found");
    }
    if (emp.status === "inactive") {
      throw new ApiError(403, "Your account is inactive. You cannot apply for leaves. Please contact Administrator.");
    }

    const { startDate, endDate, reason, document } = data;
    const leaveType = (data.leaveType || "Casual Leave").trim();
    if (!startDate || !endDate || !reason) {
      throw new ApiError(400, "All fields (startDate, endDate, reason) are required");
    }

    const todayStr = getTodayDateString();
    const startStr = normalizeDateString(startDate);
    const endStr = normalizeDateString(endDate);
    if (!startStr || !endStr) {
      throw new ApiError(400, "Invalid leave dates provided");
    }
    if (startStr < todayStr || endStr < todayStr) {
      throw new ApiError(400, "Leave cannot be applied for past dates. Please select today or a future date.");
    }
    if (endStr < startStr) {
      throw new ApiError(400, "End date cannot be earlier than start date");
    }

    const [sy, sm, sd] = startStr.split("-").map(Number);
    const [ey, em, ed] = endStr.split("-").map(Number);
    const startUtc = Date.UTC(sy, sm - 1, sd);
    const endUtc = Date.UTC(ey, em - 1, ed);
    const diffDays = Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24)) + 1;
    const start = new Date(`${startStr}T00:00:00.000Z`);
    const end = new Date(`${endStr}T00:00:00.000Z`);

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays: diffDays,
      reason,
      document: document || "",
      status: "Pending",
    });

    await leave.populate("employeeId", "name employeeId");

    try {
      const empName = leave.employeeId?.name || "Employee";
      const empIdCode = leave.employeeId?.employeeId || "WG-EMP";
      await NotificationService.createNotification({
        type: "LEAVE_APPLY",
        title: `Leave Applied: ${empName} (${empIdCode})`,
        message: `Employee [${empIdCode}] ${empName} applied for ${leaveType} leave (${diffDays} day${diffDays > 1 ? "s" : ""}) from ${startStr} to ${endStr}. Reason: "${reason}"`,
        employeeId,
        employeeName: `${empName} (${empIdCode})`,
        targetRole: "ADMIN",
        targetRoles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE_HR"],
        actorId: String(employeeId),
        actorRole: "EMPLOYEE",
        moduleScope: "WORKFORCE",
        metadata: { employeeId: empIdCode, name: empName, leaveId: leave._id, leaveType, diffDays, reason },
      });
    } catch {
    }

    return this.formatLeave(leave, false);
  }

  static async getLeaveHistory(employeeId) {
    const leaves = await Leave.find({ employeeId }).sort({ createdAt: -1 });
    return leaves.map((l) => {
      const obj = typeof l.toObject === "function" ? l.toObject() : { ...l };
      delete obj.adminRemark;
      return {
        ...obj,
        id: l._id.toString(),
        _id: l._id.toString(),
      };
    });
  }
}

export default LeaveService;
