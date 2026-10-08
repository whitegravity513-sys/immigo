import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import VendorSidebar from "./VendorSidebar.jsx";
import VendorNavbar from "./VendorNavbar.jsx";
import crmVendorService from "../../../services/crmVendorService.js";
import AppFooter from "../../common/AppFooter.jsx";
import { VendorOnboarding } from "./VendorOnboarding.jsx";

export function VendorLayout({ children, title = "Vendor Portal" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const vendor = crmVendorService.getCurrentVendor();

  const isPending = vendor?.status === "Pending";
  const needsOnboarding = vendor?.status === "Approved" && !vendor?.documentsUploaded;

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar - disabled if pending or needs onboarding */}
      <VendorSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        vendor={vendor}
        disabled={isPending || needsOnboarding}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full overflow-hidden">
        <VendorNavbar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          vendor={vendor}
          title={title}
          disabled={isPending || needsOnboarding}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {isPending ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-10 px-4 max-w-xl mx-auto space-y-5">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center shadow-md border border-amber-200">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Application Pending Admin Approval
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {vendor?.companyName || "Your Agency"}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Registered ID: <span className="font-bold text-slate-700">{vendor?.id || "VND-PENDING"}</span> &bull; {vendor?.email}
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 font-medium text-left space-y-2 leading-relaxed">
                <p>
                  ⏳ <b>Your registration is currently under review by Admin.</b> You can log into your portal to track status, but cannot add candidates or submit to projects until verification is completed.
                </p>
                <p className="text-amber-800 text-[11px]">
                  📌 <b>Next Step:</b> Once the Admin approves your account, a <span className="text-rose-600 font-bold">Red "Upload Mandatory Documents"</span> section will appear. After uploading your PAN & Bank details (PDF ≤ 2MB), all vendor portal features will be unlocked.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  <span>Check Approval Status</span>
                </button>
              </div>
            </div>
          ) : needsOnboarding ? (
            <VendorOnboarding vendor={vendor} />
          ) : (
            children || <Outlet />
          )}
        </main>

        <AppFooter role="vendor" />
      </div>
    </div>
  );
}

export default VendorLayout;
