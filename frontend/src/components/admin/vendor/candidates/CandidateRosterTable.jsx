import React from "react";
import { Users, Eye } from "lucide-react";

export default function CandidateRosterTable({
  loading,
  candidates = [],
  getVendorName,
  getCandidateOverallStatus,
  statusBadgeClass,
  applications = [],
  onReuseCandidate,
  onViewCandidate,
  actionLoading,
}) {
  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading candidates roster...</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="text-xs font-bold text-slate-800">No candidates found</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">No candidate records matched your tab selection or filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">Candidate</th>
              <th className="py-2 px-3">Vendor Partner</th>
              <th className="py-2 px-3">Trade Position</th>
              <th className="py-2 px-3">Experience</th>
              <th className="py-2 px-3">Destination</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((c) => {
              const vendorName = getVendorName(c.vendorId);
              const overallStatus = getCandidateOverallStatus(c.id);

              return (
                <tr
                  key={c.id}
                  onClick={() => onViewCandidate(c)}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                >
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 border border-blue-200 overflow-hidden font-bold text-[10px] flex items-center justify-center shrink-0">
                        {c.photo ? (
                          <img src={c.photo} alt={c.fullName} className="w-full h-full object-cover" />
                        ) : (
                          c.fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block text-xs leading-tight">
                          {c.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono leading-none">
                          {c.id} • {c.phone}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-1.5 px-3">
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs leading-tight">{vendorName}</span>
                      <span className="font-mono text-[10px] text-slate-400 leading-none">{c.vendorId}</span>
                    </div>
                  </td>

                  <td className="py-1.5 px-3 font-medium text-slate-800 text-xs">{c.currentPosition}</td>
                  <td className="py-1.5 px-3 text-slate-600 text-xs">{c.experienceYears} Yrs</td>
                  <td className="py-1.5 px-3 font-semibold text-indigo-700 text-xs">{c.preferredCountry}</td>

                  <td className="py-1.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${statusBadgeClass(overallStatus)}`}>
                      {overallStatus}
                    </span>
                    {overallStatus === "Rejected" && (() => {
                      const candApps = applications.filter((a) => a.candidateId === c.id);
                      const rejectedApp = [...candApps].reverse().find((a) => a.status === "Rejected");
                      if (rejectedApp) {
                        const reasonStr =
                          typeof rejectedApp.rejectionReason === "string"
                            ? rejectedApp.rejectionReason
                            : rejectedApp.rejectionReason?.rejectionReason || "Not specified";
                        return (
                          <div className="text-[9px] text-rose-600 mt-1 font-medium bg-rose-50/50 px-1.5 py-0.5 rounded border border-rose-100">
                            Reason: {reasonStr}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </td>

                  <td className="py-1.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {overallStatus === "Rejected" && (
                        <button
                          onClick={() => onReuseCandidate(c.id)}
                          disabled={actionLoading === c.id + "_reuse"}
                          className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-[10px] shadow-2xs transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <span>{actionLoading === c.id + "_reuse" ? "..." : "Reuse"}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onViewCandidate(c)}
                        className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Review</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
