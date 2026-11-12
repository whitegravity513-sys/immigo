import { Link } from "react-router-dom";
import {
  Users,
  Search,
  CheckCircle2,
  RotateCcw,
  Clock,
  ExternalLink,
  Lock,
  Briefcase,
  Video,
  UserCheck,
  FileText,
  Eye,
  Send,
  Plus,
} from "lucide-react";

export default function CandidateSelectionTable({
  candidates,
  filteredCandidates,
  selectedCandidateIds,
  categoryFilter,
  setCategoryFilter,
  candidateSearch,
  setCandidateSearch,
  freshCount,
  rejectedCount,
  busyCandidates,
  toggleSelection,
  toggleAll,
  onDirectAssign,
  onProceedSelected,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => setCategoryFilter("All")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === "All"
                  ? "bg-white text-blue-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Assignable ({candidates.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("fresh")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                categoryFilter === "fresh"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span>Fresh ({freshCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("rejected")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                categoryFilter === "rejected"
                  ? "bg-white text-rose-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <RotateCcw size={12} className="text-rose-500" />
              <span>Rejected ({rejectedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("in_progress")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                categoryFilter === "in_progress"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock size={12} className="text-indigo-500" />
              <span>In Progress / Active ({busyCandidates.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 sm:justify-end">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ID, trade, project..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
              />
            </div>
            {categoryFilter !== "in_progress" && selectedCandidateIds.length > 0 && onProceedSelected && (
              <button
                type="button"
                onClick={onProceedSelected}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                <Send size={12} />
                <span>Proceed ({selectedCandidateIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {categoryFilter === "in_progress" && (
          <div className="mt-3 p-3 bg-indigo-50/90 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-600 shrink-0" />
              <span>
                Showing <strong>{filteredCandidates.length}</strong> candidate(s) currently active in recruitment stages (Interview, Selected, Under Review).
              </span>
            </div>
            <Link
              to="/vendor/applications"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 underline whitespace-nowrap"
            >
              <span>View in Applications</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        )}
      </div>

      <div className="overflow-x-auto bg-white max-h-[500px]">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
            <tr>
              <th className="py-2 px-3 w-12 text-center">
                {categoryFilter !== "in_progress" ? (
                  <input
                    type="checkbox"
                    checked={selectedCandidateIds.length === filteredCandidates.length && filteredCandidates.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    title="Select all"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">#</span>
                )}
              </th>
              <th className="py-2 px-3 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Candidate Details</th>
              <th className="py-2 px-3 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Trade / Position</th>
              <th className="py-2 px-3 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Experience</th>
              <th className="py-2 px-3 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                {categoryFilter === "in_progress" ? "Active Status & Project" : "Eligibility Status"}
              </th>
              <th className="py-2 px-3 text-right font-bold text-slate-700 uppercase tracking-wider text-[10px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-500">
                  <div className="max-w-xs mx-auto space-y-2">
                    <Users size={32} className="mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700">
                      {categoryFilter === "in_progress"
                        ? "No candidates currently in progress."
                        : "No candidates available for assignment."}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {categoryFilter === "in_progress"
                        ? "Candidates will appear here once submitted or scheduled for client interviews."
                        : candidates.length === 0
                        ? "All registered candidates are currently in review, shortlisted, or selected."
                        : "No candidates match the current filter or search criteria."}
                    </p>
                    <Link
                      to="/vendor/candidates/add"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold mt-2"
                    >
                      <Plus size={13} />
                      <span>Register New Candidate</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCandidates.map((c) => {
                const cid = String(c.id || c.candidateId || c._id || "");
                return (
                <tr
                  key={cid}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    selectedCandidateIds.includes(cid) ? "bg-blue-50/40" : ""
                  }`}
                >
                  <td className="py-2 px-3 text-center">
                    {c.category === "in_progress" ? (
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-400 mx-auto"
                        title="Candidate is active on an assigned project"
                      >
                        <Lock size={12} />
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedCandidateIds.includes(cid)}
                        onChange={() => toggleSelection(cid)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-3">
                      {c.photo ? (
                        <img
                          src={c.photo}
                          alt={c.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                          {c.fullName ? c.fullName.charAt(0) : "C"}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{c.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({cid})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Pass: {c.passportNumber || "N/A"}</span>
                          {c.phoneNumber && <span>• {c.phoneNumber}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-bold text-slate-800 block">{c.currentPosition || "General Labor"}</span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-slate-700 flex items-center gap-1">
                      <Briefcase size={12} className="text-slate-400" />
                      <span>{c.experienceYears || 0} yrs</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{c.qualification || "Trade Certified"}</span>
                  </td>
                  <td className="py-2 px-3">
                    {c.category === "in_progress" ? (
                      <div>
                        {c.activeStatus === "Interview" || c.activeStatus === "Interview Scheduled" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Video size={11} className="text-purple-600 shrink-0" />
                            <span>Interview Scheduled</span>
                          </span>
                        ) : c.activeStatus === "Selected" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck size={11} className="text-emerald-600 shrink-0" />
                            <span>Selected</span>
                          </span>
                        ) : c.activeStatus === "On Hold" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={11} className="text-amber-600 shrink-0" />
                            <span>On Hold</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock size={11} className="text-blue-600 shrink-0" />
                            <span>{c.activeStatus || "Under Review"}</span>
                          </span>
                        )}
                        <span
                          className="text-[10px] text-slate-700 font-semibold block mt-0.5 truncate max-w-[160px]"
                          title={c.activeProjectName}
                        >
                          Proj: {c.activeProjectName}
                        </span>
                      </div>
                    ) : c.category === "fresh" ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <UserCheck size={11} className="text-emerald-600 shrink-0" />
                          <span>Fresh Candidate</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                          Ready for first project
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <RotateCcw size={11} className="text-rose-600 shrink-0" />
                          <span>Rejected (Reusable)</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate max-w-[150px]">
                          Prev: {c.lastProjectInfo || "Previous Project"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    {c.category === "in_progress" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to="/vendor/applications"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors"
                        >
                          <FileText size={12} />
                          <span>Track</span>
                        </Link>
                        <Link
                          to={`/vendor/candidates/${cid}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <Eye size={13} />
                        </Link>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDirectAssign(cid)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        <Send size={11} />
                        <span>Assign Project</span>
                      </button>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

