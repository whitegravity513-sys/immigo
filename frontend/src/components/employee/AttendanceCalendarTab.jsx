import React from "react";

export default function AttendanceCalendarTab({
  calendarMonth,
  calendarYear,
  setCalendarMonth,
  setCalendarYear,
  monthlyData,
  monthlyLoading,
  holidays,
  leaveHistory,
  isDateInLeaveRange,
  getDateKey,
  getIndiaDateString,
  status,
  statusRecord,
  fmtTime,
  lunchSeconds,
  breakSeconds,
  fmtDur,
}) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const firstDayIndex = new Date(calendarYear, calendarMonth - 1, 1).getDay();
  const totalDays = new Date(calendarYear, calendarMonth, 0).getDate();
  const blanks = Array.from({ length: firstDayIndex }, () => null);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const gridItems = [...blanks, ...days];
  const todayKey = getDateKey(new Date());
  const summary = monthlyData?.summary || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Working Days",
            value: summary.totalWorkingDays !== undefined && summary.totalWorkingDays !== null ? `${summary.totalWorkingDays} Days` : "—",
            sub: "Post-DOJ (Excl. Holidays & Offs)",
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Present",
            value: summary.presentDays !== undefined && summary.presentDays !== null ? `${summary.presentDays} Days` : "—",
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Half Day",
            value: summary.halfDays !== undefined && summary.halfDays !== null ? `${summary.halfDays} Days` : "—",
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Absent",
            value: summary.absentDays !== undefined && summary.absentDays !== null ? `${summary.absentDays} Days` : "—",
            color: "bg-rose-50 text-rose-700",
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border border-slate-200/70 p-4 ${item.color}`}>
            <div className="text-2xl font-black">{item.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</div>
            {item.sub && <div className="text-[10px] font-semibold opacity-75 mt-0.5">{item.sub}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-800">Attendance Calendar</h3>
            <p className="text-xs text-slate-500 font-medium">
              See holidays, leaves, and your attendance for {monthNames[calendarMonth - 1]} {calendarYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (calendarMonth === 1) {
                  setCalendarMonth(12);
                  setCalendarYear(calendarYear - 1);
                } else {
                  setCalendarMonth(calendarMonth - 1);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold hover:bg-slate-100"
            >
              ◀
            </button>
            <button
              onClick={() => {
                if (calendarMonth === 12) {
                  setCalendarMonth(1);
                  setCalendarYear(calendarYear + 1);
                } else {
                  setCalendarMonth(calendarMonth + 1);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold hover:bg-slate-100"
            >
              ▶
            </button>
          </div>
        </div>

        {monthlyLoading && <div className="text-sm text-slate-500 mb-3">Loading calendar…</div>}

        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {gridItems.map((day, idx) => {
            if (day === null) return <div key={`blank-${idx}`} className="h-16 rounded-xl border border-slate-100 bg-slate-50/40" />;
            const dateKey = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const holiday = holidays.find((h) => h.date === dateKey);
            const leaveOnDay = leaveHistory.some((lv) => isDateInLeaveRange(dateKey, lv));
            const record = monthlyData?.dailyRecords?.find((item) => item.date === dateKey);
            const isToday = dateKey === todayKey;
            const dayOfWeek = new Date(calendarYear, calendarMonth - 1, day).getDay();
            const isSunday = dayOfWeek === 0;
            const satCount = dayOfWeek === 6 ? Math.ceil(day / 7) : 0;
            const isOffSaturday = dayOfWeek === 6 && (satCount === 2 || satCount === 4);
            const isWeeklyOff = isSunday || isOffSaturday;

            let cellClass = "h-16 rounded-xl border border-slate-200 bg-white p-1.5 flex flex-col justify-between";
            let badge = null;

            if (holiday || record?.status === "Holiday") {
              cellClass = "h-16 rounded-xl border border-amber-200 bg-amber-50 p-1.5 flex flex-col justify-between";
              badge = <span className="text-[8px] font-black uppercase bg-amber-600 text-white px-1.5 py-0.5 rounded-full">Holiday</span>;
            } else if (record?.status && ["Present", "Active", "Checked Out", "On Break"].includes(record.status)) {
              cellClass = "h-16 rounded-xl border border-emerald-200 bg-emerald-50 p-1.5 flex flex-col justify-between";
              badge = <span className="text-[8px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">Present</span>;
            } else if (isWeeklyOff || record?.status === "Weekly Off" || record?.status === "Weekend") {
              cellClass = "h-16 rounded-xl border border-slate-200 bg-slate-100/70 p-1.5 flex flex-col justify-between";
              badge = <span className="text-[8px] font-black uppercase bg-slate-400 text-white px-1.5 py-0.5 rounded-full">OFF</span>;
            } else if (leaveOnDay || record?.status === "On Leave") {
              cellClass = "h-16 rounded-xl border border-blue-200 bg-blue-50 p-1.5 flex flex-col justify-between";
              badge = <span className="text-[8px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded-full">Leave</span>;
            } else if (dateKey <= todayKey && (record?.status === "Absent" || !record)) {
              cellClass = "h-16 rounded-xl border border-rose-200 bg-rose-50 p-1.5 flex flex-col justify-between";
              badge = <span className="text-[8px] font-black uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded-full">Absent</span>;
            } else if (isToday) {
              cellClass = "h-16 rounded-xl border border-slate-300 bg-slate-50 p-1.5 flex flex-col justify-between";
              badge = <span className="text-[8px] font-black uppercase bg-slate-700 text-white px-1.5 py-0.5 rounded-full">Today</span>;
            }

            return (
              <div key={dateKey} className={cellClass}>
                <div className="flex items-center justify-between text-[10px] font-black text-slate-700">
                  <span>{day}</span>
                  {holiday && <span className="text-[8px] text-amber-700 max-w-[40px] truncate">{holiday.title}</span>}
                </div>
                <div className="flex justify-end">{badge}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Leave</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Holiday</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Weekly Off</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-black text-slate-800">Today’s Snapshot</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{getIndiaDateString()}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Status", value: status },
            { label: "Check In", value: statusRecord?.checkInTime ? fmtTime(statusRecord.checkInTime) : "—" },
            { label: "Check Out", value: statusRecord?.checkOutTime ? fmtTime(statusRecord.checkOutTime) : "—" },
            { label: "Lunch / Short", value: `${fmtDur(lunchSeconds)} / ${fmtDur(breakSeconds)}` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
              <div className="text-sm font-black text-slate-800 mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
