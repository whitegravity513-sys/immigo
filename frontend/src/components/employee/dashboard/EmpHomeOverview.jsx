import React, { useState } from "react";
import {
  Clock,
  Calendar,
  LogIn,
  LogOut,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Video,
  ArrowRight,
  ShieldCheck,
  CalendarPlus,
  Briefcase,
  MapPin,
  UserCheck,
  CheckSquare,
  Square,
  ExternalLink,
  ChevronRight,
  Sparkles,
  TrendingUp,
  FileText
} from "lucide-react";
import { EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";
import DeptSalesWidgets from "./DeptSalesWidgets.jsx";
import DeptHRWidgets from "./DeptHRWidgets.jsx";
import DeptAccountsWidgets from "./DeptAccountsWidgets.jsx";
import DeptAdminWidgets from "./DeptAdminWidgets.jsx";

export default function EmpHomeOverview({
  user,
  statusRecord,
  status,
  statusColor,
  workSeconds = 0,
  lunchSeconds = 0,
  breakSeconds = 0,
  fmtDur,
  fmtTime,
  leaveBalance = 0,
  leaveHistory = [],
  todayMeetings = [],
  announcements = [],
  holidays = [],
  setView,
  handleCheckIn,
  handleCheckOut,
  loading,
  isHolidayToday,
  todayHoliday,
  isWeeklyOffToday,
  weeklyOffReason,
}) {
  // Determine greeting based on local hour
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
      ? "Good Afternoon"
      : "Good Evening";

  // Interactive local task list
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Review daily workforce allocation sheet",
      priority: "High",
      completed: true,
      time: "10:30 AM",
    },
    {
      id: 2,
      title: "Follow up on overseas client documents & KYC",
      priority: "High",
      completed: false,
      time: "02:00 PM",
    },
    {
      id: 3,
      title: "Update weekly departmental deliverables",
      priority: "Medium",
      completed: false,
      time: "04:30 PM",
    },
    {
      id: 4,
      title: "Complete compliance audit checklist",
      priority: "Low",
      completed: false,
      time: "05:45 PM",
    },
  ]);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  // Department identification
  const deptLower = (user?.department || "").toLowerCase();
  const isSales = deptLower.includes("sales");
  const isHR = deptLower.includes("hr") || deptLower.includes("human resource");
  const isAccounts =
    deptLower.includes("account") ||
    deptLower.includes("finance") ||
    deptLower.includes("billing");

  const totalBreakSeconds = (lunchSeconds || 0) + (breakSeconds || 0);

  // Leave breakdown estimation based on balance
  const casualLeave = Math.min(8, Math.max(0, leaveBalance));
  const sickLeave = 5;
  const earnedLeave = Math.max(0, leaveBalance - casualLeave);

  return (
    <div className="space-y-6">
      {/* ── 1. Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a1532] via-[#0d2258] to-[#142850] p-6 sm:p-8 text-white shadow-lg border border-blue-900/50">
        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-cyan-300 mb-3">
              <Sparkles size={13} className="text-cyan-400" />
              <span>immiGo Enterprise Portal</span>
              <span className="text-white/30">•</span>
              <span>{user?.department || "Staff"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {greeting}, {user?.name || "Team Member"}! 👋
            </h2>
            <p className="text-sm text-blue-200/90 mt-1 max-w-xl font-medium leading-relaxed">
              Track your daily work hours, access recruitment pipelines, submit leave requests, and collaborate seamlessly with your team.
            </p>
          </div>

          {/* Quick Action Buttons in Banner */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {status === "Active" ? (
              <button
                onClick={() => setView("breaks")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Coffee size={15} />
                <span>Take Break</span>
              </button>
            ) : null}

            <button
              onClick={() => setView("checkinout")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <LogIn size={15} />
              <span>
                {status === "Active" ? "Punch Status" : "Shift Check In"}
              </span>
            </button>

            <button
              onClick={() => setView("apply-leave")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <CalendarPlus size={15} />
              <span>Apply Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Profile Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header Ribbon */}
        <div className="h-16 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 relative flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-blue-300">
              Employee Verification Profile
            </span>
          </div>
          {isHolidayToday ? (
            <span className="px-3 py-1 bg-amber-400 text-amber-950 text-[10px] font-black rounded-lg uppercase tracking-wider shadow-xs">
              🌟 Holiday: {todayHoliday?.title}
            </span>
          ) : isWeeklyOffToday ? (
            <span className="px-3 py-1 bg-slate-400 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
              {weeklyOffReason}
            </span>
          ) : null}
        </div>

        <div className="px-6 pb-6 pt-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 -mt-8">
            {/* Avatar & Core Metadata */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center border-4 border-white shadow-lg overflow-hidden shrink-0">
                  {statusRecord?.profileImage || user?.profileImage ? (
                    <img
                      src={statusRecord?.profileImage || user?.profileImage}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (user?.name || "E")[0].toUpperCase()
                  )}
                </div>
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${statusColor}`}
                />
              </div>

              <div className="pt-2 sm:pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {user?.name || "Employee"}
                  </h3>
                  <EmployeeIdBadge id={user?.employeeId} size="sm" />
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      status === "Active"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : status === "On Break"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusColor} ${
                        status === "Active" || status === "On Break"
                          ? "animate-pulse"
                          : ""
                      }`}
                    />
                    {status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={13} className="text-slate-400" />
                    <span>Role: <strong className="text-slate-800">{user?.designation || "Staff Specialist"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={13} className="text-slate-400" />
                    <span>Manager: <strong className="text-slate-800">{user?.reportingManager || "Department Head"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>Branch: <strong className="text-slate-800">{user?.location || "Headquarters (HQ)"}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Shift Summary Counter */}
            <div className="w-full lg:w-auto flex items-center justify-between sm:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <div className="text-xl font-black tabular-nums text-slate-900">
                  {fmtDur ? fmtDur(workSeconds) : "0h 0m"}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Work Time
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="text-left sm:text-right">
                <div className="text-xl font-black tabular-nums text-amber-600">
                  {fmtDur ? fmtDur(totalBreakSeconds) : "0h 0m"}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Break Consumed
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="text-left sm:text-right">
                <div className="text-xl font-black text-blue-600">
                  {statusRecord?.checkInTime
                    ? fmtTime
                      ? fmtTime(statusRecord.checkInTime)
                      : "09:30 AM"
                    : "--:--"}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Shift Punch In
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Four Core KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Shift Hours */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Clock size={20} />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Target 8.5h
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {fmtDur ? fmtDur(workSeconds) : "0h 0m"}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              Today's Productive Work
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Breaks: {fmtDur ? fmtDur(totalBreakSeconds) : "0m"}</span>
            <button
              onClick={() => setView("tracker")}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Live details →
            </button>
          </div>
        </div>

        {/* KPI 2: Attendance Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <LogIn size={20} />
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                status === "Active"
                  ? "bg-emerald-100 text-emerald-800"
                  : status === "On Break"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {status}
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {statusRecord?.checkInTime ? "Checked In" : "Pending Punch"}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              {statusRecord?.checkInTime
                ? `Punched at ${fmtTime ? fmtTime(statusRecord.checkInTime) : "Time"}`
                : "Shift not yet started"}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Calendar</span>
            <button
              onClick={() => setView("calendar")}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              View Month →
            </button>
          </div>
        </div>

        {/* KPI 3: Leave Balance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-purple-200 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Calendar size={20} />
            </div>
            <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
              Available
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {leaveBalance}{" "}
              <span className="text-sm font-semibold text-slate-400">Days</span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              Remaining Paid Leaves
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{leaveHistory.length} requests filed</span>
            <button
              onClick={() => setView("apply-leave")}
              className="font-bold text-purple-600 hover:underline cursor-pointer"
            >
              Apply now →
            </button>
          </div>
        </div>

        {/* KPI 4: Pending Tasks / Meetings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <CheckSquare size={20} />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              {completedCount}/{tasks.length} Done
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {tasks.length - completedCount}{" "}
              <span className="text-sm font-semibold text-slate-400">Tasks Due</span>
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              {todayMeetings.length} Scheduled Meeting
              {todayMeetings.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Today's pipeline</span>
            <button
              onClick={() => setView("meetings")}
              className="font-bold text-amber-600 hover:underline cursor-pointer"
            >
              Meetings →
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Department Dynamic Widget (Sales/HR/Accounts/Admin) ── */}
      {isSales ? (
        <DeptSalesWidgets setView={setView} />
      ) : isHR ? (
        <DeptHRWidgets />
      ) : isAccounts ? (
        <DeptAccountsWidgets />
      ) : (
        <DeptAdminWidgets />
      )}

      {/* ── 5. Two-Column Operations Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Tasks & Checklist + Attendance Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Today's Deliverables</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Daily work priority list</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {completedCount} of {tasks.length} Completed
              </span>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    task.completed
                      ? "bg-slate-50 border-slate-200 text-slate-400"
                      : "bg-white border-slate-200/80 hover:border-blue-300 shadow-2xs text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 transition-colors shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      ) : (
                        <Square size={18} className="text-slate-400" />
                      )}
                    </button>
                    <span
                      className={`text-xs font-semibold truncate ${
                        task.completed ? "line-through text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {task.time}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        task.priority === "High"
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : task.priority === "Medium"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Attendance Operations Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <LogIn size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Attendance Shift Action</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Daily biometric & punch logging</p>
                </div>
              </div>
              <button
                onClick={() => setView("checkinout")}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Full Check In Screen <ChevronRight size={14} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse shrink-0`} />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Current Shift Status:{" "}
                    <span className="text-blue-700 font-black">{status}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {statusRecord?.checkInTime
                      ? `Punched in at ${fmtTime ? fmtTime(statusRecord.checkInTime) : "Time"}`
                      : "You have not checked in for today yet."}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {status === "Active" ? (
                  <button
                    onClick={() => setView("breaks")}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Take Break
                  </button>
                ) : null}

                <button
                  onClick={() => setView("checkinout")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer ${
                    status === "Active"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {status === "Active" ? "Proceed to Checkout" : "Check In Now"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Schedule, Leave Summary, Announcements */}
        <div className="space-y-6">
          {/* Today's Schedule & Meetings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Video size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Today's Schedule</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Calls & client reviews</p>
                </div>
              </div>
              <button
                onClick={() => setView("meetings")}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {todayMeetings.length > 0 ? (
              <div className="space-y-2.5">
                {todayMeetings.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start justify-between gap-2"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 leading-tight">
                        {m.title}
                      </h4>
                      <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                        {m.startTime || "11:00 AM"} • {m.platform || "Google Meet"}
                      </p>
                    </div>
                    {m.meetingLink && (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                      >
                        Join
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                <Video size={24} className="mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No meetings today</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Enjoy your focused work day!</p>
              </div>
            )}
          </div>

          {/* Leave Balance Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Leave Balance</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Paid time-off allocation</p>
                </div>
              </div>
              <button
                onClick={() => setView("apply-leave")}
                className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
              >
                Apply
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Casual</div>
                <div className="text-lg font-black text-slate-800 mt-0.5">{casualLeave}d</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Sick</div>
                <div className="text-lg font-black text-slate-800 mt-0.5">{sickLeave}d</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Earned</div>
                <div className="text-lg font-black text-slate-800 mt-0.5">{earnedLeave}d</div>
              </div>
            </div>

            <button
              onClick={() => setView("leave-history")}
              className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200/80"
            >
              View Leave History & Approvals
            </button>
          </div>

          {/* Company Announcements Notice */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Notice Board</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Official announcements</p>
                </div>
              </div>
              <button
                onClick={() => setView("announcements")}
                className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
              >
                All
              </button>
            </div>

            {announcements.length > 0 ? (
              <div className="space-y-2.5">
                {announcements.slice(0, 2).map((a) => (
                  <div
                    key={a._id}
                    className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl"
                  >
                    <h4 className="font-bold text-amber-950 text-xs leading-tight">
                      {a.title}
                    </h4>
                    <p className="text-[11px] text-amber-800 line-clamp-2 mt-1 font-normal">
                      {a.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No active notices.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
