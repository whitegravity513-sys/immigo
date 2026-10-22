import React from "react";
import { Briefcase, RefreshCw, ChevronRight, Lock, Upload } from "lucide-react";

export default function CandidateJobsTab({
  projects = [],
  applications = [],
  canApply = false,
  isProfileComplete = false,
  onApplyProject = () => {},
  onNavigateTab = () => {},
  onRefreshProjects = () => {},
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-white p-2.5 px-3 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xs sm:text-sm font-semibold text-[#0f2744]">
            Available Job Opportunities
          </h2>
          <p className="text-[10px] text-slate-500">
            Active overseas projects posted by Admin seeking candidates.
          </p>
        </div>
        <div className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
          {projects.length} Active Openings
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="py-6 px-4 text-center bg-white rounded-lg border border-slate-200 space-y-1.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Briefcase size={15} />
          </div>
          <h3 className="text-xs font-semibold text-slate-800">
            No Projects Published Yet
          </h3>
          <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
            There are no active projects posted by Admin right now. As soon as Admin publishes projects, they will appear here.
          </p>
          <div className="pt-0.5">
            <button
              type="button"
              onClick={onRefreshProjects}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
            >
              <RefreshCw size={11} />
              <span>Refresh Projects</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {projects.map((proj) => {
            const isApplied = applications.some(
              (a) => a.projectId === String(proj.id || proj.projectId)
            );

            return (
              <div
                key={proj.id}
                className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all text-xs"
              >
                <div className="h-14 bg-gradient-to-tr from-[#0f2744] to-[#163660] p-2.5 flex flex-col justify-between text-white">
                  <span className="self-start text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-white/20 text-white">
                    {proj.destinationCountry || proj.country || "Overseas"}
                  </span>
                  <h3 className="text-xs font-semibold text-white line-clamp-1">
                    {proj.projectName}
                  </h3>
                </div>

                <div className="p-2.5 space-y-1 flex-1">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span className="text-slate-400">Position:</span>
                    <span className="font-medium text-slate-800 truncate ml-2">
                      {proj.position}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span className="text-slate-400">Employer:</span>
                    <span className="font-medium text-slate-800 truncate ml-2">
                      {proj.clientName}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span className="text-slate-400">Vacancies:</span>
                    <span className="font-semibold text-blue-700">
                      {proj.vacancies}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                    <span className="text-slate-400">Salary:</span>
                    <span className="font-semibold text-emerald-700">
                      {proj.salary}
                    </span>
                  </div>
                  <div className="p-1 bg-slate-50 rounded text-[9px] text-slate-500 font-medium">
                    {proj.eligibility || "Passport & Document Verification Required"}
                  </div>
                </div>

                <div className="p-2.5 pt-0">
                  {isApplied ? (
                    <div className="w-full py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded text-center">
                      &check; Already Applied
                    </div>
                  ) : canApply ? (
                    <button
                      type="button"
                      onClick={() => onApplyProject(proj)}
                      className="w-full py-1.5 text-xs font-semibold text-white bg-[#0f2744] hover:bg-[#163660] rounded shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Apply Now</span>
                      <ChevronRight size={12} />
                    </button>
                  ) : !isProfileComplete ? (
                    <button
                      type="button"
                      onClick={() => onNavigateTab("profile")}
                      className="w-full py-1.5 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Lock size={11} className="text-amber-700" />
                      <span>Complete Profile to Apply</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigateTab("documents")}
                      className="w-full py-1.5 text-[11px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Upload size={11} className="text-blue-700" />
                      <span>Upload Docs to Apply</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
