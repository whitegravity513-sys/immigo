import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  FolderKanban,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  ExternalLink,
  Briefcase,
  UserCheck,
  Calendar,
  Award,
  Receipt,
} from "lucide-react";
import AdminMasterLayout from "../../components/admin/layout/AdminMasterLayout.jsx";
import StatusBadge from "../../components/crm/ui/StatusBadge.jsx";
import crmClientService, {
  calculateProjectManpower,
} from "../../services/crmClientService.js";
import crmVendorService from "../../services/crmVendorService.js";
import employeeService from "../../services/employeeService.js";
import apiClient from "../../services/apiClient.js";
import activityService from "../../services/activityService.js";

export function MainAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    // HR / Workforce
    totalEmployees: 0,
    newEmployeesThisMonth: 0,
    presentToday: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,

    // CRM Clients & Projects
    totalClients: 0,
    activeClients: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalRequiredManpower: 0,
    activeRequirements: 0,

    // Vendors
    totalVendors: 0,
    pendingVendors: 0,

    // Candidate Management & Recruitment Pipeline
    totalCandidates: 0,
    pendingRegistrations: 0,
    approvedAccounts: 0,
    pendingDocuments: 0,
    eligibleCandidates: 0,
    totalApplications: 0,
    interviewsScheduled: 0,
    selectedCandidates: 0,
    rejectedApplications: 0,

    // Payments & Ledger
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

    const handleUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener("immigo:application-update", handleUpdate);
    window.addEventListener("immigo:candidate-update", handleUpdate);
    window.addEventListener("immigo:dashboard-update", handleUpdate);
    window.addEventListener("immigo:vendor-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
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

        // 1. Clients & Projects Real Data
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

        // 2. HR & Workforce Real Data
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

        // 3. Vendor Management Real Data
        if (vendorRes.status === "fulfilled" && vendorRes.value) {
          const v = vendorRes.value;
          updated.totalVendors = v.totalVendors || 0;
          updated.pendingVendors = v.pendingVendors || 0;
          updated.deployedCandidates = v.deployedCandidates || 0;
        }

        // 4. Candidate Portal Management Real Data
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

        // 5. Client Payment & Ledger Stats Real Data
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
          
          {/* Top Section: Workforce Card + 6 Management Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-1 p-3 sm:p-3.5 rounded-lg bg-indigo-600 text-white shadow-xs flex flex-col justify-between overflow-hidden relative">
              <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
              <div>
                <h2 className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Company Workforce</h2>
                <div className="text-2xl font-bold mt-0.5">{stats.totalEmployees}</div>
                <div className="text-[11px] text-indigo-100 mt-1.5 font-medium bg-white/15 inline-block px-2.5 py-0.5 rounded-full">
                  {stats.presentToday > 0 ? `${stats.presentToday} present today` : stats.newEmployeesThisMonth > 0 ? `+${stats.newEmployeesThisMonth} new this month` : "Active staff"}
                </div>
              </div>
              <Link to="/admin/dashboard/workforce" className="mt-3 pt-2 border-t border-indigo-500/50 flex items-center justify-between text-xs font-bold hover:text-white group">
                <span>View HR Dashboard</span>
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                  <ArrowRight size={12} />
                </span>
              </Link>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {summaryCards.slice(1, 7).map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    to={card.to}
                    className="p-2.5 sm:p-3 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
                      <span className={`p-1.5 rounded-lg border font-bold ${card.badgeBg}`}>
                        <Icon size={15} />
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100 truncate max-w-[110px]">
                        {card.trend}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <p className="text-lg font-bold text-slate-800 tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                        {card.value}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                        {card.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Real-time Candidate & Recruitment Operations Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
            <Link
              to="/admin/candidates/new-registrations"
              className="p-2 sm:p-2.5 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/70 rounded-lg transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[10px] font-bold uppercase tracking-wider">New Registrations</span>
                <Clock size={12} className="text-amber-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-amber-950 mt-1">
                {stats.pendingRegistrations}
              </div>
              <span className="text-[9px] text-amber-700/80 font-semibold group-hover:underline">
                Review &rarr;
              </span>
            </Link>

            <Link
              to="/admin/candidates/documents"
              className="p-2 sm:p-2.5 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/70 rounded-lg transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-indigo-800">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pending Docs</span>
                <FileText size={12} className="text-indigo-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-indigo-950 mt-1">
                {stats.pendingDocuments}
              </div>
              <span className="text-[9px] text-indigo-700/80 font-semibold group-hover:underline">
                Verify docs &rarr;
              </span>
            </Link>

            <Link
              to="/admin/candidates/applications"
              className="p-2 sm:p-2.5 bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/70 rounded-lg transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-sky-800">
                <span className="text-[10px] font-bold uppercase tracking-wider">Applications</span>
                <Briefcase size={12} className="text-sky-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-sky-950 mt-1">
                {stats.totalApplications}
              </div>
              <span className="text-[9px] text-sky-700/80 font-semibold group-hover:underline">
                View pipeline &rarr;
              </span>
            </Link>

            <Link
              to="/admin/candidates/interviews"
              className="p-2 sm:p-2.5 bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/70 rounded-lg transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-purple-800">
                <span className="text-[10px] font-bold uppercase tracking-wider">Interviews</span>
                <Calendar size={12} className="text-purple-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-purple-950 mt-1">
                {stats.interviewsScheduled}
              </div>
              <span className="text-[9px] text-purple-700/80 font-semibold group-hover:underline">
                Schedule &rarr;
              </span>
            </Link>

            <Link
              to="/admin/candidates/selected"
              className="p-2 sm:p-2.5 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/70 rounded-lg transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[10px] font-bold uppercase tracking-wider">Selected</span>
                <Award size={12} className="text-emerald-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-emerald-950 mt-1">
                {stats.selectedCandidates}
              </div>
              <span className="text-[9px] text-emerald-700/80 font-semibold group-hover:underline">
                Deployments &rarr;
              </span>
            </Link>

            <Link
              to="/client/ledger"
              className="p-2 sm:p-2.5 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/70 rounded-lg transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-teal-800">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Inward</span>
                <TrendingUp size={12} className="text-teal-600" />
              </div>
              <div className="text-base sm:text-lg font-bold text-teal-950 mt-1">
                {stats.totalReceived > 0 ? `₹${(stats.totalReceived / 100000).toFixed(1)}L` : "₹0"}
              </div>
              <span className="text-[9px] text-teal-700/80 font-semibold group-hover:underline">
                Open ledger &rarr;
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {}
            <div className="lg:col-span-1 space-y-3">
              <div className="p-3 sm:p-3.5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-lg text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                    Overseas Manpower Demand
                  </span>
                  <div className="flex items-baseline gap-2 mt-1 mb-3">
                    <span className="text-2xl font-bold text-white">{stats.totalRequiredManpower}</span>
                    <span className="text-[11px] text-slate-300 font-medium">Active Open Positions</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/10 text-xs font-bold">
                  <Link
                    to="/client/clients/new"
                    className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
                  >
                    <span>+ Client</span>
                    <Plus size={12} />
                  </Link>
                  <Link
                    to="/client/projects/new"
                    className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
                  >
                    <span>+ Project</span>
                    <Plus size={12} />
                  </Link>
                  <Link
                    to="/admin/vendor"
                    className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
                  >
                    <span>Vendors</span>
                    <ArrowRight size={12} />
                  </Link>
                  <Link
                    to="/client/ledger"
                    className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
                  >
                    <span>Ledger</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {}
            <div className="lg:col-span-2 space-y-4">
              
              <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full">
                <div className="p-2.5 sm:p-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FolderKanban size={17} className="text-indigo-600" />
                      Active Projects Pipeline (Latest 5)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Live tracking of overseas manpower deployment demands</p>
                  </div>
                  <Link
                    to="/client/projects"
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                  >
                    <span>See All ({projectsList.length})</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="flex-1 overflow-x-auto">
                  {projectsList.length === 0 ? (
                    <div className="p-8 text-center text-xs font-medium text-slate-500 flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                        <FolderKanban size={20} className="text-slate-300" />
                      </div>
                      No active projects.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-1.5 px-3">Project</th>
                          <th className="py-1.5 px-3">Client</th>
                          <th className="py-1.5 px-3 text-center">Positions</th>
                          <th className="py-1.5 px-3">Status</th>
                          <th className="py-1.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {projectsList.slice(0, 5).map((proj) => (
                          <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors group">
                            <td className="py-1.5 px-3">
                              <span className="font-bold text-slate-800 block group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">
                                {proj.projectName}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="text-slate-400" /> {proj.country}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 font-semibold text-slate-700 truncate max-w-[140px]">
                              {proj.clientName}
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                {proj.requiredManpower} Reqs
                              </span>
                            </td>
                            <td className="py-1.5 px-3">
                              <StatusBadge status={proj.status} size="sm" />
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              <Link
                                to={`/client/clients/${proj.clientId}/projects/${proj.id}`}
                                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors ml-auto shadow-2xs"
                                title="View Project"
                              >
                                <ArrowRight size={13} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {}
                {projectsList.length > 5 && (
                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Showing 5 of {projectsList.length} active projects
                    </span>
                    <Link
                      to="/client/projects"
                      className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>See All Projects ({projectsList.length})</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {}
          <div className="w-full bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden mt-1">
            <div className="p-2.5 sm:px-3 sm:py-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity size={15} className="text-blue-600" />
                  <span>Recent Activity & Updates</span>
                </h3>
                <p className="text-[10px] text-slate-500">
                  Live operational updates across Employee HR, Vendors, Projects, Clients, and Payments.
                </p>
              </div>

              {}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={activityFilter}
                  onChange={(e) => {
                    setActivityFilter(e.target.value);
                    setActivityPage(1);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Updates</option>
                  <option value="EMPLOYEE">Employees & HR</option>
                  <option value="VENDOR">Vendors</option>
                  <option value="PROJECT">Projects</option>
                  <option value="CLIENT">Clients</option>
                  <option value="CLIENT_PAYMENT">Payments</option>
                </select>

                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                  {activityTotal} events
                </span>
              </div>
            </div>

            {loadingActivities ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                Loading activity feed...
              </div>
            ) : activities.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <Activity size={20} className="mx-auto text-slate-300 mb-1.5" />
                No activity recorded yet for the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[240px] overflow-y-auto">
                {activities.map((act) => {
                  const entityColors = {
                    VENDOR: "bg-purple-50 text-purple-700 border-purple-200",
                    Vendor: "bg-purple-50 text-purple-700 border-purple-200",
                    EMPLOYEE: "bg-blue-50 text-blue-700 border-blue-200",
                    Employee: "bg-blue-50 text-blue-700 border-blue-200",
                    Leave: "bg-amber-50 text-amber-700 border-amber-200",
                    CLIENT: "bg-cyan-50 text-cyan-700 border-cyan-200",
                    Client: "bg-cyan-50 text-cyan-700 border-cyan-200",
                    CLIENT_PAYMENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    Payment: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    PROJECT: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    Project: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    CANDIDATE: "bg-amber-50 text-amber-700 border-amber-200",
                    Candidate: "bg-amber-50 text-amber-700 border-amber-200",
                  };

                  const getEntityIcon = (type) => {
                    const t = (type || "").toUpperCase();
                    if (t.includes("VENDOR")) return <Briefcase size={12} className="text-purple-600" />;
                    if (t.includes("EMPLOYEE") || t.includes("LEAVE")) return <Users size={12} className="text-blue-600" />;
                    if (t.includes("PAYMENT")) return <Receipt size={12} className="text-emerald-600" />;
                    if (t.includes("PROJECT")) return <FolderKanban size={12} className="text-indigo-600" />;
                    if (t.includes("CLIENT")) return <Building2 size={12} className="text-cyan-600" />;
                    return <Activity size={12} className="text-slate-600" />;
                  };

                  const formatDate = (iso) => {
                    if (!iso) return "—";
                    try {
                      const d = new Date(iso);
                      return d.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return iso;
                    }
                  };

                  return (
                    <div
                      key={act._id || act.id}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          {getEntityIcon(act.entityType)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[11px] text-slate-900 truncate">
                              {act.userName || "System Admin"}
                            </span>
                            <span className="text-[11px] text-slate-600 font-medium">
                              {act.action}
                            </span>
                            {act.status && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
                                {act.status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                            {act.entityType && (
                              <span className={`px-1 py-0.2 rounded font-bold text-[9px] border ${entityColors[act.entityType] || "bg-slate-100 text-slate-600"}`}>
                                {act.entityType.replace("_", " ")}
                              </span>
                            )}
                            {act.entityName && (
                              <span className="font-medium text-slate-700 truncate max-w-[180px] sm:max-w-none">
                                {act.entityName}
                              </span>
                            )}
                            {act.details && (
                              <span className="text-slate-400 truncate max-w-[200px] sm:max-w-none">
                                • {act.details}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                        {formatDate(act.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {}
            {activityTotalPages > 1 && (
              <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">
                  Page {activityPage} of {activityTotalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={activityPage <= 1}
                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-bold text-[10px] disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={activityPage >= activityTotalPages}
                    onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-bold text-[10px] disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminMasterLayout>
  );
}

export default MainAdminDashboard;
