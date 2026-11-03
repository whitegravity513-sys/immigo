import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import ActivityLog from "../models/ActivityLog.js";
import Meeting from "../models/Meeting.js";
import CrmCandidateApplication from "../models/CrmCandidateApplication.js";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import ROLES from "../constants/roles.js";
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

export const getHrPerformanceReport = asyncHandler(async (req, res) => {
  const { hrId, vendorId, startDate, endDate } = req.query;

  // 1. Target HR accounts
  let hrQuery = { role: ROLES.HR };
  if (req.userRole === ROLES.HR) {
    hrQuery._id = req.user._id;
  } else if (hrId) {
    hrQuery._id = hrId;
  }
  const hrUsers = await User.find(hrQuery).select("name email hrType assignedVendors isActive");

  // 2. Date filters if passed
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const activityQuery = {};
  if (Object.keys(dateFilter).length > 0) activityQuery.createdAt = dateFilter;
  if (req.userRole === ROLES.HR) {
    activityQuery.updatedByUserId = req.user._id.toString();
  } else if (hrId) {
    activityQuery.updatedByUserId = hrId;
  }
  if (vendorId) {
    activityQuery.vendorId = vendorId;
  }

  // 3. Meeting metrics
  const meetingQuery = {};
  if (Object.keys(dateFilter).length > 0) meetingQuery.meetingDate = dateFilter;
  if (req.userRole === ROLES.HR) {
    meetingQuery.$or = [{ hrId: req.user._id.toString() }, { createdBy: req.user._id.toString() }];
  } else if (hrId) {
    meetingQuery.$or = [{ hrId }, { createdBy: hrId }];
  }
  if (vendorId) meetingQuery.vendorId = vendorId;

  const [activities, meetings, crmApps, allVendors] = await Promise.all([
    ActivityLog.find(activityQuery).sort({ createdAt: -1 }),
    Meeting.find(meetingQuery),
    CrmCandidateApplication.find(vendorId ? { vendorId } : {}),
    Vendor.find().select("vendorId companyName"),
  ]);

  // Candidates processed
  const uniqueCandidateIds = new Set(activities.map((a) => a.candidateId).filter(Boolean));
  const totalCandidatesProcessed = uniqueCandidateIds.size;

  // Candidate status distribution
  const statusDistribution = {};
  crmApps.forEach((app) => {
    const st = app.status || "Submitted";
    statusDistribution[st] = (statusDistribution[st] || 0) + 1;
  });

  // Meetings stats
  const totalMeetingsScheduled = meetings.length;
  const meetingsCompleted = meetings.filter((m) => m.status === "COMPLETED").length;
  const meetingsCancelled = meetings.filter((m) => m.status === "CANCELLED").length;
  const meetingsRescheduled = meetings.filter((m) => m.status === "RESCHEDULED").length;

  // Meeting outcomes
  const outcomeBreakdown = {};
  meetings.forEach((m) => {
    if (m.outcome) {
      outcomeBreakdown[m.outcome] = (outcomeBreakdown[m.outcome] || 0) + 1;
    }
  });

  // Transition times (hours between status changes in ActivityLog for each candidate)
  const candidateHistoryMap = {};
  activities.forEach((act) => {
    if (!candidateHistoryMap[act.candidateId]) {
      candidateHistoryMap[act.candidateId] = [];
    }
    candidateHistoryMap[act.candidateId].push(act);
  });

  let totalTransitionHours = 0;
  let transitionCount = 0;
  Object.values(candidateHistoryMap).forEach((list) => {
    const chrono = [...list].reverse();
    for (let i = 1; i < chrono.length; i++) {
      const diffMs = new Date(chrono[i].createdAt) - new Date(chrono[i - 1].createdAt);
      if (diffMs > 0) {
        totalTransitionHours += diffMs / (1000 * 60 * 60);
        transitionCount++;
      }
    }
  });
  const avgTransitionHours = transitionCount > 0 ? Number((totalTransitionHours / transitionCount).toFixed(1)) : 0;

  // Vendor performance by HR
  const vendorPerformance = allVendors.map((vnd) => {
    const vId = vnd.vendorId || vnd._id.toString();
    const vApps = crmApps.filter((a) => a.vendorId === vId);
    const vMeetings = meetings.filter((m) => m.vendorId === vId);
    const vActivities = activities.filter((a) => a.vendorId === vId);
    return {
      vendorId: vId,
      companyName: vnd.companyName,
      totalCandidates: vApps.length,
      activitiesLogged: vActivities.length,
      meetingsScheduled: vMeetings.length,
      meetingsCompleted: vMeetings.filter((m) => m.status === "COMPLETED").length,
    };
  });

  // Per-HR breakdown
  const hrPerformance = hrUsers.map((hr) => {
    const hrUid = hr._id.toString();
    const hrActivities = activities.filter((a) => a.updatedByUserId === hrUid);
    const hrCandidates = new Set(hrActivities.map((a) => a.candidateId).filter(Boolean)).size;
    const hrMeetings = meetings.filter((m) => m.hrId === hrUid || m.createdBy === hrUid);
    const hrMeetingsComp = hrMeetings.filter((m) => m.status === "COMPLETED").length;
    return {
      id: hrUid,
      name: hr.name,
      email: hr.email,
      hrType: hr.hrType || "EMPLOYEE_HR",
      assignedVendors: hr.assignedVendors || [],
      candidatesProcessed: hrCandidates,
      totalActivities: hrActivities.length,
      meetingsScheduled: hrMeetings.length,
      meetingsCompleted: hrMeetingsComp,
    };
  });

  return res.status(200).json({
    success: true,
    report: {
      candidatesProcessed: totalCandidatesProcessed,
      statusDistribution,
      totalMeetingsScheduled,
      meetingsCompleted,
      meetingsCancelled,
      meetingsRescheduled,
      outcomeBreakdown,
      avgTransitionHours,
      vendorPerformance,
      hrPerformance,
    },
  });
});

export default {
  getHrDashboard,
  getHrEmployees,
  getHrAttendance,
  getHrLeaves,
  getHrPerformanceReport,
};
