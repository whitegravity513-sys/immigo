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
  PartyPopper,
  Sparkles,
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

  const todayDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const [holidayAcknowledged, setHolidayAcknowledged] = useState(() => {
    return !!localStorage.getItem(`immigo_holiday_ack_${todayDateStr}`);
  });

  const [meetingAcks, setMeetingAcks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("immigo_meeting_acks") || "{}");
    } catch {
      return {};
    }
  });

  const handleAcknowledgeHoliday = () => {
    localStorage.setItem(`immigo_holiday_ack_${todayDateStr}`, "true");
    setHolidayAcknowledged(true);
  };

  const handleAcknowledgeMeeting = (id) => {
    const updated = { ...meetingAcks, [id]: new Date().toISOString() };
    setMeetingAcks(updated);
    localStorage.setItem("immigo_meeting_acks", JSON.stringify(updated));
  };

  const unacknowledgedMeeting = (todayMeetings || []).find(
    (m) => m && !meetingAcks[m._id || m.id]
  );

  const activeHoliday = todayHoliday || (isHolidayToday ? { title: "Company Holiday", date: todayDateStr } : null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const totalBreakSeconds = (lunchSeconds || 0) + (breakSeconds || 0);

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
      {}
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

      {/* Compact Compliance Notice Strip (Reduced height, clean simple content) */}
      {complianceInfo?.isComplianceOnHold && (
        <div className="bg-amber-500/10 border border-amber-400/40 text-amber-950 rounded-xl px-4 py-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <div className="min-w-0 text-xs">
              <span className="font-extrabold text-amber-900 mr-1.5">Compliance Notice:</span>
              <span className="text-amber-800 font-medium">
                Mandatory employee profile verification documents pending
                {complianceInfo.missingDocs?.length > 0 && ` (${complianceInfo.missingDocs.length} missing)`}
                {complianceInfo.rejectedDocs?.length > 0 && ` (${complianceInfo.rejectedDocs.length} rejected)`}.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setView("profile-docs")}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <span>Upload Documents</span>
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Meeting Acknowledgment Card for Employee Dashboard */}
      {unacknowledgedMeeting && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white rounded-xl p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 border border-purple-400/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Video size={16} className="text-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">Meeting Scheduled</span>
                <span className="text-xs text-purple-200 font-bold">{unacknowledgedMeeting.startTime} • {unacknowledgedMeeting.date}</span>
              </div>
              <h4 className="text-xs font-bold text-white mt-0.5 truncate max-w-md">{unacknowledgedMeeting.title}</h4>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleAcknowledgeMeeting(unacknowledgedMeeting._id || unacknowledgedMeeting.id)}
              className="px-3 py-1.5 bg-white text-purple-900 hover:bg-purple-50 rounded-lg text-xs font-black shadow-xs cursor-pointer transition-all flex items-center gap-1"
            >
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Acknowledge</span>
            </button>
            {unacknowledgedMeeting.meetingLink && (
              <a
                href={unacknowledgedMeeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              >
                <span>Join</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      )}

      {}
      <div
        className="text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md shadow-blue-900/25 border border-blue-500/40 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #163883ff 50%, #1d4ed8 100%)" }}
      >
        {}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {}
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

          {}
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

      {/* Holiday Notification & Acknowledgement Card (Inline - No Popup) */}
      {activeHoliday && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all animate-in fade-in duration-200 ${
            holidayAcknowledged
              ? "bg-amber-50/70 border-amber-200/90 text-amber-950"
              : "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border-amber-300 shadow-sm text-slate-800"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shrink-0 shadow-sm">
                <PartyPopper size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200/90 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-700" />
                    Official Company Holiday
                  </span>
                  <span className="text-xs font-bold text-amber-800">
                    {activeHoliday.date
                      ? new Date(activeHoliday.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Today"}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5">
                  {activeHoliday.title || "Holiday Celebration"}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                  {activeHoliday.description ||
                    "Official company holiday. Regular shifts and work logs are optional today, and your holiday credit is accounted for by HRMS."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {holidayAcknowledged ? (
                <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>✓ Acknowledged</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAcknowledgeHoliday}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-black rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>Acknowledge Holiday</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setView("calendar")}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
              >
                View Holidays
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {}
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

        {}
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

        {}
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

        {}
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

      {/* Daily Attendance Status Card */}
      <div className="p-4 sm:p-4.5 rounded-2xl border bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-100/50 border-blue-300/80 text-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-blue-600 text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Daily Attendance Verification
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Today: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-800">
                  Status: <strong className="text-blue-900 font-black">{status}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600">
                  In: <strong className="font-semibold text-slate-800">{statusRecord?.checkInTime ? fmtTime(statusRecord.checkInTime) : "Not marked"}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600">
                  Out: <strong className="font-semibold text-slate-800">{statusRecord?.checkOutTime ? fmtTime(statusRecord.checkOutTime) : (status === "Active" ? "In Progress" : "Pending")}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600">
                  Worked: <strong className="font-semibold text-slate-800">{fmtDur(workSeconds)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white rounded-2xl border-2 border-slate-300 p-3.5 sm:p-4 shadow-xs h-full flex flex-col justify-between">
            {}
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

            {}
            <div className="my-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {}
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

              {}
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

            {}
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
                {}
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

                {}
                {status === "Checked Out" && (
                  <div className="flex-1 min-w-[170px] py-2 px-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                    <span>🔒 Shift Completed (Checked Out)</span>
                  </div>
                )}

                {}
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

                {}
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

                {}
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

        {}
        <div className="lg:col-span-5 flex flex-col">
          <DailyWorkLogSection />
        </div>
      </div>
    </div>
  );
}

