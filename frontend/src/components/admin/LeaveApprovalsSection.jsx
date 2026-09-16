import React from "react";
import { Eye } from "lucide-react";

export default function LeaveApprovalsSection({
  leavesReport = [],
  openEmployeeDetail,
  formatDate,
  setPreviewDoc,
  openLeaveActionModal
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
      <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
        <h3 className="text-base font-black text-slate-800 tracking-tight">Leave Applications</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr>
              {["Employee", "Dates", "Days", "Reason", "Supporting Document", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 sm:px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leavesReport.map(leave => (
              <tr key={leave._id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                <td className="px-4 sm:px-6 py-4 text-sm">
                  {leave.employee ? (
                    <div>
                      <button className="font-bold text-green-700 hover:underline cursor-pointer text-sm text-left" onClick={() => openEmployeeDetail(leave.employee._id, "leaves")}>
                        {leave.employee.name}
                      </button>
                      <div className="text-xs text-slate-500 mt-0.5">{leave.employee.employeeId}</div>
                    </div>
                  ) : (
                    <span className="text-rose-600 font-semibold text-xs">Deleted Employee</span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 text-xs text-slate-700">
                  <div className="flex flex-col gap-1">
                    <div><strong className="text-blue-600">Start:</strong> {formatDate(leave.startDate)}</div>
                    <div><strong className="text-blue-600">End:</strong> {formatDate(leave.endDate)}</div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 text-xs">
                  {(() => {
                    const days = leave.deductedDays ?? leave.totalDays ?? 1;
                    return (
                      <span className="font-mono font-bold text-slate-700 text-sm">
                        {days} Day(s)
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate" title={leave.reason}>
                  {leave.reason}
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm">
                  {leave.document
                    ? <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer w-fit" onClick={() => setPreviewDoc(leave.document)}>
                      <Eye size={12} /> View File
                    </button>
                    : <span className="text-xs text-slate-500 italic">None Attached</span>}
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-lg border w-fit ${leave.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : leave.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    {leave.status}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-4 text-sm">
                  {leave.status === "Pending" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer" onClick={() => openLeaveActionModal(leave._id, "Approved", leave)}>
                        ✓ Approve
                      </button>
                      <button className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer" onClick={() => openLeaveActionModal(leave._id, "Rejected", leave)}>
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
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
