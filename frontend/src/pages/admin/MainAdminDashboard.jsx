import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Calendar,
  UserCheck,
  Clock,
} from "lucide-react";
import AdminMasterLayout from "../../components/admin/layout/AdminMasterLayout.jsx";
import SummaryCardsGrid from "../../components/admin/dashboard/SummaryCardsGrid.jsx";
import QuickRecruitmentStrip from "../../components/admin/dashboard/QuickRecruitmentStrip.jsx";
import OverseasDemandCard from "../../components/admin/dashboard/OverseasDemandCard.jsx";
import ActiveProjectsTable from "../../components/admin/dashboard/ActiveProjectsTable.jsx";
import RecentActivityStream from "../../components/admin/dashboard/RecentActivityStream.jsx";
import DashboardMeetingWidget from "../../components/common/meeting/DashboardMeetingWidget.jsx";
import ActiveMeetingAlertBanner from "../../components/common/meeting/ActiveMeetingAlertBanner.jsx";
import HRPerformanceReportSection from "../../components/common/reports/HRPerformanceReportSection.jsx";
import crmClientService, {
  calculateProjectManpower,
} from "../../services/crmClientService.js";
import crmVendorService from "../../services/crmVendorService.js";
import employeeService from "../../services/employeeService.js";
import apiClient from "../../services/apiClient.js";
import activityService from "../../services/activityService.js";
import appConfig from "../../config/appConfig.js";
import { useAuth } from "../../context/AuthContext.jsx";

const MAIN_DASHBOARD_STORAGE_KEYS = new Set([
  "immigo_crm_vendors_v3",
  "immigo_crm_candidates_v3",
  "immigo_crm_applications_v3",
  "immigo_crm_refunds_v3",
  "crm_clients_data_v3",
]);

export function MainAdminDashboard() {
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    newEmployeesThisMonth: 0,
    presentToday: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
    totalClients: 0,
    activeClients: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalRequiredManpower: 0,
    activeRequirements: 0,
    totalVendors: 0,
    pendingVendors: 0,
    totalCandidates: 0,
    pendingRegistrations: 0,
    approvedAccounts: 0,
    pendingDocuments: 0,
    eligibleCandidates: 0,
    totalApplications: 0,
    interviewsScheduled: 0,
    selectedCandidates: 0,
    rejectedApplications: 0,
    totalReceived: 0,
    totalReceivable: 0,
    totalInvoiced: 0,
    pendingPayments: 0,
    deployedCandidates: 0,
  });

  const [projectsList, setProjectsList] = useState([]);
  const [recentClients, setRecentClients] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);

  useEffect(() => {
    loadDashboardData();

    let debounceTimer = null;
    const handleUpdate = (e) => {
      if (e?.type === "storage" && (!e.key || !MAIN_DASHBOARD_STORAGE_KEYS.has(e.key))) {
        return;
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadDashboardData();
      }, 120);
    };

    window.addEventListener("immigo:application-update", handleUpdate);
    window.addEventListener("immigo:candidate-update", handleUpdate);
    window.addEventListener("immigo:dashboard-update", handleUpdate);
    window.addEventListener("immigo:vendor-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("immigo:application-update", handleUpdate);
      window.removeEventListener("immigo:candidate-update", handleUpdate);
      window.removeEventListener("immigo:dashboard-update", handleUpdate);
      window.removeEventListener("immigo:vendor-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    loadActivities();
  }, [activityFilter, activityPage]);

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const res = await activityService.getAdminActivities({
        page: activityPage,
        limit: 8,
        entityType: activityFilter !== "ALL" ? activityFilter : undefined,
      });
      if (res) {
        setActivities(res.activities || []);
        setActivityTotalPages(res.pagination?.totalPages || 1);
        setActivityTotal(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Error loading admin activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [clientsRes, empRes, attRes, leavesRes, vendorRes, candRes, payRes] = await Promise.allSettled([
        crmClientService.getClients({ limit: 1000 }),
        employeeService.getEmployees(),
        apiClient.get("/admin/attendance"),
        apiClient.get("/admin/leaves"),
        crmVendorService.getAdminVendorOverviewStats(),
        apiClient.get("/admin/candidates/stats"),
        apiClient.get("/admin/client-payments/stats"),
      ]);

      let allProjects = [];
      let clientList = [];

      if (clientsRes.status === "fulfilled") {
        clientList = Array.isArray(clientsRes.value)
          ? clientsRes.value
          : clientsRes.value?.clients || [];
        setRecentClients(clientList.slice(0, 5));

        clientList.forEach((c) => {
          (c.projects || []).forEach((p) => {
            allProjects.push({
              id: p.id,
              projectName: p.projectName,
              projectType: p.projectType,
              clientName: c.companyName || "Direct Overseas Client",
              clientId: c.id,
              country: p.country || c.country || "",
              location: p.location || c.city || "",
              requiredManpower: calculateProjectManpower(p) || 0,
              status: p.status || "Active",
              createdAt: p.startDate || c.createdAt || "",
            });
          });
        });
      }

      setProjectsList(allProjects);

      setStats((prev) => {
        let updated = { ...prev };

        updated.totalClients = clientList.length;
        updated.activeClients = clientList.filter(
          (c) => (c.status || "active").toLowerCase() === "active"
        ).length;
        updated.totalProjects = allProjects.length;
        updated.activeProjects = allProjects.filter(
          (p) => (p.status || "active").toLowerCase() === "active" || p.status === "in_progress"
        ).length;
        updated.totalRequiredManpower = allProjects.reduce(
          (sum, p) => sum + (Number(p.requiredManpower) || 0),
          0
        );
        updated.activeRequirements = updated.activeProjects;

        if (empRes.status === "fulfilled") {
          const empList = empRes.value?.employees || (Array.isArray(empRes.value) ? empRes.value : []);
          updated.totalEmployees = empList.length;
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          updated.newEmployeesThisMonth = empList.filter((e) => {
            if (!e.createdAt && !e.joiningDate) return false;
            const d = new Date(e.joiningDate || e.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          }).length;
        }

        if (attRes.status === "fulfilled" && Array.isArray(attRes.value?.data)) {
          const att = attRes.value.data;
          updated.presentToday = att.filter(
            (r) => r.status === "Active" || r.status === "Present" || r.status === "Checked Out"
          ).length;
          updated.onLeaveToday = att.filter(
            (r) => r.status === "Leave" || r.status === "On Leave"
          ).length;
        }

        if (leavesRes.status === "fulfilled") {
          const leaves = Array.isArray(leavesRes.value?.data?.leaves)
            ? leavesRes.value.data.leaves
            : Array.isArray(leavesRes.value?.data)
            ? leavesRes.value.data
            : [];
          updated.pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
        }

        if (vendorRes.status === "fulfilled" && vendorRes.value) {
          const v = vendorRes.value;
          updated.totalVendors = v.totalVendors || 0;
          updated.pendingVendors = v.pendingVendors || 0;
          updated.deployedCandidates = v.deployedCandidates || 0;
        }

        if (candRes.status === "fulfilled" && candRes.value?.data?.stats) {
          const cStats = candRes.value.data.stats;
          updated.totalCandidates = cStats.totalCandidates || 0;
          updated.pendingRegistrations = cStats.pendingRegistrations || 0;
          updated.approvedAccounts = cStats.approvedAccounts || 0;
          updated.pendingDocuments = cStats.pendingDocuments || 0;
          updated.eligibleCandidates = cStats.eligibleCandidates || 0;
          updated.totalApplications = cStats.totalApplications || 0;
          updated.interviewsScheduled = cStats.interviewsScheduled || 0;
          updated.selectedCandidates = cStats.selectedCandidates || 0;
          updated.rejectedApplications = cStats.rejectedApplications || 0;
        }

        if (payRes.status === "fulfilled" && payRes.value?.data?.stats) {
          const pStats = payRes.value.data.stats;
          updated.totalReceived = pStats.totalReceived || 0;
          updated.totalReceivable = pStats.totalReceivable || 0;
          updated.totalInvoiced = pStats.totalInvoiced || 0;
          updated.pendingPayments = pStats.totalReceivable || 0;
        }

        return updated;
      });
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  
  const summaryCards = [
    {
      title: "Total HR",
      value: stats.totalEmployees || 0,
      subtitle: "HR Officers & Personnel",
      trend: stats.totalEmployees > 0 ? `${stats.totalEmployees} active` : "0 active",
      icon: UserCheck,
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      to: "/admin/dashboard/workforce",
    },
    {
      title: "Total Clients",
      value: stats.totalClients || 0,
      subtitle: "Active Client Accounts",
      trend: stats.totalClients > 0 ? `${stats.activeClients || stats.totalClients} active` : "0 active",
      icon: Building2,
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      to: "/client/clients",
    },
    {
      title: "Total Vendors",
      value: stats.totalVendors || 0,
      subtitle: "Registered Agencies",
      trend: stats.pendingVendors > 0 ? `${stats.pendingVendors} pending review` : stats.totalVendors > 0 ? `${stats.totalVendors} approved` : "0 registered",
      icon: Briefcase,
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
      to: "/admin/vendor/vendors",
    },
    {
      title: "Total Projects",
      value: stats.totalProjects || 0,
      subtitle: "Active Site Demands",
      trend: stats.totalProjects > 0 ? `${stats.activeProjects || stats.totalProjects} active` : "0 active",
      icon: FolderKanban,
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      to: "/client/projects",
    },
    {
      title: "Candidate Pool",
      value: stats.totalCandidates || 0,
      subtitle: "Candidate Portal Roster",
      trend: stats.pendingRegistrations > 0 ? `${stats.pendingRegistrations} need approval` : `${stats.totalCandidates} registered`,
      icon: Users,
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
      to: "/admin/candidates/all",
    },
    {
      title: "Job Applications",
      value: stats.totalApplications || 0,
      subtitle: "Project Applications",
      trend: `${stats.totalApplications} submitted`,
      icon: Clock,
      badgeBg: "bg-yellow-50 text-yellow-800 border-yellow-200",
      to: "/admin/candidates/applications",
    },
    {
      title: "Selected Candidates",
      value: stats.selectedCandidates || 0,
      subtitle: "Recruitment Cleared",
      trend: stats.selectedCandidates > 0 ? `${stats.selectedCandidates} selected` : "0 selected",
      icon: CheckCircle2,
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      to: "/admin/candidates/selected",
    },
    {
      title: "Inward Receipts",
      value: stats.totalReceived > 0 ? `₹${(stats.totalReceived / 100000).toFixed(1)}L` : "₹0",
      subtitle: "Client Inward Receipts",
      trend: stats.totalReceivable > 0 ? `₹${(stats.totalReceivable / 100000).toFixed(1)}L due` : "All settled",
      icon: TrendingUp,
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      to: "/client/ledger",
    },
  ];

  return (
    <AdminMasterLayout title="Overview" subtitle="Real-time Operational Command Center">
      <div className="relative font-sans pb-3.5 w-full max-w-full overflow-hidden">
        <div className="space-y-3">
          
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl text-white shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white">Operations Command Center</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/hr-activities?tab=vendorHRDashboard&view=overview"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-colors"
              >
                <Briefcase size={13} className="text-cyan-300" />
                <span>Vendor HR Dashboard</span>
              </Link>
              <Link
                to="/admin/meetings"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-xs transition-colors"
              >
                <Calendar size={13} />
                <span>Meeting Calendar</span>
              </Link>
            </div>
          </div>

          <ActiveMeetingAlertBanner />

          <SummaryCardsGrid stats={stats} summaryCards={summaryCards} />

          <DashboardMeetingWidget role={isSuperAdmin ? "SUPER_ADMIN" : "ADMIN"} />

          <HRPerformanceReportSection isSuperAdmin={isSuperAdmin} />

          {!appConfig.FEATURE_FLAGS?.HIDE_CANDIDATE_MODULE && (
            <QuickRecruitmentStrip stats={stats} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-3">
              <OverseasDemandCard totalRequiredManpower={stats.totalRequiredManpower} />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <ActiveProjectsTable projectsList={projectsList} />
            </div>
          </div>

          <RecentActivityStream
            activities={activities}
            loadingActivities={loadingActivities}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            activityPage={activityPage}
            setActivityPage={setActivityPage}
            activityTotalPages={activityTotalPages}
            activityTotal={activityTotal}
          />
        </div>
      </div>
    </AdminMasterLayout>
  );
}

export default MainAdminDashboard;
