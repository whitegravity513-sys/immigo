import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  UserCheck,
  FileClock,
  RotateCcw,
  CheckCircle2,
  Briefcase,
  Calendar,
  Award,
  ArrowRight,
  RefreshCw,
  Search,
  Check,
  X,
  ExternalLink,
  AlertCircle,
  Eye,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";

export default function AdminCandidateDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCandidates: 0,
    pendingRegistrations: 0,
    approvedAccounts: 0,
    pendingDocuments: 0,
    documentsRequiringReupload: 0,
    eligibleCandidates: 0,
    totalApplications: 0,
    interviewsScheduled: 0,
    selectedCandidates: 0,
    rejectedApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, regRes, appRes] = await Promise.all([
        apiClient.get("/admin/candidates/stats"),
        apiClient.get("/admin/candidates/list?accountStatus=Pending Approval&limit=5"),
        apiClient.get("/admin/candidates/applications/list?limit=5"),
      ]);

      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
      if (regRes.data?.candidates) {
        setRecentRegistrations(regRes.data.candidates);
      }
      if (appRes.data?.applications) {
        setRecentApplications(appRes.data.applications);
      }
    } catch (err) {
      console.error("Failed to fetch candidate dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => {
      fetchDashboardData();
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
  }, []);

  const handleQuickApprove = async (candidateId, name) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/admin/candidates/${candidateId}/approve`);
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Candidate ${name} (${candidateId}) approved successfully. Approval email dispatched.`,
        });
        fetchDashboardData();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to approve registration.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const statCards = [
    {
      title: "Total Candidates",
      value: stats.totalCandidates,
      icon: Users,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      path: "/admin/candidates/all",
      badge: "Total",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      icon: UserPlus,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      path: "/admin/candidates/new-registrations",
      badge: "Action Required",
      highlight: stats.pendingRegistrations > 0,
    },
    {
      title: "Approved Accounts",
      value: stats.approvedAccounts,
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      path: "/admin/candidates/all?accountStatus=Approved",
      badge: "Active",
    },
    {
      title: "Pending Documents",
      value: stats.pendingDocuments,
      icon: FileClock,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      path: "/admin/candidates/documents",
      badge: "Verification",
    },
    {
      title: "Docs Requiring Re-upload",
      value: stats.documentsRequiringReupload,
      icon: RotateCcw,
      color: "bg-rose-50 text-rose-700 border-rose-200",
      path: "/admin/candidates/documents?status=Re-upload Required",
      badge: "Correction",
    },
    {
      title: "Eligible Candidates",
      value: stats.eligibleCandidates,
      icon: CheckCircle2,
      color: "bg-teal-50 text-teal-700 border-teal-200",
      path: "/admin/candidates/all?jobApplicationAccess=Unlocked",
      badge: "Ready to Deploy",
    },
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: Briefcase,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      path: "/admin/candidates/applications",
      badge: "Submissions",
    },
    {
      title: "Interviews Scheduled",
      value: stats.interviewsScheduled,
      icon: Calendar,
      color: "bg-sky-50 text-sky-700 border-sky-200",
      path: "/admin/candidates/interviews",
      badge: "Upcoming",
    },
    {
      title: "Selected Candidates",
      value: stats.selectedCandidates,
      icon: Award,
      color: "bg-emerald-50 text-emerald-800 border-emerald-300",
      path: "/admin/candidates/selected",
      badge: "Successful",
    },
  ];

  return (
    <div className="space-y-3.5">
      {notification && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between shadow-xs transition-all text-xs ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-sm sm:text-base font-bold text-[#0f2744]">
            Candidate Management Overview
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Real-time pipeline metrics for public registrations, compliance, and project recruitment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/candidates/new-registrations"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus size={12} />
            <span>Review Registrations</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className={`p-2.5 sm:p-3 rounded-xl border bg-white shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                card.highlight ? "border-amber-400 ring-1 ring-amber-200" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className={`p-1.5 rounded-lg border ${card.color}`}>
                  <Icon size={14} />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                  {card.badge}
                </span>
              </div>

              <div className="mt-1.5">
                <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
                  {loading ? "..." : card.value}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 mt-1 truncate leading-tight" title={card.title}>
                  {card.title}
                </div>
              </div>

              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9.5px] font-semibold text-blue-600 group-hover:text-blue-800">
                <span>View details</span>
                <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <UserPlus size={14} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  New Registrations Awaiting Review
                </h3>
                <p className="text-[10px] text-slate-500">
                  Candidates waiting for account approval
                </p>
              </div>
            </div>
            <Link
              to="/admin/candidates/new-registrations"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
            {recentRegistrations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                No registrations currently pending approval.
              </div>
            ) : (
              recentRegistrations.map((cand) => (
                <div
                  key={cand.candidateId}
                  className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {cand.fullName}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        {cand.candidateId}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {cand.email} &bull; {cand.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => navigate(`/admin/candidates/new-registrations?id=${cand.candidateId}`)}
                      className="p-1 rounded-md text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => handleQuickApprove(cand.candidateId, cand.fullName)}
                      disabled={actionLoading}
                      className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                      title="Approve Candidate"
                    >
                      <Check size={11} />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Briefcase size={14} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Recent Project Applications
                </h3>
                <p className="text-[10px] text-slate-500">
                  Applications submitted by eligible candidates
                </p>
              </div>
            </div>
            <Link
              to="/admin/candidates/applications"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
            {recentApplications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">
                No project applications submitted yet.
              </div>
            ) : (
              recentApplications.map((app) => (
                <div
                  key={app.applicationId}
                  className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {app.candidateName}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        &bull; {app.position} ({app.projectName})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Applied {new Date(app.appliedAt).toLocaleDateString()} &bull; {app.destinationCountry}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

