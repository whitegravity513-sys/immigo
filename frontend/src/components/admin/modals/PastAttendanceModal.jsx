export default function PastAttendanceModal({
  pastAttendanceModal,
  setPastAttendanceModal,
  employeeHistory,
  handleSavePastAttendance,
  loading,
}) {
  if (!pastAttendanceModal) return null;

  const empJoiningDateStr = employeeHistory?.employee?.joiningDate
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
        new Date(employeeHistory.employee.joiningDate)
      )
    : null;
  const isBeforeJoining =
    empJoiningDateStr &&
    pastAttendanceModal.date &&
    pastAttendanceModal.date < empJoiningDateStr;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => setPastAttendanceModal(null)}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-base font-black text-slate-800">
            Add/Update Past Attendance
          </h3>
          <button
            className="text-slate-500 text-xl cursor-pointer p-1"
            onClick={() => setPastAttendanceModal(null)}
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
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
            <input
              type="date"
              min={empJoiningDateStr || undefined}
              className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 ${
                isBeforeJoining ? "border-rose-400 bg-rose-50" : "border-slate-200"
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
                ⚠️ Attendance cannot be recorded before joining date ({empJoiningDateStr}).
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
            <div className="grid grid-cols-2 gap-3">
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

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer text-sm shadow-sm shadow-blue-500/20 transition-all"
              onClick={handleSavePastAttendance}
              disabled={loading}
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
