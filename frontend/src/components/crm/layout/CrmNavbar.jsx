import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  Plus,
  ChevronRight,
  ShieldCheck,
  Building2,
  PanelLeftClose,
  PanelLeft,
  X,
  ExternalLink,
} from "lucide-react";
import SearchInput from "../ui/SearchInput.jsx";

export function CrmNavbar({
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
  user,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate dynamic breadcrumb
  const pathParts = location.pathname.split("/").filter(Boolean);

  const getBreadcrumbs = () => {
    const crumbs = [{ label: "Dashboard", path: "/dashboard" }];

    if (pathParts.includes("clients")) {
      crumbs.push({ label: "Clients", path: "/clients" });

      if (pathParts.includes("new")) {
        crumbs.push({ label: "Add Client", path: "/clients/new" });
      } else if (pathParts.length >= 2) {
        const clientId = pathParts[1];
        if (clientId && clientId !== "new") {
          crumbs.push({ label: "Client Details", path: `/clients/${clientId}` });
        }
        if (pathParts.includes("edit")) {
          crumbs.push({ label: "Edit Client", path: `/clients/${clientId}/edit` });
        }
        if (pathParts.includes("projects") && pathParts.length >= 4) {
          crumbs.push({ label: "Project Details", path: location.pathname });
        }
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const handleGlobalSearch = (e) => {
    if (e.key === "Enter" && searchVal.trim()) {
      navigate(`/clients?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const adminName =
    (typeof user?.name === "string" ? user.name : user?.name?.first) ||
    user?.email?.split("@")[0] ||
    "Operations Admin";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
      {/* Left: Mobile Toggle / Collapse Button & Breadcrumbs */}
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

        {/* Breadcrumb Navigation */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.path + idx}>
                {idx > 0 && <ChevronRight size={13} className="text-gray-300 shrink-0" />}
                {isLast ? (
                  <span className="font-bold text-gray-900 truncate">{crumb.label}</span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="hover:text-blue-600 transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Center/Right: Global Search, Quick Action, Notification & Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Quick Search */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleGlobalSearch}
            placeholder="Search clients, press enter..."
            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-150"
          />
          {searchVal && (
            <button
              onClick={() => setSearchVal("")}
              className="absolute right-2 top-2 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in duration-150">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Notifications
                  </h4>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    2 New
                  </span>
                </div>
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  <div className="p-3 hover:bg-gray-50 transition-colors cursor-pointer text-xs">
                    <p className="font-semibold text-gray-900">
                      New Requirement Added
                    </p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      ABC Construction LLC added 50 Masons for Dubai Tower.
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      10 mins ago
                    </span>
                  </div>
                  <div className="p-3 hover:bg-gray-50 transition-colors cursor-pointer text-xs">
                    <p className="font-semibold text-gray-900">
                      Project Schedule Verified
                    </p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      Riyadh Metro Extension Line 4 approved for mobilization.
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      2 hours ago
                    </span>
                  </div>
                </div>
                <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Admin Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[120px]">
              {adminName}
            </p>
            <p className="text-[10px] text-gray-400 leading-tight">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default CrmNavbar;
