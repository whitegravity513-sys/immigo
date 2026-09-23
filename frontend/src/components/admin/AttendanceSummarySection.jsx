

export default function AttendanceSummarySection({
  summaryMonth,
  summaryYear,
  setSummaryMonth,
  setSummaryYear,
  summaryLoading,
  summaryData = [],
  fetchSummary,
  openEmployeeDetail,
  // eslint-disable-next-line no-unused-vars
  inlineLeaveEdit,
  // eslint-disable-next-line no-unused-vars
  setInlineLeaveEdit,
  // eslint-disable-next-line no-unused-vars
  inlineLeaveLoading,
  // eslint-disable-next-line no-unused-vars
  handleSetLeaveBalance
}) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Attendance Summary</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monthly per-employee breakdown • Calculated strictly from Joining Date onwards, excluding Weekends (2nd & 4th Sat + Sunday) and Declared Holidays
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
            value={summaryMonth}
            onChange={e => setSummaryMonth(Number(e.target.value))}
          >
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
            value={summaryYear}
            onChange={e => setSummaryYear(Number(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            onClick={fetchSummary}
          >
            {summaryLoading ? "Loading..." : "Apply"}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr>
                {["Employee", "Full Day", "Half Day", "Absent", "Leaves Taken"].map(h => (
                  <th key={h} className="px-4 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryData.map(emp => {
                const empId = emp._id || emp.employeeId || emp.id;
                const workingDays = emp.summary?.applicableWorkingDays ?? emp.applicableWorkingDays ?? 0;
                const presentDays = emp.summary?.presentDays ?? emp.totalPresent ?? 0;
                const halfDays = emp.summary?.halfDays ?? 0;
                const absentDays = emp.summary?.absentDays ?? 0;
                const leaveDays = emp.summary?.leaveDays ?? emp.totalLeaves ?? 0;

                return (
                  <tr key={empId} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                    <td className="px-4 py-4">
                      <button className="text-sm font-bold text-green-700 hover:underline cursor-pointer text-left" onClick={() => openEmployeeDetail(empId, "summary")}>
                        {typeof emp?.name === 'string' ? emp.name : (emp?.name?.first ? `${emp.name.first} ${emp.name.last}` : String(emp?.name || ""))}
                      </button>
                      <div className="text-xs text-slate-500">{emp.employeeId || emp.employeeCode || "-"} • {emp.designation || "-"}</div>
                      {emp.status === "inactive" && <span className="text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md uppercase mt-0.5 inline-block">Deactivated</span>}
                    </td>
                    <td className="px-4 py-4 text-center"><span className="text-sm font-black text-emerald-600">{presentDays}</span></td>
                    <td className="px-4 py-4 text-center"><span className="text-sm font-black text-amber-600">{halfDays}</span></td>
                    <td className="px-4 py-4 text-center"><span className={`text-sm font-black ${absentDays > 0 ? "text-rose-600" : "text-slate-500"}`}>{absentDays}</span></td>
                    <td className="px-4 py-4 text-center"><span className="text-sm font-bold text-blue-600">{leaveDays}</span></td>
                  </tr>
                );
              })}
              {summaryData.length === 0 && !summaryLoading && (
                <tr>
                  <td colSpan="5">
                    <div className="text-center py-12 text-slate-500 font-semibold text-sm">Click "Apply" to load summary.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
