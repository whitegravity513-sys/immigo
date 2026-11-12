import {
  Users,
  FolderKanban,
  Briefcase,
  Calendar,
  ArrowRight,
  Video,
  ArrowRightLeft,
  Clock,
} from "lucide-react";
import { Sparkline } from "../shared/VendorHRSparkline.jsx";
import {
  formatSalary,
  getCandidateInitials,
  formatCandidateEmail,
  getEffectiveStage,
} from "../shared/vendorHRUtils.jsx";
import { isAppRefundLocked } from "../../../services/refundService.js";

export default function VendorHROverviewSection({
  dashboardData,
  applications = [],
  projectsList = [],
  jobs = [],
  interviews = [],
  refunds = [],
  meetings = [],
  vendorName = "",
  hideProjectNames = false,
  setActiveMenu,
  setSelectedProject,
  setDetailedProject,
  openCandidateModal,
}) {
  const activeApplications = applications.filter((cand) => !isAppRefundLocked(cand, refunds));
  const activeMeetings = (meetings || []).filter((m) => m.status !== "CANCELLED");
  const activeRefunds = (refunds || []).filter((r) => !r.reassigned);
  const pendingRefundCount = activeRefunds.filter(
    (r) => r.refundStatus === "Pending Admin Approval"
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Total Candidates</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
              {activeApplications.length}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center space-x-0.5">
              <span>↑</span>
              <span>Live DB</span>
            </div>
          </div>
          <Sparkline color="#6366F1" id="c1" />
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FolderKanban className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Active Projects</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
              {projectsList.length}
            </div>
            <div className="text-[11px] font-bold text-blue-600">
              Allocated
            </div>
          </div>
          <Sparkline color="#3B82F6" id="c2" />
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Required Jobs</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
              {jobs.length}
            </div>
            <div className="text-[11px] font-bold text-violet-600">
              Open Trades
            </div>
          </div>
          <Sparkline color="#8B5CF6" id="c3" />
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Interviews Sched.</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
              {dashboardData?.kpis?.interviewsScheduled ?? interviews.length ?? 0}
            </div>
            <div className="text-[11px] font-bold text-emerald-600">
              Rounds Active
            </div>
          </div>
          <Sparkline color="#10B981" id="c4" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Active Overseas Projects</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Assigned manpower projects & requirements</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (setDetailedProject) setDetailedProject(null);
                  setActiveMenu("projects");
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({projectsList.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {hideProjectNames ? (
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Assigned</span>
                      <span className="text-lg font-extrabold text-blue-700 font-mono">{projectsList.length}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Active Trades</span>
                      <span className="text-lg font-extrabold text-slate-800 font-mono">{jobs.length}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Submitted</span>
                      <span className="text-lg font-extrabold text-emerald-700 font-mono">{applications.length}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Open <strong>My Projects</strong> to inspect project briefs, trade requirements, and submit candidates.
                  </p>
                </div>
              ) : projectsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  No active projects currently assigned.
                </div>
              ) : (
                projectsList.slice(0, 3).map((p) => (
                  <div
                    key={p.projectId || p.id}
                    onClick={() => {
                      if (setDetailedProject) setDetailedProject(p);
                      setActiveMenu("projects");
                    }}
                    className="p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition truncate">
                          {p.projectName || p.title}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {p.projectId || p.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span>{p.destinationCountry || p.country || "Overseas"}</span>
                        <span className="truncate max-w-[150px]">{p.clientName || "Client"}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (setDetailedProject) setDetailedProject(p);
                          setActiveMenu("projects");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>Details</span>
                        <ArrowRight size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (setSelectedProject) setSelectedProject(p.projectId || p.id);
                          setActiveMenu("jobs");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Briefcase size={12} />
                        <span>Jobs</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (setSelectedProject) setSelectedProject(p.projectId || p.id);
                          setActiveMenu("candidates");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Users size={12} />
                        <span>Candidates</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>
              {hideProjectNames
                ? `${projectsList.length} project(s) available in My Projects`
                : `Client: ${projectsList[0]?.clientName || "-"}`}
            </span>
            <button
              type="button"
              onClick={() => setActiveMenu("projects")}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Open My Projects →
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Required Jobs & Trades</h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {hideProjectNames ? "Open trade positions & roles" : "Open trade positions by project"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu("jobs")}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({jobs.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {jobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  No trade positions open.
                </div>
              ) : (
                jobs.slice(0, 3).map((j) => (
                  <div
                    key={j.jobId || j.id}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/20 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {j.title}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {j.jobId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {!hideProjectNames && j.projectName ? `${j.projectName} • ` : ""}
                        {formatSalary(j.salaryRange)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Active Requirements: {jobs.length ?? 0}</span>
            <button
              type="button"
              onClick={() => setActiveMenu("jobs")}
              className="text-violet-600 hover:underline font-semibold"
            >
              View All Requirements →
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Candidates Snapshot</h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {hideProjectNames ? "Recent candidate roster" : "Recent candidate roster from assigned projects"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu("candidates")}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({applications.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {activeApplications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  No active candidates submitted yet.
                </div>
              ) : (
                activeApplications.slice(0, 3).map((cand, idx) => {
                  const stageLabel = getEffectiveStage(cand);
                  const cleanEmail = formatCandidateEmail(cand.candidateEmail);
                  const subText = [
                    cand.jobTitle || "Technician",
                    !hideProjectNames && cand.projectName ? cand.projectName : "",
                    cand.candidateId || "",
                    cand.passportNumber ? `Passport: ${cand.passportNumber}` : cleanEmail,
                  ]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <div
                      key={cand.applicationId || idx}
                      className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {getCandidateInitials(cand.candidateName)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {cand.candidateName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{subText}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageLabel === "Joined"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : stageLabel.toLowerCase().includes("interview")
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : stageLabel === "Selected"
                                ? "bg-teal-50 text-teal-700 border-teal-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                        >
                          {stageLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => openCandidateModal(cand)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-bold text-slate-700 transition cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{vendorName ? `Agency: ${vendorName}` : "Assigned Agency Pipeline"}</span>
            <button
              type="button"
              onClick={() => setActiveMenu("candidates")}
              className="text-emerald-600 hover:underline font-semibold"
            >
              View All Candidates →
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Upcoming Interviews</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Scheduled candidate rounds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu("interviews")}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({interviews.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {interviews.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  No upcoming interviews today.
                </div>
              ) : (
                interviews.slice(0, 3).map((item, idx) => (
                  <div
                    key={item.interviewId || idx}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50/20 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {item.candidateName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.jobTitle} • {item.round}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {item.scheduledDate} {item.startTime}
                      </span>
                      <button
                        onClick={() => {
                          if (item.interviewLink) window.open(item.interviewLink, "_blank");
                          else alert(`Candidate: ${item.candidateName}\nInterviewer: ${item.interviewerName}`);
                        }}
                        className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs transition cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Live interview evaluations</span>
            <button
              type="button"
              onClick={() => setActiveMenu("interviews")}
              className="text-sky-600 hover:underline font-semibold cursor-pointer"
            >
              Open Calendar →
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Meetings &amp; Coordination</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Schedule discussions with Admin, Super Admin &amp; Vendor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu("meetings")}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Open Meetings ({activeMeetings.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {activeMeetings.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <div>No meetings scheduled yet.</div>
                  <button
                    type="button"
                    onClick={() => setActiveMenu("meetings")}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Schedule Meeting
                  </button>
                </div>
              ) : (
                activeMeetings.slice(0, 2).map((m, idx) => (
                  <div
                    key={m._id || m.id || idx}
                    onClick={() => setActiveMenu("meetings")}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate">{m.title || "Meeting"}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {m.meetingType || "Discussion"} {m.vendorName ? `• ${m.vendorName}` : ""}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                      <Clock size={10} />
                      <span>{m.date} {m.startTime}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Direct sync with Admin &amp; Vendor Partners</span>
            <button
              type="button"
              onClick={() => setActiveMenu("meetings")}
              className="text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Manage Meetings →
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Refund Claims &amp; Reassignments</h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Track vendor refund claims, admin approvals &amp; candidate reassignments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenu("refunds")}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Open Refunds ({activeRefunds.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {activeRefunds.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  No active refund claims at the moment.
                </div>
              ) : (
                activeRefunds.slice(0, 2).map((r, idx) => (
                  <div
                    key={r.id || r._id || r.applicationId || idx}
                    onClick={() => setActiveMenu("refunds")}
                    className="p-2.5 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/20 transition flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate">{r.candidateName || "Candidate"}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {r.refundReason || "Refund request"} • Paid ₹{Number(r.totalPaid || 0).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                      {r.refundStatus || "Pending"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Pending Admin Review: {pendingRefundCount}</span>
            <button
              type="button"
              onClick={() => setActiveMenu("refunds")}
              className="text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Open Refund Claims →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

