import { DashboardWatermark } from "../components/common/ImmiGoLogo.jsx";
import EmpSidebar from "../components/employee/layout/EmpSidebar.jsx";
import EmpTopbar from "../components/employee/layout/EmpTopbar.jsx";
import AppFooter from "../components/common/AppFooter.jsx";
import HolidayAnnouncementModals from "../components/employee/dashboard/HolidayAnnouncementModals.jsx";
import AdminUpdateToast from "../components/employee/notifications/AdminUpdateToast.jsx";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function EmployeeLayout({
  user,
  view,
  setView,
  onLogout,
  token,
  status,
  statusColor,
  sidebarOpen,
  setSidebarOpen,
  liveAdminNotification,
  setLiveAdminNotification,
  todayHoliday,
  isHolidayToday,
  announcements,
  errorMsg,
  successMsg,
  children,
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
      <DashboardWatermark />

      <HolidayAnnouncementModals
        todayHoliday={todayHoliday}
        isHolidayToday={isHolidayToday}
        announcements={announcements}
        onViewAnnouncements={() => setView("announcements")}
        onViewCalendar={() => setView("calendar")}
      />

      {liveAdminNotification && (
        <AdminUpdateToast
          notification={liveAdminNotification}
          onClose={() => setLiveAdminNotification(null)}
          onView={(n) => {
            setLiveAdminNotification(null);
            if (n?.type === "LEAVE_UPDATE") setView("leaves");
            else if (n?.type === "EXPENSE_UPDATE") setView("expenses");
            else if (n?.type === "DOCUMENT_UPDATE") setView("profile-docs");
            else if (n?.type === "ANNOUNCEMENT") setView("announcements");
            else if (n?.type === "MEETING") setView("meetings");
            else if (n?.type === "ATTENDANCE_UPDATE") setView("calendar");
            else setView("home");
          }}
        />
      )}

      <EmpSidebar
        view={view}
        setView={setView}
        onLogout={onLogout}
        user={user}
        status={status}
        statusColor={statusColor}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <EmpTopbar
          view={view}
          setView={setView}
          onLogout={onLogout}
          user={user}
          token={token}
          status={status}
          statusColor={statusColor}
          setSidebarOpen={setSidebarOpen}
          onNewNotification={(n) => setLiveAdminNotification(n)}
        />

        <main className="flex-1 p-3.5 sm:p-5 max-w-7xl w-full mx-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold mb-3">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold mb-3">
              <CheckCircle size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {children}
        </main>

        <AppFooter
          role="employee"
          onNavigate={(key) => setView(key)}
        />
      </div>
    </div>
  );
}
