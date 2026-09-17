import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Users, UserCheck, Coffee, ShieldCheck, Play, MapPin, Eye, Pencil } from "lucide-react";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";

const StatCard = ({ icon, color, val, label }) => (
  <div className="bg-white p-3.5 sm:p-4 rounded-xl border-2 border-slate-300 shadow-xs flex items-center gap-3">
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
    <div className="flex flex-col min-w-0">
      <span className="text-lg sm:text-xl font-black text-slate-900 leading-none mb-0.5">{val}</span>
      <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{label}</span>
    </div>
  </div>
);

function ActiveBreakRow({ rep, formatTime }) {
  const activeBreak = rep.breaks?.find(b => !b.endTime);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeBreak) return;
    const start = new Date(activeBreak.startTime).getTime();
    setElapsed(Math.floor((Date.now() - start) / 1000));
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [activeBreak]);

  const fmtMS = s => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
  };

  const isLunch = activeBreak?.type === "Lunch";
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-xl border ${isLunch ? "bg-amber-50/90 border-amber-300" : "bg-cyan-50/90 border-cyan-300"}`}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <strong className="text-slate-900 text-xs font-bold truncate">{typeof rep?.name === 'string' ? rep.name : (rep?.name?.first ? `${rep.name.first} ${rep.name.last}` : String(rep?.name || ""))}</strong>
          <EmployeeIdBadge id={rep.employeeId} size="xs" />
        </div>
        <span className="text-[10px] text-slate-500 truncate">{rep.designation || "Employee"}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${isLunch ? "bg-amber-200 text-amber-900" : "bg-cyan-200 text-cyan-900"}`}>
          {activeBreak?.type || "Short"} Break
        </span>
        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg border border-slate-300 bg-white shadow-2xs tabular-nums text-slate-900">
          {fmtMS(elapsed)}
        </span>
      </div>
    </div>
  );
}

export default function LiveAttendanceSection({
  attendanceReport = [],
  filterStart,
  filterEnd,
  setFilterStart,
  setFilterEnd,
  fetchAdminReports,
  openEmployeeDetail,
  formatTime,
  formatDuration,
  setEditingAttendance,
  currentPath = "/admin/dashboard/live"
}) {
  return (
    <div className="space-y-5">
      {/* ── Top Stat Cards (Compact & Defined) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} />} color="bg-blue-50 text-blue-600" val={attendanceReport.length} label="Total Workforce" />
        <StatCard icon={<UserCheck size={18} />} color="bg-emerald-50 text-emerald-600" val={attendanceReport.filter(r => r.status === "Active" || r.status === "On Break").length} label="Active Now" />
        <StatCard icon={<Coffee size={18} />} color="bg-amber-50 text-amber-600" val={attendanceReport.filter(r => r.status === "On Break").length} label="On Break" />
        <StatCard icon={<ShieldCheck size={18} />} color="bg-rose-50 text-rose-600" val={attendanceReport.filter(r => r.status === "Absent").length} label="Absent Today" />
      </div>

      {/* ── Active Break Tracker (Compact) ── */}
      {attendanceReport.filter(r => r.status === "On Break").length > 0 && (
        <div className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-xs">
          <h4 className="flex items-center gap-1.5 text-amber-800 font-black text-xs mb-3 uppercase tracking-wider">
            <Coffee size={14} className="text-amber-700" /> Live Break Tracker (Real-time)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {attendanceReport.filter(r => r.status === "On Break").map(rep => (
              <ActiveBreakRow key={rep.employeeId} rep={rep} formatTime={formatTime} />
            ))}
          </div>
        </div>
      )}

      {/* ── Shift Activity Table (Compact, Space-Efficient Rows with Darker Borders) ── */}
      <div className="bg-white rounded-xl border-2 border-slate-300 shadow-xs overflow-hidden">
        {/* Table Filter / Control Bar */}
        <div className="px-4 py-3 border-b border-slate-300 bg-slate-50/70 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Shift Activity Log</h3>
            {(filterStart || filterEnd)
              ? <span className="text-[11px] text-blue-600 font-semibold">{filterStart ? filterStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '...'} → {filterEnd ? filterEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '...'}</span>
              : <span className="text-[11px] text-slate-500 font-medium">Showing today's real-time live attendance</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <DatePicker selected={filterStart} onChange={d => setFilterStart(d)} selectsStart startDate={filterStart} endDate={filterEnd} placeholderText="From" dateFormat="dd/MM/yyyy" className="text-xs font-semibold text-slate-700 bg-transparent outline-none w-18 cursor-pointer" maxDate={new Date()} />
              <span className="text-slate-400 font-bold text-xs">—</span>
              <DatePicker selected={filterEnd} onChange={d => setFilterEnd(d)} selectsEnd startDate={filterStart} endDate={filterEnd} minDate={filterStart} placeholderText="To" dateFormat="dd/MM/yyyy" className="text-xs font-semibold text-slate-700 bg-transparent outline-none w-18 cursor-pointer" maxDate={new Date()} />
            </div>
            {(filterStart || filterEnd) && (
              <button className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border border-rose-200" onClick={() => { setFilterStart(null); setFilterEnd(null); setTimeout(fetchAdminReports, 50); }}>✕ Clear</button>
            )}
            <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20" onClick={fetchAdminReports}>
              <Play size={11} className="rotate-90" /> {filterStart && filterEnd ? 'Apply' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Compact Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-300">
                {["Employee", "Check-In", "Check-Out", "Note", "Lunch", "Break", "Total Break", "Net Work", "Status", ""].map((h, i) => (
                  <th key={i} className="px-3 py-2 text-slate-600 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attendanceReport.map(rep => (
                <tr key={rep.employeeId} className="hover:bg-blue-50/40 transition-colors">
                  {/* Employee Info: Compact 2 lines */}
                  <td className="px-3 py-2 text-xs whitespace-nowrap">
                    {(() => {
                      const actualEmpId = rep.employeeId || (typeof rep._id === 'string' ? rep._id.replace(/^virtual-/, '') : rep._id);
                      return (
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 font-bold text-xs">{typeof rep?.name === 'string' ? rep.name : (rep?.name?.first ? `${rep.name.first} ${rep.name.last}` : String(rep?.name || ""))}</strong>
                          <EmployeeIdBadge id={rep.employeeCode || rep.employeeId} size="xs" />
                          <button onClick={() => openEmployeeDetail(actualEmpId, currentPath)} className="text-blue-600 hover:text-blue-800 transition cursor-pointer p-0.5" title="View profile">
                            <Eye size={13} />
                          </button>
                        </div>
                      );
                    })()}
                    <div className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                      {rep.designation || "Employee"}
                    </div>
                  </td>

                  {/* Check-In: Time + Tiny Map Link */}
                  <td className="px-3 py-2 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-800 tabular-nums text-xs">
                        {formatTime(rep.checkInTime)}
                      </span>
                      {rep.checkInTime && rep.checkInLocation && (rep.checkInLocation.latitude || rep.checkInLocation.longitude) && (
                        <a
                          href={`https://www.google.com/maps?q=${rep.checkInLocation.latitude},${rep.checkInLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-0.5"
                          title={`Location: ${rep.checkInLocation?.address || "View on Map"}`}
                        >
                          <MapPin size={11} />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Check-Out: Time + Tiny Map Link */}
                  <td className="px-3 py-2 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-800 tabular-nums text-xs">
                        {formatTime(rep.checkOutTime)}
                      </span>
                      {rep.checkOutTime && rep.checkOutLocation && (rep.checkOutLocation.latitude || rep.checkOutLocation.longitude) && (
                        <a
                          href={`https://www.google.com/maps?q=${rep.checkOutLocation.latitude},${rep.checkOutLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-0.5"
                          title={`Location: ${rep.checkOutLocation?.address || "View on Map"}`}
                        >
                          <MapPin size={11} />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Check-Out Note: Compact Truncated */}
                  <td className="px-3 py-2 text-xs max-w-[130px]">
                    {rep.checkOutNote ? (
                      <span className="truncate block text-[11px] font-medium text-slate-700 bg-amber-50/70 border border-amber-200 px-1.5 py-0.5 rounded" title={rep.checkOutNote}>
                        {rep.checkOutNote}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Lunch Break */}
                  <td className="px-3 py-2 text-xs font-extrabold text-amber-700 tabular-nums whitespace-nowrap">
                    {formatDuration(rep.lunchBreakSeconds)}
                  </td>

                  {/* Short Break */}
                  <td className="px-3 py-2 text-xs font-extrabold text-cyan-700 tabular-nums whitespace-nowrap">
                    {formatDuration(rep.otherBreakSeconds)}
                  </td>

                  {/* Total Break */}
                  <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap">
                    <span className={`font-extrabold ${(rep.lunchBreakSeconds + rep.otherBreakSeconds) > 3600 ? "text-rose-600 font-black" : "text-slate-800"}`}>
                      {formatDuration(rep.lunchBreakSeconds + rep.otherBreakSeconds)}
                    </span>
                    {(rep.lunchBreakSeconds + rep.otherBreakSeconds) > 3600 && (
                      <span className="ml-1 text-[9px] font-black bg-rose-100 text-rose-800 px-1 py-0.2 rounded uppercase">Over 1h</span>
                    )}
                  </td>

                  {/* Net Work Duration */}
                  <td className="px-3 py-2 text-xs font-black text-slate-900 tabular-nums whitespace-nowrap">
                    {formatDuration(rep.totalWorkSeconds || 0)}
                  </td>

                  {/* Status & Compliance Badge */}
                  <td className="px-3 py-2 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black rounded-md border ${
                        rep.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : rep.status === "On Break"
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : rep.status === "Checked Out"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-rose-50 text-rose-700 border-rose-300"
                      }`}>
                        {rep.status}
                      </span>
                      {rep.status === "Checked Out" && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          rep.halfSalaryDeduct
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {rep.halfSalaryDeduct ? "Half Day" : "Full Day"}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Edit Action Button */}
                  <td className="px-2 py-2 text-xs text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        const actualEmpId = rep.employeeId || (typeof rep._id === 'string' ? rep._id.replace(/^virtual-/, '') : rep._id);
                        setEditingAttendance({
                          employeeId: actualEmpId,
                          date: rep.date || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()),
                          checkInTime: rep.checkInTime,
                          checkOutTime: rep.checkOutTime,
                          name: rep.name,
                          status: rep.status,
                          halfSalaryDeduct: rep.halfSalaryDeduct,
                          isPenaltyAbsent: rep.isPenaltyAbsent,
                          penaltyWaivedByAdmin: rep.penaltyWaivedByAdmin
                        });
                      }}
                      className="text-slate-500 hover:text-blue-600 cursor-pointer p-1 rounded hover:bg-slate-100 border border-slate-300 transition-colors"
                      title="Edit Attendance"
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {attendanceReport.length === 0 && (
                <tr>
                  <td colSpan="10">
                    <div className="flex items-center justify-center p-8 text-slate-400 font-semibold text-xs">
                      No attendance records found for today.
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
