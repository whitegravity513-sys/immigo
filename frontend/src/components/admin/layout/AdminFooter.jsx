import React from "react";
import { ShieldCheck } from "lucide-react";

export const AdminFooter = ({ navigate }) => {
  return (
    <footer className="px-4 sm:px-6 py-4 select-none shrink-0 bg-gradient-to-r from-slate-50 via-blue-50/25 to-slate-50 border-t border-slate-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">

        {/* Left: Brand + Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-0.5 select-none font-black text-base tracking-tighter leading-none text-slate-900">
            <span>immi</span>
            <span className="text-blue-600">Go</span>
            <svg viewBox="0 0 20 20" fill="none" className="w-2.5 h-2.5 text-orange-500 mb-0.5 ml-0.5 shrink-0">
              <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All Systems Operational</span>
          </div>
        </div>

        {/* Center: Quick Nav */}
        <div className="hidden md:flex items-center gap-4 text-[12px] text-slate-500 font-medium">
          {[
            { label: "Dashboard", path: "/admin/dashboard/live" },
            { label: "Employees", path: "/admin/dashboard/employees" },
            { label: "Leaves", path: "/admin/dashboard/leaves" },
            { label: "Invoices", path: "/admin/dashboard/invoices" },
          ].map((link, i) => (
            <React.Fragment key={link.path}>
              {i > 0 && <span className="text-slate-300">•</span>}
              <button
                type="button"
                onClick={() => navigate && navigate(link.path)}
                className="hover:text-blue-600 hover:underline transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Right: Copyright */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck size={13} className="text-blue-600/70" />
          <span>&copy; {new Date().getFullYear()} immiGo &middot; Powered by White Gravity</span>
        </div>

      </div>
    </footer>
  );
};

export default AdminFooter;

