import React from "react";
import { Calendar, CheckCircle2, Award, ArrowRight } from "lucide-react";

export default function CandidateApplicationsTab({
  applications = [],
  onSelectAppForProcessing = () => {},
}) {
  return (
    <div className="space-y-3">
      <div className="bg-white p-2.5 px-3 rounded-lg border border-slate-200 shadow-2xs">
        <h2 className="text-xs sm:text-sm font-semibold text-[#0f2744]">
          My Project Applications
        </h2>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Track your active recruitment reviews, scheduled interviews, and final selection statuses.
        </p>
      </div>

      <div className="space-y-2.5">
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg p-6 border border-slate-200 text-center text-xs text-slate-400">
            You haven't submitted any project applications yet.
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.applicationId}
              className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[9px] font-mono text-blue-600 font-semibold uppercase tracking-wider block">
                    Application ID: {app.applicationId}
                  </span>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
                    {app.projectName}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {app.position} &bull; {app.destinationCountry}
                  </p>
                </div>

                <span
                  className={`self-start sm:self-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    app.status === "Selected"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : app.status === "Interview Scheduled"
                      ? "bg-sky-100 text-sky-800 border border-sky-200"
                      : app.status === "Shortlisted"
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : app.status === "Rejected"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}
                >
                  {app.status}
                </span>
              </div>

              {app.interview?.scheduledDate && (
                <div className="p-2 bg-sky-50 border border-sky-200 rounded-md space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-sky-950">
                    <Calendar size={13} className="text-sky-600" />
                    <span>Interview Scheduled</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-700">
                    <div>
                      <strong>Date:</strong> {app.interview.scheduledDate}
                    </div>
                    <div>
                      <strong>Time:</strong> {app.interview.scheduledTime}
                    </div>
                    <div>
                      <strong>Mode:</strong> {app.interview.mode}
                    </div>
                    <div>
                      <strong>Venue / Link:</strong>{" "}
                      {app.interview.locationOrLink ? (
                        <a
                          href={app.interview.locationOrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline font-medium"
                        >
                          {app.interview.locationOrLink}
                        </a>
                      ) : (
                        "Shared by recruiter"
                      )}
                    </div>
                  </div>
                  {app.interview.remarks && (
                    <div className="text-slate-600 pt-0.5 border-t border-sky-100 text-[10px]">
                      <strong>Note:</strong> {app.interview.remarks}
                    </div>
                  )}
                </div>
              )}

              {app.status === "Selected" && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-emerald-950 block text-xs">
                        Officially Selected 🎉
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        Your deployment milestones and stages are active.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectAppForProcessing(app)}
                    className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer shrink-0 transition"
                  >
                    <Award size={12} />
                    <span>View Processing & Milestones</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
