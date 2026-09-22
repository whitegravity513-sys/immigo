import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient.js";
import {
  FileText,
  Calendar,
  Search,
  Filter,
  X,
  Clock,
  CheckCircle2,
  Users,
  Loader2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";

export default function AdminWorkLogsModal({ isOpen, onClose }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  });
  const [selectedDept, setSelectedDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState(["All"]);

  useEffect(() => {
    if (!isOpen) return;
    fetchLogs();
  }, [isOpen, selectedDate, selectedDept]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/worklogs", {
        params: {
          date: selectedDate,
          department: selectedDept !== "All" ? selectedDept : undefined,
        },
      });
      const data = res.data?.logs || [];
      setLogs(data);

      // Extract unique departments
      const depts = new Set(["All"]);
      data.forEach((l) => {
        if (l.employee?.department) depts.add(l.employee.department);
      });
      setDepartments(Array.from(depts));
    } catch (err) {
      console.error("Failed to fetch admin work logs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter((item) => {
    const name = item.employee?.name || "";
    const code = item.employee?.employeeId || "";
    const text = item.logText || "";
    const q = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q) ||
      text.toLowerCase().includes(q)
    );
  });

  const formatISTTime = (isoString) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                Daily Work Logs & Accomplishments
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {logs.length} Submitted
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Review what employees accomplished for the selected date
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-3 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Calendar size={14} className="text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
              />
            </div>

            {/* Department dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Filter size={13} className="text-slate-500" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === "All" ? "All Departments" : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee or task..."
              className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 outline-none focus:border-blue-500 transition-all text-slate-700"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span>Fetching submitted work logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No work logs submitted for this date.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Employees can submit what they worked on from their dashboard.
              </p>
            </div>
          ) : (
            filteredLogs.map((item) => {
              const emp = item.employee || {};
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all p-3.5 sm:p-4 space-y-2.5"
                >
                  {/* Top user row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs overflow-hidden shrink-0">
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
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800">
                            {emp.name || "Employee"}
                          </span>
                          <EmployeeIdBadge id={emp.employeeId} size="xs" />
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {emp.department || "Staff"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {emp.designation || "Staff Member"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        Submitted {formatISTTime(item.updatedAt || item.submittedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Work log content */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                    {item.logText}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Date: <strong className="text-slate-800">{selectedDate}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
