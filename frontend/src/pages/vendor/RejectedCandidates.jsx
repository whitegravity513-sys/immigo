import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  XCircle,
  Search,
  RotateCcw,
  Info,
  Calendar,
  Building2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

export default function RejectedCandidates() {
  const [vendor, setVendor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);
      const data = await crmVendorService.getApplications(curVendor?.id);
      // Filter only rejected applications
      const rejectedApps = (data || []).filter((a) => a.status === "Rejected");
      setApplications(rejectedApps);
    } catch (err) {
      console.error("Failed to load rejected applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q) ||
      app.rejectionReason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
          <XCircle className="w-4 h-4" />
          <span>Project Outcomes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Rejected Applications
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          History of candidates not selected for specific project demands. Profiles remain active in your candidate pool for immediate re-matching.
        </p>
      </div>

      {/* Reusability Policy Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-amber-800" />
        </div>
        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          <h2 className="text-sm sm:text-base font-bold text-amber-950 mb-0.5">Candidate Reusability Guarantee</h2>
          A candidate rejection is strictly isolated to that specific client or trade vacancy. The candidate's master dossier is <strong>never deleted</strong> and can be re-allocated to any other opening right away using the <strong>"Submit to Another Project"</strong> button.
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by candidate, project, role, or rejection reason..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm transition"
        />
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading rejected applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No rejected applications</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? "No applications matched your filter."
              : "Great work! None of your candidate applications are marked as rejected."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Candidate</th>
                  <th className="py-3.5 px-4">Applied Project</th>
                  <th className="py-3.5 px-4">Role / Trade</th>
                  <th className="py-3.5 px-4">Rejection Reason</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Reuse / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    {/* Candidate */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-700 font-bold flex items-center justify-center text-xs shrink-0 border border-rose-200">
                          {app.candidateName?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            to={`/vendor/candidates/${app.candidateId}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition block"
                          >
                            {app.candidateName}
                          </Link>
                          <span className="text-[11px] font-mono text-slate-400">
                            {app.candidateId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Applied Project */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{app.projectName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{app.clientName}</span>
                        <span>•</span>
                        <span className="text-slate-600">{app.country}</span>
                      </div>
                    </td>

                    {/* Trade */}
                    <td className="py-4 px-4 font-medium text-slate-700">{app.position}</td>

                    {/* Reason */}
                    <td className="py-4 px-4 max-w-[240px]">
                      <div className="p-2 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                        <span className="font-semibold block text-[10px] uppercase tracking-wider text-rose-600">
                          Feedback:
                        </span>
                        {app.rejectionReason || "Position filled or client requirements changed"}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-500 text-xs">
                      {app.rejectionDate
                        ? new Date(app.rejectionDate).toLocaleDateString()
                        : app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString()
                        : "-"}
                    </td>

                    {/* Reuse action */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/vendor/candidates/submit?candidateId=${app.candidateId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
                        title="Submit this candidate to a different client project"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Submit to Another Project</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
