
export default function VendorCandidatesTab({ candidates }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-semibold">Candidate</th>
              <th className="py-3 px-4 font-semibold">Position</th>
              <th className="py-3 px-4 font-semibold">Project</th>
              <th className="py-3 px-4 font-semibold">Recruitment Stage</th>
              <th className="py-3 px-4 font-semibold">Overall Status</th>
              <th className="py-3 px-4 font-semibold text-right">Applied Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  No candidates submitted by this vendor yet.
                </td>
              </tr>
            ) : (
              candidates.map((cand) => (
                <tr key={cand.id || cand.applicationId} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{cand.candidateName}</div>
                    <div className="text-slate-400 text-[11px]">{cand.candidateEmail}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-200">{cand.position || "Candidate"}</td>
                  <td className="py-3 px-4 text-slate-300">{cand.projectName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {cand.recruitmentStage || cand.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        cand.status === "Selected" || cand.status === "Joined"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : cand.status === "Rejected"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {cand.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {cand.appliedAt ? new Date(cand.appliedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

