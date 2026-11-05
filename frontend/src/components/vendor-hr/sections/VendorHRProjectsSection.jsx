import React, { useState } from "react";
import {
  FolderKanban,
  Search,
  Plus,
  ArrowLeft,
  Building2,
  Globe,
  ShieldCheck,
  Users,
  Target,
  CheckCircle2,
  BarChart3,
  Briefcase,
  List,
  LayoutGrid,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatSalary, AVATARS } from "../shared/vendorHRUtils.jsx";

export default function VendorHRProjectsSection({
  projectsList = [],
  applications = [],
  jobs = [],
  vendorName = "Global Staffing Solutions Pvt Ltd",
  detailedProject,
  setDetailedProject,
  setActiveMenu,
  setSelectedProject,
  setShowSubmitModal,
  setSubmitForm,
  openCandidateModal,
  navigateByTag,
}) {
  const [projectSearch, setProjectSearch] = useState("");
  const [projectViewMode, setProjectViewMode] = useState("list");

  const filteredProjects = projectsList.filter((p) => {
    if (!projectSearch) return true;
    const q = projectSearch.toLowerCase();
    return (
      p.projectName?.toLowerCase().includes(q) ||
      p.projectId?.toLowerCase().includes(q) ||
      p.clientName?.toLowerCase().includes(q) ||
      p.destinationCountry?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {detailedProject ? (
        /* DETAILED PROJECT VIEW */
        <div className="space-y-4 animate-in fade-in">
          {/* Top Header / Breadcrumb Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5 min-w-0">
              <button
                type="button"
                onClick={() => setDetailedProject(null)}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                title="Back to Projects List"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Projects List</span>
              </button>
              <div className="h-7 w-px bg-slate-200 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-xs font-extrabold border border-indigo-200">
                    {detailedProject.projectId}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {detailedProject.projectName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {detailedProject.status || "Active"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400" />
                    <span>
                      Client: <strong className="text-slate-700">{detailedProject.clientName}</strong>
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe size={13} className="text-slate-400" />
                    <span>
                      Destination: <strong className="text-slate-700">{detailedProject.destinationCountry}</strong>
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={13} className="text-indigo-500" />
                    <span>
                      Assigned Agency: <strong className="text-indigo-700">{vendorName}</strong>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedProject(detailedProject.projectId);
                  setActiveMenu("candidates");
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <Users size={14} />
                <span>
                  Filter Roster ({applications.filter((a) => a.projectId === detailedProject.projectId).length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmitForm((prev) => ({
                    ...prev,
                    projectId: detailedProject.projectId,
                    jobId: jobs.find((j) => j.projectId === detailedProject.projectId)?.jobId || "",
                  }));
                  setShowSubmitModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>+ Submit Candidate to Project</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Metric Cards */}
          {(() => {
            const projectCands = applications.filter((a) => a.projectId === detailedProject.projectId);
            const selectedCount = projectCands.filter((a) =>
              ["Selected", "Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Joined", "Deployed"].includes(a.recruitmentStage)
            ).length;
            const target = detailedProject.targetHiring || 50;
            const percent = Math.min(100, Math.round((projectCands.length / target) * 100));

            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Hiring Target Quota</span>
                      <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {target} <span className="text-xs font-bold text-slate-500">Specialists</span>
                      </div>
                      <div className="text-[11px] font-bold text-indigo-600">Target Manpower</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Target className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Agency Submissions</span>
                      <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {projectCands.length} <span className="text-xs font-bold text-slate-500">Candidates</span>
                      </div>
                      <div className="text-[11px] font-bold text-blue-600">Sourced & Screened</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Selected / Deployed</span>
                      <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {selectedCount} <span className="text-xs font-bold text-slate-500">Candidates</span>
                      </div>
                      <div className="text-[11px] font-bold text-emerald-600">Cleared Rounds</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500">Quota Fulfillment</span>
                      <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {percent}%
                      </div>
                      <div className="text-[11px] font-bold text-purple-600">Live Progress</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Project Details Grid: Scope & Required Positions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left Column: Project Profile & Specifications */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Project Profile</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Deployment metadata & client brief</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">Project Title</span>
                        <span className="font-bold text-slate-900 text-sm">{detailedProject.projectName}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Client Organization</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <Building2 size={13} className="text-blue-600" />
                          <span>{detailedProject.clientName}</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Destination Country</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <Globe size={13} className="text-indigo-600" />
                          <span>{detailedProject.destinationCountry}</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Assigned Manpower Agency</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span>{vendorName}</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Contract Notes & Scope</span>
                        <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 mt-1 leading-relaxed text-[11px]">
                          {detailedProject.notes ||
                            "Overseas technical manpower deployment and candidate shortlisting mandate. Authorized for candidate submission, interview coordination, trade testing verification, and visa milestone clearance."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Fulfillment Status:</span>
                        <span className="font-bold text-indigo-700">{projectCands.length} / {target}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Required Jobs & Trades */}
                  <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Required Trade Specializations & Positions</h3>
                          <p className="text-[11px] text-slate-400 font-medium">Open trade positions linked to this project</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg bg-violet-50 text-violet-700 font-bold text-xs border border-violet-100">
                        {jobs.filter((j) => j.projectId === detailedProject.projectId).length || 1} Positions
                      </span>
                    </div>

                    <div className="space-y-3">
                      {jobs.filter((j) => j.projectId === detailedProject.projectId).length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                          General specialized technicians apply to this overseas deployment project.
                        </div>
                      ) : (
                        jobs
                          .filter((j) => j.projectId === detailedProject.projectId)
                          .map((job) => (
                            <div
                              key={job.jobId}
                              className="p-3.5 rounded-xl border border-slate-200/80 hover:border-violet-300 hover:bg-violet-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-900 truncate">
                                    {job.title}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
                                    {job.jobId}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                                  <span>💰 {formatSalary(job.salaryRange)}</span>
                                  <span>👥 {job.openings || 10} Openings Required</span>
                                  <span>📍 {detailedProject.destinationCountry}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubmitForm((prev) => ({
                                      ...prev,
                                      projectId: detailedProject.projectId,
                                      jobId: job.jobId,
                                    }));
                                    setShowSubmitModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Plus size={13} />
                                  <span>Submit for this Trade</span>
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Candidates Roster Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Project Candidate Roster</h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {projectCands.length} candidates currently submitted & in processing for {detailedProject.projectName}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSubmitForm((prev) => ({ ...prev, projectId: detailedProject.projectId }));
                        setShowSubmitModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Plus size={13} />
                      <span>+ Add Candidate</span>
                    </button>
                  </div>

                  {projectCands.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                      No candidates submitted for this project yet. Click &quot;+ Add Candidate&quot; to begin sourcing.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10.5px]">
                          <tr>
                            <th className="py-2.5 px-3">Candidate</th>
                            <th className="py-2.5 px-3">Trade / Job</th>
                            <th className="py-2.5 px-3">Passport #</th>
                            <th className="py-2.5 px-3">Recruitment Stage</th>
                            <th className="py-2.5 px-3">Contact</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {projectCands.map((cand, idx) => (
                            <tr key={cand.applicationId || idx} className="hover:bg-slate-50/60 transition">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{cand.candidateName}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{cand.applicationId}</div>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {cand.jobTitle || "Technician"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {cand.passportNumber || "P" + (idx + 1) * 8765432}
                              </td>
                              <td className="py-2.5 px-3">
                                <button
                                  type="button"
                                  onClick={() => navigateByTag && navigateByTag(cand.recruitmentStage || cand.status, cand)}
                                  className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:scale-105 transition cursor-pointer"
                                  title="Click to view stage roster"
                                >
                                  {cand.recruitmentStage || cand.status || "Applied"}
                                </button>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                <div>{cand.candidateEmail}</div>
                                <div>{cand.phone}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => openCandidateModal(cand)}
                                  className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer"
                                >
                                  Process
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        /* PROJECTS LIST / GRID VIEW */
        <div className="space-y-4">
          {/* Header & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Assigned Overseas Projects</h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  {projectsList.length} active manpower deployments allocated to your agency
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search project, code, client..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 w-44 sm:w-56"
                />
              </div>

              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setProjectViewMode("list")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    projectViewMode === "list"
                      ? "bg-white text-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="List View"
                >
                  <List size={14} />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProjectViewMode("grid")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    projectViewMode === "grid"
                      ? "bg-white text-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={14} />
                  <span>Cards</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>+ Submit Candidate</span>
              </button>
            </div>
          </div>

          {/* LIST VIEW */}
          {projectViewMode === "list" ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase text-[10.5px] border-b border-slate-200/80 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Project & Code</th>
                      <th className="py-3 px-4">Client & Destination</th>
                      <th className="py-3 px-3 text-center">Hiring Target</th>
                      <th className="py-3 px-3 text-center">Submitted</th>
                      <th className="py-3 px-3 text-center">Selected / Joined</th>
                      <th className="py-3 px-4">Quota Progress</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-10 text-center text-slate-400">
                          No projects match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((prj) => {
                        const projectCands = applications.filter((a) => a.projectId === prj.projectId);
                        const selectedCount = projectCands.filter((a) =>
                          ["Selected", "Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Joined", "Deployed"].includes(a.recruitmentStage)
                        ).length;
                        const target = prj.targetHiring || 50;
                        const percent = Math.min(100, Math.round((projectCands.length / target) * 100));

                        return (
                          <tr
                            key={prj.projectId}
                            onClick={() => setDetailedProject(prj)}
                            className="hover:bg-blue-50/30 transition cursor-pointer group"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                                {prj.projectName}
                              </div>
                              <div className="font-mono text-slate-400 text-[10px]">
                                {prj.projectId}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <Building2 size={12} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{prj.clientName}</span>
                              </div>
                              <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                                <Globe size={11} className="text-slate-400 shrink-0" />
                                <span>{prj.destinationCountry}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold font-mono text-slate-900">
                              {target}
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold font-mono text-blue-600">
                              {projectCands.length}
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold font-mono text-emerald-600">
                              {selectedCount}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                  <div
                                    className="h-full bg-indigo-600 rounded-full"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] font-bold text-slate-700">{percent}%</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {prj.status || "Active"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDetailedProject(prj)}
                                  className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                                >
                                  Open
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubmitForm((prev) => ({ ...prev, projectId: prj.projectId }));
                                    setShowSubmitModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                                  title="Submit Candidate"
                                >
                                  + Submit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARD GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((prj) => {
                const projectCands = applications.filter((a) => a.projectId === prj.projectId);
                const selectedCount = projectCands.filter((a) =>
                  ["Selected", "Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Joined", "Deployed"].includes(a.recruitmentStage)
                ).length;
                const target = prj.targetHiring || 50;
                const percent = Math.min(100, Math.round((projectCands.length / target) * 100));

                return (
                  <div
                    key={prj.projectId}
                    onClick={() => setDetailedProject(prj)}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition cursor-pointer space-y-3.5 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {prj.projectId}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition mt-1.5 line-clamp-1">
                            {prj.projectName}
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          {prj.status || "Active"}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{prj.clientName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe size={13} className="text-slate-400 shrink-0" />
                          <span>{prj.destinationCountry}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase">Target</span>
                          <span className="font-extrabold text-sm text-slate-800 font-mono">{target}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                          <span className="block text-[10px] text-blue-600 font-bold uppercase">Applied</span>
                          <span className="font-extrabold text-sm text-blue-700 font-mono">{projectCands.length}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                          <span className="block text-[10px] text-emerald-600 font-bold uppercase">Selected</span>
                          <span className="font-extrabold text-sm text-emerald-700 font-mono">{selectedCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] font-medium">Quota Filled</span>
                        <span className="font-bold text-slate-700 font-mono">{percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

