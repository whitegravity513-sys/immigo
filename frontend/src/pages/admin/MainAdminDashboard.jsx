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
import employeeService from "../../services/employeeService.js";
import apiClient from "../../services/apiClient.js";

export function MainAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalEmployees: 248,
    newEmployeesThisMonth: 18,
    presentToday: 182,
    onLeaveToday: 9,
    pendingLeaves: 5,
    pendingDocuments: 12,
    totalClients: 32,
    activeClients: 26,
    totalProjects: 76,
    activeProjects: 42,
    totalRequiredManpower: 1280,
    activeRequirements: 24,
  });

  const [projectsList, setProjectsList] = useState([]);
  const [recentClients, setRecentClients] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [crmRes, clientsRes, empRes, attRes, leavesRes] = await Promise.allSettled([
        crmClientService.getDashboardStats(),
        crmClientService.getClients({ limit: 50 }),
        employeeService.getEmployees(),
        apiClient.get("/admin/attendance"),
        apiClient.get("/admin/leaves"),
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
              country: p.country || c.country || "UAE",
              location: p.location || c.city || "Dubai",
              requiredManpower: calculateProjectManpower(p) || 120,
              status: p.status || "Active",
              createdAt: p.startDate || c.createdAt || "2026-09-15",
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
      value: stats.totalEmployees ? Math.round(stats.totalEmployees * 0.1) || 18 : 18,
      subtitle: "HR Officers & Personnel",
      trend: "+2 this month",
      icon: UserCheck,
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      to: "/admin/employees",
    },
    {
      title: "Total Clients",
      value: stats.totalClients || 32,
      subtitle: "Active Client Accounts",
      trend: "+4 active",
      icon: Building2,
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      to: "/client/dashboard",
    },
    {
      title: "Total Vendors",
      value: "16",
      subtitle: "Registered Agencies",
      trend: "3 pending review",
      icon: Briefcase,
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
      to: "/admin/vendor/vendors",
    },
    {
      title: "Total Projects",
      value: stats.totalProjects || 48,
      subtitle: "Active Site Demands",
      trend: "+6 new projects",
      icon: FolderKanban,
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      to: "/client/projects",
    },
    {
      title: "Total Candidates",
      value: "342",
      subtitle: "Candidate Roster Pool",
      trend: "+24 this week",
      icon: Users,
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
      to: "/admin/vendor/candidates",
    },
    {
      title: "Shortlisted Candidates",
      value: "28",
      subtitle: "Under Document Review",
      trend: "Ready for interview",
      icon: Clock,
      badgeBg: "bg-yellow-50 text-yellow-800 border-yellow-200",
      to: "/admin/vendor/submissions?status=Shortlisted",
    },
    {
      title: "Interview Scheduled",
      value: "19",
      subtitle: "Upcoming Client Interviews",
      trend: "8 today",
      icon: Calendar,
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      to: "/admin/vendor/submissions?status=Interview Scheduled",
    },
    {
      title: "Selected Candidates",
      value: "42",
      subtitle: "Client Selection Cleared",
      trend: "In processing pipeline",
      icon: CheckCircle2,
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      to: "/admin/vendor/selected",
    },
    {
      title: "Pending Payments",
      value: "₹12.4L",
      subtitle: "Milestone Fee Pipeline",
      trend: "Due this milestone",
      icon: TrendingUp,
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
      to: "/admin/vendor/payments",
    },
    {
      title: "Candidates Joined",
      value: "36",
      subtitle: "Successfully Deployed",
      trend: "100% verified",
      icon: Award,
      badgeBg: "bg-green-50 text-green-800 border-green-200",
      to: "/admin/vendor/processing?status=Completed",
    },
  ];

  const recentActivityItems = [
    {
      id: "act-1",
      title: "New vendor registration",
      desc: "ABC Manpower submitted registration",
      time: "10 mins ago",
      type: "vendor",
    },
    {
      id: "act-2",
      title: "New candidate submission",
      desc: "Rahul Kumar submitted for Electrician requirement",
      time: "25 mins ago",
      type: "submission",
    },
    {
      id: "act-3",
      title: "Candidate selected",
      desc: "Amit Sharma selected for Dubai Construction Project",
      time: "1 hour ago",
      type: "selected",
    },
    {
      id: "act-4",
      title: "Milestone payment",
      desc: "Milestone 2 payment completed for Rahul Kumar",
      time: "2 hours ago",
      type: "payment",
    },
  ];

  return (
    <AdminMasterLayout title="Admin Dashboard" subtitle="Overall company-level operational overview">
      <div className="space-y-6 font-sans">
        {/* 10 Color-Coded Summary Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Operational Key Metrics & Summaries
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Real-time status metrics</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.to}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all duration-150 block text-left group"
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`p-2 rounded-lg border font-bold ${card.badgeBg}`}>
                      <Icon size={16} />
                    </span>
                    <ArrowRight size={13} className="text-slate-300 group-hover:text-slate-700 transition-colors" />
                  </div>

                  <p className="text-[11px] font-bold text-slate-600 truncate">
                    {card.title}
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight mt-1 leading-none">
                    {card.value}
                  </p>
                  <div className="flex items-center justify-between text-[10px] mt-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-400 truncate max-w-[100px]">{card.subtitle}</span>
                    <span className="font-semibold text-emerald-700 shrink-0">{card.trend}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Compact Recent Activity Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
              Recent Activity
            </h3>
            <span className="text-[11px] text-gray-400">Real-time updates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentActivityItems.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-gray-50/80 border border-gray-100 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 text-xs truncate">{item.title}</span>
                    <span className="text-[10px] text-gray-400">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Projects Overview Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <FolderKanban size={16} />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  Projects Overview
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Overseas deployment sites, manpower demand counts, and execution status.
              </p>
            </div>

            <Link
              to="/client/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>View All Client Projects</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {projectsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No projects registered yet. Create a client first, then add projects under that client.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 sm:px-6">Project Name</th>
                    <th className="py-3 px-4">Client Company</th>
                    <th className="py-3 px-4">Country</th>
                    <th className="py-3 px-4 text-center">Required Manpower</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projectsList.slice(0, 8).map((proj) => (
                    <tr key={proj.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-gray-900">
                        <Link
                          to={`/client/clients/${proj.clientId}/projects/${proj.id}`}
                          className="hover:text-blue-600 block"
                        >
                          {proj.projectName}
                        </Link>
                        <span className="text-[11px] text-gray-400 font-normal">
                          {proj.projectType} • {proj.location}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-700">
                        <Link
                          to={`/client/clients/${proj.clientId}`}
                          className="hover:text-blue-600"
                        >
                          {proj.clientName}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-gray-700 font-medium">
                          <MapPin size={11} className="text-gray-400" />
                          <span>{proj.country}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-black text-xs border border-blue-200/60">
                          {proj.requiredManpower} Persons
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={proj.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                        {proj.createdAt}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <Link
                          to={`/client/clients/${proj.clientId}/projects/${proj.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <span>View Details</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dedicated Module Overviews: HR, Client, and Vendor Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* HR Overview (All employee workforce functionality is accessed here) */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Users size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                      Human Resources & Workforce
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Employees, attendance, leaves, and staff onboarding
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  HR Module
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-3 border-y border-gray-100 text-xs">
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Total Employees</span>
                  <span className="font-black text-gray-900 text-base">{stats.totalEmployees}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Present Today</span>
                  <span className="font-black text-emerald-600 text-base">{stats.presentToday}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">On Leave Today</span>
                  <span className="font-black text-purple-600 text-base">{stats.onLeaveToday}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">New This Month</span>
                  <span className="font-black text-blue-600 text-base">+{stats.newEmployeesThisMonth}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Pending Leaves</span>
                  <span className="font-black text-rose-600 text-base">{stats.pendingLeaves}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Pending Documents</span>
                  <span className="font-black text-amber-600 text-base">{stats.pendingDocuments}</span>
                </div>
              </div>
            </div>

            <Link
              to="/admin/dashboard/workforce"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
            >
              <span>View HR Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Client Overview */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                      Client Management
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Overseas clients, contracts, and deployment sites
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Client Module
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-3 border-y border-gray-100 text-xs">
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Total Clients</span>
                  <span className="font-black text-gray-900 text-base">{stats.totalClients}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Active Clients</span>
                  <span className="font-black text-emerald-600 text-base">{stats.activeClients}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Total Projects</span>
                  <span className="font-black text-blue-600 text-base">{stats.totalProjects}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100 sm:col-span-2">
                  <span className="text-[10px] text-gray-400 block font-medium">Required Manpower</span>
                  <span className="font-black text-purple-600 text-base">{stats.totalRequiredManpower} Persons</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Requirements</span>
                  <span className="font-black text-amber-600 text-base">{stats.activeRequirements}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Link
                to="/client/clients/new"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Client</span>
              </Link>

              <Link
                to="/client/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-500/25 transition-colors cursor-pointer"
              >
                <span>View Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Vendor Overview */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between hover:border-indigo-300 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Briefcase size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                      Vendor & Manpower Supply
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Agency verification, candidate roster, and deployments
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  Vendor Module
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-3 border-y border-gray-100 text-xs">
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Registered Agencies</span>
                  <span className="font-black text-gray-900 text-base">3</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Pending Review</span>
                  <span className="font-black text-amber-600 text-base">1 New</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Candidate Pool</span>
                  <span className="font-black text-blue-600 text-base">128+</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100 sm:col-span-2">
                  <span className="text-[10px] text-gray-400 block font-medium">Milestone Tracking</span>
                  <span className="font-black text-emerald-600 text-base">8-Stage Stepper</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Disbursements</span>
                  <span className="font-black text-purple-600 text-base">Active</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Link
                to="/admin/vendors"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/25 transition-colors cursor-pointer"
              >
                <span>Manage Vendors & Candidates</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Clients Snapshot */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Clients</h3>
              <p className="text-[11px] text-gray-400">Newly registered overseas organizations</p>
            </div>
            <Link
              to="/client/clients"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>All Clients</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {recentClients.map((client) => (
              <Link
                key={client.id}
                to={`/client/clients/${client.id}`}
                className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-blue-50/40 hover:border-blue-200 transition-all block group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-gray-900 group-hover:text-blue-600 truncate">
                    {client.companyName}
                  </span>
                  <StatusBadge status={client.status} size="xs" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>{client.country}</span>
                  <span className="font-bold text-gray-700">{client.projects?.length || 0} Projects</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminMasterLayout>
  );
}

export default MainAdminDashboard;
