import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  LogIn,
  LogOut,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Video,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Play,
  Timer,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
  Megaphone,
} from "lucide-react";
import { EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";
import DailyWorkLogSection from "./DailyWorkLogSection.jsx";

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
  errorMsg = "",
  successMsg = "",
  complianceInfo = { isComplianceOnHold: false, missingDocs: [], rejectedDocs: [] },
}) {
  const [showMorePast, setShowMorePast] = useState(false);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";


  // Today's total break seconds
  const totalBreakSeconds = (lunchSeconds || 0) + (breakSeconds || 0);

  // Lifetime Attendance Stats since Joining Date
  const attStats = statusRecord?.attendanceStats || {
    presentDays: monthlyData?.summary?.presentDays ?? 0,
    absentDays: monthlyData?.summary?.absentDays ?? 0,
    leaveDays: monthlyData?.summary?.totalLeaveDays ?? (monthlyData?.summary?.onLeave ?? 0),
    halfDays: monthlyData?.summary?.halfDays ?? 0,
    joiningDate: user?.joiningDate || "",
  };

  const formattedJoiningDate = attStats.joiningDate
    ? new Date(attStats.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : user?.joiningDate
      ? new Date(user.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "Day 1";

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800">
      {/* ── ACTIVE BREAK ALERT BANNER (Only shown when On Break) ── */}
      {(status === "On Break" || isOnBreak) && (
        <div className="bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 border border-sky-400/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Coffee size={22} className="animate-bounce text-white" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-100">
                You are Currently on Break • Work Timer Paused
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                <span>Break Elapsed:</span>
                <strong className="font-mono text-base font-black underline bg-black/20 px-2 py-0.5 rounded-lg tabular-nums">
                  {fmtDur(totalBreakSeconds)}
                </strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleBreakEnd && handleBreakEnd()}
            disabled={loading}
            className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-md border border-emerald-300"
          >
            <Play size={14} className="fill-current text-emerald-700" />
            <span>Break In (Resume Work)</span>
          </button>
        </div>
      )}

      {/* ── MANDATORY COMPLIANCE DOCUMENTS ON HOLD BANNER ── */}
      {complianceInfo?.isComplianceOnHold && (
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 text-white rounded-2xl sm:rounded-3xl p-5 shadow-lg border border-rose-300/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <AlertCircle size={24} className="text-white animate-pulse" />
              </div>
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-black/25 text-white rounded-full text-[10px] font-black uppercase tracking-wider border border-white/20">
                    Compliance Status: ON HOLD
                  </span>
                  <span className="text-xs font-bold text-amber-100">Mandatory Verification Pending</span>
                </div>
                <h3 className="text-base font-black text-white tracking-tight">
                  Required Compliance Documents Missing or Rejected
                </h3>
                <p className="text-xs text-rose-100 font-medium max-w-2xl">
                  Your employee profile documentation is currently on hold. Mandatory compliance documents must be submitted and approved by HR.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setView("profile-docs")}
              className="px-5 py-2.5 bg-white hover:bg-rose-50 text-rose-700 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
            >
              <span>Upload / Resolve Documents</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Pending / Rejected Chips */}
          <div className="pt-2 border-t border-white/20 flex items-center gap-2 flex-wrap text-left">
            <span className="text-[11px] font-bold text-rose-100">Action Needed:</span>
            {complianceInfo.rejectedDocs?.map((doc) => (
              <span
                key={doc._id || doc.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-900/40 text-rose-100 rounded-lg text-[11px] font-bold border border-rose-300/30"
                title={doc.verificationNote || "Rejected by HR"}
              >
                ⚠️ Rejected: {doc.name || doc.type}
              </span>
            ))}
            {complianceInfo.missingDocs?.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/25 text-amber-100 rounded-lg text-[11px] font-bold border border-white/20"
              >
                Missing: {type}
              </span>
            ))}
          </div>
        </div>
      )}




      {/* ── 1. CLEAN MNC HERO BANNER ── */}
      <div
        className="text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md shadow-blue-900/25 border border-blue-500/40 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #163883ff 50%, #1d4ed8 100%)" }}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Employee Avatar & Info */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {(() => {
                const avatarUrl = user?.profileImage || statusRecord?.profileImage;
                return (
                  <div className={`w-14 h-14 sm:w-16 sm:h-16  ${avatarUrl ? "bg-white" : "bg-gradient-to-tr from-slate-600 to-slate-700"} text-white font-black text-xl flex items-center justify-center shadow-md border-2 border-white/80 overflow-hidden relative`}>
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user?.name || "Employee"}
                        className="w-full h-full object-cover rounded-2xl"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.parentElement?.querySelector(".banner-avatar-fallback");
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span
                      className="banner-avatar-fallback w-full h-full items-center justify-center font-black text-xl text-white select-none"
                      style={{ display: avatarUrl ? "none" : "flex" }}
                    >
                      {(user?.name || "E")[0].toUpperCase()}
                    </span>
                  </div>
                );
              })()}
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusColor} ${status === "Active" || status === "On Break" ? "animate-pulse" : ""}`}
                title={status}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {greeting}, {user?.name || "Employee"}!
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${status === "Active"
                    ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400"
                    : status === "On Break"
                      ? "bg-amber-500/30 text-amber-200 border border-amber-400"
                      : "bg-white/20 text-slate-100 border border-white/40"
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusColor} ${status === "Active" || status === "On Break" ? "animate-pulse" : ""}`} />
                  {status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-white font-semibold">
                <EmployeeIdBadge
                  id={user?.employeeId}
                  size="xs"
                  onClick={() => setView("profile-docs")}
                  title="Click to view My Profile & Documents"
                />
                <span className="text-white/80 font-black">•</span>
                <span className="text-white font-bold bg-white/20 px-2.5 py-0.5 rounded-md border border-white/30 text-[11px]">
                  {user?.department || "Staff"}
                </span>
                <span className="text-white/80 font-black">•</span>
                <span className="text-slate-100 font-semibold">{user?.designation || "Employee"}</span>
                {isHolidayToday && (
                  <span className="text-amber-300 font-bold bg-amber-400/25 px-2 py-0.5 rounded-md border border-amber-400/40 text-[10px] flex items-center gap-1">
                    🌟 {todayHoliday?.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Leave Management Shortcut */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setView("leaves")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/30 transition-all cursor-pointer backdrop-blur-xs active:scale-95 shadow-xs"
            >
              <CalendarPlus size={15} />
              <span>Apply / View Leaves</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. LIFETIME ATTENDANCE STATS SINCE JOINING DATE (Compacted) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Card 1: Present Days */}
        <div className="bg-white rounded-xl border-2 border-emerald-300 hover:border-emerald-400 p-3 sm:p-3.5 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">Present Days</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-950 tabular-nums">
              {attStats.presentDays ?? 0} <span className="text-[11px] font-bold text-emerald-800">Days</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
              <span>● Since Joining ({formattedJoiningDate})</span>
            </div>
          </div>
        </div>

        {/* Card 2: Absent Days */}
        <div className="bg-white rounded-xl border-2 border-rose-300 hover:border-rose-400 p-3 sm:p-3.5 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-rose-900 uppercase tracking-wider">Absent Days</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-950 tabular-nums">
              {attStats.absentDays ?? 0} <span className="text-[11px] font-bold text-rose-800">Days</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
              <span>● Working Days Missed</span>
            </div>
          </div>
        </div>

        {/* Card 3: On Leave */}
        <div className="bg-white rounded-xl border-2 border-blue-300 hover:border-blue-400 p-3 sm:p-3.5 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider">On Leave</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CalendarPlus size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-950 tabular-nums">
              {attStats.leaveDays ?? 0} <span className="text-[11px] font-bold text-blue-800">Days</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
              <span>● Approved Leaves Taken</span>
            </div>
          </div>
        </div>

        {/* Card 4: Half Day */}
        <div className="bg-white rounded-xl border-2 border-amber-300 hover:border-amber-400 p-3 sm:p-3.5 shadow-xs transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider">Half Day</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-950 tabular-nums">
              {attStats.halfDays ?? 0} <span className="text-[11px] font-bold text-amber-800">Days</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
              <span>● Shifts Under 8 Hours</span>
            </div>
          </div>
        </div>
      </div>


      {/* ── 4. CLEAN MNC 2-COLUMN MAIN BODY (Shift Activity & Daily Work Log - Symmetrical Height) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left 7 Columns: Today's Shift & Break Control Terminal (Compacted to match Work Log) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white rounded-2xl border-2 border-slate-300 p-3.5 sm:p-4 shadow-xs h-full flex flex-col justify-between">
            {/* Header: Title & Status */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  <Timer size={15} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 leading-tight">
                    Today's Shift & Break Activity
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Live punch tracking & shift duration</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${status === "Active"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                  : status === "On Break"
                    ? "bg-amber-50 text-amber-800 border-amber-400"
                    : status === "Checked Out"
                      ? "bg-slate-100 text-slate-800 border-slate-400"
                      : "bg-rose-50 text-rose-800 border-rose-400"
                  }`}
              >
                {status}
              </span>
            </div>

            {/* Middle Section: Live Timer + 3 Micro Metrics in One Streamlined Row */}
            <div className="my-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Left 6 cols: Live Net Work Timer Banner */}
              <div className="sm:col-span-6 p-2.5 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100/60 rounded-xl border border-blue-200 flex flex-col justify-center text-center">
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                  Net Work Duration
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums text-blue-950 my-0.5">
                  {fmtDur(workSeconds)}
                </div>
                <div className="text-[10px] font-bold">
                  {status === "On Break" || isOnBreak ? (
                    <span className="text-amber-700 font-bold">⏸ Break Paused</span>
                  ) : status === "Active" ? (
                    <span className="text-emerald-700 font-bold">▶ Counting Live</span>
                  ) : status === "Checked Out" ? (
                    <span className="text-slate-600 font-bold">✓ Shift Done</span>
                  ) : (
                    <span className="text-slate-500 font-bold">Inactive</span>
                  )}
                </div>
              </div>

              {/* Right 6 cols: Micro Shift Timings Bar (Check In, Out, Break) */}
              <div className="sm:col-span-6 grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="p-1">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">In</div>
                  <div className="text-xs font-black text-slate-900 tabular-nums mt-0.5">
                    {statusRecord?.checkInTime ? fmtTime(statusRecord.checkInTime) : "—"}
                  </div>
                </div>
                <div className="p-1 border-x border-slate-200">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Out</div>
                  <div className="text-xs font-black text-slate-900 tabular-nums mt-0.5">
                    {statusRecord?.checkOutTime ? fmtTime(statusRecord.checkOutTime) : "—"}
                  </div>
                </div>
                <div className="p-1">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Break</div>
                  <div className="text-xs font-black text-sky-900 tabular-nums mt-0.5">
                    {fmtDur(totalBreakSeconds)}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Compact 1-Row Quick Action Terminal */}
            <div className="pt-2 border-t border-slate-100">
              {errorMsg && (
                <div className="mb-2 p-1.5 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-2 p-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {/* CHECK IN BUTTON */}
                {(status !== "Active" && status !== "On Break" && status !== "Checked Out") && (
                  <button
                    type="button"
                    onClick={() => handleCheckIn && handleCheckIn()}
                    disabled={loading}
                    className="flex-1 min-w-[130px] py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <LogIn size={13} />
                    <span>{loading ? "Checking In…" : "Check In Shift"}</span>
                  </button>
                )}

                {/* SHIFT COMPLETED BADGE (NO RE-CHECK IN) */}
                {status === "Checked Out" && (
                  <div className="flex-1 min-w-[170px] py-2 px-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                    <span>🔒 Shift Completed (Checked Out)</span>
                  </div>
                )}

                {/* BREAK BUTTON */}
                {status === "Active" && (
                  <button
                    type="button"
                    onClick={() => handleBreakStart && handleBreakStart("Break")}
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Take Break"
                  >
                    <Coffee size={13} />
                    <span>Take Break</span>
                  </button>
                )}

                {/* BREAK IN BUTTON */}
                {(status === "On Break" || isOnBreak) && (
                  <button
                    type="button"
                    onClick={() => handleBreakEnd && handleBreakEnd()}
                    disabled={loading}
                    className="flex-1 min-w-[130px] py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 animate-pulse"
                  >
                    <Play size={13} className="fill-current" />
                    <span>Break In (Resume)</span>
                  </button>
                )}

                {/* CHECK OUT BUTTON */}
                {(status === "Active" || status === "On Break") && (
                  <button
                    type="button"
                    onClick={() => handleCheckOut && handleCheckOut()}
                    disabled={loading}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Check Out Shift"
                  >
                    <LogOut size={13} />
                    <span>{loading ? "…" : "Check Out"}</span>
                  </button>
                )}

                {status === "Checked Out" && (
                  <div className="w-full py-1.5 px-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-[11px] font-bold text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                    <span>Completed at {fmtTime(statusRecord?.checkOutTime)}. Re-Check In anytime if needed.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Enterprise Daily Work Log (Symmetrical Height) */}
        <div className="lg:col-span-5 flex flex-col">
          <DailyWorkLogSection />
        </div>
      </div>
    </div>
  );
}

