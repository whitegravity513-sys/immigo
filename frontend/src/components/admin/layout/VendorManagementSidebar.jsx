import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  Send,
  UserCheck,
  XCircle,
  Clock,
  CreditCard,
  Sliders,
  FileText,
  ArrowLeft,
  X,
  Shield,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { ImmiGoLogo, ImmiGoIcon } from "../../common/ImmiGoLogo.jsx";

export function VendorManagementSidebar({
  mobileOpen = false,
  setMobileOpen = () => {},
  collapsed = false,
  setCollapsed = () => {},
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isCandidateRoute =
    currentPath.startsWith("/admin/vendor/candidates") ||
    currentPath.startsWith("/admin/vendor/submissions") ||
    currentPath.startsWith("/admin/vendor/selected") ||
    currentPath.startsWith("/admin/vendor/rejected") ||
    currentPath.startsWith("/admin/vendor/processing");

  const [candidatesMenuOpen, setCandidatesMenuOpen] = useState(true);

  const isActive = (path) => {
    if (path === "/admin/vendor/dashboard") {
      return (
        currentPath === "/admin/vendor" ||
        currentPath === "/admin/vendor/" ||
        currentPath === "/admin/vendor/dashboard"
      );
    }
    return currentPath === path || currentPath.startsWith(path);
  };

  const mainNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin/vendor/dashboard" },
    { title: "All Vendors", icon: Building2, path: "/admin/vendor/vendors" },
  ];

  const candidateSubItems = [
    { title: "All Candidates", icon: Users, path: "/admin/vendor/candidates" },
    { title: "Submissions", icon: Send, path: "/admin/vendor/submissions" },
    { title: "Selected Candidates", icon: UserCheck, path: "/admin/vendor/selected" },
    { title: "Rejected Candidates", icon: XCircle, path: "/admin/vendor/rejected" },
    { title: "Processing Timeline", icon: Clock, path: "/admin/vendor/processing" },
  ];

  const bottomNavItems = [
    { title: "Payments", icon: CreditCard, path: "/admin/vendor/payments" },
    { title: "Refunds", icon: RotateCcw, path: "/admin/vendor/refunds" },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 flex flex-col shrink-0 h-screen bg-gradient-to-b from-[#eef5ff] via-[#e8f2fe] to-[#edf4fe] text-slate-800 transition-all duration-300 ease-in-out border-r border-blue-200/80 shadow-[1px_0_6px_rgba(37,99,235,0.06)] select-none ${
          collapsed ? "w-[72px]" : "w-[240px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Top Bar — dark navy */}
        <div
          className={`h-[68px] min-h-[68px] px-4 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center gap-2 shadow-xs shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Link
            to="/admin/vendor/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 min-w-0"
          >
            {collapsed ? (
              <ImmiGoIcon size="md" />
            ) : (
              <ImmiGoLogo size="sm" subtitle="Vendor Portal" theme="light" />
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden w-7 h-7 flex items-center justify-center text-blue-200 hover:text-white hover:bg-blue-800/60 rounded-lg cursor-pointer shrink-0"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Nav Body */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Back Button */}
          <div className="mb-2.5">
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-bold text-blue-800 bg-white/90 hover:bg-white hover:text-blue-900 border border-blue-200/80 rounded-xl transition-colors shadow-2xs ${
                collapsed ? "justify-center" : ""
              }`}
              title="Return to Main Admin Dashboard"
            >
              <ArrowLeft size={13} className="shrink-0 text-blue-600" />
              {!collapsed && <span className="truncate">Main Admin Dashboard</span>}
            </Link>
          </div>

          {!collapsed && (
            <p className="text-[11px] font-extrabold text-blue-900/60 uppercase tracking-[0.14em] px-3 mb-2 mt-1">
              Vendor Management
            </p>
          )}

          {/* Main Items (Dashboard, All Vendors) */}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold"
                    : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
                }`}
                title={collapsed ? item.title : undefined}
              >
                <Icon size={16} className={`shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                    <span className="truncate">{item.title}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                  </div>
                )}
              </Link>
            );
          })}

          {/* CANDIDATES GROUP (COLLAPSIBLE / NESTED SUB-ITEMS) */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                if (!collapsed) setCandidatesMenuOpen(!candidatesMenuOpen);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                isCandidateRoute
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold"
                  : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
              }`}
              title={collapsed ? "Candidates" : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users size={16} className={`shrink-0 ${isCandidateRoute ? "text-white" : "text-slate-500"}`} />
                {!collapsed && <span className="truncate font-semibold">Candidates</span>}
              </div>
              {!collapsed && (
                candidatesMenuOpen ? (
                  <ChevronDown size={14} className={isCandidateRoute ? "text-white shrink-0" : "text-slate-500 shrink-0"} />
                ) : (
                  <ChevronRight size={14} className={isCandidateRoute ? "text-white/80 shrink-0" : "text-slate-400 shrink-0"} />
                )
              )}
            </button>

            {/* NESTED CANDIDATE SUB-ITEMS */}
            {!collapsed && (candidatesMenuOpen || isCandidateRoute) && (
              <div className="ml-3.5 pl-3 border-l-2 border-blue-200/80 space-y-0.5 my-1">
                {candidateSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = currentPath === sub.path || currentPath.startsWith(sub.path);
                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => setMobileOpen(false)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-all duration-150 cursor-pointer ${
                        isSubActive
                          ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/20"
                          : "text-slate-600 hover:bg-blue-100/70 hover:text-blue-950 font-semibold"
                      }`}
                    >
                      <SubIcon size={14} className={`shrink-0 ${isSubActive ? "text-white" : "text-slate-500"}`} />
                      <span className="truncate">{sub.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Items (Payments, Milestones, Documents) */}
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold"
                    : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-950"
                }`}
                title={collapsed ? item.title : undefined}
              >
                <Icon size={16} className={`shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                    <span className="truncate">{item.title}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Bar */}
        <div
          className={`h-[48px] min-h-[48px] border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 px-3.5 flex items-center shadow-xs text-blue-200 text-xs shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed ? (
            <div className="flex items-center gap-1.5">
              <Shield size={10} className="text-cyan-400" />
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Vendor Portal</span>
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active"></span>
          )}
        </div>
      </aside>
    </>
  );
}

export default VendorManagementSidebar;
