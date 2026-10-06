import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  PanelLeftClose,
  PanelLeft,
  Shield,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import Breadcrumb from "../../common/Breadcrumb.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

export function HrNavbar({
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
  title = "HR Dashboard",
  subtitle = "Workforce directory, attendance monitoring, and leave administration.",
  breadcrumbs = [
    { label: "Admin", path: "/admin/dashboard" },
    { label: "HR", path: "/hr/dashboard" },
    { label: "Dashboard" },
  ],
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchVal, setSearchVal] = useState("");

  const adminName =
    (typeof user?.name === "string" ? user.name : user?.name?.first) ||
    user?.email?.split("@")[0] ||
    "HR Admin";

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchVal.trim()) {
      navigate(`/admin/dashboard/employees?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 select-none">
      {/* Top Bar */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Button, Collapse Toggle & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Right: Quick Switch to Main Admin, Search, Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} className="text-gray-500" />
            <span>Main Admin</span>
          </Link>

          <div className="hidden md:flex items-center relative w-52 lg:w-60">
            <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search staff, employee ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
            />
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate leading-tight">
                {adminName}
              </div>
              <div className="text-[10px] text-gray-500 font-medium truncate flex items-center gap-1">
                <Shield size={9} className="text-blue-600" />
                <span>HR Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title Sub-bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/70 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h1 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {subtitle}
          </p>
        </div>
        <div className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-md self-start sm:self-center">
          Workforce Operations Hub
        </div>
      </div>
    </header>
  );
}

export default HrNavbar;
