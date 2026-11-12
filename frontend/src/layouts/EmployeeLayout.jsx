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
  holidayPopupOpen = false,
  setHolidayPopupOpen,
  announcements,
  errorMsg,
  successMsg,
  children,
}) {
  return (
    <div className="flex min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] w-full max-w-full overflow-x-hidden lg:overflow-hidden bg-slate-50 font-sans relative">
      <DashboardWatermark />

      <HolidayAnnouncementModals
        todayHoliday={todayHoliday}
        isHolidayToday={isHolidayToday}
        forceOpen={holidayPopupOpen}
        onCloseForce={() => setHolidayPopupOpen && setHolidayPopupOpen(false)}
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

      <div className="flex-1 flex flex-col min-h-[100dvh] lg:min-h-0 lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden min-w-0">
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

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 lg:px-6 py-3 sm:py-4 w-full custom-scrollbar flex flex-col">
          <div className="w-full max-w-[1680px] mx-auto flex-1 flex flex-col">
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
          </div>
        </main>

        <AppFooter
          role="employee"
          onNavigate={(key) => setView(key)}
        />
      </div>
    </div>
  );
}
