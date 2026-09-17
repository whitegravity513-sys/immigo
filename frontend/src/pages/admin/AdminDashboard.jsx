import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Clock,
  Coffee,
  Users,
  UserCheck,
  ShieldCheck,
  Play,
  MapPin,
  Edit,
  UserMinus,
  Plus,
  FileText,
  Eye,
  LogOut,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Menu,
  StickyNote,
  Save,
  Pencil,
  Calendar,
  IndianRupee,
  Tag,
  Briefcase,
  Folder,
  UserPlus,
  Sparkles,
  Camera,
  UploadCloud,
  Trash2,
  Building,
  Award,
} from "lucide-react";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import EditAttendance from "../../components/admin/EditAttendance.jsx";
import EmployeeMonthlyReport from "./employees/EmployeeMonthlyReport.jsx";
import EmployeeDetail from "./employees/EmployeeDetail.jsx";
import ExpenseCategories from "./expenses/ExpenseCategories.jsx";
import ExpenseForm from "./expenses/ExpenseForm.jsx";
import ExpenseReport from "./expenses/ExpenseReport.jsx";
import CalendarMeetings from "./meetings/CalendarMeetings.jsx";
import NotificationBell from "../../components/admin/NotificationBell.jsx";
import AnnouncementsSection from "../../components/admin/AnnouncementsSection.jsx";

import {
  LiveAttendanceSection,
  EmployeesDirectorySection,
  LeaveApprovalsSection,
  AttendanceSummarySection,
  HolidaysSection,
  ExpensesSection,
  EmployeeDetailSection,
} from "../../components/admin";
import { AdminHeader, AdminSidebar, AdminFooter } from "../../components/admin/layout";
import RegisterEmployeeModal from "../../components/admin/RegisterEmployeeModal.jsx";
import { DashboardWatermark } from "../../components/common/ImmiGoLogo.jsx";
import ErrorBoundary from "../../components/common/ErrorBoundary.jsx";

const toLocalDateStr = (d) => {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function AdminDashboard({ user, token, onLogout }) {
  const [renewalMenuOpen, setRenewalMenuOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Derive current section from URL path
  const pathParts = location.pathname.replace(/\/+$/, "").split("/");
  // /admin/dashboard/employee/:id → detect "employee" in path
  const isEmployeeDetail = pathParts.includes("employee");
  const rawSegment = pathParts.pop();
  const pathSegment =
    rawSegment === "admin" || rawSegment === "dashboard" || !rawSegment
      ? "live"
      : rawSegment;
  const view = isEmployeeDetail ? "employee-detail" : pathSegment;

  const {
    sidebarCollapsed,
    sidebarMobileOpen,
    employeeMenuOpen,
    expenseMenuOpen,
    clientMenuOpen,
    projectMenuOpen,
    invoiceMenuOpen,
    selectedProject,
    previewDoc,
    loading,
    errorMsg,
    successMsg,
    attendanceReport,
    employees,
    leavesReport,
    filterStart,
    filterEnd,
    selectedEmployeeId,
    employeeHistory,
    employeeHistoryLoading,
    detailFromDate,
    detailToDate,
    previousPath,
    leaveActionModal,
    editingAttendance,
    leaveActionRemark,
    isAddModalOpen,
    employeeForm,
    editingEmployee,
    editForm,
    summaryData,
    summaryMonth,
    summaryYear,
    summaryLoading,
    inlineLeaveEdit,
    inlineLeaveLoading,
    notesData,
    notesDate,
    notesLoading,
    holidays,
    holidayForm,
    holidayLoading,
    employeeDetailView,
    calendarMonth,
    calendarYear,
    pastAttendanceModal,
    textModalData,
    expenses,
    expenseLoading,
    expenseForm,
    editingExpense,
    expenseFilterDate,
    renewals,
    renewalAlerts,
    renewalLoading,
    setSidebarCollapsed,
    setSidebarMobileOpen,
    setEmployeeMenuOpen,
    setExpenseMenuOpen,
    setClientMenuOpen,
    setProjectMenuOpen,
    setInvoiceMenuOpen,
    setSelectedProject,
    setPreviewDoc,
    setLoading,
    setErrorMsg,
    setSuccessMsg,
    setAttendanceReport,
    setEmployees,
    setLeavesReport,
    setFilterStart,
    setFilterEnd,
    setSelectedEmployeeId,
    setEmployeeHistory,
    setEmployeeHistoryLoading,
    setDetailFromDate,
    setDetailToDate,
    setPreviousPath,
    setLeaveActionModal,
    setEditingAttendance,
    setLeaveActionRemark,
    setIsAddModalOpen,
    setEmployeeForm,
    setEditingEmployee,
    setEditForm,
    setSummaryData,
    setSummaryMonth,
    setSummaryYear,
    setSummaryLoading,
    setInlineLeaveEdit,
    setInlineLeaveLoading,
    setNotesData,
    setNotesDate,
    setNotesLoading,
    setHolidays,
    setHolidayForm,
    setHolidayLoading,
    setEmployeeDetailView,
    setCalendarMonth,
    setCalendarYear,
    setPastAttendanceModal,
    setTextModalData,
    setExpenses,
    setExpenseLoading,
    setExpenseForm,
    setEditingExpense,
    setExpenseFilterDate,
    fetchAdminReports,
    fetchSummary,
    fetchNotes,
    fetchHolidays,
    fetchExpenses,
    handleExpenseSubmit,
    handleEditExpenseClick,
    handleDeleteExpense,
    handleCreateHolidaySubmit,
    handleDeleteHoliday,
    handleSavePastAttendance,
    openTextModal,
    handleSetLeaveBalance,
    openEmployeeDetail,
    handleGoBack,
    fetchEmployeeHistoryById,
    handleOpenAddModal,
    handleCreateEmployeeSubmit,
    handleDeactivateEmployee,
    handleEditClick,
    handleUpdateEmployeeSubmit,
    openLeaveActionModal,
    handleSubmitLeaveAction,
    formatDuration,
    formatDate,
    formatTime,
    navigateTo,
  } = useAdminDashboard(user, token, navigate, location, view);

  const renderLiveTracker = () => (
    <LiveAttendanceSection
      attendanceReport={attendanceReport}
      filterStart={filterStart}
      filterEnd={filterEnd}
      setFilterStart={setFilterStart}
      setFilterEnd={setFilterEnd}
      fetchAdminReports={fetchAdminReports}
      openEmployeeDetail={openEmployeeDetail}
      formatTime={formatTime}
      formatDuration={formatDuration}
      setEditingAttendance={setEditingAttendance}
      currentPath={location.pathname}
    />
  );

  const renderEmployeesDirectory = () => (
    <EmployeesDirectorySection
      employees={employees}
      handleOpenAddModal={handleOpenAddModal}
      openEmployeeDetail={openEmployeeDetail}
      formatDate={formatDate}
      handleEditClick={handleEditClick}
      handleDeactivateEmployee={handleDeactivateEmployee}
    />
  );

  const renderLeaveApprovals = () => (
    <LeaveApprovalsSection
      leavesReport={leavesReport}
      openEmployeeDetail={openEmployeeDetail}
      formatDate={formatDate}
      setPreviewDoc={setPreviewDoc}
      openLeaveActionModal={openLeaveActionModal}
    />
  );

  const renderAttendanceSummary = () => (
    <AttendanceSummarySection
      summaryMonth={summaryMonth}
      summaryYear={summaryYear}
      setSummaryMonth={setSummaryMonth}
      setSummaryYear={setSummaryYear}
      summaryLoading={summaryLoading}
      summaryData={summaryData}
      fetchSummary={fetchSummary}
      openEmployeeDetail={openEmployeeDetail}
      inlineLeaveEdit={inlineLeaveEdit}
      setInlineLeaveEdit={setInlineLeaveEdit}
      inlineLeaveLoading={inlineLeaveLoading}
      handleSetLeaveBalance={handleSetLeaveBalance}
    />
  );

  // Holidays are now handled inside AnnouncementsSection (unified form)

  const renderExpenses = () => (
    <ExpensesSection
      expenses={expenses}
      expenseFilterDate={expenseFilterDate}
      setExpenseFilterDate={setExpenseFilterDate}
      expenseForm={expenseForm}
      setExpenseForm={setExpenseForm}
      handleExpenseSubmit={handleExpenseSubmit}
      expenseLoading={expenseLoading}
      loading={loading}
      formatDate={formatDate}
      openTextModal={openTextModal}
      handleEditExpenseClick={handleEditExpenseClick}
      handleDeleteExpense={handleDeleteExpense}
    />
  );

  const renderEmployeeDetail = () => (
    <EmployeeDetailSection
      employeeHistory={employeeHistory}
      employeeHistoryLoading={employeeHistoryLoading}
      handleGoBack={handleGoBack}
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
      holidays={holidays}
    />
  );

  const renderPastAttendanceModal = () => {
    if (!pastAttendanceModal) return null;
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={() => setPastAttendanceModal(null)}
      >
        <div
          className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-base font-black text-slate-800">
              Add/Update Past Attendance
            </h3>
            <button
              className="text-slate-500 text-xl cursor-pointer p-1"
              onClick={() => setPastAttendanceModal(null)}
            >
              ×
            </button>
          </div>
          <div className="p-6 space-y-4">
            {(() => {
              const empJoiningDateStr = employeeHistory?.employee?.joiningDate
                ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(employeeHistory.employee.joiningDate))
                : null;
              const isBeforeJoining = empJoiningDateStr && pastAttendanceModal.date && pastAttendanceModal.date < empJoiningDateStr;

              return (
                <>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Date
                      </label>
                      {empJoiningDateStr && (
                        <span className="text-[10px] font-bold text-slate-400">
                          Joined: {empJoiningDateStr}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      min={empJoiningDateStr || undefined}
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 ${
                        isBeforeJoining ? "border-rose-400 bg-rose-50" : "border-slate-200"
                      }`}
                      value={pastAttendanceModal.date || ""}
                      onChange={(e) =>
                        setPastAttendanceModal({
                          ...pastAttendanceModal,
                          date: e.target.value,
                        })
                      }
                    />
                    {isBeforeJoining && (
                      <p className="text-xs font-bold text-rose-600 mt-0.5">
                        ⚠️ Attendance cannot be recorded before joining date ({empJoiningDateStr}).
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                value={pastAttendanceModal.status || "Present"}
                onChange={(e) =>
                  setPastAttendanceModal({
                    ...pastAttendanceModal,
                    status: e.target.value,
                  })
                }
              >
                <option value="Present">Present (Full Day)</option>
                <option value="Half Day">Half Day (Half Salary Deduct)</option>
                <option value="Absent">Absent</option>
                <option value="Leave">On Leave</option>
              </select>
            </div>
            {(pastAttendanceModal.status === "Present" ||
              pastAttendanceModal.status === "Half Day") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800"
                    value={pastAttendanceModal.checkInTime || ""}
                    onChange={(e) =>
                      setPastAttendanceModal({
                        ...pastAttendanceModal,
                        checkInTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800"
                    value={pastAttendanceModal.checkOutTime || ""}
                    onChange={(e) =>
                      setPastAttendanceModal({
                        ...pastAttendanceModal,
                        checkOutTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Note / Remark
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800"
                placeholder="Optional remark"
                value={pastAttendanceModal.checkOutNote || ""}
                onChange={(e) =>
                  setPastAttendanceModal({
                    ...pastAttendanceModal,
                    checkOutNote: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer text-sm shadow-sm shadow-blue-500/20 transition-all"
                onClick={handleSavePastAttendance}
                disabled={loading}
              >
                Save Record
              </button>
              <button
                type="button"
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer text-sm"
                onClick={() => setPastAttendanceModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sidebarNavItems = [
    {
      key: "employee-group",
      icon: <Users size={16} className="shrink-0" />,
      label: "Employee Management",
      isGroup: true,
      subItems: [
        {
          key: "live",
          icon: <Clock size={15} className="shrink-0" />,
          label: "Live Tracker",
        },
        {
          key: "employees",
          icon: <Users size={15} className="shrink-0" />,
          label: "Employees Directory",
        },
        {
          key: "leaves",
          icon: <FileText size={15} className="shrink-0" />,
          label: "Leave Approvals",
        },
        {
          key: "summary",
          icon: <UserCheck size={15} className="shrink-0" />,
          label: "Attendance Summary",
          onClick: () => {
            navigateTo("summary");
            setTimeout(fetchSummary, 50);
          },
        },
        {
          key: "announcements",
          icon: <FileText size={15} className="shrink-0" />,
          label: "Announcements & Holidays",
          onClick: () => {
            navigateTo("announcements");
            setTimeout(fetchHolidays, 50);
          },
        },
        {
          key: "monthly-report",
          icon: <BarChart3 size={15} className="shrink-0" />,
          label: "Monthly Report",
        },
        {
          key: "expenses",
          icon: <IndianRupee size={15} className="shrink-0" />,
          label: "Expense Management",
          onClick: () => {
            navigateTo("expenses");
            if (typeof fetchExpenses === "function") setTimeout(fetchExpenses, 50);
          },
        },
        {
          key: "meetings",
          icon: <Calendar size={15} className="shrink-0" />,
          label: "Calendar & Meetings",
          onClick: () => navigateTo("meetings"),
        },
      ],
    },
  ];


  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
      {/* Light Background Watermark Logo */}
      <DashboardWatermark />

      {/* Modular MNC Grade Sidebar Component */}
      <AdminSidebar
        user={user}
        sidebarCollapsed={sidebarCollapsed}
        sidebarMobileOpen={sidebarMobileOpen}
        setSidebarMobileOpen={setSidebarMobileOpen}
        sidebarNavItems={sidebarNavItems}
        employeeMenuOpen={employeeMenuOpen}
        setEmployeeMenuOpen={setEmployeeMenuOpen}
        expenseMenuOpen={expenseMenuOpen}
        setExpenseMenuOpen={setExpenseMenuOpen}
        clientMenuOpen={clientMenuOpen}
        setClientMenuOpen={setClientMenuOpen}
        projectMenuOpen={projectMenuOpen}
        setProjectMenuOpen={setProjectMenuOpen}
        invoiceMenuOpen={invoiceMenuOpen}
        setInvoiceMenuOpen={setInvoiceMenuOpen}
        view={view}
        navigateTo={navigateTo}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-slate-50 text-slate-900 overflow-x-hidden">
        {/* Modular MNC Grade Header Component with Universal Toggle */}
        <AdminHeader
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          sidebarMobileOpen={sidebarMobileOpen}
          setSidebarMobileOpen={setSidebarMobileOpen}
          view={view}
          onLogout={onLogout}
        />

        <main className="flex-1 p-3.5 sm:p-5 md:p-6 max-w-[1440px] w-full mx-auto overflow-x-hidden">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-medium mb-6">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium mb-6">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          <ErrorBoundary key={view}>
            {(view === "dashboard" || view === "live") && renderLiveTracker()}
            {view === "employees" && renderEmployeesDirectory()}
            {view === "leaves" && renderLeaveApprovals()}
            {view === "summary" && renderAttendanceSummary()}
            {view === "employee-detail" && renderEmployeeDetail()}
            {view === "expenses" && renderExpenses()}
            {view === "announcements" && (
              <AnnouncementsSection
                holidays={holidays}
                holidayForm={holidayForm}
                setHolidayForm={setHolidayForm}
                holidayLoading={holidayLoading}
                handleCreateHolidaySubmit={handleCreateHolidaySubmit}
                handleDeleteHoliday={handleDeleteHoliday}
              />
            )}
            {(view === "meetings" || view === "calendar") && <CalendarMeetings />}
            {editingAttendance && (
              <EditAttendance
                attendance={editingAttendance}
                onClose={() => setEditingAttendance(null)}
                onSaved={fetchAdminReports}
              />
            )}
            {view === "monthly-report" && (
              <EmployeeMonthlyReport
                token={token}
                onGoBack={() => navigateTo("live")}
              />
            )}
          </ErrorBoundary>
          {renderPastAttendanceModal()}
          {textModalData && (
            <div
              className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
              onClick={() => setTextModalData(null)}
            >
              <div
                className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="text-base font-black text-slate-800">
                    {textModalData.title}
                  </h3>
                  <button
                    className="text-slate-500 text-xl cursor-pointer p-1"
                    onClick={() => setTextModalData(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {textModalData.content}
                  </p>
                  <div className="flex justify-end pt-4">
                    <button
                      className="px-4 py-2 bg-slate-105 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                      onClick={() => setTextModalData(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Modular MNC Grade Footer Component */}
        <AdminFooter navigate={navigate} />
      </div>

      <RegisterEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        employeeForm={employeeForm}
        setEmployeeForm={setEmployeeForm}
        onSubmit={handleCreateEmployeeSubmit}
        loading={loading}
      />

      {editingEmployee && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingEmployee(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-black text-slate-800">
                Edit Employee Details
              </h3>
              <button
                className="text-slate-500 text-xl cursor-pointer p-1"
                onClick={() => setEditingEmployee(null)}
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateEmployeeSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Role / Designation
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                      value={editForm.designation}
                      onChange={(e) =>
                        setEditForm({ ...editForm, designation: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering, Sales"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                      value={editForm.department || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, department: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                      value={editForm.phone || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Employee Status
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                      value={editForm.status || "active"}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="probation">Probation</option>
                      <option value="inactive">Inactive / Deactivated</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Sunshine Heights, Mumbai"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                    value={editForm.address || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                    value={editForm.joiningDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, joiningDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date of Leaving{" "}
                    <span className="font-normal normal-case text-slate-400">
                      (if applicable)
                    </span>
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                    value={editForm.leavingDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, leavingDate: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Leave Balance
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                      value={editForm.leaveBalance}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          leaveBalance: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Next Month Leaves
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                      value={editForm.nextMonthLeaves}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          nextMonthLeaves: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    New Password{" "}
                    <span className="font-normal normal-case text-slate-400">
                      (leave blank to keep current)
                    </span>
                  </label>
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer text-sm shadow-sm shadow-blue-500/20 transition-all"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer text-sm"
                    onClick={() => setEditingEmployee(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800">
                Supporting Document
              </h3>
              <button
                className="text-slate-500 text-xl cursor-pointer p-1"
                onClick={() => setPreviewDoc(null)}
              >
                ×
              </button>
            </div>
            <div className="p-6 flex justify-center items-center">
              {previewDoc.startsWith("data:image/") ? (
                <img
                  src={previewDoc}
                  className="max-h-[450px] w-auto object-contain rounded-lg shadow-sm"
                  alt="Document"
                />
              ) : previewDoc.startsWith("data:application/pdf") ? (
                <iframe
                  src={previewDoc}
                  style={{
                    width: "100%",
                    height: "450px",
                    border: "none",
                    borderRadius: "8px",
                  }}
                ></iframe>
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} className="mb-4 text-green-600 mx-auto" />
                  <p className="text-slate-500 text-sm mb-4">
                    Binary file attachment.
                  </p>
                  <a
                    href={previewDoc}
                    download="attachment"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-block shadow-sm shadow-blue-500/20 transition-all"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {leaveActionModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLeaveActionModal(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${leaveActionModal.action === "Approved" ? "bg-emerald-50" : "bg-rose-50"}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-base ${leaveActionModal.action === "Approved" ? "bg-emerald-600" : "bg-rose-600"}`}
                >
                  {leaveActionModal.action === "Approved" ? "✓" : "✕"}
                </span>
                <h3 className="text-base font-black text-slate-800">
                  {leaveActionModal.action === "Approved"
                    ? "Approve Leave Application"
                    : "Reject Leave Application"}
                </h3>
              </div>
              <button
                className="text-slate-500 text-xl cursor-pointer p-1"
                onClick={() => setLeaveActionModal(null)}
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Admin Remark{" "}
                  {leaveActionModal.action === "Rejected" ? (
                    <span className="text-rose-500">*</span>
                  ) : (
                    <span className="text-slate-500">(Optional)</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder={
                    leaveActionModal.action === "Rejected"
                      ? "Enter reason for rejection..."
                      : "Enter optional remark..."
                  }
                  value={leaveActionRemark}
                  onChange={(e) => setLeaveActionRemark(e.target.value)}
                  autoFocus
                />
                {leaveActionModal.action === "Rejected" && (
                  <p className="text-[11px] text-rose-500 font-medium">
                    Remark is required when rejecting a leave application.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  className={`flex-1 py-3 text-white font-bold rounded-xl cursor-pointer text-sm ${leaveActionModal.action === "Approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
                  onClick={handleSubmitLeaveAction}
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : leaveActionModal.action === "Approved"
                      ? "✓ Confirm Approval"
                      : "✕ Confirm Rejection"}
                </button>
                <button
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer text-sm"
                  onClick={() => setLeaveActionModal(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
