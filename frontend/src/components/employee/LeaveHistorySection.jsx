import React from "react";
import { Award, Eye } from "lucide-react";

export default function LeaveHistorySection({
  leaveBalance,
  leaveHistory,
  fmtDate,
  setPreviewDoc,
}) {
  return (
    <div className="space-y-6">


      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-800">Leave Request History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr>
                {["Dates", "Reason", "Document", "Status & Remark"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaveHistory.map((lv) => (
                <tr
                  key={lv._id}
                  className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0"
                >
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                    <div>{fmtDate(lv.startDate)}</div>
                    <div className="text-slate-400">to {fmtDate(lv.endDate)}</div>
                    {lv.totalDays && (
                      <div className="text-[10px] text-blue-600 font-bold">
                        {lv.totalDays} day{lv.totalDays > 1 ? "s" : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 max-w-[200px]">
                    <span className="leading-snug">{lv.reason}</span>
                    {lv.leaveType && (
                      <span className="mt-1 inline-block text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-md">
                        {lv.leaveType}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lv.document ? (
                      <button
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        onClick={() => setPreviewDoc(lv.document)}
                      >
                        <Eye size={12} /> View
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-lg border w-fit ${
                        lv.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : lv.status === "Rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {lv.status}
                    </span>
                    {lv.adminRemark && (
                      <div
                        className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border mt-1.5 ${
                          lv.status === "Rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-slate-50 text-slate-600 border-slate-100"
                        }`}
                      >
                        <span className="font-bold uppercase text-[9px] tracking-wider block mb-0.5">
                          Admin Remark:
                        </span>
                        {lv.adminRemark}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {leaveHistory.length === 0 && (
                <tr>
                  <td colSpan="4">
                    <div className="text-center py-12 text-slate-400 font-semibold text-sm">
                      No leave requests submitted yet.
                    </div>
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
