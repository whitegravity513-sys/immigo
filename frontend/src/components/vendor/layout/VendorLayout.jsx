import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import VendorSidebar from "./VendorSidebar.jsx";
import VendorNavbar from "./VendorNavbar.jsx";
import crmVendorService from "../../../services/crmVendorService.js";
import AppFooter from "../../common/AppFooter.jsx";
import { VendorOnboarding } from "./VendorOnboarding.jsx";
import { useAuth } from "../../../context/useAuth.js";

const VENDOR_SYNC_STORAGE_KEYS = new Set([
  "immigo_crm_vendors_v3",
  "user",
  "immigo_user",
]);

const hasVendorUploadedDocuments = (vendor) =>
  Boolean(
    vendor?.documentsUploaded === true ||
      (Array.isArray(vendor?.documents) && vendor.documents.length > 0) ||
      [
        "Documents Under Review",
        "Under Review",
        "Documents Verified",
        "MOU Pending",
        "MOU Under Review",
        "Pending MOU Approval",
        "MOU Correction Required",
        "Active",
        "Approved",
      ].includes(vendor?.status) ||
      vendor?.mouSigned === true ||
      ["Sent", "Signed", "Approved"].includes(vendor?.mouStatus) ||
      [
        "DOCS_SUBMITTED",
        "DOCS_UNDER_REVIEW",
        "DOCS_VERIFIED",
        "MOU_SENT",
        "MOU_PENDING",
        "MOU_SIGNED",
        "MOU_UNDER_REVIEW",
        "COMPLETED",
        "ACTIVE",
      ].includes(vendor?.onboardingStage)
  );

export function VendorLayout({ children, title = "Vendor Portal" }) {
  const { updateUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [vendor, setVendor] = useState(() => crmVendorService.getCurrentVendor());

  const handleVendorUpdate = useCallback(
    (nextVendorOrUpdater) => {
      setVendor((prev) => {
        const next =
          typeof nextVendorOrUpdater === "function"
            ? nextVendorOrUpdater(prev)
            : nextVendorOrUpdater;
        if (next) {
          updateUser(next);
        }
        return next;
      });
    },
    [updateUser]
  );

  useEffect(() => {
    let isMounted = true;

    const hasVendorChanged = (prev, next) =>
      !prev ||
      prev.status !== next.status ||
      prev.mouStatus !== next.mouStatus ||
      prev.mouSigned !== next.mouSigned ||
      prev.mouSignMethod !== next.mouSignMethod ||
      prev.signedMouDocUrl !== next.signedMouDocUrl ||
      prev.onboardingStage !== next.onboardingStage ||
      Boolean(prev.documentsUploaded) !== Boolean(next.documentsUploaded) ||
      Boolean(prev.documentVerified) !== Boolean(next.documentVerified) ||
      JSON.stringify(prev.documents || []) !== JSON.stringify(next.documents || []) ||
      JSON.stringify(prev.signedMou || null) !== JSON.stringify(next.signedMou || null) ||
      JSON.stringify(prev.mouDocument || null) !== JSON.stringify(next.mouDocument || null);

    const syncVendor = async () => {
      try {
        const fresh = await crmVendorService.getVendorMe();
        if (fresh && isMounted) {
          setVendor((prev) => {
            if (hasVendorChanged(prev, fresh)) {
              updateUser(fresh);
              return fresh;
            }
            return prev;
          });
          return;
        }
      } catch {}

      if (isMounted) {
        const local = crmVendorService.getCurrentVendor();
        if (local) {
          setVendor((prev) => (hasVendorChanged(prev, local) ? local : prev));
        }
      }
    };

    const syncFromLocal = (evt) => {
      if (!isMounted) return;
      if (evt?.detail?.remote) {
        syncVendor();
        return;
      }
      const local = crmVendorService.getCurrentVendor();
      if (local) {
        setVendor((prev) => (hasVendorChanged(prev, local) ? local : prev));
      }
    };

    syncVendor();
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        syncVendor();
      }
    }, 30000);
    const handleStorage = (e) => {
      if (e?.key && VENDOR_SYNC_STORAGE_KEYS.has(e.key)) {
        syncVendor();
      }
    };
    window.addEventListener("focus", syncVendor);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("immigo:vendor-update", syncFromLocal);

    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener("focus", syncVendor);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("immigo:vendor-update", syncFromLocal);
    };
  }, [updateUser]);

  const hasUploadedDocuments = hasVendorUploadedDocuments(vendor);
  const isPortalLocked = !hasUploadedDocuments;

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] flex overflow-x-hidden lg:overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <VendorSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        vendor={vendor}
        isPortalLocked={isPortalLocked}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 min-h-[100dvh] lg:min-h-0 lg:h-full lg:overflow-hidden">
        <VendorNavbar
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          vendor={vendor}
          title={title}
          isPortalLocked={isPortalLocked}
        />

        <main className="flex-1 p-2.5 sm:p-4 lg:p-5 max-w-full w-full mx-auto overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-[1680px] mx-auto">
            {isPortalLocked ? (
              <VendorOnboarding vendor={vendor} onVendorUpdate={handleVendorUpdate} />
            ) : (
              children || <Outlet />
            )}
          </div>
        </main>

        <AppFooter role="vendor" />
      </div>
    </div>
  );
}

export default VendorLayout;
