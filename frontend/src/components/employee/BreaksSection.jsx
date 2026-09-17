import React from "react";
import { Coffee, Play, Pause, AlertCircle, Clock, ShieldCheck, Timer } from "lucide-react";

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
  const totalBreakSec = (lunchSeconds || 0) + (breakSeconds || 0);
  const breaksList = statusRecord?.breaks || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── 1. SINGLE UNIFIED BREAK CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Timer size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Break Timer</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Your total break time for today</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${
            isOnBreak ? "bg-amber-100 text-amber-800 border border-amber-300"
            : status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
            : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${statusColor} ${isOnBreak ? "animate-ping" : ""}`} />
            {isOnBreak ? "On Break" : status === "Active" ? "Working" : status}
          </div>
        </div>

        {/* Big Timer Display */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 text-center">
          <div className="text-5xl sm:text-6xl font-black tabular-nums tracking-tight text-amber-900 mb-1">
            {fmtDur(totalBreakSec)}
          </div>
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Total Break Time Used Today</div>
        </div>

        {/* Single Break Action Button */}
        {(isActive || isOnBreak) && !isCheckedOut && (
          <div className="flex gap-3">
            {!isOnBreak ? (
              <button
                onClick={() => handleBreakStart("Break")}
                disabled={loading || isHolidayToday}
                className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm shadow-amber-500/20 text-sm"
              >
                <Pause size={18} /> Take a Break
              </button>
            ) : (
              <button
                onClick={handleBreakEnd}
                disabled={loading || isHolidayToday}
                className="flex-1 py-4 bg-slate-900 hover:bg-black active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm shadow-sm"
              >
                <Play size={18} /> Resume Work
              </button>
            )}
          </div>
        )}

        {status === "Absent" && (
          <div className="p-5 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl font-semibold text-center text-sm space-y-1">
            <div className="text-base font-black text-slate-800">Not checked in yet</div>
            <p className="text-xs text-slate-400">Check in first to start tracking breaks.</p>
          </div>
        )}

        {isCheckedOut && (
          <div className="p-5 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl font-semibold text-center text-sm">
            Shift completed for today. Breaks are locked.
          </div>
        )}
      </div>

      {/* ── 2. TODAY'S BREAK LOG ── */}
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
            No breaks taken yet today. Click "Take a Break" above when stepping away.
          </div>
        ) : (
          <div className="space-y-2.5">
            {breaksList.map((b, idx) => (
              <div key={idx} className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                    <Coffee size={11} /> {b.type || "Break"}
                  </span>
                  <span className="text-slate-600 font-semibold tabular-nums">
                    {fmtTime ? fmtTime(b.startTime) : b.startTime} →{" "}
                    {b.endTime
                      ? (fmtTime ? fmtTime(b.endTime) : b.endTime)
                      : <span className="text-amber-600 font-black animate-pulse">Ongoing</span>}
                  </span>
                </div>
                <div className="font-extrabold tabular-nums text-slate-900">
                  {b.durationSeconds ? fmtDur(b.durationSeconds) : "In Progress"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. BREAK TIPS ── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600" /> Break Best Practices
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Step Away Freely
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Take breaks when you need them. Resting improves focus and long-term productivity.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Remember to Resume
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Always click "Resume Work" when you return so your productive time counter resumes.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ergonomics & Rest
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Short 5-minute stretch and hydration breaks improve mental alertness and prevent fatigue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
