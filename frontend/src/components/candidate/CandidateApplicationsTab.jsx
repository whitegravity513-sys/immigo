import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Video,
  MapPin,
  User,
  FileText,
  ExternalLink,
  Sparkles,
  Info,
} from "lucide-react";

export default function CandidateApplicationsTab({
  applications = [],
  onSelectAppForProcessing = () => {},
}) {
  // Store expanded application IDs (default expand first or clicked)
  const [expandedAppIds, setExpandedAppIds] = useState(() => {
    if (applications.length > 0) {
      return [applications[0].applicationId || applications[0].id];
    }
    return [];
  });

  const toggleExpand = (appId) => {
    setExpandedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Selected":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Interview Scheduled":
      case "Interview Rescheduled":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "Interview Completed":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Shortlisted":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Rejected":
      case "No Show":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-[#0f2744] flex items-center gap-1.5">
            <FileText size={15} className="text-blue-600" />
            <span>My Project Applications & Status</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Click on any application card below to view complete status details, interview date & link, or outcome reasons.
          </p>
        </div>
        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-center">
          Total Applications: {applications.length}
        </span>
      </div>

      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600">No applications submitted yet.</p>
            <p className="text-[11px]">Browse open vacancies in the "Available Job Openings" tab to apply.</p>
          </div>
        ) : (
          applications.map((app) => {
            const appId = app.applicationId || app.id;
            const isExpanded = expandedAppIds.includes(appId);
            const status = app.status || "Applied";
            const interview = app.interview || {};
            const hasInterview =
              Boolean(interview.scheduledDate) ||
              status === "Interview Scheduled" ||
              status === "Interview Rescheduled";

            return (
              <div
                key={appId}
                className={`bg-white rounded-xl border transition-all duration-200 shadow-2xs overflow-hidden ${
                  isExpanded
                    ? "border-blue-400 ring-2 ring-blue-500/10"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                {/* Clickable Header Card */}
                <div
                  onClick={() => toggleExpand(appId)}
                  className="p-3 sm:p-3.5 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono text-blue-700 font-bold tracking-wider px-1.5 py-0.5 bg-blue-50 rounded border border-blue-200">
                        APP #{appId}
                      </span>
                      {app.appliedAt && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                          <Clock size={11} className="text-slate-400" />
                          <span>Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {app.projectName}
                    </h3>

                    <p className="text-[10px] text-slate-600 font-medium flex items-center gap-2 flex-wrap">
                      <span>Role: <strong>{app.position || "Specialist"}</strong></span>
                      <span>&bull;</span>
                      <span>Destination: <strong>{app.destinationCountry || "Overseas"}</strong></span>
                      {app.salary && (
                        <>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-semibold">{app.salary}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-2xs ${getStatusBadge(
                        status
                      )}`}
                    >
                      {status}
                    </span>

                    <button
                      type="button"
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Status Details Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-3.5 sm:p-4 bg-slate-50/50 space-y-3.5">
                    {/* Status Highlights & Explanation */}
                    {status === "Applied" && (
                      <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900">
                          <Info size={15} className="text-blue-600" />
                          <span>Application Under Review</span>
                        </div>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                          Your profile has been received and is currently undergoing initial document and eligibility screening by the Immigo hiring desk. You will be notified once shortlisted.
                        </p>
                      </div>
                    )}

                    {status === "Shortlisted" && (
                      <div className="p-3 bg-purple-50/90 border border-purple-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-purple-900">
                          <Sparkles size={15} className="text-purple-600" />
                          <span>Profile Shortlisted for Interview! 🎉</span>
                        </div>
                        <p className="text-[11px] text-purple-800 leading-relaxed">
                          Congratulations! Your qualifications have met the requirements for this role. You are officially <strong>Shortlisted</strong>. Our recruitment coordinator will schedule your client interview shortly. Keep your phone and email active.
                        </p>
                      </div>
                    )}

                    {hasInterview && (
                      <div className="p-3.5 bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl space-y-2.5 text-xs shadow-2xs">
                        <div className="flex items-center justify-between gap-2 border-b border-sky-100 pb-2">
                          <div className="flex items-center gap-2 font-bold text-sky-950">
                            <Calendar size={16} className="text-sky-600" />
                            <span>Scheduled Client Interview Details</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-sky-200/60 text-sky-900 text-[10px] font-bold">
                            {status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-800">
                          <div className="bg-white/80 p-2 rounded-lg border border-sky-100">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                              Date & Time
                            </span>
                            <span className="font-bold text-sky-950">
                              {interview.scheduledDate || "Date TBD"} at {interview.scheduledTime || "Time TBD"}
                            </span>
                          </div>

                          <div className="bg-white/80 p-2 rounded-lg border border-sky-100">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                              Interview Mode
                            </span>
                            <span className="font-bold text-sky-950 flex items-center gap-1">
                              <Video size={12} className="text-sky-600" />
                              <span>{interview.mode || "Video Call"}</span>
                            </span>
                          </div>

                          <div className="bg-white/80 p-2 rounded-lg border border-sky-100 sm:col-span-2">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                              Meeting Venue / Video Link
                            </span>
                            {interview.locationOrLink ? (
                              interview.locationOrLink.startsWith("http") ? (
                                <a
                                  href={interview.locationOrLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold underline mt-0.5 break-all"
                                >
                                  <span>{interview.locationOrLink}</span>
                                  <ExternalLink size={12} />
                                </a>
                              ) : (
                                <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                                  <MapPin size={12} className="text-slate-500" />
                                  <span>{interview.locationOrLink}</span>
                                </span>
                              )
                            ) : (
                              <span className="text-slate-500 italic">
                                Online link / venue details will be provided by your recruiter.
                              </span>
                            )}
                          </div>

                          {interview.interviewerName && (
                            <div className="bg-white/80 p-2 rounded-lg border border-sky-100">
                              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                                Interviewer / Panel
                              </span>
                              <span className="font-semibold text-slate-800 flex items-center gap-1">
                                <User size={12} className="text-slate-500" />
                                <span>{interview.interviewerName}</span>
                              </span>
                            </div>
                          )}

                          {interview.remarks && (
                            <div className="bg-white/80 p-2 rounded-lg border border-sky-100 sm:col-span-2">
                              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                                Candidate Instructions & Notes
                              </span>
                              <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">
                                {interview.remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {status === "Interview Completed" && (
                      <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                          <CheckCircle2 size={15} className="text-indigo-600" />
                          <span>Interview Completed</span>
                        </div>
                        <p className="text-[11px] text-indigo-900 leading-relaxed">
                          Your client interview round has concluded. The assessment committee is compiling feedback and final decisions. Selection notifications will follow shortly.
                        </p>
                      </div>
                    )}

                    {status === "Selected" && (
                      <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold text-emerald-950 text-xs block">
                              Officially Selected for Project 🎉
                            </span>
                            <span className="text-[11px] text-emerald-800 font-medium">
                              Congratulations on your selection for {app.projectName}. Your overseas deployment milestones and stages are now active.
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-emerald-100 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Next Step: Complete milestone payments and document submissions.
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectAppForProcessing(app)}
                            className="px-3 py-1.5 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                          >
                            <Award size={13} />
                            <span>View Processing & Milestones</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                    {status === "Rejected" && (
                      <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-rose-950 text-xs block">
                              Application Status: Not Selected
                            </span>
                            <p className="text-[11px] text-rose-900 leading-relaxed">
                              Thank you for your interest in this role. After careful evaluation, the hiring team was unable to move forward with your application for this specific opening.
                            </p>
                          </div>
                        </div>

                        {/* Exact Rejection Reason Box */}
                        <div className="bg-white/90 p-2.5 rounded-lg border border-rose-200 text-[11px] space-y-1">
                          <span className="text-[10px] uppercase font-bold text-rose-700 block tracking-wider">
                            Reason for Outcome:
                          </span>
                          <p className="font-semibold text-slate-800">
                            {app.rejectionReason ||
                              app.adminRemarks ||
                              "Application did not meet candidate criteria or position quota was filled."}
                          </p>
                          {app.adminRemarks && app.adminRemarks !== app.rejectionReason && (
                            <p className="text-[10px] text-slate-600 pt-1 border-t border-rose-100">
                              <strong>Recruiter Feedback:</strong> {app.adminRemarks}
                            </p>
                          )}
                        </div>

                        <p className="text-[10px] text-rose-700 font-medium pt-0.5">
                          💡 You are encouraged to explore and apply to other vacancies matching your qualifications.
                        </p>
                      </div>
                    )}

                    {/* Timeline History if available */}
                    {Array.isArray(app.statusHistory) && app.statusHistory.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Application Journey & History
                        </span>
                        <div className="space-y-1 text-[10px] text-slate-600">
                          {app.statusHistory.map((hist, hIdx) => (
                            <div key={hIdx} className="flex items-start gap-2 bg-white/70 p-1.5 rounded border border-slate-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <span className="font-bold text-slate-800">{hist.status}</span>
                                {hist.note && <span> &bull; {hist.note}</span>}
                              </div>
                              <span className="text-slate-400 font-mono text-[9px] shrink-0">
                                {hist.date ? new Date(hist.date).toLocaleDateString() : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
