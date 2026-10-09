import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Send,
  FileCheck,
  CheckCircle2,
  XCircle,
  GitCommit,
  CreditCard,
  FileText,
  UserCheck,
  LogOut,
  X,
  Building2,
  ArrowRightLeft,
  FolderKanban,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";

import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";

export function VendorSidebar({ mobileOpen, setMobileOpen, vendor }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/vendor/login");
  };

  const vendorName = vendor?.companyName || "Vendor Partner";
  const vendorId = vendor?.id || "VND-1001";
  const vendorLogo = vendor?.profileImage || vendor?.logo || vendor?.avatar || "";

  const [candidatesMenuOpen, setCandidatesMenuOpen] = React.useState(true);
  const [paymentsMenuOpen, setPaymentsMenuOpen] = React.useState(false);
  const [projectsMenuOpen, setProjectsMenuOpen] = React.useState(true);

  const renderContent = () => (
    <div className="flex flex-col h-full bg-[#F3F7FC] text-slate-800 font-sans border-r border-blue-200/80">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-blue-800/80 shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-900/70 border border-blue-700/50 text-cyan-400 flex items-center justify-center font-bold shadow-xs">
            <Building2 size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-white text-base tracking-tight">immi</span>
              <span className="font-extrabold text-cyan-400 text-base tracking-tight">Go</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-blue-200/80 tracking-wider mt-0.5">
              Vendor Portal
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Vendor Profile Header Summary */}
      <div className="p-3.5 mx-3 mt-3 bg-blue-100/70 rounded-xl border border-blue-300 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs overflow-hidden border border-blue-400/60">
            {vendorLogo ? (
              <img src={vendorLogo} alt={vendorName} className="w-full h-full object-cover" />
            ) : (
              vendorName.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
              {vendorName}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-mono font-bold text-blue-700">
                {vendorId}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/vendor/dashboard" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-extrabold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
          <LayoutDashboard size={16} /> <span>Dashboard</span>
        </NavLink>




        {/* CANDIDATES GROUP */}
        <div className="space-y-0.5">
          <button type="button" onClick={() => setCandidatesMenuOpen(!candidatesMenuOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${window.location.pathname.includes('/candidates') || window.location.pathname.includes('/selected') || window.location.pathname.includes('/rejected') ? "bg-blue-600 text-white shadow-md" : "text-slate-700 hover:bg-blue-100/70"}`}>
            <div className="flex items-center gap-2.5"><Users size={16} className={window.location.pathname.includes('/candidates') ? "text-white" : "text-slate-500"} /> <span>Candidates</span></div>
            {candidatesMenuOpen ? <ChevronDown size={14} className={window.location.pathname.includes('/candidates') ? "text-white/80" : "text-slate-400"} /> : <ChevronRight size={14} className={window.location.pathname.includes('/candidates') ? "text-white/80" : "text-slate-400"} />}
          </button>
          {candidatesMenuOpen && (
            <div className="ml-4 pl-3 border-l-2 border-blue-200/80 space-y-0.5 my-1">
              <NavLink to="/vendor/candidates" end className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>My Candidates</NavLink>
              <NavLink to="/vendor/candidates/assign" className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>Assign Candidate</NavLink>
              <NavLink to="/vendor/selected" className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>Selected</NavLink>
              <NavLink to="/vendor/rejected" className={({ isActive }) => `flex items-center px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-100/70"}`}>Rejected / Hold</NavLink>
            </div>
          )}
        </div>

        {/* PAYMENTS & REFUNDS DIRECT LINKS */}
        <NavLink to="/vendor/payments" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-extrabold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
          <CreditCard size={16} className={window.location.pathname.includes('/payments') ? "text-white" : "text-slate-500"} /> <span>Payments</span>
        </NavLink>
        <NavLink to="/vendor/refunds" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-extrabold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
          <RotateCcw size={16} className={window.location.pathname.includes('/refunds') ? "text-white" : "text-slate-500"} /> <span>Refunds</span>
        </NavLink>

        <NavLink to="/vendor/documents" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-extrabold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
          <FileCheck size={16} className={window.location.pathname.includes('/documents') ? "text-white" : "text-slate-500"} /> <span>Documents / MOU</span>
        </NavLink>
        <NavLink to="/vendor/profile" onClick={() => { if (window.innerWidth < 1024) setMobileOpen(false); }} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${isActive ? "bg-blue-600 text-white shadow-md font-extrabold" : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"}`}>
          <UserCheck size={16} className={window.location.pathname.includes('/profile') ? "text-white" : "text-slate-500"} /> <span>Profile</span>
        </NavLink>
      </nav>

      {/* Logout button at bottom - aligned with AppFooter */}
      <div className="h-[48px] min-h-[48px] px-4 border-t border-blue-800/80 shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 flex items-center">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 shadow-md">
        {renderContent()}
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Mobile slide-over drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {renderContent()}
      </div>
    </>
  );
}

export default VendorSidebar;
