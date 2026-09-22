import React from "react";
import {
  LogIn,
  LogOut,
  CheckCircle,
  Clock,
  Coffee,
  Calendar,
  CheckCircle2
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
  handleBreakStart,
  handleBreakEnd,
  checkOutNote,
  setCheckOutNote,
}) {
  const isOffDay = isHolidayToday || isWeeklyOffToday;
  const totalBreakSec = (lunchSeconds || 0) + (breakSeconds || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-slate-800">
      {/* Holiday / Off Day Alert */}
      {isHolidayToday && (
        <div className="p-4 bg-indigo-50/80 border border-indigo-200 text-indigo-950 rounded-2xl text-xs font-semibold flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <span className="font-bold text-sm block text-indigo-900">Official Company Holiday: {todayHoliday?.title || "Holiday"}</span>
            <span className="text-indigo-700 font-medium">Office operations are closed today. Daily attendance check-in is not required. Enjoy your holiday!</span>
          </div>
        </div>
      )}

      {isWeeklyOffToday && !isHolidayToday && (
        <div className="p-3.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2.5">
          <Calendar size={16} className="text-slate-600 shrink-0" />
          <span>Today is your Weekly Off ({weeklyOffReason || "Weekend"}). (Shift check-in is allowed).</span>
        </div>
      )}

      {/* ── MAIN ATTENDANCE CARD ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Check In/Out Terminal (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Clock size={16} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Shift Check In / Out Terminal
              </h2>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isHolidayToday
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : status === "Active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : status === "On Break"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : status === "Checked Out"
                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isHolidayToday ? "bg-indigo-600" : statusColor} ${status === "Active" || status === "On Break" ? "animate-pulse" : ""}`} />
              {isHolidayToday ? "Holiday" : status}
            </div>
          </div>

          {/* Big Work Timer Display */}
          <div className="text-center py-5 bg-blue-50/50 rounded-xl border border-blue-100/80">
            <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-blue-950 mb-1">
              {fmtDur(workSeconds)}
            </div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              Current Net Work Time
            </div>
          </div>

          {/* Action Buttons */}
          <div>
            {isHolidayToday ? (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                  <Calendar size={14} /> Official Company Holiday
                </div>
                <p className="text-xs text-indigo-900 font-semibold">
                  Attendance check-in is not required today for &ldquo;{todayHoliday?.title || "Holiday"}&rdquo;.
                </p>
                <p className="text-[11px] text-indigo-600">
                  No absent penalty or salary deductions are applied on official holidays.
                </p>
              </div>
            ) : (status === "Absent" || status === "Weekly Off" || status === "Holiday") ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[.98] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogIn size={18} />
                  <span>{loading ? "Checking In…" : "Check In Shift"}</span>
                </button>
                <p className="text-center text-[11px] text-slate-400 font-medium">
                  Click to start your daily shift and record your check-in time.
                </p>
              </div>
            ) : null}

            {(status === "Active" || status === "On Break") && (
              <div className="space-y-3">
                {/* Break Controls directly next to Check In/Out */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Coffee size={16} className="text-amber-700" />
                    <div>
                      <div className="text-xs font-bold text-amber-950">
                        {status === "On Break" ? "Break Mode Active" : "Break Controls"}
                      </div>
                      <div className="text-[10px] text-amber-700 font-medium">
                        Total today: {fmtDur(totalBreakSec)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {status === "Active" ? (
                      <button
                        type="button"
                        onClick={() => handleBreakStart && handleBreakStart("Break")}
                        disabled={loading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <Coffee size={14} />
                        <span>Take Break</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBreakEnd && handleBreakEnd()}
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 animate-pulse"
                      >
                        <LogIn size={14} />
                        <span>Break In (Resume Work)</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Shift Note / Remarks <span className="font-normal text-slate-400 normal-case">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    placeholder="Add an optional note about today's work…"
                    value={checkOutNote}
                    onChange={(e) => setCheckOutNote(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={loading}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-[.98] text-white font-bold text-sm rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <LogOut size={16} />
                  <span>{loading ? "Checking Out…" : "Check Out Shift"}</span>
                </button>
              </div>
            )}

            {status === "Checked Out" && (
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300/80 text-emerald-950 rounded-2xl font-medium flex flex-col items-center justify-center gap-3 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200 shadow-inner">
                  <CheckCircle size={26} className="text-emerald-600" />
                </div>
                <div>
                  <div className="text-base font-black text-emerald-900 tracking-tight">Shift Completed For Today</div>
                  <div className="text-xs text-emerald-800 font-semibold mt-1">
                    Checked out at <strong className="underline">{fmtTime(statusRecord?.checkOutTime)}</strong>
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white/90 border border-emerald-200 text-[11px] text-emerald-800 font-medium max-w-sm">
                  🔒 <strong>Check-in is locked until tomorrow.</strong> Once checked out, re-check-in is restricted. For any timing modifications or corrections, please contact your Admin.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Shift Summary Details (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Shift Timings
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Check In
                </span>
                <span className="text-sm font-black text-slate-800 mt-1 block tabular-nums">
                  {statusRecord?.checkInTime ? fmtTime(statusRecord.checkInTime) : "—"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Check Out
                </span>
                <span className="text-sm font-black text-slate-800 mt-1 block tabular-nums">
                  {statusRecord?.checkOutTime ? fmtTime(statusRecord.checkOutTime) : "—"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Break
                </span>
                <span className="text-sm font-black text-amber-700 mt-1 block tabular-nums">
                  {fmtDur(totalBreakSec)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Work Duration
                </span>
                <span className="text-sm font-black text-blue-700 mt-1 block tabular-nums">
                  {fmtDur(workSeconds)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Simple Attendance:</strong> You can check in when starting your day and check out when you finish. No minimum hours mandatory.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
