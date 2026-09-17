import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  PlusCircle,
  Calendar as CalendarIcon,
  LogOut,
  User,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Building
} from "lucide-react";
import EmployeeNotificationBell from "../EmployeeNotificationBell.jsx";
import { EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";

export default function EmpTopbar({
  view,
  setView,
  onLogout,
  user,
  token,
  isSalesEmployee,
  status = "Checked Out",
  statusColor = "bg-slate-400",
  setSidebarOpen,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Map view key to readable titles
  const viewTitles = {
    home: { title: "Employee Workspace", subtitle: "Overview & Daily Operations" },
    tracker: { title: "Live Work Tracker", subtitle: "Real-time activity & monthly overview" },
    calendar: { title: "Attendance Calendar", subtitle: "Monthly shifts, leaves & holidays" },
    checkinout: { title: "Check In / Check Out", subtitle: "Punch in your daily work shift" },
    breaks: { title: "Breaks & Rest Intervals", subtitle: "Meal and refreshment timers" },
    "apply-leave": { title: "Leave Application", subtitle: "Submit formal leave requests" },
    "leave-history": { title: "Leave History", subtitle: "Review approved, pending & rejected leaves" },
    meetings: { title: "Meetings & Calls", subtitle: "Scheduled client and team sessions" },
    announcements: { title: "Notice Board", subtitle: "Official corporate announcements & updates" },
    expenses: { title: "Expenses & Claims", subtitle: "Track reimbursements & receipts" },
    "profile-docs": { title: "Profile & Documents", subtitle: "Your employee ID, contracts & KYC" },
    crm: { title: "Lead CRM & Pipeline", subtitle: "Manage client acquisitions & follow-ups" },
  };

  const currentMeta = viewTitles[view] || {
    title: "Employee Dashboard",
    subtitle: "immiGo Workforce Management",
  };

  return (
    <header className="h-[68px] min-h-[68px] bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate leading-tight">
              {currentMeta.title}
            </h1>
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                status === "Active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : status === "On Break"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor} animate-pulse`} />
              {status}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate hidden sm:block font-medium">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Middle: Quick Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md mx-2">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search tasks, leaves, leads, records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right Action Icons & User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
          <CalendarIcon size={14} className="text-blue-600" />
          <span>{todayStr}</span>
        </div>

        {/* Sales Action Quick Button */}
        {isSalesEmployee && (
          <button
            onClick={() => setView("crm")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-blue-600/20 transition-all cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>+ Lead CRM</span>
          </button>
        )}

        {/* Real-time Notifications */}
        <EmployeeNotificationBell
          token={token}
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 shadow-2xs"
        />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                (user?.name || "E")[0].toUpperCase()
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || "Employee"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {user?.department || "Staff"}
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs font-black text-slate-900 truncate">
                  {user?.name || "Employee"}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {user?.email || "employee@immigo.com"}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <EmployeeIdBadge id={user?.employeeId} size="xs" />
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {user?.designation || "Staff"}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setView("profile-docs");
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <User size={15} className="text-slate-400" />
                  <span>My Profile & Documents</span>
                </button>
                <button
                  onClick={() => {
                    setView("calendar");
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <CalendarIcon size={15} className="text-slate-400" />
                  <span>Attendance Record</span>
                </button>
                {isSalesEmployee && (
                  <button
                    onClick={() => {
                      setView("crm");
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Building size={15} className="text-slate-400" />
                    <span>Lead CRM Workspace</span>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut size={15} className="text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
