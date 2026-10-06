import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Shield,
  LogOut,
  LayoutDashboard,
  Bell,
  Plus,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";

export function ClientNavbar({
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
  title = "Client Management Hub",
  subtitle = "Overseas client contracts, deployment sites & manpower requirements.",
  breadcrumbs = null,
}) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const adminName =
    (typeof user?.name === "string" ? user.name : user?.name?.first) ||
    user?.email?.split("@")[0] ||
    "Client Admin";

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/client/dashboard") return "Client Management Hub";
    if (path === "/client/clients") return "All Clients";
    if (path === "/client/clients/new") return "Add New Client";
    if (path.includes("/client/clients/") && path.includes("/edit")) return "Edit Client";
    if (path.includes("/client/clients/")) return "Client Details";
    return title;
  };

  return (
    <header className="h-[68px] min-h-[68px] bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white px-4 sm:px-6 sticky top-0 z-30 flex items-center border-b border-blue-800/80 shadow-md shrink-0">
      <div className="w-full flex items-center justify-between gap-3 sm:gap-5">

        {/* Left: Toggle + Logo + Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) setMobileOpen(!mobileOpen);
              else setCollapsed(!collapsed);
            }}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800/90 text-blue-200 hover:text-white border border-blue-700/60 transition-all duration-150 cursor-pointer shrink-0 group shadow-xs"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu size={18} className="lg:hidden text-blue-200 group-hover:text-white" />
            <span className="hidden lg:flex items-center gap-2">
              {collapsed ? (
                <PanelLeftOpen size={16} className="text-cyan-400 group-hover:text-white transition-colors" />
              ) : (
                <PanelLeftClose size={16} className="text-blue-300 group-hover:text-white transition-colors" />
              )}
            </span>
          </button>

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
                {getTitle()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/40 hover:bg-blue-600 text-cyan-200 hover:text-white border border-cyan-400/30 transition-all duration-150 cursor-pointer text-xs font-bold shadow-xs"
            title="Admin Dashboard"
          >
            <LayoutDashboard size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-800/60 border border-blue-600/40 text-[10px] font-black text-cyan-300 uppercase tracking-widest">
            <Shield size={11} className="text-cyan-400" />
            <span>Admin</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-400/30 transition-all duration-150 cursor-pointer text-xs font-bold shadow-xs group"
            title="Sign Out"
          >
            <LogOut size={13} className="shrink-0 text-rose-400 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default ClientNavbar;
