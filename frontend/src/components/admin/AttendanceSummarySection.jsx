import React from "react";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";

export default function AttendanceSummarySection({
  summaryMonth,
  summaryYear,
  setSummaryMonth,
  setSummaryYear,
  summaryLoading,
  summaryData = [],
  employees = [],
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight">Attendance Summary</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Monthly per-employee breakdown • Calculated strictly from Joining Date onwards, excluding Weekends (2nd & 4th Sat + Sunday) and Declared Holidays
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            value={summaryMonth}
            onChange={e => setSummaryMonth(Number(e.target.value))}
          >
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            value={summaryYear}
            onChange={e => setSummaryYear(Number(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold cursor-pointer transition-colors shadow-xs"
            onClick={fetchSummary}
          >
            {summaryLoading ? "Loading..." : "Apply"}
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto sm:table-fixed">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-3 py-2 w-[36%]">Employee</th>
                <th className="px-2 py-2 w-[16%] text-center">Full Day</th>
                <th className="px-2 py-2 w-[16%] text-center">Half Day</th>
                <th className="px-2 py-2 w-[16%] text-center">Absent</th>
                <th className="px-2 py-2 w-[16%] text-center">Leaves Taken</th>
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

                const matchedEmp = (employees || []).find(e =>
                  e._id === emp._id ||
                  e._id === empId ||
                  e.employeeId === (emp.employeeId || emp.employeeCode) ||
                  (e.email && emp.email && e.email === emp.email)
                );

                const safeName =
                  (typeof emp?.name === 'string' && emp.name.trim()) ? emp.name.trim() :
                  emp?.personalInfo?.fullName ||
                  (matchedEmp?.name ? (typeof matchedEmp.name === 'string' ? matchedEmp.name : `${matchedEmp.name?.first || ''} ${matchedEmp.name?.last || ''}`.trim()) : "") ||
                  matchedEmp?.personalInfo?.fullName ||
                  emp?.fullName ||
                  emp?.email?.split("@")[0] ||
                  "Employee";

                const empIdCode = emp.employeeId || emp.employeeCode || matchedEmp?.employeeId || "-";
                const designation = emp.designation || emp.employmentDetails?.designation || matchedEmp?.designation || matchedEmp?.role || "-";
                const department = emp.department || emp.employmentDetails?.department || matchedEmp?.department || "";

                return (
                  <tr key={empId} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left truncate max-w-[150px] sm:max-w-none"
                          onClick={() => openEmployeeDetail(empId, "summary")}
                          title="Click to view employee profile details"
                        >
                          {safeName}
                        </button>
                        <EmployeeIdBadge
                          id={empIdCode}
                          size="xs"
                          onClick={() => openEmployeeDetail(empId, "summary")}
                          title="Click to view employee profile details"
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                        {designation} {department ? `• ${department}` : ""}
                      </div>
                      {emp.status === "inactive" && (
                        <span className="text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md uppercase mt-0.5 inline-block">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center"><span className="text-xs font-bold text-emerald-600">{presentDays}</span></td>
                    <td className="px-3 py-2 text-center"><span className="text-xs font-bold text-amber-600">{halfDays}</span></td>
                    <td className="px-3 py-2 text-center"><span className={`text-xs font-bold ${absentDays > 0 ? "text-rose-600" : "text-slate-500"}`}>{absentDays}</span></td>
                    <td className="px-3 py-2 text-center"><span className="text-xs font-bold text-blue-600">{leaveDays}</span></td>
                  </tr>
                );
              })}
              {summaryData.length === 0 && !summaryLoading && (
                <tr>
                  <td colSpan="5">
                    <div className="text-center py-8 text-slate-500 font-semibold text-xs">Click "Apply" to load summary.</div>
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
