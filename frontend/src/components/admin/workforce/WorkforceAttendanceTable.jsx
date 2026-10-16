import React from "react";
import {
  Clock,
  Calendar,
  Search,
  Mail,
  User,
  Edit3,
  Eye,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";

export function WorkforceAttendanceTable({
  filteredAttendance,
  displayedAttendance,
  isFullRegisterPage,
  selectedDate,
  todayDate,
  handleDateChange,
  loadingDateAttendance,
  liveSearch,
  setLiveSearch,
  formattedSelectedDateDisplay,
  getAttendanceInfo,
  formatTime,
  setEditingAttendance,
  openEmployeeDetail,
  navigateTo,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Daily Attendance Tracker
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedDate === todayDate
                  ? "Live shift attendance for Today"
                  : `Showing attendance for ${formattedSelectedDateDisplay}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/90 rounded-xl p-1 text-xs flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg shadow-2xs border border-slate-200/80 shrink-0">
              <Calendar size={13} className="text-blue-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                max={todayDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer max-w-[125px]"
                title="Select date to inspect past attendance"
              />
            </div>

            {selectedDate !== todayDate && (
              <button
                type="button"
                onClick={() => handleDateChange(todayDate)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-extrabold bg-blue-600 text-white shadow-2xs hover:bg-blue-700 transition-all cursor-pointer shrink-0"
                title="Jump back to today's live shift"
              >
                <span>Go to Today</span>
              </button>
            )}

            {loadingDateAttendance && (
              <span className="text-[10px] text-slate-400 font-semibold px-1 animate-pulse">
                Loading...
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2.5 w-full xl:w-auto">
          <div className="relative w-full md:w-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={liveSearch}
              onChange={(e) => setLiveSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full md:w-36 lg:w-44 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {}
      <div className="block lg:hidden p-3 sm:p-4 space-y-3">
        {displayedAttendance.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Clock size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600">No attendance records found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting search or status filter.</p>
          </div>
        ) : (
          displayedAttendance.map((rep) => {
            const actualEmpId =
              rep.employeeId ||
              (typeof rep._id === "string" ? rep._id.replace(/^virtual-/, "") : rep._id);
            const safeName =
              typeof rep?.name === "string"
                ? rep.name
                : rep?.name?.first
                ? `${rep.name.first} ${rep.name.last}`
                : String(rep?.name || "Employee");

            const totalWorkSec = rep.totalWorkSeconds || 0;
            const hrs = Math.floor(totalWorkSec / 3600);
            const mins = Math.floor((totalWorkSec % 3600) / 60);
            const workDurStr = totalWorkSec > 0 ? `${hrs}h ${mins}m` : "—";
            const info = getAttendanceInfo(rep);

            return (
              <div
                key={`card-${rep.employeeId || rep._id || actualEmpId}`}
                className="p-3.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white shadow-2xs space-y-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {safeName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {safeName}
                        </h4>
                        <EmployeeIdBadge
                          id={rep.employeeCode || rep.employeeId}
                          size="xs"
                          onClick={() => openEmployeeDetail(rep._id || rep.employeeId || rep.id)}
                          title="Click to view employee profile details"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {rep.department || "Staff"} • {rep.designation || "Member"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider shrink-0 ${info.badgeClass}`}
                  >
                    {info.icon}
                    {info.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Check In</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatTime(rep.checkInTime) || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Check Out</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatTime(rep.checkOutTime) || (info.isPresent ? "In Shift" : "—")}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Breaks</span>
                    <span className={`font-mono ${rep.totalBreakSeconds > 3600 ? "text-rose-600 font-bold" : "text-slate-600"}`}>
                      {rep.totalBreakSeconds ? `${Math.floor(rep.totalBreakSeconds / 60)}m` : "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Net Work</span>
                    <span className="font-mono font-black text-blue-900">
                      {workDurStr}
                    </span>
                  </div>
                </div>

                {(rep.email || rep.personalEmail) && (
                  <div className="space-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    {rep.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700 font-medium">{rep.email}</span>
                      </div>
                    )}
                    {rep.personalEmail && (
                      <div className="flex items-center gap-1.5 truncate">
                        <User size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate text-slate-400">Personal: {rep.personalEmail}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAttendance({
                        ...rep,
                        date: selectedDate,
                      });
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-amber-200 shadow-2xs"
                  >
                    <Edit3 size={12} />
                    <span>Edit Time</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEmployeeDetail(actualEmpId)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                  >
                    <Eye size={12} />
                    <span>Profile</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <th className="px-4 py-3">Employee & Emails</th>
              <th className="px-3 py-3">Department & Role</th>
              <th className="px-3 py-3">Attendance Status</th>
              <th className="px-3 py-3">Check In</th>
              <th className="px-3 py-3">Check Out</th>
              <th className="px-3 py-3">Break Taken</th>
              <th className="px-3 py-3">Net Work Time</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {displayedAttendance.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-xs font-semibold">
                  No attendance records found for this date and filter.
                </td>
              </tr>
            ) : (
              displayedAttendance.map((rep) => {
                const actualEmpId =
                  rep.employeeId ||
                  (typeof rep._id === "string" ? rep._id.replace(/^virtual-/, "") : rep._id);
                const safeName =
                  typeof rep?.name === "string"
                    ? rep.name
                    : rep?.name?.first
                    ? `${rep.name.first} ${rep.name.last}`
                    : String(rep?.name || "Employee");

                const totalWorkSec = rep.totalWorkSeconds || 0;
                const hrs = Math.floor(totalWorkSec / 3600);
                const mins = Math.floor((totalWorkSec % 3600) / 60);
                const workDurStr = totalWorkSec > 0 ? `${hrs}h ${mins}m` : "—";
                const info = getAttendanceInfo(rep);

                return (
                  <tr
                    key={rep.employeeId || rep._id || actualEmpId}
                    className="hover:bg-blue-50/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {safeName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4
                              onClick={() => openEmployeeDetail(actualEmpId)}
                              className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer truncate"
                            >
                              {safeName}
                            </h4>
                            <EmployeeIdBadge
                              id={rep.employeeCode || rep.employeeId}
                              size="xs"
                              onClick={() => openEmployeeDetail(actualEmpId)}
                              title="Click to view employee profile details"
                            />
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {rep.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-800">{rep.department || "General"}</div>
                      <div className="text-[11px] text-slate-400">{rep.designation || "Staff"}</div>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${info.badgeClass}`}
                      >
                        {info.icon}
                        {info.label}
                      </span>
                    </td>

                    <td className="px-3 py-3 font-mono font-bold text-slate-700 text-xs">
                      {formatTime(rep.checkInTime)}
                    </td>

                    <td className="px-3 py-3 font-mono font-bold text-slate-700 text-xs">
                      {formatTime(rep.checkOutTime)}
                    </td>

                    <td className="px-3 py-3 font-mono text-slate-600 text-xs">
                      {rep.totalBreakSeconds ? (
                        <span className={rep.totalBreakSeconds > 3600 ? "text-rose-600 font-bold" : ""}>
                          {Math.floor(rep.totalBreakSeconds / 60)}m
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-3 py-3 font-mono font-bold text-blue-900 text-xs">
                      {workDurStr}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAttendance({
                              ...rep,
                              date: selectedDate,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-amber-200 shadow-2xs"
                          title="Edit / Adjust attendance time (Admin only)"
                        >
                          <Edit3 size={11} />
                          <span>Edit Time</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEmployeeDetail(actualEmpId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200/80"
                          title="View Profile"
                        >
                          <Eye size={11} />
                          <span>Profile</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isFullRegisterPage ? (
        <div className="p-3.5 sm:p-4 bg-slate-50/90 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium">
            Showing preview of <span className="font-bold text-slate-900">{Math.min(4, filteredAttendance.length)}</span> of{" "}
            <span className="font-bold text-slate-900">{filteredAttendance.length}</span> employees
          </div>
          <button
            type="button"
            onClick={() => navigateTo("attendance-all")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <span>See All Attendance ({filteredAttendance.length})</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium">
            Showing all <span className="font-bold text-slate-900">{filteredAttendance.length}</span> records for{" "}
            <span className="font-bold text-slate-900">{formattedSelectedDateDisplay}</span>
          </div>
          <button
            type="button"
            onClick={() => navigateTo("workforce")}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
}
