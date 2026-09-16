import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, Users } from "lucide-react";
import {
  AdminLoginForm,
  EmployeeLoginForm,
  HeroBrandingPanel,
  SecurityTrustBadge,
} from "../components/auth";
import luxuryBg from "../assets/luxury-terminal-bg.jpg";

/**
 * Enterprise Unified Authentication Portal.
 * Orchestrates Admin and Employee login flows with role query syncing.
 */
export default function UnifiedLogin({ onLoginSuccess }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleQuery = searchParams.get("role") || searchParams.get("tab");
  const [tab, setTab] = useState(roleQuery === "admin" ? "admin" : "employee");

  // Keep state synchronized with URL query parameter
  useEffect(() => {
    if (roleQuery && (roleQuery === "admin" || roleQuery === "employee") && roleQuery !== tab) {
      setTab(roleQuery);
    }
  }, [roleQuery, tab]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setSearchParams({ role: newTab }, { replace: true });
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex bg-white font-sans overflow-x-hidden lg:overflow-hidden select-none">
      {/* Left Column — Hero Branding & Foreign Manpower Credibility */}
      <HeroBrandingPanel />

      {/* Right Column — Authentication Container with Locked Height on Desktop (No Scroll/Jitter) & Fluid on Mobile */}
      <div className="flex-1 min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between px-4 sm:px-8 md:px-12 lg:px-10 xl:px-14 py-4 sm:py-5 overflow-y-auto lg:overflow-hidden relative bg-[#f8faff] animated-light-blue-bg">
        {/* Full-Cover Cinematic International Terminal Background with Slow Animated Pan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -inset-10 bg-cover bg-center animated-cover-pan opacity-80"
            style={{ backgroundImage: `url(${luxuryBg})` }}
          />
          {/* Light glassmorphic wash for 100% text legibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/82 via-blue-50/40 to-white/78 backdrop-blur-[2px]" />
        </div>

        {/* Floating Animated Logo-Colored Luminous Light Orbs */}
        <div className="absolute top-1/6 -left-20 w-[420px] h-[420px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none orb-blue" />
        <div className="absolute bottom-1/6 -right-20 w-[360px] h-[360px] bg-orange-400/15 rounded-full blur-3xl pointer-events-none orb-orange" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] bg-sky-400/15 rounded-full blur-2xl pointer-events-none orb-cyan" />

        {/* Subtle dot matrix pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#2563eb 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top Header: Brand Logo & Realtime Server Status */}
        <header className="relative z-10 flex items-center justify-between gap-3 w-full pb-3 border-b border-slate-300">
          <div className="flex items-end gap-0.5 select-none">
            <span className="font-black text-2xl sm:text-3xl text-slate-900 tracking-tighter leading-none">
              immi
            </span>
            <span className="font-black text-2xl sm:text-3xl text-blue-600 tracking-tighter leading-none">
              Go
            </span>
            <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 text-orange-500 mb-2 ml-0.5">
              <path
                d="M3 10h14M10 3l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-white/95 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Portal Online</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-[11px] font-semibold text-slate-500">256-Bit SSL</span>
          </div>
        </header>

        {/* Center: Main Form Card Vertically Centered with No Scroll on Desktop */}
        <main className="relative z-10 w-full max-w-xl mx-auto my-auto py-2">
          <div className="relative bg-white/95 backdrop-blur-xl border-2 border-slate-300 shadow-[0_15px_40px_rgba(37,99,235,0.08)] rounded-2xl sm:rounded-3xl p-5 sm:p-7 xl:p-8 overflow-hidden">
            {/* Top Brand Accent Ribbon (Royal Blue to Warm Orange) */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
                  {tab === "admin" ? "Admin Portal" : "Employee Portal"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {tab === "admin"
                    ? "Sign in with authorized management credentials"
                    : "Sign in to access your immiGo workforce dashboard"}
                </p>
              </div>

              {/* Role Switcher Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-300 self-start sm:self-auto shrink-0 shadow-2xs">
                {[
                  { key: "admin", icon: <ShieldCheck size={15} />, label: "Admin" },
                  { key: "employee", icon: <Users size={15} />, label: "Employee" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleTabChange(t.key)}
                    className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-extrabold rounded-lg transition-all duration-200 cursor-pointer border-none ${
                      tab === t.key
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 scale-[1.02]"
                        : "bg-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Component Rendering */}
            {tab === "admin" ? (
              <AdminLoginForm
                key="admin"
                onLoginSuccess={onLoginSuccess}
                onSwitchToEmployee={() => handleTabChange("employee")}
              />
            ) : (
              <EmployeeLoginForm
                key="employee"
                onLoginSuccess={onLoginSuccess}
                onSwitchToAdmin={() => handleTabChange("admin")}
              />
            )}

            {/* Security Guarantee Banner */}
            <SecurityTrustBadge />
          </div>
        </main>

        {/* Bottom Footer */}
        <footer className="relative z-10 w-full pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} immiGo &middot; HRMS & Operations Platform</span>
          <div className="flex items-center gap-2.5 font-medium text-[11px] text-slate-400">
            <span>Server: 24ms</span>
            <span>&bull;</span>
            <span>All sessions encrypted</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
