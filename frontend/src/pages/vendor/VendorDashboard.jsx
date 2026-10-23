import React, { useState, useEffect } from "react";
import { Users, Send, CheckCircle2, GitCommit, Award } from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import MouFullPageView from "../../components/vendor/MouFullPageView.jsx";
import {
  VendorWelcomeBanner,
  VendorMetricCards,
  VendorRecentProjectsTable,
} from "../../components/vendor/dashboard/index.js";

export function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMouPage, setShowMouPage] = useState(false);
  const vendor = crmVendorService.getCurrentVendor();

  useEffect(() => {
    loadDashboardData();

    const handleUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener("immigo:application-update", handleUpdate);
    window.addEventListener("immigo:candidate-update", handleUpdate);
    window.addEventListener("immigo:dashboard-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("immigo:application-update", handleUpdate);
      window.removeEventListener("immigo:candidate-update", handleUpdate);
      window.removeEventListener("immigo:dashboard-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [vendor?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [data, projs] = await Promise.all([
        crmVendorService.getVendorDashboardStats(vendor?.id),
        crmVendorService.getAvailableProjects(vendor?.id),
      ]);
      setStats({
        ...data,
        availableProjects: Array.isArray(projs) && projs.length > 0 ? projs : data?.availableProjects || [],
      });
    } catch (err) {
      console.error("Failed to load vendor dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

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
      to: "/vendor/candidates?tab=selected",
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

  if (showMouPage) {
    return (
      <div className="space-y-3 sm:space-y-3.5 w-full max-w-full overflow-hidden text-slate-800">
        <MouFullPageView
          mode="preview"
          vendor={vendor}
          onBack={() => setShowMouPage(false)}
        />
      </div>
    );
  }

  const allProjects = stats?.availableProjects || [];

  return (
    <div className="space-y-3 sm:space-y-3.5 w-full max-w-full overflow-hidden text-slate-800">
      <VendorWelcomeBanner
        vendor={vendor}
        onOpenMou={() => setShowMouPage(true)}
      />

      <VendorMetricCards cards={CARDS} />

      <VendorRecentProjectsTable allProjects={allProjects} />
    </div>
  );
}

export default VendorDashboard;
