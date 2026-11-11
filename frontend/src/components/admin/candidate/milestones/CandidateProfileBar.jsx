
export default function CandidateProfileBar({ application, totalPaid, totalAmount }) {
  return (
    <div className="bg-gradient-to-r from-[#0f274a] via-[#163868] to-[#1e4a82] rounded-xl p-3 sm:p-3.5 text-white shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-cyan-300 font-bold text-sm flex items-center justify-center shrink-0 shadow-inner">
            {(application.candidateName || "C").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold tracking-tight text-white">{application.candidateName}</h2>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-cyan-200 border border-white/20 text-[10px] font-bold">
                {application.status || "Selected"}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-white/10 px-1.5 py-0.5 rounded">
                ID: {application.candidateId}
              </span>
            </div>
            <div className="text-[11px] text-slate-200 mt-0.5 flex items-center gap-2.5 flex-wrap">
              <span>{application.candidateEmail}</span>
              {application.candidatePhone && <span>• {application.candidatePhone}</span>}
              <span>• Role: <strong className="text-white">{application.position || "Specialist"}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg border border-white/15 text-xs">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-300 block">Project & Client</span>
            <span className="font-bold text-white block text-xs">{application.projectName}</span>
            <span className="text-[10px] text-cyan-300">{application.destinationCountry || "Overseas"}</span>
          </div>
          <div className="border-l border-white/20 pl-3">
            <span className="text-[9px] uppercase font-bold text-slate-300 block">Fees Collected</span>
            <span className="font-bold text-cyan-300 text-xs sm:text-sm">
              ₹{totalPaid.toLocaleString()} / ₹{Number(totalAmount).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

