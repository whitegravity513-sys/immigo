import React from "react";
import {
  LogIn,
  LogOut,
  CheckCircle,
  Clock,
  Coffee,
  Award,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function CheckInOutSection({
  status,
  statusColor,
  workSeconds = 0,
  lunchSeconds = 0,
  breakSeconds = 0,
  fmtDur,
  statusRecord,
  fmtTime,
  isHolidayToday,
  todayHoliday,
  isWeeklyOffToday,
  weeklyOffReason,
  loading,
  handleCheckIn,
  handleCheckOut,
  checkOutNote,
  setCheckOutNote,
}) {
  const isOffDay = isHolidayToday || isWeeklyOffToday;
  const targetSeconds = 28800; // 8 hours standard full day
  const progressPct = Math.min(100, Math.round(((workSeconds || 0) / targetSeconds) * 100));
  const remainingWorkSec = Math.max(0, targetSeconds - (workSeconds || 0));
  const totalBreakSec = (lunchSeconds || 0) + (breakSeconds || 0);

  // Compute expected checkout if checked in
  const getExpectedCheckout = () => {
    if (!statusRecord?.checkInTime) return "—";
    try {
      const d = new Date(statusRecord.checkInTime);
      d.setHours(d.getHours() + 8);
      d.setMinutes(d.getMinutes() + 30); // 8h work + 30m break
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── 1. TOP SHIFT TARGET & PROGRESS BAR ── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">Today's Shift Progress</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  Target: 8h 00m
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {workSeconds >= targetSeconds
                  ? "🎉 Full-day quota achieved! Keep up the great work."
                  : `${fmtDur(remainingWorkSec)} needed to complete 8-hour target.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-2xl font-black tabular-nums tracking-tight text-slate-900">
              {progressPct}%
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</span>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPct >= 100
                ? "bg-gradient-to-r from-blue-600 to-emerald-500"
                : "bg-gradient-to-r from-blue-600 to-indigo-600"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Holiday / Off Day Alert */}
      {isHolidayToday && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-sm font-semibold flex items-center gap-3">
          <Calendar size={18} className="text-amber-700 shrink-0" />
          <span>Today is a declared holiday: <strong>{todayHoliday?.title || "Holiday"}</strong>. Check-in is optional/disabled.</span>
        </div>
      )}

      {isWeeklyOffToday && !isHolidayToday && (
        <div className="p-4 bg-slate-100 border border-slate-300 text-slate-800 rounded-2xl text-sm font-semibold flex items-center gap-3">
          <Calendar size={18} className="text-slate-600 shrink-0" />
          <span>Today is your Weekly Off ({weeklyOffReason || "Weekend"}). Enjoy your rest day!</span>
        </div>
      )}

      {/* ── 2. MAIN 2-COLUMN ATTENDANCE PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Punch Control Terminal */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-300 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Attendance Terminal
              </span>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black ${
                  status === "Active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                    : status === "On Break"
                    ? "bg-amber-50 text-amber-700 border border-amber-300"
                    : status === "Checked Out"
                    ? "bg-slate-100 text-slate-700 border border-slate-300"
                    : "bg-rose-50 text-rose-700 border border-rose-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
                {status}
              </div>
            </div>

            {/* Big Timer Display */}
            <div className="text-center py-5 bg-slate-50/80 rounded-2xl border border-slate-200 mb-6">
              <div className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-slate-900 mb-1">
                {fmtDur(workSeconds)}
              </div>
              <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest">
                Current Net Work Time
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div>
            {(status === "Absent" || status === "Weekly Off" || status === "Holiday") && (
              <div className="space-y-3">
                <button
                  onClick={handleCheckIn}
                  disabled={loading || isOffDay}
                  className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 active:scale-[.98] text-white font-black text-lg rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <LogIn size={22} /> {loading ? "Punching In…" : "Punch In / Check In"}
                </button>
                <p className="text-center text-xs text-slate-400 font-medium">
                  Clicking will stamp your exact punch-in time for today.
                </p>
              </div>
            )}

            {(status === "Active" || status === "On Break") && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Shift Note / Accomplishment <span className="font-normal normal-case text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    placeholder="Briefly describe what you worked on today…"
                    value={checkOutNote}
                    onChange={(e) => setCheckOutNote(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleCheckOut}
                  disabled={loading || isOffDay}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 active:scale-[.98] text-white font-black text-base rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <LogOut size={20} /> {loading ? "Punching Out…" : "Punch Out / Check Out"}
                </button>
              </div>
            )}

            {status === "Checked Out" && (
              <div className="p-5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle size={22} />
                </div>
                <div className="text-sm font-black">Shift Completed For Today</div>
                <div className="text-xs text-emerald-700 font-medium">
                  Punch out recorded at {fmtTime(statusRecord?.checkOutTime)}. Have a great evening!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Shift Summary & Key Metrics Grid */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Metric 1: Check In */}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-5">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <LogIn size={18} />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Check In Time</span>
              </div>
              <div className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-slate-900">
                {statusRecord?.checkInTime ? fmtTime(statusRecord.checkInTime) : "—"}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {statusRecord?.checkInTime ? "Recorded" : "Not yet checked in"}
              </div>
            </div>

            {/* Metric 2: Expected / Check Out */}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-5">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Clock size={18} />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {statusRecord?.checkOutTime ? "Check Out Time" : "Expected Out"}
                </span>
              </div>
              <div className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-slate-900">
                {statusRecord?.checkOutTime ? fmtTime(statusRecord.checkOutTime) : getExpectedCheckout()}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {statusRecord?.checkOutTime ? "Shift finished" : "Estimated (+8.5h)"}
              </div>
            </div>

            {/* Metric 3: Total Breaks */}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-5">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Coffee size={18} />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Breaks</span>
              </div>
              <div className="text-lg sm:text-xl font-black tabular-nums tracking-tight text-slate-900">
                {fmtDur(totalBreakSec)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Lunch: {fmtDur(lunchSeconds)} • Short: {fmtDur(breakSeconds)}
              </div>
            </div>

            {/* Metric 4: Shift Compliance */}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-5">
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <Award size={18} />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Shift Credit</span>
              </div>
              <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                {workSeconds >= targetSeconds
                  ? "Full Day (8h+)"
                  : status === "Checked Out" && workSeconds < targetSeconds
                  ? "Half Day"
                  : "In Progress"}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {workSeconds >= targetSeconds ? "100% Salary Credit" : "Requires 8h minimum"}
              </div>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <div className="text-xs text-blue-900">
              <strong className="font-bold">Need to step away?</strong> Head over to the <strong>Breaks</strong> tab to pause your work timer for Lunch or Tea break.
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. ATTENDANCE GUIDELINES & POLICY CARDS ── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600" /> Attendance Guidelines & Work Policies
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> 8 Hours Minimum
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              To qualify for full-day salary credit, you must achieve at least 8 hours of net productive working time.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 60 Mins Break Allowance
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Combined lunch and tea breaks should stay within 1 hour per day. Exceeding may trigger salary deduction.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Real-time IST Sync
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Punches are synced in Indian Standard Time (Asia/Kolkata). Ensure you punch out at shift completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
