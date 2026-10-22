import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Award,
  FolderLock,
  Briefcase,
  ChevronLeft,
} from "lucide-react";
import { apiClient } from "../../services/apiClient.js";
import {
  EmployeeProfileHeader,
  EmployeeAttendanceTab,
  EmployeePaymentsTab,
  EmployeeDocumentsTab,
  EmployeeLeavesTab,
} from "./employee/detail/index.js";

const formatHHMM = (val) => {
  if (!val) return "";
  if (typeof val === "string" && /^\d{2}:\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

const formatFileUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  const apiBase = (
    apiClient.defaults?.baseURL || "http://localhost:5000/api"
  ).replace(/\/api\/?$/, "");
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function EmployeeDetailSection({
  employeeHistory,
  employeeHistoryLoading,
  handleGoBack,
  employeeDetailView,
  setEmployeeDetailView,
  calendarMonth,
  calendarYear,
  setCalendarMonth,
  setCalendarYear,
  detailFromDate,
  detailToDate,
  setDetailFromDate,
  setDetailToDate,
  selectedEmployeeId,
  fetchEmployeeHistoryById,
  setPastAttendanceModal,
  formatTime,
  formatDate,
  openTextModal,
  holidays = [],
}) {
  const emp = employeeHistory?.employee;
  const attendance = Array.isArray(employeeHistory?.attendanceHistory)
    ? employeeHistory.attendanceHistory
    : Array.isArray(employeeHistory)
    ? employeeHistory
    : [];
  const leaves = Array.isArray(employeeHistory?.leaveHistory)
    ? employeeHistory.leaveHistory
    : [];
  const safeHolidays = Array.isArray(holidays) ? holidays : [];

  const [activeTab, setActiveTab] = useState("attendance");

  const joiningDateStr = (() => {
    if (!emp?.joiningDate) return null;
    try {
      const d = new Date(emp.joiningDate);
      if (isNaN(d.getTime())) return null;
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(d);
    } catch {
      return null;
    }
  })();

  const validAttendance = attendance.filter(
    (a) => a && (!joiningDateStr || a.date >= joiningDateStr)
  );
  const presentCount = validAttendance.filter((a) =>
    ["Present", "Active", "Checked Out", "On Break"].includes(a.status)
  ).length;
  const absentCount = validAttendance.filter((a) => a.status === "Absent").length;
  const halfDayCount = validAttendance.filter((a) => a.halfSalaryDeduct).length;

  const postDojWorkingDays = (() => {
    let count = 0;
    const totalDays = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${calendarYear}-${String(calendarMonth).padStart(
        2,
        "0"
      )}-${String(d).padStart(2, "0")}`;
      if (joiningDateStr && dateStr < joiningDateStr) continue;
      const dt = new Date(calendarYear, calendarMonth - 1, d);
      const dayOfWeek = dt.getDay();
      if (dayOfWeek === 0) continue;
      if (dayOfWeek === 6) {
        const satCount = Math.ceil(d / 7);
        if (satCount === 2 || satCount === 4) continue;
      }
      const isHoli = safeHolidays.some((h) => {
        if (!h || !h.date) return false;
        const hDate =
          typeof h.date === "string"
            ? h.date.split("T")[0]
            : new Date(h.date).toISOString().split("T")[0];
        return hDate === dateStr;
      });
      if (isHoli) continue;
      count++;
    }
    return count;
  })();

  const safeEmpName =
    typeof emp?.name === "string"
      ? emp.name
      : emp?.name?.first
      ? `${emp.name.first} ${emp.name.last}`
      : String(emp?.name || "Employee");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold cursor-pointer transition-colors"
          onClick={handleGoBack}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Employee Profile & Management
          </h2>
          <p className="text-xs text-slate-500">
            Profile, compliance documents, leave balance & attendance
          </p>
        </div>
      </div>

      {employeeHistoryLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-slate-500 text-sm font-semibold">
              Loading employee profile...
            </span>
          </div>
        </div>
      ) : !emp ? (
        <div className="text-center py-16 text-slate-500 font-semibold">
          Employee not found.
        </div>
      ) : (
        <>
          <EmployeeProfileHeader
            emp={emp}
            safeEmpName={safeEmpName}
            formatDate={formatDate}
            formatFileUrl={formatFileUrl}
            postDojWorkingDays={postDojWorkingDays}
            presentCount={presentCount}
            halfDayCount={halfDayCount}
            absentCount={absentCount}
          />

          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "attendance"
                  ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <CalendarIcon size={16} /> Attendance History
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "payments"
                  ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Award size={16} /> Payment & Financial Details
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "documents"
                  ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FolderLock size={16} /> Corporate Document Vault
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {emp.documents?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("leaves")}
              className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "leaves"
                  ? "border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Briefcase size={16} /> Leave Applications
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {leaves.length}
              </span>
            </button>
          </div>

          {activeTab === "attendance" && (
            <EmployeeAttendanceTab
              emp={emp}
              attendance={attendance}
              safeHolidays={safeHolidays}
              joiningDateStr={joiningDateStr}
              employeeDetailView={employeeDetailView}
              setEmployeeDetailView={setEmployeeDetailView}
              calendarMonth={calendarMonth}
              calendarYear={calendarYear}
              setCalendarMonth={setCalendarMonth}
              setCalendarYear={setCalendarYear}
              detailFromDate={detailFromDate}
              detailToDate={detailToDate}
              setDetailFromDate={setDetailFromDate}
              setDetailToDate={setDetailToDate}
              selectedEmployeeId={selectedEmployeeId}
              fetchEmployeeHistoryById={fetchEmployeeHistoryById}
              setPastAttendanceModal={setPastAttendanceModal}
              formatTime={formatTime}
              formatDate={formatDate}
              openTextModal={openTextModal}
              formatHHMM={formatHHMM}
            />
          )}

          {activeTab === "payments" && (
            <EmployeePaymentsTab emp={emp} formatDate={formatDate} />
          )}

          {activeTab === "documents" && (
            <EmployeeDocumentsTab
              emp={emp}
              formatFileUrl={formatFileUrl}
              selectedEmployeeId={selectedEmployeeId}
              detailFromDate={detailFromDate}
              detailToDate={detailToDate}
              fetchEmployeeHistoryById={fetchEmployeeHistoryById}
            />
          )}

          {activeTab === "leaves" && (
            <EmployeeLeavesTab
              emp={emp}
              leaves={leaves}
              formatDate={formatDate}
              openTextModal={openTextModal}
            />
          )}
        </>
      )}
    </div>
  );
}
