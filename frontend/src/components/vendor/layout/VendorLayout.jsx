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

  const isFullyUnlocked =
    vendor?.status === "Approved" &&
    (vendor?.mouSigned || vendor?.mouStatus === "Signed" || vendor?.mouStatus === "Approved");

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar - disabled until fully onboarded with signed MOU */}
      <VendorSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        vendor={vendor}
        disabled={!isFullyUnlocked}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full overflow-hidden">
        <VendorNavbar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          vendor={vendor}
          title={title}
          disabled={!isFullyUnlocked}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {!isFullyUnlocked ? (
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
