import React from "react";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  LogIn,
  Coffee,
  CalendarPlus,
  FileText,
  Video,
  Receipt,
  User,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  BellRing
} from "lucide-react";
import { ImmiGoLogo, EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";

export default function EmpSidebar({
  view,
  setView,
  onLogout,
  user,
  status = "Checked Out",
  statusColor = "bg-slate-400",
  sidebarOpen,
  setSidebarOpen,
}) {
  const navSections = [
    {
      title: "Main",
      items: [
        { key: "home", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Attendance & Leaves",
      items: [
        { key: "checkinout", label: "Check In / Out", icon: LogIn },
        { key: "calendar", label: "Attendance Calendar", icon: Calendar },
        { key: "leaves", label: "Leave Management", icon: CalendarPlus },
      ],
    },
    {
      title: "Work & Communication",
      items: [
        { key: "meetings", label: "Meetings", icon: Video },
        { key: "announcements", label: "Announcements", icon: BellRing },
        { key: "expenses", label: "Expenses & Claims", icon: Receipt },
        { key: "profile-docs", label: "Profile & Documents", icon: User },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col shrink-0 w-64 bg-slate-100 border-r border-slate-300 text-slate-800 shadow-xl transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Brand Header — Blue Header matching Dashboard Topbar */}
        <div className="h-[68px] min-h-[68px] px-5 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <ImmiGoLogo size="sm" subtitle="Workforce Suite" theme="light" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 rounded-lg cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Card */}


        {/* Nav Items List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    view === item.key ||
                    (item.key === "home" && (view === "tracker" || view === "breaks")) ||
                    (item.key === "leaves" && (view === "apply-leave" || view === "leave-history"));
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setView(item.key);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer group ${isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold"
                        : "text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 font-bold"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          className={`shrink-0 transition-colors ${isActive
                            ? "text-white"
                            : "text-slate-500 group-hover:text-slate-900"
                            }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer — Blue matching Dashboard Footer */}
        <div className="h-[48px] min-h-[48px] px-5 border border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center justify-between shadow-md">


        </div>
      </aside>
    </>
  );
}
