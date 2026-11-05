import React from "react";
import {
  Users,
  FolderKanban,
  Briefcase,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Sparkline, formatSalary, AVATARS } from "../shared/vendorHRUtils.jsx";

export default function VendorHROverviewSection({
  dashboardData,
  applications = [],
  projectsList = [],
  jobs = [],
  interviews = [],
  vendorName = "Global Staffing Solutions Pvt Ltd",
  setActiveMenu,
  setSelectedProject,
  setDetailedProject,
  openCandidateModal,
}) {
  return (
    <div className="space-y-6">
      {/* 4 KPI Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Total Candidates</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
              {dashboardData?.kpis?.totalCandidates ?? applications.length ?? 0}
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

      {/* Balanced 2x2 Modular Grid: Projects, Jobs, Candidates & Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Active Overseas Projects */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Active Overseas Projects</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Assigned manpower projects & quota</p>
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
              {projectsList.length === 0 ? (
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
                    className="p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition truncate">
                          {p.projectName || p.title}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {p.projectId || p.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                        <span>📍 {p.destinationCountry || p.country || "Overseas"}</span>
                        <span className="truncate max-w-[150px]">🏢 {p.clientName || "Client"}</span>
                        <span className="text-blue-600 font-semibold font-mono">
                          Target: {p.targetHiring || p.targetManpower || 50}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
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
            <span>Client: {projectsList[0]?.clientName || "Emirates Engineering & Contracting LLC"}</span>
            <button
              type="button"
              onClick={() => setActiveMenu("projects")}
              className="text-blue-600 hover:underline font-semibold"
            >
              View All Projects →
            </button>
          </div>
        </div>

        {/* Card 2: Required Jobs & Trades */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Required Jobs & Trades</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Open trade positions by project</p>
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
                        {j.projectName || "Project"} • {formatSalary(j.salaryRange)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 shrink-0">
                      {j.openings || 10} Openings
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Active Requirements: {dashboardData?.kpis?.activeOpenings || 85}</span>
            <button
              type="button"
              onClick={() => setActiveMenu("jobs")}
              className="text-violet-600 hover:underline font-semibold"
            >
              View All Requirements →
            </button>
          </div>
        </div>

        {/* Card 3: Candidates Snapshot */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Candidates Snapshot</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Recent candidate roster from assigned projects</p>
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
              {applications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  No candidates submitted yet.
                </div>
              ) : (
                applications.slice(0, 3).map((cand, idx) => (
                  <div
                    key={cand.applicationId || idx}
                    className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={AVATARS[idx % AVATARS.length]}
                        alt={cand.candidateName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {cand.candidateName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {cand.jobTitle || "Technician"} • {cand.projectName || "Project"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          cand.recruitmentStage === "Joined"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : cand.recruitmentStage?.includes("Interview")
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : cand.recruitmentStage === "Selected"
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {cand.recruitmentStage || cand.status || "Applied"}
                      </span>
                      <button
                        type="button"
                        onClick={() => openCandidateModal(cand)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-bold text-slate-700 transition cursor-pointer"
                      >
                        Process
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Agency: {vendorName}</span>
            <button
              type="button"
              onClick={() => setActiveMenu("candidates")}
              className="text-emerald-600 hover:underline font-semibold"
            >
              View All Candidates →
            </button>
          </div>
        </div>

        {/* Card 4: Upcoming Interviews */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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
              onClick={() => setActiveMenu("interviews")}
              className="text-sky-600 hover:underline font-semibold"
            >
              Open Calendar →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
