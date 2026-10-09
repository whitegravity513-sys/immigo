import React, { useState } from "react";
import { Eye, Check, X, AlertCircle } from "lucide-react";

export default function LeaveApprovalsSection({
  leavesReport = [],
  openEmployeeDetail,
  formatDate,
  setPreviewDoc,
  handleDirectLeaveAction,
}) {
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectRemark, setRejectRemark] = useState("");
  const [submittingId, setSubmittingId] = useState(null);

  const handleApprove = async (leaveId) => {
    if (!handleDirectLeaveAction) return;
    setSubmittingId(leaveId);
    try {
      await handleDirectLeaveAction(leaveId, "Approved", "Approved by Admin");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleConfirmReject = async (leaveId) => {
    if (!handleDirectLeaveAction) return;
    setSubmittingId(leaveId);
    try {
      const remark = rejectRemark.trim() || "Rejected by Admin";
      await handleDirectLeaveAction(leaveId, "Rejected", remark);
      setRejectingId(null);
      setRejectRemark("");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
      <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-800 tracking-tight">Leave Applications & Approval Portal</h3>
          <p className="text-xs text-slate-500">Review employee leave claims and approve or reject inline directly (No popups)</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr>
              {["Employee", "Dates", "Requested Days", "Reason", "Document", "Status", "Actions"].map(h => (
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

              const isRejectingThis = rejectingId === leave._id;
              const isSubmittingThis = submittingId === leave._id;

              return (
                <tr key={leave._id || Math.random()} className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0">
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    {empId ? (
                      <div>
                        <button
                          className="font-bold text-blue-700 hover:underline cursor-pointer text-sm text-left block"
                          onClick={() => openEmployeeDetail && openEmployeeDetail(empId, "leaves")}
                        >
                          {empName}
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-500 font-medium">{empCode}</span>
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
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={leave.reason}>
                    {leave.reason}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    {leave.document ? (
                      <button
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer w-fit transition"
                        onClick={() => setPreviewDoc && setPreviewDoc(leave.document)}
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
                    {leave.adminRemark && (
                      <div className="text-[11px] text-slate-600 font-medium mt-1 max-w-[220px]" title={leave.adminRemark}>
                        <strong className="text-slate-800 font-bold">Remark:</strong> {leave.adminRemark}
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    {isRejectingThis ? (
                      <div className="flex flex-col gap-2 p-2.5 bg-rose-50/90 border border-rose-200 rounded-xl min-w-[250px] animate-in fade-in duration-150">
                        <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                          <AlertCircle size={13} /> Rejection Remark:
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. Incomplete proof / Not permitted"
                          value={rejectRemark}
                          onChange={(e) => setRejectRemark(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleConfirmReject(leave._id);
                            if (e.key === "Escape") { setRejectingId(null); setRejectRemark(""); }
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isSubmittingThis}
                            onClick={() => handleConfirmReject(leave._id)}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            {isSubmittingThis ? "Rejecting..." : "Confirm Reject"}
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingThis}
                            onClick={() => { setRejectingId(null); setRejectRemark(""); }}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {leave.status === "Pending" ? (
                          <>
                            <button
                              type="button"
                              disabled={isSubmittingThis}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1 active:scale-95 disabled:opacity-50"
                              onClick={() => handleApprove(leave._id)}
                            >
                              <Check size={13} />
                              <span>{isSubmittingThis ? "Approving..." : "Approve"}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingThis}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs flex items-center gap-1 active:scale-95 disabled:opacity-50"
                              onClick={() => { setRejectingId(leave._id); setRejectRemark(""); }}
                            >
                              <X size={13} />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : leave.status === "Approved" ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-emerald-700 font-bold">✓ Approved</span>
                            <button
                              type="button"
                              disabled={isSubmittingThis}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg text-xs font-bold cursor-pointer transition border border-slate-200"
                              onClick={() => { setRejectingId(leave._id); setRejectRemark(""); }}
                              title="Switch decision to Rejected"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-rose-700 font-bold">✕ Rejected</span>
                            <button
                              type="button"
                              disabled={isSubmittingThis}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg text-xs font-bold cursor-pointer transition border border-slate-200 flex items-center gap-1"
                              onClick={() => handleApprove(leave._id)}
                              title="Switch decision to Approved"
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                          </div>
                        )}
                      </div>
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
