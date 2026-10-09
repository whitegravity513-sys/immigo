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
  Eye,
  Briefcase,
  FileText,
  X,
  Check,
  ShieldCheck,
  Globe,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import MouFullPageView from "../../components/vendor/MouFullPageView.jsx";

export function VendorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMouPage, setShowMouPage] = useState(false);
  const vendor = crmVendorService.getCurrentVendor();

  useEffect(() => {
    loadDashboardData();
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
      value: stats?.totalCandidates ?? 0,
      subtitle: "In your candidate pool",
      icon: Users,
      color: "blue",
      to: "/vendor/candidates",
    },
    {
      title: "Submitted",
      value: stats?.submitted ?? 0,
      subtitle: "To client projects",
      icon: Send,
      color: "indigo",
      to: "/vendor/applications",
    },
    {
      title: "Under Review",
      value: stats?.underReview ?? 0,
      subtitle: "Awaiting client review",
      icon: Clock,
      color: "amber",
      to: "/vendor/applications?status=Under%20Review",
    },
    {
      title: "Selected",
      value: stats?.selected ?? 0,
      subtitle: "Hired for deployment",
      icon: CheckCircle2,
      color: "emerald",
      to: "/vendor/selected",
    },
    {
      title: "Rejected",
      value: stats?.rejected ?? 0,
      subtitle: "Reusable for other projects",
      icon: XCircle,
      color: "rose",
      to: "/vendor/rejected",
    },
    {
      title: "In Processing",
      value: stats?.inProcessing ?? 0,
      subtitle: "Visa, medical & travel",
      icon: GitCommit,
      color: "purple",
      to: "/vendor/candidates?tab=selected",
    },
    {
      title: "Completed",
      value: stats?.completed ?? 0,
      subtitle: "Deployed on site",
      icon: Award,
      color: "teal",
      to: "/vendor/selected",
    },
  ];

  // File Upload Logic
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB.");
      return;
    }

    // Simulate upload and update vendor
    try {
      const updated = await crmVendorService.updateVendorDocuments(vendor.id, true);
      // Reload page to reflect changes
      window.location.reload();
    } catch (err) {
      alert("Failed to upload document.");
    }
  };

  if (showMouPage) {
    return (
      <div className="space-y-6">
        <MouFullPageView
          mode="preview"
          vendor={vendor}
          onBack={() => setShowMouPage(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-xl p-3.5 sm:p-4 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border border-blue-800/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {vendor?.status === "Pending MOU Approval" || (vendor?.mouSigned && vendor?.status !== "Approved") ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/20">
                <Clock size={12} className="text-amber-400" />
                MOU Signed &bull; Pending Admin Approval (Full Access Unlocked)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/20">
                <CheckCircle2 size={12} className="text-emerald-400" />
                Verified Partner &bull; MOU Executed
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-300">
              ID: {vendor?.id || vendor?.vendorId || "VND"}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight mt-1">
            Welcome, {vendor?.companyName || vendor?.contactPersonName || "Vendor Partner"}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 max-w-xl leading-snug">
            Manage your candidates, submit profiles to verified overseas employer projects, and track deployment milestones & payments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setShowMouPage(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-200 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <FileText size={13} />
            <span>View Executed MOU</span>
          </button>
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

      {/* Active Available Projects */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FolderKanban size={16} className="text-blue-600" />
              My Assigned Projects
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active projects accepting candidate submissions.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Trades / Roles</th>
                <th className="py-3 px-4">Headcount Req.</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.availableProjects && stats.availableProjects.length > 0 ? (
                stats.availableProjects.map((proj) => {
                  const trades = proj.manpowerRequirements || [];
                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 truncate max-w-[200px]">
                        <Link
                          to={`/vendor/projects/${proj.id}`}
                          className="hover:text-blue-600 hover:underline text-left font-bold transition-colors block truncate"
                        >
                          {proj.projectName}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-700 truncate max-w-[150px]">
                        {proj.clientName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-blue-500 shrink-0" />
                          <span>{proj.country}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {trades.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1 max-w-[280px]">
                            {trades.slice(0, 2).map((t, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                              >
                                {t.position || t.positionTitle || "Role"}
                                {t.quantity ? ` (${t.quantity})` : ""}
                              </span>
                            ))}
                            {trades.length > 2 && (
                              <Link
                                to={`/vendor/projects/${proj.id}`}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors"
                              >
                                +{trades.length - 2} more
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">General / All Trades</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} className="text-slate-400" />
                          <span>{proj.totalHeadcount || "N/A"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/vendor/projects/${proj.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                            title="View Full Project Details (New Page)"
                          >
                            <Eye size={12} className="text-slate-500" />
                            <span>View</span>
                          </Link>
                          <Link
                            to={`/vendor/submit-candidate?project=${proj.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition-colors"
                          >
                            <Send size={11} />
                            <span>Submit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500 italic text-xs">
                    No active projects assigned to you at the moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
