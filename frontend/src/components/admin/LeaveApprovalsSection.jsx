import React from "react";
import { Eye, AlertTriangle } from "lucide-react";

export default function LeaveApprovalsSection({
  leavesReport = [],
  openEmployeeDetail,
  formatDate,
  setPreviewDoc,
  openLeaveActionModal
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
      <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-800 tracking-tight">Leave Applications & Approval Portal</h3>
          <p className="text-xs text-slate-500">Review employee leave claims, balance deductions, and supporting proofs</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr>
              {["Employee & Balance", "Dates", "Requested Days", "Reason", "Document", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 sm:px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(leavesReport) ? leavesReport : []).map(leave => {
              if (!leave) return null;
              const days = leave.deductedDays ?? leave.totalDays ?? 1;
              const emp = typeof leave.employee === 'object' && leave.employee !== null ? leave.employee : null;
              const empId = emp ? (emp._id || emp.id) : (typeof leave.employee === 'string' ? leave.employee : null);
              const empName = emp
                ? (typeof emp.name === 'string' ? emp.name : (emp.name?.first ? `${emp.name.first} ${emp.name.last}` : "Employee"))
                : (typeof leave.employee === 'string' ? "Employee" : "Deleted Employee");
              const empCode = emp?.employeeId || (empId ? `ID: ${String(empId).slice(-4)}` : "Staff");
              const balance = emp?.leaveBalance ?? 0;
              const isInsufficient = leave.status === "Pending" && balance < days;

              return (
                <tr key={leave._id || Math.random()} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    {empId ? (
                      <div>
                        <button
                          className="font-bold text-blue-700 hover:underline cursor-pointer text-sm text-left block"
                          onClick={() => openEmployeeDetail(empId, "leaves")}
                        >
                          {empName}
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-500 font-medium">{empCode}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${balance <= 2 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            {balance}d balance
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-rose-600 font-semibold text-xs">{empName}</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-xs text-slate-700">
                    <div className="flex flex-col gap-0.5">
                      <div><strong className="text-slate-500">From:</strong> <span className="font-semibold">{formatDate(leave.startDate)}</span></div>
                      <div><strong className="text-slate-500">To:</strong> <span className="font-semibold">{formatDate(leave.endDate)}</span></div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-xs">
                    <span className="font-mono font-black text-slate-800 text-sm block">
                      {days} Day(s)
                    </span>
                    {isInsufficient && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-1 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        <AlertTriangle size={10} /> Low Balance
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={leave.reason}>
                    {leave.reason}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    {leave.document ? (
                      <button
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer w-fit transition"
                        onClick={() => setPreviewDoc(leave.document)}
                      >
                        <Eye size={12} /> View File
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None Attached</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-lg border w-fit ${leave.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : leave.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    {leave.status === "Pending" ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                          onClick={() => openLeaveActionModal(leave._id, "Approved", leave)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                          onClick={() => openLeaveActionModal(leave._id, "Rejected", leave)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Completed</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {leavesReport.length === 0 && (
              <tr>
                <td colSpan="7">
                  <div className="text-center py-12 text-slate-500 font-semibold text-sm">No leave applications submitted.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

