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
  setMobileOpen = () => { },
  collapsed = false,
  setCollapsed = () => { },
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  const [vendorsMenuOpen, setVendorsMenuOpen] = useState(false);
  const [candidatesMenuOpen, setCandidatesMenuOpen] = useState(true);
  const [processMenuOpen, setProcessMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/admin/vendor/dashboard") {
      return (
        currentPath === "/admin/vendor" ||
        currentPath === "/admin/vendor/" ||
        currentPath === "/admin/vendor/dashboard"
      );
    }
    const [pathname, search] = path.split("?");
    if (search) {
      return currentPath === pathname && location.search === `?${search}`;
    }
    return currentPath === pathname && !location.search;
  };

  const mainNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/admin/vendor/dashboard" },
  ];

  const vendorSubItems = [
    { title: "All Vendors", icon: Building2, path: "/admin/vendor/vendors?tab=all" },
    { title: "Pending Verification", icon: Clock, path: "/admin/vendor/vendors?tab=pending" },
    { title: "MOU Pending", icon: FileText, path: "/admin/vendor/vendors?tab=mou" },
    { title: "Approved Vendors", icon: UserCheck, path: "/admin/vendor/vendors?tab=approved" },
  ];

  const candidateSubItems = [
    { title: "All Candidates", icon: Users, path: "/admin/vendor/candidates" },
    { title: "Pending Review", icon: Send, path: "/admin/vendor/submissions" },
    { title: "Shortlisted", icon: Clock, path: "/admin/vendor/candidates?tab=shortlisted" },
    { title: "Selected", icon: UserCheck, path: "/admin/vendor/selected" },
    { title: "Rejected / Hold", icon: XCircle, path: "/admin/vendor/rejected" },
  ];

  const processSubItems = [
    { title: "Milestones", icon: Sliders, path: "/admin/vendor/milestones" },
  ];

  const paymentSubItems = [
    { title: "Pending Approval", icon: Clock, path: "/admin/vendor/payments" },
    { title: "Approved Payments", icon: UserCheck, path: "/admin/vendor/payments?tab=approved" },
    { title: "Payment History", icon: CreditCard, path: "/admin/vendor/payments?tab=history" },
  ];

  const standaloneItems = [
    { title: "Projects", icon: Building2, path: "/admin/dashboard/projects" },
    { title: "Refunds", icon: RotateCcw, path: "/admin/vendor/refunds" },
    { title: "Notifications", icon: FileText, path: "/admin/vendor/dashboard" },
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
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 flex flex-col shrink-0 h-screen bg-gradient-to-b from-[#eef5ff] via-[#e8f2fe] to-[#edf4fe] text-slate-800 transition-all duration-300 ease-in-out border-r border-blue-200/80 shadow-[1px_0_6px_rgba(37,99,235,0.06)] select-none ${collapsed ? "w-[72px]" : "w-[240px]"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Top Bar — dark navy */}
        <div
          className={`h-[68px] min-h-[68px] px-4 border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex items-center gap-2 shadow-xs shrink-0 ${collapsed ? "justify-center" : "justify-between"
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
              className={`w-full flex items-center gap-2 px-2.5 py-2 text-[11px] font-bold text-blue-800 bg-white/90 hover:bg-white hover:text-blue-900 border border-blue-200/80 rounded-xl transition-colors shadow-2xs ${collapsed ? "justify-center" : ""
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

          {/* Main Items (Dashboard) */}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${active
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

          {/* VENDORS GROUP */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { if (!collapsed) setVendorsMenuOpen(!vendorsMenuOpen); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${currentPath.includes("/vendors") ? "bg-blue-600 text-white font-bold shadow-sm" : "text-slate-700 hover:bg-blue-100/70"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Building2 size={16} className={`shrink-0 ${currentPath.includes("/vendors") ? "text-white" : "text-slate-500"}`} />
                {!collapsed && <span className="truncate font-semibold">Vendors</span>}
              </div>
              {!collapsed && (vendorsMenuOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />)}
            </button>
            {!collapsed && (vendorsMenuOpen || currentPath.includes("/vendors")) && (
              <div className="ml-3.5 pl-3 border-l-2 border-blue-200/80 space-y-0.5 my-1">
                {vendorSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link key={sub.path} to={sub.path} onClick={() => setMobileOpen(false)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-blue-100/70`}>
                      <SubIcon size={14} className="shrink-0 text-slate-500" /> <span className="truncate">{sub.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* CANDIDATES GROUP */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { if (!collapsed) setCandidatesMenuOpen(!candidatesMenuOpen); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${currentPath.includes("/candidates") || currentPath.includes("/submissions") || currentPath.includes("/selected") || currentPath.includes("/rejected") ? "bg-blue-600 text-white font-bold shadow-sm" : "text-slate-700 hover:bg-blue-100/70"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users size={16} className={`shrink-0 ${currentPath.includes("/candidates") ? "text-white" : "text-slate-500"}`} />
                {!collapsed && <span className="truncate font-semibold">Candidates</span>}
              </div>
              {!collapsed && (candidatesMenuOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />)}
            </button>
            {!collapsed && (candidatesMenuOpen || currentPath.includes("/candidates")) && (
              <div className="ml-3.5 pl-3 border-l-2 border-blue-200/80 space-y-0.5 my-1">
                {candidateSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link key={sub.path} to={sub.path} onClick={() => setMobileOpen(false)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-blue-100/70`}>
                      <SubIcon size={14} className="shrink-0 text-slate-500" /> <span className="truncate">{sub.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* CANDIDATE PROCESS GROUP */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => { if (!collapsed) setProcessMenuOpen(!processMenuOpen); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${currentPath.includes("/processing") || currentPath.includes("/milestones") ? "bg-blue-600 text-white font-bold shadow-sm" : "text-slate-700 hover:bg-blue-100/70"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Sliders size={16} className={`shrink-0 ${currentPath.includes("/processing") ? "text-white" : "text-slate-500"}`} />
                {!collapsed && <span className="truncate font-semibold">Candidate Process</span>}
              </div>
              {!collapsed && (processMenuOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />)}
            </button>
            {!collapsed && (processMenuOpen || currentPath.includes("/processing") || currentPath.includes("/milestones")) && (
              <div className="ml-3.5 pl-3 border-l-2 border-blue-200/80 space-y-0.5 my-1">
                {processSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link key={sub.title} to={sub.path} onClick={() => setMobileOpen(false)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-blue-100/70`}>
                      <SubIcon size={14} className="shrink-0 text-slate-500" /> <span className="truncate">{sub.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* PAYMENTS DIRECT LINK */}
          <Link
            to="/admin/vendor/payments"
            onClick={() => setMobileOpen(false)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
              currentPath.includes("/payments")
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-slate-700 hover:bg-blue-100/70"
            }`}
          >
            <CreditCard
              size={16}
              className={`shrink-0 ${
                currentPath.includes("/payments") ? "text-white" : "text-slate-500"
              }`}
            />
            {!collapsed && <span className="truncate">Payments</span>}
          </Link>

          <Link to="/admin/vendor/refunds" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap text-slate-700 hover:bg-blue-100/70">
             <RotateCcw size={16} className="shrink-0 text-slate-500" /> {!collapsed && <span className="truncate">Refunds</span>}
          </Link>
        </div>

        {/* Sidebar Footer Bar */}
        <div
          className={`h-[48px] min-h-[48px] border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 px-3.5 flex items-center shadow-xs text-blue-200 text-xs shrink-0 ${collapsed ? "justify-center" : "justify-between"
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
