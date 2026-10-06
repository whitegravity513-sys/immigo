import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  GitCommit,
  Award,
  Plus,
  ArrowRight,
  FolderKanban,
  CreditCard,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

export function VendorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const vendor = crmVendorService.getCurrentVendor();

  useEffect(() => {
    loadDashboardData();
  }, [vendor?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await crmVendorService.getVendorDashboardStats(vendor?.id);
      setStats(data);
    } catch (err) {
      console.error("Failed to load vendor dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Selected":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Under Review":
      case "Shortlisted":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Submitted":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Rejected":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "Processing":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "Completed":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const CARDS = [
    {
      title: "Total Candidates",
      value: stats?.totalCandidates ?? 128,
      subtitle: "In your candidate pool",
      icon: Users,
      color: "blue",
      to: "/vendor/candidates",
    },
    {
      title: "Submitted",
      value: stats?.submitted ?? 56,
      subtitle: "To client projects",
      icon: Send,
      color: "indigo",
      to: "/vendor/applications",
    },
    {
      title: "Under Review",
      value: stats?.underReview ?? 10,
      subtitle: "Awaiting client review",
      icon: Clock,
      color: "amber",
      to: "/vendor/applications?status=Under%20Review",
    },
    {
      title: "Selected",
      value: stats?.selected ?? 21,
      subtitle: "Hired for deployment",
      icon: CheckCircle2,
      color: "emerald",
      to: "/vendor/selected",
    },
    {
      title: "Rejected",
      value: stats?.rejected ?? 31,
      subtitle: "Reusable for other projects",
      icon: XCircle,
      color: "rose",
      to: "/vendor/rejected",
    },
    {
      title: "In Processing",
      value: stats?.inProcessing ?? 14,
      subtitle: "Visa, medical & travel",
      icon: GitCommit,
      color: "purple",
      to: "/vendor/processing",
    },
    {
      title: "Completed",
      value: stats?.completed ?? 7,
      subtitle: "Deployed on site",
      icon: Award,
      color: "teal",
      to: "/vendor/selected",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-xl p-3.5 sm:p-4 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border border-blue-800/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-400/20">
              Verified Manpower Partner
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight mt-1">
            Welcome, {vendor?.companyName || "ABC Manpower Consultants"}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 max-w-xl leading-snug">
            Manage your candidates, submit profiles to verified overseas employer projects, and track deployment milestones & payments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
          <Link
            to="/vendor/candidates/add"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={14} className="text-blue-600" />
            <span>+ Add Candidate</span>
          </Link>
          <Link
            to="/vendor/submit-candidate"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Send size={13} />
            <span>Submit to Project</span>
          </Link>
        </div>
      </div>

      {/* Clickable Summary Metric Cards (Section 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-3.5">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all duration-150 block text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <Icon size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                {card.value}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {card.subtitle}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Recent Candidate Activity (Section 7) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Recent Candidate Activity
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status updates for recent candidate project submissions.
            </p>
          </div>
          <Link
            to="/vendor/applications"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.recentActivity || []).slice(0, 5).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <Link
                      to={`/vendor/candidates/${row.candidateId}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {row.candidateName}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {row.position}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                    {row.projectName}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-blue-500" />
                      <span>{row.country}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <Link
                      to={`/vendor/candidates/${row.candidateId}`}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-colors"
                    >
                      View
                    </Link>
                    {row.status === "Selected" && (
                      <Link
                        to="/vendor/processing"
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-[11px] transition-colors"
                      >
                        Track
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* See All Candidates Footer Bar */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-200/80 text-center">
          <Link
            to="/vendor/applications"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
          >
            <span>See All Candidate Submissions & Roster →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
