
export default function VendorMetricsBar({ stats }) {
  const metrics = [
    { label: "Assigned Projects", val: stats.totalProjects || 0, color: "text-blue-400" },
    { label: "Vendor HRs", val: stats.totalHRs || 0, color: "text-indigo-400" },
    { label: "Candidates", val: stats.totalCandidates || 0, color: "text-sky-400" },
    { label: "Interviews", val: stats.totalInterviews || 0, color: "text-purple-400" },
    { label: "Selected", val: stats.selectedCandidates || 0, color: "text-pink-400" },
    { label: "Joined", val: stats.joinedCandidates || 0, color: "text-teal-400" },
    { label: "Total Value", val: `₹${(stats.totalPayment || 0).toLocaleString()}`, color: "text-amber-400" },
    { label: "Paid", val: `₹${(stats.paidPayment || 0).toLocaleString()}`, color: "text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {metrics.map((m, idx) => (
        <div key={idx} className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-center">
          <div className="text-[11px] text-slate-400 font-medium">{m.label}</div>
          <div className={`text-base font-bold mt-1 ${m.color}`}>{m.val}</div>
        </div>
      ))}
    </div>
  );
}

