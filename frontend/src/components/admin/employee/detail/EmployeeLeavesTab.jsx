
import React from "react";

export function EmployeeLeavesTab({
  emp,
  leaves = [],
  formatDate,
  openTextModal,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">
            Leave History{" "}
            <span className="text-slate-500 font-semibold text-xs">
              ({leaves.length} applications)
            </span>
          </h4>
          <p className="text-xs text-slate-400">
            Current leave balance:{" "}
            <strong className="text-blue-600">
              {emp?.leaveBalance || 0} days remaining
            </strong>
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr>
              {[
                "Type",
                "Start",
                "End",
                "Days",
                "Reason",
                "Status",
                "Admin Remark",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaves.map((l) => (
              <tr
                key={l._id}
                className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-0"
              >
                <td className="px-3 py-1.5">
                  <span className="text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-lg">
                    {l.leaveType || "Casual"}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-sm text-slate-700 font-semibold whitespace-nowrap">
                  {formatDate(l.startDate)}
                </td>
                <td className="px-3 py-1.5 text-sm text-slate-700 font-semibold whitespace-nowrap">
                  {formatDate(l.endDate)}
                </td>
                <td className="px-3 py-1.5 text-sm font-bold text-slate-800 text-center">
                  {l.totalDays}
                </td>
                <td className="px-3 py-1.5 text-sm text-slate-600 max-w-[200px]">
                  <span
                    className="line-clamp-2 cursor-pointer text-green-700 hover:underline"
                    onClick={() => openTextModal("Leave Reason", l.reason)}
                  >
                    {l.reason}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-lg border ${l.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : l.status === "Rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-xs max-w-[160px]">
                  {l.adminRemark ? (
                    <span
                      className={`block px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${l.status === "Rejected"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-50 text-slate-600"
                        }`}
                      onClick={() => openTextModal("Admin Remark", l.adminRemark)}
                    >
                      {l.adminRemark}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan="7">
                  <div className="text-center py-10 text-slate-500 font-semibold text-sm">
                    No leave applications found.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeLeavesTab;
