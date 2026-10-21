import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
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
import NotificationBell from "../../admin/NotificationBell.jsx";

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
      {}
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

        {}
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

      {}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {}
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

        <NotificationBell className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border border-gray-200" />

        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
          <div className={`w-8 h-8 rounded-lg ${user?.profileImage || user?.avatar ? "bg-white" : "bg-blue-50 border border-blue-200 text-blue-600"} font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden`}>
            {user?.profileImage || user?.avatar ? (
              <img
                src={user.profileImage || user.avatar}
                alt={adminName}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              adminName.charAt(0).toUpperCase()
            )}
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
