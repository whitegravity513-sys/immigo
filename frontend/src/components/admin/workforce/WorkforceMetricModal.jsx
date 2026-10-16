import React from "react";
import { Search, Users, Eye } from "lucide-react";
import { EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";

export function WorkforceMetricModal({
  metricModal,
  setMetricModal,
  metricModalSearch,
  setMetricModalSearch,
  modalFilteredList,
  formattedSelectedDateDisplay,
  openEmployeeDetail,
  getAttendanceInfo,
  formatTime,
}) {
  if (!metricModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={() => setMetricModal(null)}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center font-bold shrink-0">
              {metricModal.icon}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{metricModal.title}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${metricModal.color}`}>
                  {metricModal.list.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Showing for {formattedSelectedDateDisplay} • Click employee or ID badge to view full details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMetricModal(null)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold shrink-0"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={metricModalSearch}
              onChange={(e) => setMetricModalSearch(e.target.value)}
              placeholder="Filter by name, ID code (e.g. IMMI-001), department..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100/80">
          {modalFilteredList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Users size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No employees found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No staff matched this category or search filter.
              </p>
            </div>
          ) : (
            modalFilteredList.map((emp) => {
              const actualEmpId =
                emp.employeeId ||
                (typeof emp._id === "string" ? emp._id.replace(/^virtual-/, "") : emp._id) ||
                emp.id;
              const safeName =
                typeof emp?.name === "string"
                  ? emp.name
                  : emp?.name?.first
                  ? `${emp.name.first} ${emp.name.last}`
                  : "Employee";
              const empCode = emp.employeeCode || emp.employeeId || "IMMI-001";
              const info = getAttendanceInfo(emp);

              return (
                <div
                  key={`metric-staff-${actualEmpId}-${emp.date || ""}`}
                  className="pt-2.5 first:pt-0 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      {emp.profileImage ? (
                        <img src={emp.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        safeName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          onClick={() => {
                            setMetricModal(null);
                            openEmployeeDetail(actualEmpId);
                          }}
                          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer truncate"
                          title="Click to view Profile"
                        >
                          {safeName}
                        </h4>
                        <EmployeeIdBadge
                          id={empCode}
                          size="sm"
                          onClick={() => {
                            setMetricModal(null);
                            openEmployeeDetail(actualEmpId);
                          }}
                          title="Click to view Employee Profile"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {emp.department || "General"} • {emp.designation || "Staff"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${info.badgeClass}`}
                    >
                      {info.icon}
                      {info.label}
                    </span>

                    {info.isPresent && emp.checkInTime && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                        In: {formatTime(emp.checkInTime)}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setMetricModal(null);
                        openEmployeeDetail(actualEmpId);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-blue-200 hover:border-blue-600 shadow-2xs active:scale-95"
                      title="Open Employee Profile"
                    >
                      <Eye size={12} />
                      <span>Detail</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {modalFilteredList.length} of {metricModal.list.length} records</span>
          <button
            type="button"
            onClick={() => setMetricModal(null)}
            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-200 cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
