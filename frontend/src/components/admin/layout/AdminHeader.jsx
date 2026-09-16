import React from "react";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Zap,
} from "lucide-react";
import NotificationBell from "../NotificationBell.jsx";

export const AdminHeader = ({
  user,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarMobileOpen,
  setSidebarMobileOpen,
  view = "live",
}) => {
  const getSectionTitle = (v) => {
    const titles = {
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
    };
    return titles[v] || "HR Operations";
  };

  return (
    <header className="h-[72px] min-h-[72px] bg-gradient-to-r from-white via-blue-50/25 to-white backdrop-blur-md px-4 sm:px-6 sticky top-0 z-30 flex items-center border-b border-slate-300 shadow-xs">
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
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-slate-300 transition-all duration-150 cursor-pointer shrink-0 group"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Sidebar"
          >
            <Menu size={18} className="lg:hidden text-slate-700" />
            <span className="hidden lg:flex items-center gap-2">
              {sidebarCollapsed ? (
                <PanelLeftOpen size={16} className="text-blue-600 group-hover:text-blue-700 transition-colors" />
              ) : (
                <PanelLeftClose size={16} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
              )}
            </span>
          </button>

          {/* Breadcrumb */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 truncate">
              <span className="hidden sm:flex items-end gap-0.5 select-none font-black text-lg tracking-tighter leading-none text-slate-900">
                <span>immi</span>
                <span className="text-blue-600">Go</span>
                <svg viewBox="0 0 20 20" fill="none" className="w-2.5 h-2.5 text-orange-500 mb-0.5 ml-0.5 shrink-0">
                  <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <ChevronRight size={13} className="text-slate-400 shrink-0 hidden sm:inline" />
              <span className="text-slate-900 font-extrabold text-sm sm:text-[15px] tracking-tight truncate">
                {getSectionTitle(view)}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-[10px] text-blue-700 font-bold tracking-wide">Enterprise Admin Console</span>
            </div>
          </div>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">



          {/* Notifications */}
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

