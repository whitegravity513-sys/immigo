import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Shield,
  Sparkles,
  LogOut,
} from "lucide-react";
import NotificationBell from "../NotificationBell.jsx";

export const AdminHeader = ({
  user,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarMobileOpen,
  setSidebarMobileOpen,
  view = "live",
  onLogout,
}) => {
  const getSectionTitle = (v) => {
    const titles = {
      workforce: "Workforce Management Hub",
      live: "Live Attendance Monitor",
      dashboard: "Live Attendance Monitor",
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
      "attendance-all": "Full Attendance Register",
    };
    return titles[v] || "HR Operations";
  };

  return (
    <header className="h-[68px] min-h-[68px] bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white backdrop-blur-md px-4 sm:px-6 sticky top-0 z-30 flex items-center border-b border-blue-800/80 shadow-md">
      <div className="w-full flex items-center justify-between gap-3 sm:gap-5">

        {/* Left: Toggle + Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">

          {/* SIDEBAR TOGGLE */}
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

          {/* Breadcrumb */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 truncate">
              <span className="hidden sm:flex items-end gap-0.5 select-none font-black text-lg tracking-tighter leading-none text-white">
                <span>immi</span>
                <span className="text-cyan-400">Go</span>
                <svg viewBox="0 0 20 20" fill="none" className="w-2.5 h-2.5 text-orange-400 mb-0.5 ml-0.5 shrink-0">
                  <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <ChevronRight size={13} className="text-blue-400 shrink-0 hidden sm:inline" />
              <span className="text-white font-extrabold text-sm sm:text-[15px] tracking-tight truncate drop-shadow-2xs">
                {getSectionTitle(view)}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 mt-0.5">


            </div>
          </div>
        </div>

        {/* Right: Status + Notifications + Role Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">


          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-800/60 border border-blue-600/40 text-[10px] font-black text-cyan-300 uppercase tracking-widest">
            <Shield size={11} className="text-cyan-400" />
            <span>Admin</span>
          </div>

          {/* Notifications */}
          <div className="flex items-center">
            <NotificationBell className="relative p-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/90 text-blue-200 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-blue-700/60 shadow-xs focus:outline-none" />
          </div>

          {/* Sign Out Button in Header */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-400/30 transition-all duration-150 cursor-pointer text-xs font-bold shadow-xs group"
              title="Sign Out"
            >
              <LogOut size={13} className="shrink-0 text-rose-400 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
