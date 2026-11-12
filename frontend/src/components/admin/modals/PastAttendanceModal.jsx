import { useState } from "react";
import { Calendar, PartyPopper, X } from "lucide-react";
import DateInput from "../../common/DateInput.jsx";

export default function PastAttendanceModal({
  pastAttendanceModal,
  setPastAttendanceModal,
  employeeHistory,
  holidays = [],
  handleSavePastAttendance,
  loading,
}) {
  const [dismissedHolidayDate, setDismissedHolidayDate] = useState("");

  if (!pastAttendanceModal) return null;

  const empJoiningDateStr = employeeHistory?.employee?.joiningDate
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
        new Date(employeeHistory.employee.joiningDate)
      )
    : null;

  const targetDateStr = String(pastAttendanceModal.date || "").split("T")[0];
  const isBeforeJoining =
    empJoiningDateStr &&
    targetDateStr &&
    targetDateStr < empJoiningDateStr;

  const holidayOnDate = targetDateStr
    ? (holidays || []).find((h) => String(h?.date || "").split("T")[0] === targetDateStr)
    : null;
  const isHolidayBlocked = Boolean(holidayOnDate);
  const showHolidayPopup = isHolidayBlocked && dismissedHolidayDate !== targetDateStr;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={() => setPastAttendanceModal(null)}
    >
      <div
        className="relative bg-white w-full max-w-md h-[100dvh] border-l border-slate-200 shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {showHolidayPopup && (
          <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-sm h-[100dvh] border-l border-indigo-200 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <PartyPopper size={18} className="text-amber-200" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100 block">
                      Official Holiday
                    </span>
                    <h4 className="text-sm font-bold leading-tight">Today is an Official Holiday</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedHolidayDate(targetDateStr)}
                  className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-xs font-bold text-indigo-700">{targetDateStr}</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {holidayOnDate?.title || "Company Holiday"}
                  </div>
                </div>
                <p className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
                  {targetDateStr} has been declared an official holiday. Attendance cannot be marked for this date.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDismissedHolidayDate(targetDateStr)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Okay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPastAttendanceModal(null)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50">
          <h3 className="text-base font-bold text-slate-800">
            Add/Update Past Attendance
          </h3>
          <button
            className="text-slate-500 text-xl cursor-pointer p-1"
            onClick={() => setPastAttendanceModal(null)}
          >
            ×
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {isHolidayBlocked && (
            <div className="flex items-start gap-2.5 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
              <Calendar size={16} className="text-indigo-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-indigo-900">
                  Official Holiday: {holidayOnDate?.title || "Holiday"}
                </div>
                <div className="text-[11px] text-indigo-800 font-medium mt-0.5">
                  Today ({targetDateStr}) is a declared official holiday — attendance cannot be marked for this date.
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date
              </label>
              {empJoiningDateStr && (
                <span className="text-[10px] font-bold text-slate-400">
                  Joined: {empJoiningDateStr}
                </span>
              )}
            </div>
            <DateInput
              min={empJoiningDateStr || undefined}
              className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 ${
                isBeforeJoining || isHolidayBlocked ? "border-rose-400 bg-rose-50" : "border-slate-200"
              }`}
              value={pastAttendanceModal.date || ""}
              onChange={(e) =>
                setPastAttendanceModal({
                  ...pastAttendanceModal,
                  date: e.target.value,
                })
              }
            />
            {isBeforeJoining && (
              <p className="text-xs font-bold text-rose-600 mt-0.5">
                Attendance cannot be recorded before joining date ({empJoiningDateStr}).
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              value={pastAttendanceModal.status || "Present"}
              onChange={(e) =>
                setPastAttendanceModal({
                  ...pastAttendanceModal,
                  status: e.target.value,
                })
              }
            >
              <option value="Present">Present (Full Day)</option>
              <option value="Half Day">Half Day (Half Salary Deduct)</option>
              <option value="Absent">Absent</option>
              <option value="Leave">On Leave</option>
            </select>
          </div>

          {(pastAttendanceModal.status === "Present" ||
            pastAttendanceModal.status === "Half Day") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Check-in Time
                </label>
                <input
                  type="time"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800"
                  value={pastAttendanceModal.checkInTime || ""}
                  onChange={(e) =>
                    setPastAttendanceModal({
                      ...pastAttendanceModal,
                      checkInTime: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Check-out Time
                </label>
                <input
                  type="time"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800"
                  value={pastAttendanceModal.checkOutTime || ""}
                  onChange={(e) =>
                    setPastAttendanceModal({
                      ...pastAttendanceModal,
                      checkOutTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Note / Remark
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800"
              placeholder="Optional remark"
              value={pastAttendanceModal.checkOutNote || ""}
              onChange={(e) =>
                setPastAttendanceModal({
                  ...pastAttendanceModal,
                  checkOutNote: e.target.value,
                })
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl cursor-pointer text-sm shadow-sm shadow-blue-500/20 transition-all"
              onClick={handleSavePastAttendance}
              disabled={loading || isBeforeJoining || isHolidayBlocked}
            >
              Save Record
            </button>
            <button
              type="button"
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer text-sm"
              onClick={() => setPastAttendanceModal(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
