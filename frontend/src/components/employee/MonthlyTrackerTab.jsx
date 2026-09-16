import React, { useState } from "react";
import { Award, Clock, Sandwich, Coffee, AlertCircle, Calendar, ChevronDown, ChevronUp } from "lucide-react";

export default function MonthlyTrackerTab({
  holidays = [],
  status,
  statusColor,
  workSeconds,
  lunchSeconds,
  breakSeconds,
  fmtDur,
  overLimit,
  statusRecord,
  fmtTime,
  monthlyData,
}) {
  const [showMorePast, setShowMorePast] = useState(false);

  const todayStr = statusRecord?.date || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  // Past attendance records from monthlyData
  const rawPastRecords = (monthlyData?.dailyRecords || monthlyData?.records || [])
    .filter((r) => r.date < todayStr && r.status !== "Before Joining");
  
  // Sort descending by date
  const pastRecords = [...rawPastRecords].sort((a, b) => (a.date < b.date ? 1 : -1));
  const visiblePastRecords = showMorePast ? pastRecords : pastRecords.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Upcoming Holidays Banner */}
      {holidays.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-blue-600/10 flex items-center justify-between border border-blue-400/20">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-xs rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
              🎉
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">
                Upcoming Holiday
              </div>
              <div className="text-sm sm:text-base font-black tracking-tight text-white mt-0.5">
                {holidays[0].title} <span className="text-blue-200 font-bold mx-1.5">•</span> <span className="font-semibold text-blue-100 text-xs sm:text-sm">{holidays[0].date}</span>
              </div>
            </div>
          </div>
          {holidays[0].description && (
            <span className="text-xs text-blue-100 max-w-[200px] truncate hidden sm:inline bg-white/10 px-3 py-1 rounded-lg font-medium">
              {holidays[0].description}
            </span>
          )}
        </div>
      )}

      {/* Status + timers grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Status",
            value: status,
            icon: <Award size={22} />,
            color: "bg-green-50 text-green-600",
            valueClass: `text-lg sm:text-xl font-black uppercase tracking-tight ${
              status === "Active"
                ? "text-emerald-600"
                : status === "On Break"
                ? "text-amber-600"
                : status === "Checked Out"
                ? "text-slate-500"
                : "text-rose-600"
            }`,
          },
          {
            label: "Net Work",
            value: fmtDur(workSeconds),
            icon: <Clock size={22} />,
            color: "bg-blue-50 text-blue-600",
            valueClass: "text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-slate-900",
          },
          {
            label: "Lunch Break",
            value: fmtDur(lunchSeconds),
            icon: <Sandwich size={22} />,
            color: "bg-amber-50 text-amber-600",
            valueClass: "text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-slate-900",
          },
          {
            label: "Short Break",
            value: fmtDur(breakSeconds),
            icon: <Coffee size={22} />,
            color: "bg-cyan-50 text-cyan-600",
            valueClass: "text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-slate-900",
          },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-300 shadow-xs hover:shadow-md transition-all p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.color} shadow-xs`}>
              {c.icon}
            </div>
            <div className="min-w-0">
              <div className={c.valueClass}>{c.value}</div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {c.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {overLimit && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          <span>Total break limit of 1 hour exceeded! Salary deduction may apply.</span>
        </div>
      )}

      {/* Shift Detail Card */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
            <h3 className="text-base font-black text-slate-900 tracking-tight">Today's Shift Details</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 tabular-nums">
              <Calendar size={13} className="text-slate-500" />
              {todayStr}
            </span>
            {statusRecord?.halfSalaryDeduct !== undefined && (
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                  statusRecord.halfSalaryDeduct
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {statusRecord.halfSalaryDeduct ? "Half Day (< 8h)" : "Full Day (8+ h)"}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Check In", value: fmtTime(statusRecord?.checkInTime) },
            { label: "Check Out", value: fmtTime(statusRecord?.checkOutTime) },
            { label: "Lunch Break Used", value: fmtDur(lunchSeconds) },
            { label: "Short Breaks Used", value: fmtDur(breakSeconds) },
          ].map((d) => (
            <div key={d.label} className="flex flex-col bg-slate-50/80 rounded-xl p-4 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{d.label}</span>
              <span className="text-base font-extrabold text-slate-800 tabular-nums tracking-tight">{d.value}</span>
            </div>
          ))}
        </div>

        {/* Recent breaks log */}
        {statusRecord?.breaks?.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Break Log</div>
            {statusRecord.breaks.filter((b) => b.type === "Lunch").length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-black text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Sandwich size={14} /> Lunch Breaks
                </div>
                <div className="space-y-2">
                  {statusRecord.breaks
                    .filter((b) => b.type === "Lunch")
                    .map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-amber-50/60 rounded-xl border border-amber-300 text-xs"
                      >
                        <span className="font-black text-amber-800">Lunch</span>
                        <span className="text-slate-600 font-semibold tabular-nums">
                          {fmtTime(b.startTime)} →{" "}
                          {b.endTime ? (
                            fmtTime(b.endTime)
                          ) : (
                            <span className="text-amber-600 font-bold animate-pulse">Ongoing</span>
                          )}
                        </span>
                        <span className="font-extrabold tabular-nums text-slate-900">
                          {b.durationSeconds ? fmtDur(b.durationSeconds) : "—"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {statusRecord.breaks.filter((b) => b.type !== "Lunch").length > 0 && (
              <div>
                <div className="text-[11px] font-black text-cyan-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Coffee size={14} /> Short Breaks
                </div>
                <div className="space-y-2">
                  {statusRecord.breaks
                    .filter((b) => b.type !== "Lunch")
                    .map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3.5 py-2.5 bg-cyan-50/60 rounded-xl border border-cyan-300 text-xs"
                      >
                        <span className="font-black text-cyan-800">{b.type || "Break"}</span>
                        <span className="text-slate-600 font-semibold tabular-nums">
                          {fmtTime(b.startTime)} →{" "}
                          {b.endTime ? (
                            fmtTime(b.endTime)
                          ) : (
                            <span className="text-cyan-600 font-bold animate-pulse">Ongoing</span>
                          )}
                        </span>
                        <span className="font-extrabold tabular-nums text-slate-900">
                          {b.durationSeconds ? fmtDur(b.durationSeconds) : "—"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PAST ATTENDANCE HISTORY SECTION ── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">Past Attendance History</h3>
          </div>
          <span className="text-xs font-bold text-slate-500 tabular-nums">
            {pastRecords.length} record{pastRecords.length !== 1 ? "s" : ""}
          </span>
        </div>

        {pastRecords.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-300">
            No past attendance records found.
          </div>
        ) : (
          <div className="space-y-2.5">
            {visiblePastRecords.map((rec) => {
              const isHalfDay = rec.halfSalaryDeduct || (rec.totalWorkSeconds > 0 && rec.totalWorkSeconds < 28800);
              const isPresent = rec.status === "Present" || rec.status === "Checked Out";

              return (
                <div
                  key={rec.date}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50/70 border border-slate-300/80 rounded-xl text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-800 bg-white border border-slate-300 px-3 py-1 rounded-lg tabular-nums tracking-tight shadow-2xs">
                      {rec.date}
                    </span>
                    <span
                      className={`font-black px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${
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

                  <div className="flex items-center gap-4 text-slate-600 font-semibold">
                    {rec.checkInTime && <span className="tabular-nums">IN: <strong className="text-slate-800">{fmtTime(rec.checkInTime)}</strong></span>}
                    {rec.checkOutTime && <span className="tabular-nums">OUT: <strong className="text-slate-800">{fmtTime(rec.checkOutTime)}</strong></span>}
                    {rec.totalWorkSeconds > 0 && (
                      <span className="tabular-nums text-slate-900 font-black">
                        Work: {fmtDur(rec.totalWorkSeconds)}
                      </span>
                    )}
                    {isPresent && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                          isHalfDay
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {isHalfDay ? "Half Day (< 8h)" : "Full Day (8+ h)"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {pastRecords.length > 4 && (
              <button
                onClick={() => setShowMorePast(!showMorePast)}
                className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {showMorePast ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    <span>Show More ({pastRecords.length - 4} more records)</span>
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
