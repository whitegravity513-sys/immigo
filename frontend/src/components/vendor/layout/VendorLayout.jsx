import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import VendorSidebar from "./VendorSidebar.jsx";
import VendorNavbar from "./VendorNavbar.jsx";
import crmVendorService from "../../../services/crmVendorService.js";
import AppFooter from "../../common/AppFooter.jsx";
import { VendorOnboarding } from "./VendorOnboarding.jsx";

export function VendorLayout({ children, title = "Vendor Portal" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [vendor, setVendor] = useState(() => crmVendorService.getCurrentVendor());

  // Real-time synchronization with backend & local state
  useEffect(() => {
    let isMounted = true;

    const syncVendor = async () => {
      try {
        // Fetch fresh state from backend
        const fresh = await crmVendorService.getVendorMe();
        if (fresh && isMounted) {
          setVendor((prev) => {
            if (
              !prev ||
              prev.status !== fresh.status ||
              prev.mouStatus !== fresh.mouStatus ||
              prev.mouSigned !== fresh.mouSigned ||
              prev.onboardingStage !== fresh.onboardingStage ||
              JSON.stringify(prev.mouDocument) !== JSON.stringify(fresh.mouDocument)
            ) {
              return fresh;
            }
            return prev;
          });
          return;
        }
      } catch {
        // Fallback to local storage check
      }

      if (isMounted) {
        const local = crmVendorService.getCurrentVendor();
        if (local) {
          setVendor((prev) => {
            if (
              !prev ||
              prev.status !== local.status ||
              prev.mouStatus !== local.mouStatus ||
              prev.mouSigned !== local.mouSigned ||
              prev.onboardingStage !== local.onboardingStage
            ) {
              return local;
            }
            return prev;
          });
        }
      }
    };

    syncVendor();
    const timer = setInterval(syncVendor, 3000);
    window.addEventListener("focus", syncVendor);
    window.addEventListener("storage", syncVendor);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener("focus", syncVendor);
      window.removeEventListener("storage", syncVendor);
    };
  }, []);

  const isFullyUnlocked = Boolean(
    vendor?.mouSigned ||
    vendor?.mouStatus === "Signed" ||
    vendor?.mouStatus === "Approved" ||
    vendor?.status === "Approved" ||
    vendor?.status === "Pending MOU Approval" ||
    vendor?.onboardingStage === "MOU_SIGNED" ||
    vendor?.onboardingStage === "COMPLETED"
  );

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
            <VendorOnboarding vendor={vendor} onVendorUpdate={setVendor} />
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
