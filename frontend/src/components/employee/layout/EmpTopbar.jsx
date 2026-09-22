import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  Calendar as CalendarIcon,
  LogOut,
  User,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import EmployeeNotificationBell from "../EmployeeNotificationBell.jsx";
import { EmployeeIdBadge } from "../../common/ImmiGoLogo.jsx";

export default function EmpTopbar({
  view,
  setView,
  onLogout,
  user,
  token,
  status = "Checked Out",
  statusColor = "bg-slate-400",
  setSidebarOpen,
  onNewNotification,
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
    checkinout: { title: "Check In / Check Out", subtitle: "Record your daily work shift attendance" },
    breaks: { title: "Breaks & Rest Intervals", subtitle: "Meal and refreshment timers" },
    leaves: { title: "Leave Management", subtitle: "Apply for leaves and review request history" },
    "apply-leave": { title: "Leave Management", subtitle: "Apply for leaves and review request history" },
    "leave-history": { title: "Leave Management", subtitle: "Apply for leaves and review request history" },
    meetings: { title: "Meetings & Calls", subtitle: "Scheduled client and team sessions" },
    announcements: { title: "Notice Board", subtitle: "Official corporate announcements & updates" },
    expenses: { title: "Expenses & Claims", subtitle: "Track reimbursements & receipts" },
    "profile-docs": { title: "Profile & Documents", subtitle: "Your employee ID, contracts & KYC" },
  };

  const currentMeta = viewTitles[view] || {
    title: "Employee Dashboard",
    subtitle: "immiGo Workforce Management",
  };

  return (
    <header className="h-[68px] min-h-[68px] bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-b border-blue-800/80 text-white sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-md">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-white hover:bg-blue-800/60 transition-colors cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu size={20} />
        </button>


      </div>


      <div className="flex items-center gap-2 sm:gap-3 shrink-0">




        {/* Real-time Notifications */}
        <EmployeeNotificationBell
          token={token}
          onNewNotification={onNewNotification}
          className="relative p-2 rounded-xl text-white hover:bg-blue-800/60 transition-colors cursor-pointer border border-blue-700/60 bg-blue-900/40 shadow-xs"
        />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border border-blue-700/60 hover:border-blue-500/80 bg-blue-900/40 hover:bg-blue-900/80 text-white transition-all cursor-pointer shadow-xs"
          >
            <div className={`w-8 h-8 rounded-lg ${user?.profileImage ? "bg-white" : "bg-gradient-to-tr from-blue-600 to-indigo-600"} text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden`}>
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name || "Employee"}
                  className="w-full h-full object-cover "
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                (user?.name || "E")[0].toUpperCase()
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">
                {user?.name || "Employee"}
              </span>
              <span className="text-[10px] text-white font-medium">
                {user?.department || "Staff"}
              </span>
            </div>
            <ChevronDown size={14} className="text-white" />
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
                  <EmployeeIdBadge
                    id={user?.employeeId}
                    size="xs"
                    onClick={() => {
                      setView("profile-docs");
                      setProfileOpen(false);
                    }}
                    title="Click to view My Profile & Documents"
                  />
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
