import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Search,
  RotateCcw,
  Info,
  Building2,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";

export default function OnHoldCandidates() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      const data = await crmVendorService.getApplications(curVendor?.id);
      const onHoldApps = (data || []).filter(
        (a) => a.status === "On Hold" || a.recruitmentStage === "On Hold"
      );
      setApplications(onHoldApps);
    } catch (err) {
      console.error("Failed to load on-hold applications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    const handleRefresh = () => loadData();
    window.addEventListener("immigo:application-update", handleRefresh);
    window.addEventListener("immigo:vendor-hr-refresh", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("immigo:application-update", handleRefresh);
      window.removeEventListener("immigo:vendor-hr-refresh", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, [loadData]);

  const filtered = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q) ||
      app.holdReason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-2 sm:p-3 max-w-full w-full mx-auto space-y-3 font-sans text-slate-800">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4" />
          <span>Post-Interview Review</span>
        </div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          On Hold Applications
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Candidates placed on hold after interview evaluation, awaiting final selection or release from the review team.
        </p>
      </div>

      <div className="p-2.5 sm:p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-start gap-2 shadow-2xs text-xs">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-amber-800" />
        </div>
        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          <h2 className="text-xs font-bold text-amber-950 mb-0.5">On Hold Pipeline Status</h2>
          These candidates completed interviews and are under hold review by Admin / Vendor HR. Profiles remain active in your candidate directory.
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by candidate, project, role, or hold note..."
          className="w-full pl-10 pr-4 py-1.5 rounded-md border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading on-hold applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200/80 shadow-2xs">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No on-hold applications</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? "No on-hold applications matched your filter."
              : "None of your candidate applications are currently placed on hold."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-1.5 px-2 text-[10px] sm:px-6">Candidate</th>
                  <th className="py-1.5 px-2 text-[10px]">Applied Project</th>
                  <th className="py-1.5 px-2 text-[10px]">Role / Trade</th>
                  <th className="py-1.5 px-2 text-[10px]">Hold Remarks</th>
                  <th className="py-1.5 px-2 text-[10px]">Date</th>
                  <th className="py-1.5 px-2 text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => (
                  <tr key={app.id || app.applicationId || app._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 px-2 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-xs shrink-0 border border-amber-200">
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

                    <td className="py-2 px-2">
                      <div className="font-semibold text-slate-800">{app.projectName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{app.clientName}</span>
                        <span>•</span>
                        <span className="text-slate-600">{app.country}</span>
                      </div>
                    </td>

                    <td className="py-2 px-2 font-medium text-slate-700">{app.position}</td>

                    <td className="py-2 px-2 max-w-[240px]">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                        <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-700">
                          Hold Note:
                        </span>
                        {app.holdReason || app.adminRemark || "Pending post-interview evaluation"}
                      </div>
                    </td>

                    <td className="py-2 px-2 text-slate-500 text-xs">
                      {app.holdDate
                        ? new Date(app.holdDate).toLocaleDateString()
                        : app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="py-2 px-2 text-right">
                      <Link
                        to={`/vendor/candidates/submit?candidateId=${app.candidateId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
                        title="Submit this candidate to another project"
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
