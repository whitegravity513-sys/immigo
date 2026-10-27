import { Link } from "react-router-dom";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Shield,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import NotificationBell from "../NotificationBell.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export const AdminHeader = ({
  user,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarMobileOpen,
  setSidebarMobileOpen,
  view = "live",
  onLogout,
}) => {
  const { role: authRole, isSuperAdmin } = useAuth();
  const isHR =
    (user?.role || authRole || "").toUpperCase().replace(/[\s_-]/g, "") === "HR" ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/hr"));
  const getSectionTitle = (v) => {
    const titles = {
      workforce: isHR ? "Dashboard" : "Workforce Management Hub",
      live: isHR ? "Dashboard" : "Live Attendance Monitor",
      dashboard: "Dashboard",
      employees: "Employee Directory",
      leaves: "Leave Approvals",
      summary: "Attendance Summary",
      holidays: "Holidays",
      meetings: "Company Calendar & Meetings",
      calendar: "Company Calendar & Meetings",
      "monthly-report": "Monthly Reports",
      "employee-detail": "Employee Profile",
      "expense-categories": "Expense Categories",
      "expense-form": "Record Expense",
      "expense-report": "Expense Analytics",
      expenses: "Corporate Expense Hub",
      announcements: "Company Announcements",
      "attendance-all": "Daily Attendance Register",
    };
    return titles[v] || (isHR ? "Dashboard" : "HR Operations");
  };

  return (
    <header className="h-[52px] min-h-[52px] bg-gradient-to-r from-[#0f274a] via-[#163868] to-[#1e4a82] text-white backdrop-blur-md px-4 sm:px-6 sticky top-0 z-30 flex items-center border-b border-blue-900/60 shadow-xs">
      <div className="w-full flex items-center justify-between gap-3 sm:gap-5">

        <div className="flex items-center gap-3 sm:gap-4 min-w-0">

          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarMobileOpen(!sidebarMobileOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/90 text-blue-200 hover:text-white border border-blue-700/60 transition-all duration-150 cursor-pointer shrink-0 group shadow-xs"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Sidebar"
          >
            <Menu size={18} className="lg:hidden text-blue-200 group-hover:text-white" />
            <span className="hidden lg:flex items-center gap-2">
              {sidebarCollapsed ? (
                <PanelLeftOpen size={16} className="text-cyan-400 group-hover:text-white transition-colors" />
              ) : (
                <PanelLeftClose size={16} className="text-blue-300 group-hover:text-white transition-colors" />
              )}
            </span>
          </button>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 truncate">
              <span className="hidden sm:flex items-end gap-0.5 select-none font-bold text-lg tracking-tighter leading-none text-white">
                <span>immi</span>
                <span className="text-cyan-400">Go</span>
                <svg viewBox="0 0 20 20" fill="none" className="w-2.5 h-2.5 text-orange-400 mb-0.5 ml-0.5 shrink-0">
                  <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <ChevronRight size={13} className="text-blue-400 shrink-0 hidden sm:inline" />
              <span className="text-white font-bold text-sm sm:text-[15px] tracking-tight truncate drop-shadow-2xs">
                {getSectionTitle(view)}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 mt-0.5">

            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Switch to Admin/Super Admin Dashboard link only for Admins, not for HR */}
          {!isHR && (
            <Link
              to={isSuperAdmin ? "/super-admin/dashboard" : "/admin/dashboard"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/40 hover:bg-blue-600 text-cyan-200 hover:text-white border border-cyan-400/30 transition-all duration-150 cursor-pointer text-xs font-bold shadow-xs"
              title={isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard"}
            >
              <LayoutDashboard size={14} className="text-cyan-400" />
              <span className="hidden sm:inline">{isSuperAdmin ? "Super Admin" : "Admin"} Dashboard</span>
            </Link>
          )}

          <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-800/60 border border-blue-600/40 text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
            <Shield size={11} className="text-cyan-400" />
            <span>{isHR ? "HR Portal" : isSuperAdmin ? "Super Admin" : "Admin"}</span>
          </div>

          <div className="flex items-center">
            <NotificationBell className="relative p-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/90 text-blue-200 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-blue-700/60 shadow-xs focus:outline-none" />
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 transition-all text-xs font-semibold cursor-pointer shadow-xs active:scale-95"
              title="Sign Out"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}


        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
