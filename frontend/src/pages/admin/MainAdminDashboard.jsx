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
} from "lucide-react";
import AdminMasterLayout from "../../components/admin/layout/AdminMasterLayout.jsx";
import StatusBadge from "../../components/crm/ui/StatusBadge.jsx";
import crmClientService, {
  calculateProjectManpower,
} from "../../services/crmClientService.js";
import crmVendorService from "../../services/crmVendorService.js";
import employeeService from "../../services/employeeService.js";
import apiClient from "../../services/apiClient.js";

export function MainAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    newEmployeesThisMonth: 0,
    presentToday: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
    pendingDocuments: 0,
    totalClients: 0,
    activeClients: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalRequiredManpower: 0,
    activeRequirements: 0,
    totalVendors: 0,
    pendingVendors: 0,
    totalCandidates: 0,
    pendingCandidates: 0,
    selectedCandidates: 0,
    inProcessing: 0,
    pendingPayments: 0,
    deployedCandidates: 0,
  });

  const [projectsList, setProjectsList] = useState([]);
  const [recentClients, setRecentClients] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [crmRes, clientsRes, empRes, attRes, leavesRes, vendorRes] = await Promise.allSettled([
        crmClientService.getDashboardStats(),
        crmClientService.getClients({ limit: 50 }),
        employeeService.getEmployees(),
        apiClient.get("/admin/attendance"),
        apiClient.get("/admin/leaves"),
        crmVendorService.getAdminVendorOverviewStats(),
      ]);

      let allProjects = [];

      if (clientsRes.status === "fulfilled" && clientsRes.value?.clients) {
        const clients = clientsRes.value.clients;
        setRecentClients(clients.slice(0, 5));

        clients.forEach((c) => {
          (c.projects || []).forEach((p) => {
            allProjects.push({
              id: p.id,
              projectName: p.projectName,
              projectType: p.projectType,
              clientName: c.companyName,
              clientId: c.id,
              country: p.country || c.country || "",
              location: p.location || c.city || "",
              requiredManpower: calculateProjectManpower(p) || 0,
              status: p.status || "Pending",
              createdAt: p.startDate || c.createdAt || "",
            });
          });
        });
      }

      setProjectsList(allProjects);

      setStats((prev) => {
        let updated = { ...prev };

        if (crmRes.status === "fulfilled" && crmRes.value) {
          const crm = crmRes.value;
          updated.totalClients = crm.totalClients || prev.totalClients;
          updated.activeClients = crm.activeClients || prev.activeClients;
          updated.totalProjects = crm.totalProjects || prev.totalProjects;
          updated.activeProjects = crm.activeProjects || prev.activeProjects;
          updated.totalRequiredManpower = crm.totalRequiredManpower || prev.totalRequiredManpower;
          updated.activeRequirements = crm.activeRequirements || prev.activeRequirements;
        }

        if (empRes.status === "fulfilled") {
          const empList = empRes.value?.employees || (Array.isArray(empRes.value) ? empRes.value : []);
          if (empList.length > 0) {
            updated.totalEmployees = empList.length;
          }
        }

        if (attRes.status === "fulfilled" && Array.isArray(attRes.value?.data)) {
          const att = attRes.value.data;
          const present = att.filter((r) => r.status === "Active" || r.status === "Present" || r.status === "Checked Out").length;
          const onLeave = att.filter((r) => r.status === "Leave" || r.status === "On Leave").length;
          if (present > 0) updated.presentToday = present;
          if (onLeave > 0) updated.onLeaveToday = onLeave;
        }

        if (leavesRes.status === "fulfilled") {
          const leaves = Array.isArray(leavesRes.value?.data?.leaves)
            ? leavesRes.value.data.leaves
            : Array.isArray(leavesRes.value?.data)
            ? leavesRes.value.data
            : [];
          const pending = leaves.filter((l) => l.status === "Pending").length;
          if (pending > 0) updated.pendingLeaves = pending;
        }

        if (vendorRes.status === "fulfilled" && vendorRes.value) {
          const v = vendorRes.value;
          updated.totalVendors = v.totalVendors;
          updated.pendingVendors = v.pendingVendors;
          updated.totalCandidates = v.totalCandidates;
          updated.pendingCandidates = v.pendingCandidates;
          updated.selectedCandidates = v.selectedCandidates;
          updated.inProcessing = v.inProcessing;
          updated.pendingPayments = v.pendingPayments;
          updated.deployedCandidates = v.deployedCandidates || 0;
        }

        return updated;
      });
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 10 Color-Coded Summary Cards with Professional Hierarchy
  const summaryCards = [
    {
      title: "Total HR",
      value: stats.totalEmployees || 0,
      subtitle: "HR Officers & Personnel",
      trend: "+2 this month",
      icon: UserCheck,
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      to: "/admin/employees",
    },
    {
      title: "Total Clients",
      value: stats.totalClients || 0,
      subtitle: "Active Client Accounts",
      trend: "+4 active",
      icon: Building2,
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      to: "/client/dashboard",
    },
    {
      title: "Total Vendors",
      value: stats.totalVendors || 0,
      subtitle: "Registered Agencies",
      trend: stats.pendingVendors > 0 ? `${stats.pendingVendors} pending review` : "All approved",
      icon: Briefcase,
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
      to: "/admin/vendor/vendors",
    },
    {
      title: "Total Projects",
      value: stats.totalProjects || 0,
      subtitle: "Active Site Demands",
      trend: "+6 new projects",
      icon: FolderKanban,
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      to: "/client/projects",
    },
    {
      title: "Total Candidates",
      value: stats.totalCandidates || 0,
      subtitle: "Candidate Roster Pool",
      trend: "+24 this week",
      icon: Users,
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
      to: "/admin/vendor/candidates",
    },
    {
      title: "Shortlisted Candidates",
      value: stats.pendingCandidates || 0,
      subtitle: "Under Document Review",
      trend: "Ready for interview",
      icon: Clock,
      badgeBg: "bg-yellow-50 text-yellow-800 border-yellow-200",
      to: "/admin/vendor/submissions?status=Shortlisted",
    },
    {
      title: "Interview Scheduled",
      value: stats.selectedCandidates || 0,
      subtitle: "Upcoming Client Interviews",
      trend: "8 today",
      icon: Calendar,
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      to: "/admin/vendor/submissions?status=Interview Scheduled",
    },
    {
      title: "Selected Candidates",
      value: stats.selectedCandidates || 0,
      subtitle: "Client Selection Cleared",
      trend: "In processing pipeline",
      icon: CheckCircle2,
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      to: "/admin/vendor/selected",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments ? `₹${(stats.pendingPayments / 100000).toFixed(1)}L` : "₹0",
      subtitle: "Milestone Fee Pipeline",
      trend: "Due this milestone",
      icon: TrendingUp,
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      to: "/admin/vendor/payments",
    },
    {
      title: "Candidates Joined",
      value: stats.deployedCandidates || 0,
      subtitle: "Successfully Deployed",
      trend: "100% verified",
      icon: Award,
      badgeBg: "bg-green-50 text-green-800 border-green-200",
      to: "/admin/vendor/candidates?tab=Selected",
    },
  ];


  return (
    <AdminMasterLayout title="Overview" subtitle="Real-time Operational Command Center">
      <div className="relative font-sans pb-12">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[2px]"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-3xl orb-blue"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-purple-200/40 rounded-full blur-3xl orb-cyan"></div>
          <div className="absolute top-[30%] right-[10%] w-[25%] h-[25%] bg-blue-200/30 rounded-full blur-3xl orb-orange"></div>
        </div>

        <div className="relative z-10 space-y-8">
          
          {/* Main Stats Header */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 flex flex-col justify-between overflow-hidden relative">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div>
                <h2 className="text-sm font-bold text-indigo-100 uppercase tracking-widest mb-1">Company Workforce</h2>
                <div className="text-4xl font-black mt-2">{stats.totalEmployees}</div>
                <div className="text-xs text-indigo-200 mt-2 font-medium bg-white/10 inline-block px-3 py-1 rounded-full">
                  +{stats.newEmployeesThisMonth} new this month
                </div>
              </div>
              <Link to="/admin/dashboard/workforce" className="mt-6 flex items-center justify-between text-sm font-bold hover:text-white group">
                <span>View HR Dashboard</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                  <ArrowRight size={14} />
                </span>
              </Link>
            </div>

            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {summaryCards.slice(1, 7).map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    to={card.to}
                    className="p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Icon size={80} />
                    </div>
                    <div className="flex items-center justify-between gap-1 mb-4 relative z-10">
                      <span className={`p-2.5 rounded-xl bg-white shadow-sm border font-bold ${card.badgeBg}`}>
                        <Icon size={18} />
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 transition-colors bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                        {card.trend}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <p className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                        {card.value}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {card.title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Actions & Recent Activity - Left Column */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="p-6 bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-500" /> Recent Operations Activity
                </h3>
                <div className="space-y-4">
                  {(stats.recentActivity || []).map((item, i) => (
                    <div key={item.id} className="flex gap-3 relative">
                      {i !== (stats.recentActivity || []).length - 1 && (
                        <div className="absolute left-[11px] top-7 bottom-[-16px] w-0.5 bg-slate-100"></div>
                      )}
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 z-10 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 block">{item.time}</span>
                      </div>
                    </div>
                  ))}
                  {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                    <p className="text-xs text-slate-500 text-center py-4">No recent activity.</p>
                  )}
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <h3 className="text-sm font-bold text-white mb-2">Manpower Requirements</h3>
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-4xl font-black text-white">{stats.totalRequiredManpower}</span>
                  <span className="text-xs text-slate-300 font-medium mb-1">Total Positions</span>
                </div>
                
                <div className="space-y-3">
                  <Link to="/client/clients/new" className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                    <span className="text-xs font-bold">Onboard New Client</span>
                    <Plus size={14} />
                  </Link>
                  <Link to="/client/projects/new" className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                    <span className="text-xs font-bold">Create New Project</span>
                    <Plus size={14} />
                  </Link>
                </div>
              </div>

            </div>

            {/* Active Projects & Pipelines - Right 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <FolderKanban size={20} className="text-indigo-600" />
                      Active Projects Pipeline
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Live tracking of manpower deployment demands</p>
                  </div>
                  <Link
                    to="/client/projects"
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shrink-0"
                  >
                    View All Projects <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="flex-1 overflow-x-auto p-2">
                  {projectsList.length === 0 ? (
                    <div className="p-12 text-center text-xs font-medium text-slate-500 flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <FolderKanban size={24} className="text-slate-300" />
                      </div>
                      No active projects.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-4 px-4">Project</th>
                          <th className="py-4 px-4">Client</th>
                          <th className="py-4 px-4 text-center">Positions</th>
                          <th className="py-4 px-4">Status</th>
                          <th className="py-4 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {projectsList.slice(0, 7).map((proj) => (
                          <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-slate-800 block group-hover:text-indigo-600 transition-colors">
                                {proj.projectName}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="text-slate-400" /> {proj.country}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-600">
                              {proj.clientName}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                {proj.requiredManpower} Reqs
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={proj.status} size="sm" />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                to={`/client/clients/${proj.clientId}/projects/${proj.id}`}
                                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors ml-auto shadow-2xs"
                              >
                                <ArrowRight size={14} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </AdminMasterLayout>
  );
}

export default MainAdminDashboard;
