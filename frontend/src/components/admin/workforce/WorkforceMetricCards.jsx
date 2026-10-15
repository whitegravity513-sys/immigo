import React from "react";
import { Users, UserCheck, Calendar, AlertCircle } from "lucide-react";

export function WorkforceMetricCards({
  totalEmployeesCount,
  presentCount,
  onLeaveCount,
  absentCount,
  selectedDate,
  todayDate,
  openMetricListModal,
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        onClick={() => openMetricListModal("total")}
        className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-md hover:border-blue-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
        title="Click to view all registered staff"
      >
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="group-hover:text-blue-600 transition-colors">Total Staff</span>
          <Users size={15} className="text-blue-600 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
          {totalEmployeesCount}
        </div>
        <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center justify-between">
          <span>Registered employees</span>
          <span className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            View list →
          </span>
        </div>
      </div>

      <div
        onClick={() => openMetricListModal("present")}
        className="bg-white rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-3.5 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
        title="Click to view present employees"
      >
        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
          <span>{selectedDate === todayDate ? "Present Today" : "Present on Date"}</span>
          <UserCheck size={15} className="text-emerald-600 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
          {presentCount}
        </div>
        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center justify-between">
          <span>Checked in & attended</span>
          <span className="text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            View list →
          </span>
        </div>
      </div>

      <div
        onClick={() => openMetricListModal("leave")}
        className="bg-white rounded-xl border border-purple-200/80 bg-purple-50/20 p-3.5 shadow-2xs hover:shadow-md hover:border-purple-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
        title="Click to view employees on leave"
      >
        <div className="flex items-center justify-between text-[10px] font-bold text-purple-600 uppercase tracking-wider">
          <span>On Leave</span>
          <Calendar size={15} className="text-purple-600 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-purple-900 mt-1">
          {onLeaveCount}
        </div>
        <div className="text-[10px] text-purple-700 font-semibold mt-0.5 flex items-center justify-between">
          <span>Approved leaves for date</span>
          <span className="text-purple-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            View list →
          </span>
        </div>
      </div>

      <div
        onClick={() => openMetricListModal("absent")}
        className="bg-white rounded-xl border border-rose-200/80 bg-rose-50/20 p-3.5 shadow-2xs hover:shadow-md hover:border-rose-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
        title="Click to view absent employees"
      >
        <div className="flex items-center justify-between text-[10px] font-bold text-rose-600 uppercase tracking-wider">
          <span>Absent</span>
          <AlertCircle size={15} className="text-rose-600 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-rose-900 mt-1">
          {absentCount}
        </div>
        <div className="text-[10px] text-rose-700 font-semibold mt-0.5 flex items-center justify-between">
          <span>Did not attend</span>
          <span className="text-rose-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            View list →
          </span>
        </div>
      </div>
    </div>
  );
}
