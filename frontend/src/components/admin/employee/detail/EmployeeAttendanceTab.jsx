import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Eye } from "lucide-react";

export function EmployeeAttendanceTab({
  emp,
  attendance = [],
  safeHolidays = [],
  joiningDateStr,
  employeeDetailView,
  setEmployeeDetailView,
  calendarMonth,
  calendarYear,
  setCalendarMonth,
  setCalendarYear,
  detailFromDate,
  detailToDate,
  setDetailFromDate,
  setDetailToDate,
  selectedEmployeeId,
  fetchEmployeeHistoryById,
  setPastAttendanceModal,
  formatTime,
  formatDate,
  openTextModal,
  formatHHMM,
}) {
  const fmtDur = (s) => {
    if (!s || s === 0) return "—";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
  };

  const sColor = (s) => {
    if (s === "Checked Out") return "bg-slate-100 text-slate-700 border-slate-200";
    if (s === "Active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "On Break") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "Absent") return "bg-rose-50 text-rose-700 border-rose-200";
    if (s === "On Leave") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-500 border-slate-200";
  };

  const renderCalendarView = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const firstDayIndex = new Date(calendarYear, calendarMonth - 1, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth, 0).getDate();

    const blanks = Array.from({ length: firstDayIndex }, () => null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const gridItems = [...blanks, ...days];

    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
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
              className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer font-bold"
            >
              ◀
            </button>
            <span className="font-bold text-slate-800 text-sm w-36 text-center">
              {months[calendarMonth - 1]} {calendarYear}
            </span>
            <button
              onClick={() => {
                if (calendarMonth === 12) {
                  setCalendarMonth(1);
                  setCalendarYear(calendarYear + 1);
                } else {
                  setCalendarMonth(calendarMonth + 1);
                }
              }}
              className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer font-bold"
            >
              ▶
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={calendarMonth}
              onChange={(e) => setCalendarMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer text-slate-700"
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={calendarYear}
              onChange={(e) => setCalendarYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer text-slate-700"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-center font-bold text-slate-500 text-[10px] sm:text-xs uppercase py-1"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {gridItems.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="bg-slate-50/20 rounded-xl h-24 border border-slate-100/40"
                />
              );
            }

            const dateStr = `${calendarYear}-${String(calendarMonth).padStart(
              2,
              "0"
            )}-${String(day).padStart(2, "0")}`;
            const rec = attendance.find((a) => a && a.date === dateStr);
            const holiday = safeHolidays.find((h) => h && h.date === dateStr);

            const isBeforeJoining = joiningDateStr && dateStr < joiningDateStr;

            const dayOfWeek = new Date(calendarYear, calendarMonth - 1, day).getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;
            let isOffSaturday = false;
            if (isSaturday) {
              const satCount = Math.ceil(day / 7);
              if (satCount === 2 || satCount === 4) isOffSaturday = true;
            }
            const isWeekendOff = isSunday || isOffSaturday;

            let cardBg = "bg-white hover:bg-slate-50/50";
            let statusPill = null;
            let checkInFmt = null;
            let checkOutFmt = null;

            if (isBeforeJoining) {
              cardBg = "bg-slate-50/40 border border-slate-200/50 opacity-60";
              statusPill = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-400">
                  N/A
                </span>
              );
            } else if (rec) {
              let statusText = rec.status;
              let pillBg = "bg-slate-100 text-slate-700 border-slate-200";

              if (rec.halfSalaryDeduct) {
                statusText = "Half Day";
                pillBg = "bg-amber-100 text-amber-800 border-amber-200";
                cardBg = "bg-amber-50/20 hover:bg-amber-50/40 border border-amber-200";
              } else if (
                rec.status === "Present" ||
                rec.status === "Active" ||
                rec.status === "Checked Out" ||
                rec.status === "On Break"
              ) {
                statusText = "Present";
                pillBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                cardBg =
                  "bg-emerald-50/10 hover:bg-emerald-50/30 border border-emerald-200/60";
              } else if (
                rec.status === "Holiday" ||
                (holiday && rec.status === "Absent")
              ) {
                statusText = "Holiday";
                pillBg = "bg-indigo-100 text-indigo-800 border-indigo-200";
                cardBg =
                  "bg-indigo-50/10 hover:bg-indigo-50/30 border border-indigo-200/60";
              } else if (
                rec.status === "Weekly Off" ||
                rec.status === "Weekend" ||
                (isWeekendOff && rec.status === "Absent")
              ) {
                statusText = "Off";
                pillBg = "bg-slate-200 text-slate-600 border-slate-300";
                cardBg = "bg-slate-50 hover:bg-slate-100/80 border border-slate-150";
              } else if (rec.status === "Absent") {
                pillBg = "bg-rose-100 text-rose-800 border-rose-200";
                cardBg =
                  "bg-rose-50/10 hover:bg-rose-50/30 border border-rose-200/60";
              } else if (rec.status === "On Leave") {
                pillBg = "bg-blue-100 text-blue-800 border-blue-200";
                cardBg =
                  "bg-blue-50/10 hover:bg-blue-50/30 border border-blue-200/60";
              }

              statusPill = (
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${pillBg}`}
                >
                  {statusText}
                </span>
              );

              if (rec.checkInTime)
                checkInFmt = new Date(rec.checkInTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              if (rec.checkOutTime)
                checkOutFmt = new Date(rec.checkOutTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
            } else if (holiday) {
              cardBg = "bg-indigo-50/20 hover:bg-indigo-50/40 border border-indigo-100";
              statusPill = (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200"
                  title={holiday.description}
                >
                  Holiday
                </span>
              );
            } else if (isWeekendOff) {
              cardBg = "bg-slate-50 hover:bg-slate-100/80 border border-slate-150";
              statusPill = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-500 border border-slate-300">
                  Off
                </span>
              );
            } else {
              cardBg =
                "bg-white hover:bg-slate-50 border border-dashed border-slate-200";
              statusPill = (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-50 text-slate-400">
                  No Log
                </span>
              );
            }

            return (
              <div
                key={`day-${day}`}
                onClick={() => {
                  if (isBeforeJoining) return;
                  const prefilled = {
                    date: dateStr,
                    status: rec
                      ? rec.halfSalaryDeduct
                        ? "Half Day"
                        : rec.status
                      : "Present",
                    checkInTime: rec?.checkInTime
                      ? formatHHMM(rec.checkInTime)
                      : "10:00",
                    checkOutTime: rec?.checkOutTime
                      ? formatHHMM(rec.checkOutTime)
                      : "19:00",
                    checkOutNote: rec?.checkOutNote || rec?.notes || "",
                    halfSalaryDeduct: rec?.halfSalaryDeduct || false,
                    isDateEditable: false,
                  };
                  setPastAttendanceModal(prefilled);
                }}
                className={`border border-slate-200/80 rounded-xl sm:rounded-2xl h-16 sm:h-24 p-1.5 sm:p-2.5 flex flex-col justify-between text-left cursor-pointer transition-all ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs">{day}</span>
                  {statusPill}
                </div>
                <div className="flex flex-col gap-0.5">
                  {holiday && (
                    <span
                      className="text-[9px] text-indigo-700 font-bold truncate w-full"
                      title={holiday.title}
                    >
                      {holiday.title}
                    </span>
                  )}
                  {checkInFmt && (
                    <span className="text-[9px] text-slate-500 font-semibold">
                      IN: {checkInFmt}
                    </span>
                  )}
                  {checkOutFmt && (
                    <span className="text-[9px] text-slate-500 font-semibold">
                      OUT: {checkOutFmt}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-bold text-slate-800">Attendance Log</h4>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
            <button
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                employeeDetailView === "table"
                  ? "bg-white text-slate-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setEmployeeDetailView("table")}
            >
              📋 Table
            </button>
            <button
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                employeeDetailView === "calendar"
                  ? "bg-white text-slate-800 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setEmployeeDetailView("calendar")}
            >
              📅 Calendar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {employeeDetailView === "table" && (
            <>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <DatePicker
                  selected={detailFromDate}
                  onChange={(d) => setDetailFromDate(d)}
                  placeholderText="From date"
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}
                  className="text-xs font-semibold text-slate-700 bg-transparent outline-none w-20 cursor-pointer"
                />
              </div>
              <span className="text-slate-500 text-xs">→</span>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <DatePicker
                  selected={detailToDate}
                  onChange={(d) => setDetailToDate(d)}
                  placeholderText="To date"
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}
                  className="text-xs font-semibold text-slate-700 bg-transparent outline-none w-20 cursor-pointer"
                />
              </div>
              <button
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                onClick={() =>
                  fetchEmployeeHistoryById(
                    selectedEmployeeId,
                    detailFromDate,
                    detailToDate
                  )
                }
              >
                Filter
              </button>
              {(detailFromDate || detailToDate) && (
                <button
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                  onClick={() => {
                    setDetailFromDate(null);
                    setDetailToDate(null);
                    fetchEmployeeHistoryById(selectedEmployeeId, null, null);
                  }}
                >
                  Clear
                </button>
              )}
            </>
          )}

          <button
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              const initialDate =
                joiningDateStr && today < joiningDateStr ? joiningDateStr : today;
              setPastAttendanceModal({
                date: initialDate,
                status: "Present",
                checkInTime: "10:00",
                checkOutTime: "19:00",
                checkOutNote: "",
                halfSalaryDeduct: false,
                isDateEditable: true,
              });
            }}
          >
            ➕ Add Past Attendance
          </button>
        </div>
      </div>

      {employeeDetailView === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr>
                {[
                  "Date",
                  "Status",
                  "Check In",
                  "Check Out",
                  "Work Time",
                  "Break",
                  "Half Day?",
                  "Checkout Note",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, idx) => {
                const isBeforeJoining = joiningDateStr && a.date < joiningDateStr;
                let workSec = a.totalWorkSeconds || 0;
                if (!workSec && a.checkInTime && a.checkOutTime) {
                  const diff = Math.floor(
                    (new Date(a.checkOutTime).getTime() -
                      new Date(a.checkInTime).getTime()) /
                      1000
                  );
                  workSec = Math.max(0, diff - (a.totalBreakSeconds || 0));
                }
                const isHalfDay =
                  a.halfSalaryDeduct || (workSec > 0 && workSec < 28800);
                const hasTimes = Boolean(a.checkInTime && a.checkOutTime);

                if (isBeforeJoining) {
                  return (
                    <tr
                      key={idx}
                      className="bg-slate-50/40 border-b border-slate-100 last:border-0 opacity-60"
                    >
                      <td className="px-3 py-1.5 text-sm font-semibold text-slate-500 whitespace-nowrap">
                        {a.date}
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-lg border bg-slate-100 text-slate-500 border-slate-200">
                          Pre-Joining (Joined{" "}
                          {emp.joiningDate ? formatDate(emp.joiningDate) : ""})
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                      <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                      <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                      <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                      <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                      <td className="px-3 py-1.5 text-slate-400 text-xs">—</td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-1.5 text-sm font-bold text-slate-700 whitespace-nowrap">
                      {a.date}
                    </td>
                    <td className="px-3 py-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-lg border ${sColor(
                          a.status
                        )}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {a.checkInTime ? (
                        formatTime(a.checkInTime)
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {a.checkOutTime ? (
                        formatTime(a.checkOutTime)
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <span
                        className={`text-xs font-bold ${
                          workSec > 0 && workSec < 28800
                            ? "text-amber-600 font-bold"
                            : "text-slate-700"
                        }`}
                      >
                        {fmtDur(workSec)}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-xs text-slate-500 font-semibold">
                      {fmtDur(a.totalBreakSeconds)}
                    </td>
                    <td className="px-3 py-1.5">
                      {hasTimes ||
                      ["Present", "Checked Out", "Active"].includes(a.status) ? (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isHalfDay
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {isHalfDay ? "Half Day (< 8h)" : "Full Day (8+ h)"}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 max-w-[180px]">
                      {a.checkOutNote ? (
                        <div className="flex items-center gap-1.5 justify-between">
                          <span
                            className="text-xs text-slate-700 truncate bg-amber-50 border border-amber-200/80 px-2 py-1 rounded-lg max-w-[110px]"
                            title={a.checkOutNote}
                          >
                            {a.checkOutNote}
                          </span>
                          <button
                            onClick={() =>
                              openTextModal("Checkout Note", a.checkOutNote)
                            }
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition shrink-0 cursor-pointer"
                            title="View full note"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="text-center py-10 text-slate-500 font-semibold text-sm">
                      No attendance records for this period.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        renderCalendarView()
      )}
    </div>
  );
}

export default EmployeeAttendanceTab;
