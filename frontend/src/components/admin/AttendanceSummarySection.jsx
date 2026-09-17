import React from "react";
import { Edit, Save } from "lucide-react";

export default function AttendanceSummarySection({
  summaryMonth,
  summaryYear,
  setSummaryMonth,
  setSummaryYear,
  summaryLoading,
  summaryData = [],
  fetchSummary,
  openEmployeeDetail,
  inlineLeaveEdit,
  setInlineLeaveEdit,
  inlineLeaveLoading,
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
                {["Employee", "Working Days (Post-DOJ)", "Full Day", "Half Day", "Absent", "Leaves Taken", "Leave Balance", "Next Month Leaves", "Set Leave"].map(h => (
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
                const leaveBal = emp.leaveBalance ?? 0;
                const nextLeaves = emp.nextMonthLeaves ?? 0;
                const autoEarned = emp.nextMonthLeaveEarned ?? nextLeaves;
                const isEditing = inlineLeaveEdit?.empId === empId;

                return (
                  <tr key={empId} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                    <td className="px-4 py-4">
                      <button className="text-sm font-bold text-green-700 hover:underline cursor-pointer text-left" onClick={() => openEmployeeDetail(empId, "summary")}>
                        {typeof emp?.name === 'string' ? emp.name : (emp?.name?.first ? `${emp.name.first} ${emp.name.last}` : String(emp?.name || ""))}
                      </button>
                      <div className="text-xs text-slate-500">{emp.employeeId || emp.employeeCode || "-"} • {emp.designation || "-"}</div>
                      {emp.status === "inactive" && <span className="text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md uppercase mt-0.5 inline-block">Deactivated</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-slate-800">{workingDays} Days</span>
                        {emp.joiningDate && emp.summary?.totalMonthWorkingDays && emp.summary.totalMonthWorkingDays !== workingDays ? (
                          <span
                            className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded mt-0.5"
                            title={`Joined: ${new Date(emp.joiningDate).toLocaleDateString("en-IN")}. Full month has ${emp.summary.totalMonthWorkingDays} working days.`}
                          >
                            DOJ: {new Date(emp.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} (Total: {emp.summary.totalMonthWorkingDays})
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-medium">
                            (Full Month)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center"><span className="text-sm font-black text-emerald-600">{presentDays}</span></td>
                    <td className="px-4 py-4 text-center"><span className="text-sm font-black text-amber-600">{halfDays}</span></td>
                    <td className="px-4 py-4 text-center"><span className={`text-sm font-black ${absentDays > 0 ? "text-rose-600" : "text-slate-500"}`}>{absentDays}</span></td>
                    <td className="px-4 py-4 text-center"><span className="text-sm font-bold text-blue-600">{leaveDays}</span></td>
                    <td className="px-4 py-4 text-center">
                      {isEditing
                        ? <input type="number" min="0" step="0.5" className="w-16 text-center bg-white border border-green-400 rounded-lg px-1 py-1 text-sm font-bold text-slate-800 focus:outline-none" value={inlineLeaveEdit.leaveBalance} onChange={e => setInlineLeaveEdit({ ...inlineLeaveEdit, leaveBalance: e.target.value })} autoFocus />
                        : <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 text-xs font-black rounded-lg border border-green-200">{leaveBal} days</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEditing
                        ? <input type="number" min="0" step="0.5" className="w-16 text-center bg-white border border-blue-400 rounded-lg px-1 py-1 text-sm font-bold text-slate-800 focus:outline-none" value={inlineLeaveEdit.nextMonthLeaves} onChange={e => setInlineLeaveEdit({ ...inlineLeaveEdit, nextMonthLeaves: e.target.value })} />
                        : <div className="flex flex-col items-center gap-0.5"><span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-lg border border-blue-200">{nextLeaves} days</span>{autoEarned !== nextLeaves && <span className="text-[9px] text-slate-500">Auto: {autoEarned}</span>}</div>}
                    </td>
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1" onClick={handleSetLeaveBalance} disabled={inlineLeaveLoading}><Save size={11} />{inlineLeaveLoading ? "..." : "Save"}</button>
                          <button className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer" onClick={() => setInlineLeaveEdit(null)}>✕</button>
                        </div>
                      ) : (
                        <button className="px-3 py-1.5 bg-slate-100 hover:bg-green-50 hover:text-green-700 text-slate-700 border border-slate-200 hover:border-green-200 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1" onClick={() => setInlineLeaveEdit({ empId, leaveBalance: leaveBal, nextMonthLeaves })}><Edit size={11} /> Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {summaryData.length === 0 && !summaryLoading && (
                <tr>
                  <td colSpan="9">
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
