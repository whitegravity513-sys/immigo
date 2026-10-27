import React from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowRight, Check, X } from "lucide-react";

export default function HrLeaveRequestsList({ leaveRequests, onLeaveAction }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
      <div>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText size={18} className="text-purple-600" />
            <h2 className="text-sm font-bold text-gray-900">Leave Requests</h2>
          </div>
          <Link
            to="/admin/dashboard/leaves"
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Manage All
          </Link>
        </div>

        <div className="p-3 divide-y divide-gray-100">
          {leaveRequests.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">All leave applications reviewed.</p>
          ) : (
            leaveRequests.map((lv) => (
              <div key={lv.id} className="py-3.5 px-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate text-sm">{lv.employee}</p>
                  <p className="text-xs text-purple-700 font-semibold truncate mt-0.5">
                    {lv.leaveType} ({lv.from} - {lv.to})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onLeaveAction(lv.id, "Approved")}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
                    title="Approve"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onLeaveAction(lv.id, "Rejected")}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                    title="Reject"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-3 bg-gray-50/70 border-t border-gray-100">
        <Link
          to="/admin/dashboard/leaves"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-purple-700 hover:text-purple-900"
        >
          <span>Open Leave Approvals Desk</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
