import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getHrDashboard = asyncHandler(async (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [
    totalEmployees,
    employeesList,
    todayAttendance,
    pendingLeaves,
    allLeaves,
  ] = await Promise.all([
    Employee.countDocuments({ status: { $ne: "Terminated" } }),
    Employee.find({ status: { $ne: "Terminated" } })
      .sort({ createdAt: -1 })
      .limit(10),
    Attendance.find({ date: todayStr }),
    Leave.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(10),
    Leave.find().sort({ createdAt: -1 }).limit(100),
  ]);

  const presentToday = todayAttendance.filter(
    (a) => a.status === "Present" || a.status === "Active" || a.status === "Checked Out"
  ).length;

  const onLeaveToday = todayAttendance.filter(
    (a) => a.status === "Leave" || a.status === "On Leave"
  ).length;

  const departments = new Set(
    employeesList.map((e) => e.department).filter(Boolean)
  ).size;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const newThisMonth = await Employee.countDocuments({
    createdAt: { $gte: startOfMonth },
  });

  const recentEmployees = employeesList.slice(0, 5).map((e) => ({
    id: e._id.toString(),
    _id: e._id.toString(),
    name: e.name,
    employeeId: e.employeeId,
    department: e.department || "Operations",
    designation: e.designation || "Staff",
    joiningDate: e.joiningDate
      ? new Date(e.joiningDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Recent",
    status: e.status || "Active",
  }));

  const mappedLeaves = pendingLeaves.map((l) => ({
    id: l._id.toString(),
    _id: l._id.toString(),
    employee: l.employeeId?.name || l.employeeName || "Employee",
    leaveType: l.leaveType || "Casual",
    from: l.startDate ? new Date(l.startDate).toLocaleDateString("en-GB") : "",
    to: l.endDate ? new Date(l.endDate).toLocaleDateString("en-GB") : "",
    totalDays: l.totalDays,
    reason: l.reason,
    status: l.status,
  }));

  return res.status(200).json({
    success: true,
    stats: {
      totalEmployees,
      newThisMonth,
      presentToday,
      onLeaveToday,
      leaveRequests: pendingLeaves.length,
      departments: departments || 6,
      pendingOnboarding: 4,
      pendingDocuments: 8,
    },
    recentEmployees,
    leaveRequests: mappedLeaves,
  });
});

export const getHrEmployees = asyncHandler(async (req, res) => {
  const { search, department, status } = req.query;
  const query = {};

  if (status) query.status = status;
  if (department) query.department = department;
  if (search) {
    const s = String(search).trim();
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
      { employeeId: { $regex: s, $options: "i" } },
    ];
  }

  const employees = await Employee.find(query).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: employees.length,
    employees,
  });
});

export const getHrAttendance = asyncHandler(async (req, res) => {
  const { date = new Date().toISOString().split("T")[0] } = req.query;

  const attendance = await Attendance.find({ date })
    .populate("employeeId", "name employeeId department designation email")
    .sort({ checkInTime: -1 });

  return res.status(200).json({
    success: true,
    date,
    count: attendance.length,
    attendance,
  });
});

export const getHrLeaves = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;

  const leaves = await Leave.find(query)
    .populate("employeeId", "name employeeId department designation email")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    count: leaves.length,
    leaves,
  });
});

export default {
  getHrDashboard,
  getHrEmployees,
  getHrAttendance,
  getHrLeaves,
};
