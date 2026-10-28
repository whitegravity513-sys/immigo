import React from "react";
import { ShieldCheck } from "lucide-react";

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

  return (
    <footer className="select-none shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 border-t border-blue-800/80 shadow-md mt-auto h-[48px] min-h-[48px] px-4 sm:px-6 flex items-center">
      <div className="w-full flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-0.5 select-none font-bold text-sm tracking-tight leading-none text-white">
            <span>immi</span>
            <span className="text-cyan-400">Go</span>
          </div>
        </div>

        {/* Copyright and developer attribution */}
        <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] text-white font-medium">
          <span>&copy; {currentYear} ImmiGo Global Enterprise</span>
          <span className="text-cyan-400">&bull;</span>
          <span className="font-semibold text-cyan-300 tracking-wide">
            Designed by White Gravity Web Solutions
          </span>
        </div>
      </div>
    </footer>
  );
}
