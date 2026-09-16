import Leave from "../models/Leave.js";
import { ApiError } from "../utils/apiError.js";
import NotificationService from "./notification.service.js";

/**
 * Enterprise Leave Management Service
 */
export class LeaveService {
  static formatLeave(leave) {
    if (!leave) return null;
    return {
      ...leave.toObject(),
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
      .populate("employeeId", "id employeeId name email")
      .sort({ createdAt: -1 });

    return leaves.map((l) => this.formatLeave(l));
  }

  static async updateLeaveStatus(id, status, adminRemark = "") {
    if (!["Approved", "Rejected"].includes(status)) {
      throw new ApiError(400, "Invalid status value. Use 'Approved' or 'Rejected'");
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      throw new ApiError(404, "Leave application not found");
    }

    leave.status = status;
    leave.adminRemark = adminRemark || "";
    leave.approvedAt = new Date();
    await leave.save();
    await leave.populate("employeeId", "id employeeId name email");

    // Send notification specifically to the employee
    try {
      NotificationService.createNotification({
        type: "LEAVE_UPDATE",
        title: `Leave ${status}`,
        message: `Your leave application has been ${status.toLowerCase()}.${adminRemark ? ` Remark: "${adminRemark}"` : ""}`,
        targetType: "EMPLOYEE",
        targetId: leave.employeeId._id,
      });
    } catch (e) {
      // non-blocking
    }

    return this.formatLeave(leave);
  }

  static async applyLeave(employeeId, data) {
    const { leaveType, startDate, endDate, reason } = data;
    if (!leaveType || !startDate || !endDate || !reason) {
      throw new ApiError(400, "All fields (leaveType, startDate, endDate, reason) are required");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      throw new ApiError(400, "End date cannot be earlier than start date");
    }

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays: diffDays,
      reason,
      status: "Pending",
    });

    await leave.populate("employeeId", "name employeeId");

    // Trigger Admin Live Notification
    try {
      const empName = leave.employeeId?.name || "Employee";
      const empIdCode = leave.employeeId?.employeeId || "WG-EMP";
      NotificationService.createNotification({
        type: "LEAVE_APPLY",
        title: `Leave Applied: ${empName} (${empIdCode})`,
        message: `Employee [${empIdCode}] ${empName} applied for ${leaveType} leave (${diffDays} day${diffDays > 1 ? "s" : ""}) from ${start.toLocaleDateString("en-IN")} to ${end.toLocaleDateString("en-IN")}. Reason: "${reason}"`,
        employeeId,
        employeeName: `${empName} (${empIdCode})`,
        metadata: { employeeId: empIdCode, name: empName, leaveId: leave._id, leaveType, diffDays, reason },
      });
    } catch (e) {
      // Non-blocking
    }

    return this.formatLeave(leave);
  }

  static async getLeaveHistory(employeeId) {
    const leaves = await Leave.find({ employeeId }).sort({ createdAt: -1 });
    return leaves.map((l) => ({
      ...l.toObject(),
      id: l._id.toString(),
      _id: l._id.toString(),
    }));
  }
}

export default LeaveService;
