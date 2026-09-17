import React from "react";
import { ShieldCheck } from "lucide-react";

/**
 * Enterprise Unified App Footer for both Admin & Employee Portals.
 * Provides identical visual theme, responsive layout, status badge, and security branding.
 */
export default function AppFooter({
  role = "admin",
  navItems = [],
  onNavigate,
}) {
  const currentYear = new Date().getFullYear();

  const defaultAdminLinks = [
    { label: "Live Tracker", key: "live" },
    { label: "Employees", key: "employees" },
    { label: "Summary", key: "summary" },
    { label: "Monthly Report", key: "monthly-report" },
    { label: "Expenses", key: "expenses" },
  ];

  const defaultEmployeeLinks = [
    { label: "Live Tracker", key: "tracker" },
    { label: "Calendar", key: "calendar" },
    { label: "Breaks", key: "breaks" },
    { label: "Claims", key: "expenses" },
    { label: "Profile", key: "profile-docs" },
  ];

  const links = navItems && navItems.length > 0
    ? navItems
    : (role === "employee" ? defaultEmployeeLinks : defaultAdminLinks);

  const portalLabel = role === "employee" ? "Employee Portal" : "Enterprise Admin";
  const statusLabel = role === "employee" ? "Portal Online" : "All Systems Active";

  return (
    <footer className="select-none shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 border-t border-blue-800/80 shadow-md mt-auto h-[48px] min-h-[48px] px-4 sm:px-6 flex items-center">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Brand + Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-0.5 select-none font-black text-sm tracking-tight leading-none text-white">
            <span>immi</span>
            <span className="text-cyan-400">Go</span>
            <svg viewBox="0 0 20 20" fill="none" className="w-2.5 h-2.5 text-orange-400 mb-0.5 ml-0.5 shrink-0">
              <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[9px] text-blue-300 font-bold ml-1 uppercase tracking-wider">
              {portalLabel}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/80 border border-blue-700/60 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{statusLabel}</span>
          </div>
        </div>

        {/* Center: Quick Nav Links */}
        <div className="hidden md:flex items-center gap-3 text-[11px] font-semibold text-blue-200">
          {links.map((link, i) => (
            <React.Fragment key={link.key || link.path || link.label}>
              {i > 0 && <span className="text-blue-700/80">&bull;</span>}
              <button
                type="button"
                onClick={() => onNavigate && onNavigate(link.key || link.path)}
                className="hover:text-white hover:underline transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Right: Security Badge & Version */}
        <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] text-blue-300/90 font-medium">
          <div className="flex items-center gap-1 text-cyan-300 font-semibold">
            <ShieldCheck size={12} className="text-cyan-400" />
            <span>ISO 27001 Secure</span>
          </div>
          <span className="text-blue-700">&bull;</span>
          <span>&copy; {currentYear} immiGo &middot; White Gravity</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-900/90 text-blue-200 text-[9px] font-mono border border-blue-700/50">
            v2.5
          </span>
        </div>
      </div>
    </footer>
  );
}
