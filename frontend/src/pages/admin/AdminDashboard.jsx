import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Clock,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Calendar,
  IndianRupee,
  LayoutDashboard,
  Building2,
  FolderKanban,
  UserPlus,
} from "lucide-react";
import WorkforceDashboardSection from "../../components/admin/WorkforceDashboardSection.jsx";
import { useAdminDashboard } from "../../hooks/useAdminDashboard";
import EditAttendance from "../../components/admin/EditAttendance.jsx";
import NotificationBell from "../../components/admin/NotificationBell.jsx";
import AnnouncementsSection from "../../components/admin/AnnouncementsSection.jsx";
import CalendarMeetings from "./meetings/CalendarMeetings.jsx";
import EmployeeMonthlyReport from "./employees/EmployeeMonthlyReport.jsx";

import {
  LiveAttendanceSection,
  EmployeesDirectorySection,
  LeaveApprovalsSection,
  AttendanceSummarySection,
  HolidaysSection,
  ExpensesSection,
  EmployeeDetailSection,
  AttendanceCalendarSection,
  RegisterEmployeeModal,
} from "../../components/admin";
import { AdminLayout } from "../../layouts";
import ErrorBoundary from "../../components/common/ErrorBoundary.jsx";
import { toLocalDateStr } from "../../utils/formatters.js";
import PastAttendanceModal from "../../components/admin/modals/PastAttendanceModal.jsx";
import EditEmployeeModal from "../../components/admin/modals/EditEmployeeModal.jsx";
import LeaveActionModal from "../../components/admin/modals/LeaveActionModal.jsx";
import DocPreviewModal from "../../components/admin/modals/DocPreviewModal.jsx";
import TextModal from "../../components/admin/modals/TextModal.jsx";

function AdminDashboard({ user, token, onLogout }) {
  const [renewalMenuOpen, setRenewalMenuOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.replace(/\/+$/, "").split("/");
  const isEmployeeDetail = pathParts.includes("employee");
  const rawSegment = pathParts.pop();
  const pathSegment =
    rawSegment === "admin" || rawSegment === "dashboard" || !rawSegment
      ? "workforce"
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

  const renderWorkforceHub = () => (
    <WorkforceDashboardSection
      employees={employees}
      attendanceReport={attendanceReport}
      leavesReport={leavesReport}
      openEmployeeDetail={openEmployeeDetail}
      openAddModal={handleOpenAddModal}
      fetchAdminReports={fetchAdminReports}
      openLeaveAction={openLeaveActionModal}
      navigateTo={navigateTo}
      formatTime={formatTime}
      formatDate={formatDate}
      setEditingAttendance={setEditingAttendance}
      isFullRegisterPage={false}
    />
  );

  const renderFullAttendanceRegister = () => (
    <WorkforceDashboardSection
      employees={employees}
      attendanceReport={attendanceReport}
      leavesReport={leavesReport}
      openEmployeeDetail={openEmployeeDetail}
      openAddModal={handleOpenAddModal}
      fetchAdminReports={fetchAdminReports}
      openLeaveAction={openLeaveActionModal}
      navigateTo={navigateTo}
      formatTime={formatTime}
      formatDate={formatDate}
      setEditingAttendance={setEditingAttendance}
      isFullRegisterPage={true}
    />
  );

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
      fetchExpenses={fetchExpenses}
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

  const sidebarNavItems = [
    {
      key: "workforce",
      icon: <LayoutDashboard size={16} className="shrink-0" />,
      label: "Dashboard",
      onClick: () => navigateTo("workforce"),
    },
    {
      key: "attendance-all",
      icon: <Clock size={16} className="shrink-0" />,
      label: "Attendance Register",
      onClick: () => navigateTo("attendance-all"),
    },
    {
      key: "employees",
      icon: <Users size={16} className="shrink-0" />,
      label: "Employees Directory",
      onClick: () => navigateTo("employees"),
    },
    {
      key: "leaves",
      icon: <FileText size={16} className="shrink-0" />,
      label: "Leave Approvals",
      onClick: () => navigateTo("leaves"),
    },
    {
      key: "summary",
      icon: <UserCheck size={16} className="shrink-0" />,
      label: "Attendance Summary",
      onClick: () => {
        navigateTo("summary");
        setTimeout(fetchSummary, 50);
      },
    },
    {
      key: "announcements",
      icon: <FileText size={16} className="shrink-0" />,
      label: "Announcements & Holidays",
      onClick: () => {
        navigateTo("announcements");
        setTimeout(fetchHolidays, 50);
      },
    },
    {
      key: "monthly-report",
      icon: <BarChart3 size={16} className="shrink-0" />,
      label: "Monthly Report",
      onClick: () => navigateTo("monthly-report"),
    },
    {
      key: "expenses",
      icon: <IndianRupee size={16} className="shrink-0" />,
      label: "Expense Management",
      onClick: () => {
        navigateTo("expenses");
        if (typeof fetchExpenses === "function") setTimeout(fetchExpenses, 50);
      },
    },
    {
      key: "meetings",
      icon: <Calendar size={16} className="shrink-0" />,
      label: "Calendar & Meetings",
      onClick: () => navigateTo("meetings"),
    },
  ];

  return (
    <AdminLayout
      user={user}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
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
      navigate={navigate}
      errorMsg={errorMsg}
      successMsg={successMsg}
    >
      <ErrorBoundary key={view}>
        {(view === "workforce" || view === "dashboard" || view === "live") && renderWorkforceHub()}
        {view === "attendance-all" && renderFullAttendanceRegister()}
        {view === "employees" && renderEmployeesDirectory()}
        {view === "leaves" && renderLeaveApprovals()}
        {view === "summary" && renderAttendanceSummary()}
        {view === "attendance-calendar" && (
          <AttendanceCalendarSection
            setEditingAttendance={setEditingAttendance}
            openEmployeeDetail={openEmployeeDetail}
            refreshTrigger={attendanceReport.length}
          />
        )}
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

      <PastAttendanceModal
        pastAttendanceModal={pastAttendanceModal}
        setPastAttendanceModal={setPastAttendanceModal}
        employeeHistory={employeeHistory}
        handleSavePastAttendance={handleSavePastAttendance}
        loading={loading}
      />

      <TextModal data={textModalData} onClose={() => setTextModalData(null)} />

      <RegisterEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        employeeForm={employeeForm}
        setEmployeeForm={setEmployeeForm}
        onSubmit={handleCreateEmployeeSubmit}
        loading={loading}
        errorMsg={errorMsg}
      />

      <EditEmployeeModal
        editingEmployee={editingEmployee}
        setEditingEmployee={setEditingEmployee}
        editForm={editForm}
        setEditForm={setEditForm}
        onSubmit={handleUpdateEmployeeSubmit}
        loading={loading}
      />

      <DocPreviewModal previewDoc={previewDoc} onClose={() => setPreviewDoc(null)} />

      <LeaveActionModal
        leaveActionModal={leaveActionModal}
        setLeaveActionModal={setLeaveActionModal}
        leaveActionRemark={leaveActionRemark}
        setLeaveActionRemark={setLeaveActionRemark}
        handleSubmitLeaveAction={handleSubmitLeaveAction}
        loading={loading}
      />
    </AdminLayout>
  );
}

export default AdminDashboard;
