import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Building2,
  MapPin,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Send,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

export default function Applications() {
  const [vendor, setVendor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("All");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);
      const data = await crmVendorService.getApplications(curVendor?.id);
      setApplications(data || []);
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Distinct project names for project filter dropdown
  const projectList = Array.from(new Set(applications.map((a) => a.projectName).filter(Boolean)));

  // Status Tabs
  const statusTabs = [
    { label: "All", count: applications.length },
    { label: "Submitted", count: applications.filter((a) => a.status === "Submitted").length },
    { label: "Under Review", count: applications.filter((a) => a.status === "Under Review").length },
    { label: "Shortlisted", count: applications.filter((a) => a.status === "Shortlisted" || a.status === "Interview" || a.status === "Interview Scheduled").length },
    { label: "Selected", count: applications.filter((a) => a.status === "Selected").length },
    { label: "Rejected", count: applications.filter((a) => a.status === "Rejected").length },
    { label: "Completed", count: applications.filter((a) => a.status === "Completed").length },
  ];

  // Filtering
  const filteredApplications = applications.filter((app) => {
    if (activeTab === "Under Review") {
      if (app.status !== "Under Review") return false;
    } else if (activeTab === "Shortlisted") {
      if (app.status !== "Shortlisted" && app.status !== "Interview" && app.status !== "Interview Scheduled") return false;
    } else if (activeTab !== "All" && app.status !== activeTab) {
      return false;
    }

    if (selectedProject !== "All" && app.projectName !== selectedProject) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        app.candidateName?.toLowerCase().includes(q) ||
        app.candidateId?.toLowerCase().includes(q) ||
        app.projectName?.toLowerCase().includes(q) ||
        app.clientName?.toLowerCase().includes(q) ||
        app.position?.toLowerCase().includes(q) ||
        app.country?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Submitted
          </span>
        );
      case "Under Review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
            Under Review
          </span>
        );
      case "Shortlisted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-500" />
            Shortlisted
          </span>
        );
      case "Selected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Selected
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            Rejected
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <CheckCircle2 className="w-3 h-3 text-slate-600" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Applications & Submissions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Candidate Submissions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time track of all candidate applications per project. Remember: rejection on one project never impacts candidate reuse for other demands.
          </p>
        </div>

        <Link
          to="/vendor/candidates/submit"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm hover:shadow shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Submit Candidate</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {statusTabs.map((tab) => {
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, ID, trade, project, country..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition font-medium"
          >
            <option value="All">All Projects</option>
            {projectList.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table / Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading submissions...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No applications found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || activeTab !== "All" || selectedProject !== "All"
              ? "No applications matched your filter criteria. Try resetting your search or tabs."
              : "You haven't submitted any candidates yet. Get started by submitting from your verified candidate pool."}
          </p>
          <div className="mt-4">
            <Link
              to="/vendor/candidates/submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Submit First Candidate
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Candidate</th>
                  <th className="py-3.5 px-4">Project & Client</th>
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Status</th>

                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => {
                  const isRejected = app.status === "Rejected";
                  const isSelected = app.status === "Selected" || app.status === "Completed";
                  const stageIndex = app.processing?.currentStageIndex ?? 0;
                  const currentStageName = app.processing?.stages?.[stageIndex]?.name;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      {/* Candidate */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                            {app.candidateName?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              to={`/vendor/candidates/${app.candidateId}`}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition block truncate max-w-[160px]"
                            >
                              {app.candidateName}
                            </Link>
                            <span className="text-[11px] font-mono text-slate-400">
                              App: {app.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Project & Client */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[180px]">
                          {app.projectName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[140px]">{app.clientName}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-indigo-600 font-medium">{app.country}</span>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-800">{app.position}</span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-slate-500 text-xs">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "-"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(app.status)}
                      </td>



                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isSelected && (
                            <Link
                              to={`/vendor/candidates?candidateId=${app.candidateId}`}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition inline-flex items-center gap-1"
                              title="Track 8-Stage Processing Timeline"
                            >
                              <span>Track</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}

                          {isRejected && (
                            <Link
                              to={`/vendor/candidates/submit?candidateId=${app.candidateId}`}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition inline-flex items-center gap-1 border border-emerald-200"
                              title="Re-submit this candidate to another client project"
                            >
                              <RotateCcw className="w-3 h-3 text-emerald-600" />
                              <span>Reuse</span>
                            </Link>
                          )}

                          <Link
                            to={`/vendor/candidates/${app.candidateId}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Candidate Profile"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
