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
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading candidates roster...</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">No candidates found</h3>
        <p className="text-xs text-slate-500 mt-1">No candidate records matched your tab selection or filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 sm:px-5">Candidate</th>
              <th className="py-3.5 px-4">Vendor Partner</th>
              <th className="py-3.5 px-4">Trade Position</th>
              <th className="py-3.5 px-4">Experience</th>
              <th className="py-3.5 px-4">Destination</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
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
                  className="hover:bg-blue-50/40 transition cursor-pointer group"
                >
                  <td className="py-4 px-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 overflow-hidden font-black text-xs flex items-center justify-center shrink-0">
                        {c.photo ? (
                          <img src={c.photo} alt={c.fullName} className="w-full h-full object-cover" />
                        ) : (
                          c.fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition block">
                          {c.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.id} • {c.phone}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{vendorName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{c.vendorId}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4 font-semibold text-slate-800">{c.currentPosition}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{c.experienceYears} Yrs</td>
                  <td className="py-4 px-4 font-bold text-indigo-700">{c.preferredCountry}</td>

                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${statusBadgeClass(overallStatus)}`}>
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
                          <div className="text-[10px] text-rose-600 mt-2 font-medium bg-rose-50/50 p-1.5 rounded-lg border border-rose-100">
                            <span className="block font-bold">Stage: {rejectedApp.rejectionStage || "Verification"}</span>
                            Reason: {reasonStr}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </td>

                  <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {overallStatus === "Rejected" && (
                        <button
                          onClick={() => onReuseCandidate(c.id)}
                          disabled={actionLoading === c.id + "_reuse"}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-[11px] shadow-2xs transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <span>{actionLoading === c.id + "_reuse" ? "..." : "Reuse"}</span>
                        </button>
                      )}
                      <button
                        onClick={() => onViewCandidate(c)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={14} />
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
