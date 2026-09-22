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
                {["Dates", "Reason", "Document", "Status"].map((h) => (
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
                    {lv.startDate !== lv.endDate && (
                      <div className="text-slate-400 text-[10px]">
                        to {fmtDate(lv.endDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    {lv.reason}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {lv.document ? (
                      <button
                        onClick={() => setPreviewDoc(lv.document)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs underline cursor-pointer"
                      >
                        View File
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
