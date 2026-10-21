import React from "react";
import { Calendar, CheckCircle2, Eye, Check, X } from "lucide-react";
import { EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";

export function WorkforceLeavesPanel({
  pendingLeaves,
  openEmployeeDetail,
  openLeaveAction,
  navigateTo,
  formatDate,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-rose-50/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Calendar size={15} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Leave Applications
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold">
                {pendingLeaves.length} Pending
              </span>
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">
              Review and approve or reject employee leave requests
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateTo("leaves")}
          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
        >
          View all →
        </button>
      </div>

      <div className="p-3 sm:p-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {pendingLeaves.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400 opacity-80" />
            <p className="font-bold text-slate-600">All leave requests are up to date!</p>
            <p className="text-[10px] text-slate-400 mt-0.5">No pending leaves awaiting approval.</p>
          </div>
        ) : (
          pendingLeaves.map((leave) => {
            const emp = leave.employeeId || leave.employee || {};
            return (
              <div
                key={leave._id || leave.id}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs space-y-2.5 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${emp.profileImage ? "bg-white" : "bg-blue-50 border border-blue-200 text-blue-600"} text-xs font-black flex items-center justify-center shrink-0 shadow-2xs overflow-hidden`}>
                      {emp.profileImage ? (
                        <img
                          src={emp.profileImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (emp.name || "E")[0].toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {emp.name || "Employee"}
                        </span>
                        <EmployeeIdBadge
                          id={emp.employeeId}
                          size="xs"
                          onClick={() => openEmployeeDetail(emp._id || emp.id)}
                          title="Click to view employee profile details"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium truncate block">
                        {emp.department || "Staff"} • {emp.designation || "Employee"}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    {leave.leaveType || "Casual Leave"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar size={12} className="text-slate-400" />
                    <span>
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                    </span>
                  </div>
                  <span className="font-black text-blue-700 text-xs">
                    {leave.totalDays} Day{leave.totalDays > 1 ? "s" : ""}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/40 p-2 rounded-lg border border-slate-100/80">
                  <strong className="text-slate-500 font-semibold block text-[10px] uppercase">Reason:</strong>
                  {leave.reason}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEmployeeDetail(emp._id || emp.id)}
                    className="text-[11px] text-slate-500 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={12} /> Profile
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openLeaveAction(leave._id || leave.id, "Rejected", leave)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <X size={12} /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => openLeaveAction(leave._id || leave.id, "Approved", leave)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Check size={12} /> Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
