import { useState, useEffect, useCallback } from "react";
import { Users, Send, CheckCircle2, GitCommit, Award } from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import MouFullPageView from "../../components/vendor/MouFullPageView.jsx";
import {
  VendorWelcomeBanner,
  VendorMetricCards,
  VendorRecentProjectsTable,
} from "../../components/vendor/dashboard/index.js";
import DashboardMeetingWidget from "../../components/common/meeting/DashboardMeetingWidget.jsx";

const VENDOR_PORTAL_STORAGE_KEYS = new Set([
  "immigo_crm_candidates_v3",
  "immigo_crm_applications_v3",
  "immigo_crm_vendors_v3",
  "immigo_crm_refunds_v3",
]);

export function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [showMouPage, setShowMouPage] = useState(false);
  const [vendor, setVendor] = useState(() => crmVendorService.getCurrentVendor());

  const vendorId = vendor?.id;

  const loadDashboardData = useCallback(async () => {
    try {
      const [data, projs] = await Promise.all([
        crmVendorService.getVendorDashboardStats(vendorId),
        crmVendorService.getAvailableProjects(vendorId),
      ]);
      setStats({
        ...data,
        availableProjects: Array.isArray(projs) && projs.length > 0 ? projs : data?.availableProjects || [],
      });
    } catch (err) {
      console.error("Failed to load vendor dashboard:", err);
    }
  }, [vendorId]);

  useEffect(() => {
    const syncVendorState = () => {
      const cur = crmVendorService.getCurrentVendor();
      if (cur) setVendor(cur);
    };
    window.addEventListener("immigo:vendor-update", syncVendorState);
    return () => window.removeEventListener("immigo:vendor-update", syncVendorState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) loadDashboardData();
    });

    let debounceTimer = null;
    const handleUpdate = (e) => {
      if (e?.type === "storage" && (!e.key || !VENDOR_PORTAL_STORAGE_KEYS.has(e.key))) {
        return;
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadDashboardData();
      }, 100);
    };

    window.addEventListener("immigo:application-update", handleUpdate);
    window.addEventListener("immigo:candidate-update", handleUpdate);
    window.addEventListener("immigo:refund-update", handleUpdate);
    window.addEventListener("immigo:dashboard-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("immigo:application-update", handleUpdate);
      window.removeEventListener("immigo:candidate-update", handleUpdate);
      window.removeEventListener("immigo:refund-update", handleUpdate);
      window.removeEventListener("immigo:dashboard-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadDashboardData]);

  const CARDS = [
    {
      title: "Total Candidates",
      value: stats?.totalCandidates ?? 0,
      subtitle: "Candidate pool",
      icon: Users,
      bgClass: "bg-blue-50 text-blue-600",
      to: "/vendor/candidates",
    },
    {
      title: "Submitted",
      value: stats?.submitted ?? 0,
      subtitle: "To client projects",
      icon: Send,
      bgClass: "bg-indigo-50 text-indigo-600",
      to: "/vendor/applications",
    },
    {
      title: "Selected",
      value: stats?.selected ?? 0,
      subtitle: "Hired candidates",
      icon: CheckCircle2,
      bgClass: "bg-emerald-50 text-emerald-600",
      to: "/vendor/selected",
    },
    {
      title: "In Processing",
      value: stats?.inProcessing ?? 0,
      subtitle: "Visa & travel stage",
      icon: GitCommit,
      bgClass: "bg-purple-50 text-purple-600",
      to: "/vendor/processing",
    },
    {
      title: "Completed",
      value: stats?.completed ?? 0,
      subtitle: "Deployed on site",
      icon: Award,
      bgClass: "bg-teal-50 text-teal-600",
      to: "/vendor/selected",
    },
  ];

  const isRejected = Boolean(
    ["Rejected", "Registration Rejected", "MOU Rejected"].includes(vendor?.status) ||
      vendor?.mouStatus === "Rejected"
  );
  const isCorrectionRequired = Boolean(
    vendor?.mouStatus === "Correction Required" ||
      vendor?.status === "MOU Correction Required"
  );
  const isMouApproved = Boolean(
    !isRejected &&
      (vendor?.status === "Approved" ||
        vendor?.status === "Active" ||
        vendor?.mouStatus === "Approved" ||
        vendor?.onboardingStage === "COMPLETED" ||
        vendor?.onboardingStage === "ACTIVE")
  );
  const isMouUnderReview = Boolean(
    !isRejected &&
      !isMouApproved &&
      !isCorrectionRequired &&
      (vendor?.mouSigned ||
        vendor?.mouStatus === "Signed" ||
        vendor?.mouStatus === "Under Review" ||
        vendor?.status === "Pending MOU Approval" ||
        vendor?.status === "MOU Under Review" ||
        vendor?.onboardingStage === "MOU_UNDER_REVIEW" ||
        vendor?.onboardingStage === "MOU_SIGNED" ||
        Boolean(vendor?.signedMou?.signedAt))
  );
  const isMouPendingSignature = Boolean(
    !isRejected &&
      !isMouApproved &&
      !isMouUnderReview &&
      (vendor?.mouStatus === "Sent" ||
        isCorrectionRequired ||
        vendor?.status === "MOU Pending" ||
        vendor?.onboardingStage === "MOU_SENT")
  );
  const isMouAssigned =
    isMouPendingSignature ||
    isMouUnderReview ||
    isMouApproved ||
    Boolean(isRejected && (vendor?.mouStatus === "Rejected" || vendor?.signedMou?.signedAt || vendor?.mouDocument?.sentAt));

  if (showMouPage && isMouAssigned) {
    return (
      <div className="space-y-3 sm:space-y-3.5 w-full max-w-full overflow-hidden text-slate-800">
        <MouFullPageView
          mode={isMouPendingSignature ? "sign" : "preview"}
          vendor={vendor}
          onBack={() => setShowMouPage(false)}
          onSuccess={async () => {
            setShowMouPage(false);
            const fresh = await crmVendorService.getVendorMe();
            if (fresh) setVendor(fresh);
          }}
        />
      </div>
    );
  }

  const allProjects = stats?.availableProjects || [];

  return (
    <div className="space-y-3 sm:space-y-3.5 w-full max-w-full overflow-hidden text-slate-800">
      <VendorWelcomeBanner
        vendor={vendor}
        onOpenMou={() => {
          if (isMouAssigned) setShowMouPage(true);
        }}
      />

      <VendorMetricCards cards={CARDS} />

      <DashboardMeetingWidget
        role="VENDOR"
        assignedVendors={[vendor?.id || vendor?.vendorId].filter(Boolean)}
      />

      <VendorRecentProjectsTable allProjects={allProjects} />
    </div>
  );
}

export default VendorDashboard;
