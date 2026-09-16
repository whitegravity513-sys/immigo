import React from "react";
import {
  Sandwich,
  Coffee,
  Play,
  Pause,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Timer,
} from "lucide-react";

export default function BreaksSection({
  isOnBreak,
  lastBreak,
  status,
  statusColor,
  lunchSeconds = 0,
  breakSeconds = 0,
  workSeconds = 0,
  statusRecord,
  fmtDur,
  fmtTime,
  overLimit,
  isCheckedOut,
  isActive,
  loading,
  isHolidayToday,
  handleBreakStart,
  handleBreakEnd,
}) {
  const activeBreakType = isOnBreak ? lastBreak?.type : null;
  const totalBreakSec = (lunchSeconds || 0) + (breakSeconds || 0);
  const breakLimitSec = 3600; // 60 minutes limit
  const breakPct = Math.min(100, Math.round((totalBreakSec / breakLimitSec) * 100));
  const remainingBreakSec = Math.max(0, breakLimitSec - totalBreakSec);

  const breaksList = statusRecord?.breaks || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── 1. TOP BREAK ALLOWANCE OVERVIEW CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Timer size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900 tracking-tight">Daily Break Allowance</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  Daily Cap: 60 Mins
                </span>
                {overLimit ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                    Over Limit
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Within Limit
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {overLimit
                  ? `⚠️ Break limit exceeded by ${fmtDur(totalBreakSec - breakLimitSec)}. Salary deduction may apply.`
                  : `${Math.round(remainingBreakSec / 60)} minutes remaining for today.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900">
                {fmtDur(totalBreakSec)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Used</div>
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${
                isOnBreak
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : status === "Active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusColor} ${isOnBreak ? "animate-ping" : ""}`} />
              {isOnBreak ? `On ${activeBreakType || "Break"}` : status === "Active" ? "Working" : status}
            </div>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overLimit
                ? "bg-gradient-to-r from-amber-500 to-rose-600"
                : "bg-gradient-to-r from-amber-500 to-amber-600"
            }`}
            style={{ width: `${Math.min(100, breakPct)}%` }}
          />
        </div>
      </div>

      {overLimit && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl text-sm font-semibold">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>Total break limit of 1 hour exceeded! Salary deduction may be applied by administration.</span>
        </div>
      )}

      {status === "Absent" && (
        <div className="p-6 bg-slate-50 border border-slate-300 text-slate-600 rounded-2xl font-semibold text-center text-sm space-y-2">
          <div className="text-base font-black text-slate-800">You are not checked in yet</div>
          <p className="text-xs text-slate-400">Please go to the "Check In / Out" tab and punch in first to activate break tracking.</p>
        </div>
      )}

      {isCheckedOut && (
        <div className="p-6 bg-slate-50 border border-slate-300 text-slate-600 rounded-2xl font-semibold text-center text-sm">
          Shift is already completed and punched out for today. Breaks cannot be modified.
        </div>
      )}

      {/* ── 2. INTERACTIVE BREAK CONTROLS (2-COLUMN CARDS) ── */}
      {(isActive || isOnBreak) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lunch Break Card */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Sandwich size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Lunch Break</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      Typical: 30–45 Mins
                    </span>
                  </div>
                </div>
                {isOnBreak && activeBreakType === "Lunch" && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    Ongoing
                  </span>
                )}
              </div>

              {/* Big Lunch Timer */}
              <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 text-center mb-5">
                <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-amber-900 mb-0.5">
                  {fmtDur(lunchSeconds)}
                </div>
                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  Lunch Time Used Today
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                Standard recess for full lunch and rest. Pauses your net work counter while on break.
              </p>
            </div>

            {/* Lunch Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleBreakStart("Lunch")}
                disabled={loading || isOnBreak || isHolidayToday}
                className="py-3.5 bg-amber-600 hover:bg-amber-700 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm shadow-amber-500/20"
              >
                <Play size={15} /> Start Lunch
              </button>
              <button
                onClick={handleBreakEnd}
                disabled={loading || !isOnBreak || activeBreakType !== "Lunch" || isHolidayToday}
                className="py-3.5 bg-slate-900 hover:bg-black active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm"
              >
                <Pause size={15} /> End Lunch
              </button>
            </div>
          </div>

          {/* Short Break Card */}
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                    <Coffee size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Short Break</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                      Typical: 10–15 Mins
                    </span>
                  </div>
                </div>
                {isOnBreak && activeBreakType !== "Lunch" && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-300 animate-pulse">
                    Ongoing
                  </span>
                )}
              </div>

              {/* Big Short Break Timer */}
              <div className="bg-cyan-50/70 rounded-2xl p-4 border border-cyan-200 text-center mb-5">
                <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-cyan-900 mb-0.5">
                  {fmtDur(breakSeconds)}
                </div>
                <div className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
                  Short Break Time Used Today
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                Quick tea, coffee, or stretch break to stay refreshed and maintain optimum focus.
              </p>
            </div>

            {/* Short Break Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleBreakStart("Break")}
                disabled={loading || isOnBreak || isHolidayToday}
                className="py-3.5 bg-cyan-600 hover:bg-cyan-700 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm shadow-cyan-500/20"
              >
                <Play size={15} /> Start Break
              </button>
              <button
                onClick={handleBreakEnd}
                disabled={loading || !isOnBreak || activeBreakType === "Lunch" || isHolidayToday}
                className="py-3.5 bg-slate-900 hover:bg-black active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs shadow-sm"
              >
                <Pause size={15} /> End Break
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. TODAY'S BREAK LOG ── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">Today's Break Activity</h3>
          </div>
          <span className="text-xs font-bold text-slate-500 tabular-nums">
            {breaksList.length} session{breaksList.length !== 1 ? "s" : ""}
          </span>
        </div>

        {breaksList.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No breaks taken yet today. Click "Start Lunch" or "Start Break" above when stepping away.
          </div>
        ) : (
          <div className="space-y-2.5">
            {breaksList.map((b, idx) => {
              const isLunch = b.type === "Lunch";
              return (
                <div
                  key={idx}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isLunch
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-cyan-100 text-cyan-800 border border-cyan-300"
                      }`}
                    >
                      {isLunch ? <Sandwich size={12} /> : <Coffee size={12} />}
                      {b.type || "Break"}
                    </span>
                    <span className="text-slate-600 font-semibold tabular-nums">
                      {fmtTime ? fmtTime(b.startTime) : b.startTime} →{" "}
                      {b.endTime ? (
                        fmtTime ? fmtTime(b.endTime) : b.endTime
                      ) : (
                        <span className="text-amber-600 font-black animate-pulse">Ongoing</span>
                      )}
                    </span>
                  </div>

                  <div className="font-extrabold tabular-nums text-slate-900">
                    {b.durationSeconds ? fmtDur(b.durationSeconds) : "In Progress"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. BREAK RULES & HEALTH TIPS ── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600" /> Break Best Practices & Policies
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 60 Mins Daily Limit
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your combined lunch and short breaks should not exceed 1 hour. Any excess duration is logged.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Remember to End Break
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Always click "End Lunch" or "End Break" as soon as you return so your work timer resumes immediately.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ergonomics & Rest
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Short 5-minute stretch and hydration pauses help maintain mental alertness and prevent fatigue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
