import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  XCircle,
  Search,
  RotateCcw,
  Info,
  Building2,
  ExternalLink,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminRejectedCandidates() {
  const [rejectedApps, setRejectedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadRejected();
  }, []);

  const loadRejected = async () => {
    try {
      setLoading(true);
      const data = await crmVendorService.getApplications();
      const filtered = (data || []).filter((a) => a.status === "Rejected");
      setRejectedApps(filtered);
    } catch (err) {
      console.error("Failed to load rejected applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = rejectedApps.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.vendorId?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q) ||
      app.rejectionReason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rejected Candidates</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          History of candidates not selected for specific project demands. Candidate dossiers remain active and reusable for future projects.
        </p>
      </div>

      {/* Candidate Reusability Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-amber-950 block">Candidate Reusability Guarantee:</strong>
          Rejected candidates are never deleted. Rejection is strictly isolated to that specific project demand. The candidate remains completely active in the central pool for immediate re-matching.
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter rejected applications by candidate, project, role, reason..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
        />
      </div>

      {/* Rejected Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading rejected applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <XCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No rejected candidates</h3>
          <p className="text-xs text-slate-500 mt-1">No candidate applications are currently marked as rejected.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Candidate</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Requirement</th>
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4">Rejection Reason</th>
                  <th className="py-3.5 px-4">Rejected Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">{app.candidateName}</td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{app.vendorId}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">{app.projectName}</td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-500">{app.requirementCode || "REQ-0008"}</td>
                    <td className="py-4 px-4 font-semibold text-indigo-700">{app.position}</td>
                    <td className="py-4 px-4 max-w-[220px]">
                      <span className="text-xs text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-100 block">
                        {app.rejectionReason || "Criteria not met"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs">
                      {app.rejectionDate ? new Date(app.rejectionDate).toLocaleDateString() : "2026-09-05"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/vendor/candidates/submit?candidateId=${app.candidateId}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                          title="Submit to Another Project"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Submit Again</span>
                        </Link>
                      </div>
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
