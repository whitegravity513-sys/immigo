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
      { }
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      { }
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col shrink-0 w-64 bg-gradient-to-b from-[#eef5ff] via-[#e4f0fe] to-[#edf5ff] text-slate-800 border-r border-blue-200/90 shadow-lg transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        { }
        <div className="h-[68px] min-h-[68px] px-5 border-b border-blue-600/30 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-xs">
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

        { }

        { }
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-1.5 text-[10px] font-black uppercase tracking-wider text-blue-900/60">
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
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 font-bold"
                        : "text-slate-700 hover:text-blue-950 hover:bg-white/80 font-bold"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={16}
                          className={`shrink-0 transition-colors ${isActive
                            ? "text-white"
                            : "text-blue-600/70 group-hover:text-blue-800"
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

        { }
        <div className="p-3 border-t border-blue-200/80 bg-white/70 backdrop-blur-xs flex flex-col gap-2 shadow-2xs">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                {(user.name?.charAt(0) || "E").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name || "Employee"}</p>
                <p className="text-[10px] text-blue-700 font-mono font-semibold truncate">{user.employeeCode || user.role || "Staff"}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 transition-all cursor-pointer shadow-2xs group"
            title="Sign out of your session"
          >
            <LogOut size={14} className="text-rose-500 group-hover:text-rose-700 group-hover:-translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
