import React, { useState } from "react";
import {
  Clock,
  Calendar,
  LogIn,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Video,
  CalendarPlus,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Play,
  Timer,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText
} from "lucide-react";
import { EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";
import DeptSalesWidgets from "./DeptSalesWidgets.jsx";
import DeptAccountsWidgets from "./DeptAccountsWidgets.jsx";
import DeptAdminWidgets from "./DeptAdminWidgets.jsx";

export default function EmpHomeOverview({
  user,
  statusRecord,
  status = "Checked Out",
  statusColor = "bg-slate-400",
  workSeconds = 0,
  lunchSeconds = 0,
  breakSeconds = 0,
  fmtDur = (s) => `${s}s`,
  fmtTime = (t) => t,
  todayMeetings = [],
  announcements = [],
  holidays = [],
  setView,
  handleCheckIn,
  handleCheckOut,
  handleBreakStart,
  handleBreakEnd,
  isOnBreak = false,
  isActive = false,
  isCheckedOut = false,
  overLimit = false,
  monthlyData,
  loading = false,
  isHolidayToday,
  todayHoliday,
  isWeeklyOffToday,
  weeklyOffReason,
}) {
  const [showMorePast, setShowMorePast] = useState(false);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Department identification
  const dept = (user?.department || "").toLowerCase().trim();
  const isSales = dept.includes("sales");
  const isAdmin = dept.includes("admin");
  const isAccounts = dept.includes("account") || dept.includes("finance") || dept.includes("billing");

  // Today's total break seconds
  const totalBreakSeconds = (lunchSeconds || 0) + (breakSeconds || 0);

  // Past attendance records from monthlyData
  const todayDateStr =
    statusRecord?.date ||
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  const rawPastRecords = (monthlyData?.dailyRecords || monthlyData?.records || [])
    .filter((r) => r.date < todayDateStr && r.status !== "Before Joining");
  const pastRecords = [...rawPastRecords].sort((a, b) => (a.date < b.date ? 1 : -1));
  const visiblePastRecords = showMorePast ? pastRecords : pastRecords.slice(0, 3);

  // Interactive local task list (compact)
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review daily workforce allocation sheet", priority: "High", completed: true },
    { id: 2, title: "Follow up on client documents & compliance", priority: "High", completed: false },
    { id: 3, title: "Update departmental weekly deliverables", priority: "Medium", completed: false },
    { id: 4, title: "Team sync & operational review", priority: "Low", completed: false },
  ]);

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800">
      {/* ── ACTIVE BREAK ALERT BANNER (Only shown when On Break) ── */}
      {(status === "On Break" || isOnBreak) && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl px-4 py-2.5 shadow-sm flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <Coffee size={18} className="animate-pulse shrink-0" />
            <span className="text-xs font-bold">
              Currently On Break • Elapsed:{" "}
              <strong className="font-mono text-sm underline font-black">
                {fmtDur(totalBreakSeconds)}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleBreakEnd && handleBreakEnd()}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white text-amber-950 rounded-lg text-xs font-black hover:bg-amber-50 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-xs"
          >
            <Play size={12} className="fill-current text-amber-600" />
            <span>Resume Work</span>
          </button>
        </div>
      )}

      {/* ── Break limit warning ── */}
      {overLimit && (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>Break limit of 1 hour exceeded. Salary deduction policy applies.</span>
        </div>
      )}

      {/* ── 1. COMPACT BLUE CORPORATE HEADER ── */}
      <div className="bg-gradient-to-r from-[#0d1e48] via-[#102a6b] to-[#1a367c] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Employee Avatar & Info */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-blue-500 text-white font-black text-lg flex items-center justify-center shadow-inner border border-blue-400/30 overflow-hidden shrink-0">
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
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d1e48] ${statusColor}`}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {greeting}, {user?.name || "Employee"}!
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    status === "Active"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : status === "On Break"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-white/15 text-slate-200 border border-white/20"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColor} ${status === "Active" || status === "On Break" ? "animate-pulse" : ""}`} />
                  {status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-blue-200/90 font-medium">
                <EmployeeIdBadge id={user?.employeeId} size="xs" />
                <span>•</span>
                <span className="text-cyan-300 font-semibold">{user?.department || "General"}</span>
                <span>•</span>
                <span>{user?.designation || "Staff"}</span>
                {isHolidayToday && (
                  <span className="text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-[10px]">
                    🌟 {todayHoliday?.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 1-CLICK BREAK BUTTON */}
            {status === "Active" ? (
              <button
                type="button"
                onClick={() => handleBreakStart && handleBreakStart("Break")}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                title="Start Break"
              >
                <Coffee size={13} />
                <span>Take Break</span>
              </button>
            ) : status === "On Break" ? (
              <button
                type="button"
                onClick={() => handleBreakEnd && handleBreakEnd()}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
                title="Resume Work"
              >
                <Play size={13} className="fill-current" />
                <span>Resume Work</span>
              </button>
            ) : null}

            {/* Check In / Out Button */}
            <button
              type="button"
              onClick={() => setView("checkinout")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs ${
                status === "Active"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-500 border border-blue-400/30"
              }`}
            >
              <LogIn size={13} />
              <span>{status === "Active" ? "Check Out" : "Check In"}</span>
            </button>

            {/* Leave Management Button */}
            <button
              type="button"
              onClick={() => setView("leaves")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
            >
              <CalendarPlus size={13} />
              <span>Leaves</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. COMPACT 4-STAT BLUE CARDS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Shift Status & Punch In */}
        <div className="bg-white rounded-xl border border-blue-100 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Shift Punch</span>
            <LogIn size={15} className="text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1.5 truncate">
            {statusRecord?.checkInTime ? fmtTime(statusRecord.checkInTime) : "Not Punched"}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
            {statusRecord?.checkOutTime
              ? `Out: ${fmtTime(statusRecord.checkOutTime)}`
              : statusRecord?.checkInTime
              ? "Shift In Progress"
              : "Pending check in"}
          </div>
        </div>

        {/* Card 2: Net Work Time */}
        <div className="bg-white rounded-xl border border-blue-100 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Net Work</span>
            <Clock size={15} className="text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-900 mt-1.5 tabular-nums">
            {fmtDur(workSeconds)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            <span>Target: 8.5 Hours</span>
          </div>
        </div>

        {/* Card 3: Break Time with Direct 1-Click Action */}
        <div className="bg-white rounded-xl border border-blue-100 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Break Time</span>
            <Coffee size={15} className="text-amber-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-700 mt-1.5 tabular-nums">
            {fmtDur(totalBreakSeconds)}
          </div>
          <div className="text-[11px] mt-0.5">
            {status === "Active" ? (
              <button
                type="button"
                onClick={() => handleBreakStart && handleBreakStart("Break")}
                disabled={loading}
                className="text-amber-700 font-bold hover:underline cursor-pointer"
              >
                Take break now →
              </button>
            ) : status === "On Break" ? (
              <button
                type="button"
                onClick={() => handleBreakEnd && handleBreakEnd()}
                disabled={loading}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Resume work →
              </button>
            ) : (
              <span className="text-slate-400 font-medium">Standard 1 hr limit</span>
            )}
          </div>
        </div>

        {/* Card 4: Quick Action - Leaves & Tasks */}
        <div className="bg-white rounded-xl border border-blue-100 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Leave / Requests</span>
            <CalendarPlus size={15} className="text-indigo-600" />
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-1.5">
            Apply Leave
          </div>
          <div className="text-[11px] mt-0.5">
            <button
              type="button"
              onClick={() => setView("leaves")}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Open leave form →
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. CONDITIONAL DEPARTMENT TOOL (Sales/Admin/Accounts ONLY) ── */}
      {isSales ? (
        <DeptSalesWidgets setView={setView} />
      ) : isAdmin ? (
        <DeptAdminWidgets />
      ) : isAccounts ? (
        <DeptAccountsWidgets />
      ) : null}

      {/* ── 4. COMPACT 2-COLUMN MAIN BODY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 7 Columns: Today's Shift Details & Attendance Records */}
        <div className="lg:col-span-7 space-y-4">
          {/* Today's Shift & Break Log */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer size={16} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Today's Shift Activity
                </h3>
              </div>
              {statusRecord?.halfSalaryDeduct !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                    statusRecord.halfSalaryDeduct
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {statusRecord.halfSalaryDeduct ? "Half Day (<8h)" : "Full Day (8h+)"}
                </span>
              )}
            </div>

            {/* Shift timings micro bar */}
            <div className="grid grid-cols-3 gap-2 text-center p-2.5 bg-blue-50/50 rounded-xl border border-blue-100/80 mb-3">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Check In</div>
                <div className="text-xs font-black text-slate-800 tabular-nums mt-0.5">
                  {statusRecord?.checkInTime ? fmtTime(statusRecord.checkInTime) : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Check Out</div>
                <div className="text-xs font-black text-slate-800 tabular-nums mt-0.5">
                  {statusRecord?.checkOutTime ? fmtTime(statusRecord.checkOutTime) : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Break</div>
                <div className="text-xs font-black text-amber-700 tabular-nums mt-0.5">
                  {fmtDur(totalBreakSeconds)}
                </div>
              </div>
            </div>

            {/* Breaks log list */}
            {statusRecord?.breaks?.length > 0 ? (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Break Intervals ({statusRecord.breaks.length})
                </div>
                {statusRecord.breaks.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs border border-slate-100"
                  >
                    <span className="font-bold text-slate-700">{b.type || "Break"}</span>
                    <span className="text-slate-500 font-medium text-[11px] tabular-nums">
                      {fmtTime(b.startTime)} → {b.endTime ? fmtTime(b.endTime) : <span className="text-amber-600 font-bold animate-pulse">Ongoing</span>}
                    </span>
                    <span className="font-bold text-slate-800 text-[11px] tabular-nums">
                      {b.durationSeconds ? fmtDur(b.durationSeconds) : "Active"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-400">
                No breaks taken yet today.
              </div>
            )}
          </div>

          {/* Recent Attendance Records */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Recent Attendance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setView("calendar")}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Calendar View →
              </button>
            </div>

            {pastRecords.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No past attendance records found.
              </div>
            ) : (
              <div className="space-y-1.5">
                {visiblePastRecords.map((rec) => {
                  const isHalfDay = rec.halfSalaryDeduct || (rec.totalWorkSeconds > 0 && rec.totalWorkSeconds < 28800);
                  return (
                    <div
                      key={rec.date}
                      className="flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-slate-50 rounded-lg text-xs border border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 tabular-nums">
                          {rec.date}
                        </span>
                        <span
                          className={`font-black px-1.5 py-0.2 rounded text-[9px] uppercase ${
                            rec.status === "Absent"
                              ? "bg-rose-100 text-rose-800"
                              : rec.status === "Holiday"
                              ? "bg-purple-100 text-purple-800"
                              : rec.status === "On Leave"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        {rec.checkInTime && <span>In: <strong>{fmtTime(rec.checkInTime)}</strong></span>}
                        {rec.totalWorkSeconds > 0 && (
                          <span className="font-bold text-blue-900">
                            {fmtDur(rec.totalWorkSeconds)}
                          </span>
                        )}
                        {isHalfDay && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 rounded">
                            Half Day
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {pastRecords.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowMorePast(!showMorePast)}
                    className="w-full py-1.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {showMorePast ? "Show Less ↑" : `Show More (${pastRecords.length - 3} records) ↓`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Tasks & Notices */}
        <div className="lg:col-span-5 space-y-4">
          {/* Today's Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Tasks
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {completedCount}/{tasks.length} Done
              </span>
            </div>

            <div className="space-y-1.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                    task.completed
                      ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                      : "bg-white border-slate-200/70 hover:border-blue-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {task.completed ? (
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Square size={15} className="text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{task.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase px-1 py-0.5 rounded shrink-0 ${
                      task.priority === "High" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Meetings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video size={16} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Meetings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setView("meetings")}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                All →
              </button>
            </div>

            {todayMeetings && todayMeetings.length > 0 ? (
              <div className="space-y-1.5">
                {todayMeetings.map((m, idx) => (
                  <div key={idx} className="p-2.5 bg-blue-50/40 border border-blue-100 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{m.title}</div>
                      <div className="text-[10px] text-blue-700">{m.startTime || "Scheduled"} • {m.platform || "Online"}</div>
                    </div>
                    {m.meetingLink && (
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                      >
                        Join
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-400">
                No meetings scheduled for today.
              </div>
            )}
          </div>

          {/* Announcements Notice */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Notice Board
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setView("announcements")}
                className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
              >
                All →
              </button>
            </div>

            {announcements && announcements.length > 0 ? (
              <div className="space-y-2">
                {announcements.slice(0, 2).map((a) => (
                  <div key={a._id} className="p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-lg">
                    <div className="text-xs font-bold text-amber-950">{a.title}</div>
                    <div className="text-[11px] text-amber-900 line-clamp-2 mt-0.5">{a.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-400">
                No active announcements.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
