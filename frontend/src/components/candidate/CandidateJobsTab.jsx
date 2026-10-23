import React, { useState } from "react";
import {
  Briefcase,
  RefreshCw,
  ChevronRight,
  Lock,
  Upload,
  Eye,
  Check,
  Building2,
  MapPin,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  FileText,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Gift,
} from "lucide-react";

export default function CandidateJobsTab({
  projects = [],
  applications = [],
  canApply = false,
  isProfileComplete = false,
  onApplyProject = () => {},
  onNavigateTab = () => {},
  onRefreshProjects = () => {},
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const filteredProjects = (projects || []).filter((proj) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (proj.projectName && proj.projectName.toLowerCase().includes(q)) ||
      (proj.clientName && proj.clientName.toLowerCase().includes(q)) ||
      (proj.position && proj.position.toLowerCase().includes(q)) ||
      (proj.destinationCountry &&
        proj.destinationCountry.toLowerCase().includes(q)) ||
      (proj.country && proj.country.toLowerCase().includes(q))
    );
  });

  const getApplicationForProject = (proj) => {
    if (!proj) return null;
    const pId = String(proj.id || proj.projectId || "");
    return (applications || []).find(
      (a) => String(a.projectId || a.id) === pId
    );
  };

  const selectedApp = selectedProject
    ? getApplicationForProject(selectedProject)
    : null;
  const isSelectedForMilestones =
    selectedApp?.status === "Selected" || selectedApp?.status === "Completed";

  return (
    <div className="space-y-3">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-[#0f2744]">
            Available Job Opportunities
          </h2>
          <p className="text-[11px] text-slate-500">
            Official overseas recruitment projects open for candidate deployment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative w-48 sm:w-60">
            <Search
              size={13}
              className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects, trades, country..."
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={onRefreshProjects}
            title="Refresh open projects"
            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw size={13} />
          </button>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-100 whitespace-nowrap">
            {filteredProjects.length} Openings
          </span>
        </div>
      </div>

      {/* Projects List View */}
      {filteredProjects.length === 0 ? (
        <div className="py-10 px-4 text-center bg-white rounded-xl border border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Briefcase size={18} />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">
            {searchTerm ? "No Matching Projects Found" : "No Projects Published Yet"}
          </h3>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? "Try adjusting your search keywords to find open overseas projects."
              : "There are currently no active overseas deployment projects published. New openings will appear here once approved by Admin."}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                onRefreshProjects();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Reset Filters & Refresh</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Project & Employer</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Position / Trade</th>
                  <th className="py-2.5 px-3 text-center">Vacancies</th>
                  <th className="py-2.5 px-3 text-center">Application Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjects.map((proj) => {
                  const app = getApplicationForProject(proj);
                  const isApplied = Boolean(app);
                  const isSelected =
                    app?.status === "Selected" || app?.status === "Completed";

                  return (
                    <tr
                      key={proj.id || proj.projectId}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProject(proj)}
                    >
                      {/* Project & Employer */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            <Building2 size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                              {proj.projectName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {proj.clientName || "Direct Overseas Employer"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <MapPin size={11} className="text-slate-400" />
                          <span>
                            {proj.destinationCountry || proj.country || "Overseas"}
                          </span>
                        </span>
                      </td>

                      {/* Position */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">
                          {proj.position || "General Trade Specialist"}
                        </span>
                      </td>

                      {/* Vacancies */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                          {proj.vacancies || proj.totalHeadcount || "Open"}
                        </span>
                      </td>

                      {/* Application Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={11} />
                            Selected
                          </span>
                        ) : isApplied ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock size={11} />
                            Applied
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Not Applied
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProject(proj)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>

                          {isApplied ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg inline-flex items-center gap-1">
                              <Check size={12} />
                              <span>Applied</span>
                            </span>
                          ) : canApply ? (
                            <button
                              type="button"
                              onClick={() => onApplyProject(proj)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>Apply</span>
                              <ChevronRight size={12} />
                            </button>
                          ) : !isProfileComplete ? (
                            <button
                              type="button"
                              onClick={() => onNavigateTab("profile")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Lock size={10} className="text-amber-700" />
                              <span>Profile</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onNavigateTab("documents")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <Upload size={10} className="text-blue-700" />
                              <span>Docs</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Details Slide-over Drawer Panel */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedProject(null)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0f2744] to-[#163660] text-white flex items-center justify-between shrink-0">
                <div className="min-w-0 pr-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white inline-block mb-1">
                    {selectedProject.destinationCountry ||
                      selectedProject.country ||
                      "Overseas Project"}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {selectedProject.projectName}
                  </h3>
                  <p className="text-[11px] text-slate-300 truncate">
                    {selectedProject.clientName || "Direct Overseas Employer"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* Key Overview Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      Target Position
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {selectedProject.position || "General Skilled Trade"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      Open Vacancies
                    </span>
                    <span className="text-xs font-bold text-blue-700 font-mono">
                      {selectedProject.vacancies ||
                        selectedProject.totalHeadcount ||
                        "Open"}{" "}
                      Positions
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      Site Location
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate block">
                      {selectedProject.location ||
                        selectedProject.destinationCountry ||
                        "Site Assignment"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      Project Duration
                    </span>
                    <span className="text-xs font-semibold text-slate-800 block">
                      {selectedProject.duration || "24 Months Contract"}
                    </span>
                  </div>
                </div>

                {/* Scope & Description */}
                {selectedProject.description && (
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Work Scope & Description
                    </h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                      {selectedProject.description}
                    </p>
                  </div>
                )}

                {/* Manpower Positions List if available */}
                {Array.isArray(selectedProject.manpowerRequirements) &&
                  selectedProject.manpowerRequirements.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Required Trades & Manpower
                      </h4>
                      <div className="space-y-1.5">
                        {selectedProject.manpowerRequirements.map(
                          (mpr, mIdx) => (
                            <div
                              key={mpr.id || mIdx}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70"
                            >
                              <span className="font-semibold text-slate-800">
                                {mpr.position || mpr.trade}
                              </span>
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                                {mpr.quantity || 1} required
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Benefits & Allowances */}
                {Array.isArray(selectedProject.benefits) &&
                  selectedProject.benefits.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <Gift size={13} className="text-blue-600" />
                        Provided Amenities & Benefits
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProject.benefits.map((b, bIdx) => (
                          <span
                            key={bIdx}
                            className="text-[10px] font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200"
                          >
                            ✓ {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Additional Requirements Checklist */}
                {selectedProject.additionalRequirements && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Recruitment Specifications
                    </h4>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70 space-y-1.5 text-[11px]">
                      {selectedProject.additionalRequirements
                        .requiredDocuments && (
                        <p>
                          <strong className="text-slate-800">Documents:</strong>{" "}
                          <span className="text-slate-600">
                            {
                              selectedProject.additionalRequirements
                                .requiredDocuments
                            }
                          </span>
                        </p>
                      )}
                      {selectedProject.additionalRequirements
                        .medicalRequirements && (
                        <p>
                          <strong className="text-slate-800">Medical:</strong>{" "}
                          <span className="text-slate-600">
                            {
                              selectedProject.additionalRequirements
                                .medicalRequirements
                            }
                          </span>
                        </p>
                      )}
                      {selectedProject.additionalRequirements
                        .languageRequirements && (
                        <p>
                          <strong className="text-slate-800">Language:</strong>{" "}
                          <span className="text-slate-600">
                            {
                              selectedProject.additionalRequirements
                                .languageRequirements
                            }
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Milestones & Processing Pipeline Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={14} className="text-indigo-600" />
                    <span>Recruitment Milestones & Stages</span>
                  </h4>

                  {isSelectedForMilestones ? (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>Application Selected! Milestones are Active</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Your application for this project has been approved and marked as <strong>Selected</strong>. You can view your stage progress and verify milestones directly in the Processing tab.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProject(null);
                          onNavigateTab("processing");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <Award size={13} />
                        <span>Open Processing & Milestones</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                        <Lock size={14} className="text-indigo-600" />
                        <span>Milestones Unlock Upon Selection</span>
                      </div>
                      <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                        Payment milestones and candidate processing stages (Documentation, Trade Test, Visa Stamping, Air Ticket) will be unlocked and visible once your profile is reviewed and marked as <strong>Selected</strong> by the employer.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>

                {selectedApp ? (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                    <Check size={14} />
                    <span>
                      {selectedApp.status === "Selected"
                        ? "Selected for Project"
                        : "Application Submitted"}
                    </span>
                  </div>
                ) : canApply ? (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyProject(selectedProject);
                      setSelectedProject(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Apply Now</span>
                    <ChevronRight size={14} />
                  </button>
                ) : !isProfileComplete ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject(null);
                      onNavigateTab("profile");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Lock size={12} className="text-amber-700" />
                    <span>Complete Profile to Apply</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject(null);
                      onNavigateTab("documents");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload size={12} className="text-blue-700" />
                    <span>Upload Documents to Apply</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
