import React, { useState } from "react";
import {
  Search,
  Plus,
  X,
  Calendar,
  Clock,
  Video,
  Award,
} from "lucide-react";
import { AVATARS } from "../shared/vendorHRUtils.jsx";

export default function VendorHRInterviewsSection({
  interviews = [],
  setShowScheduleModal,
  handleQuickStage,
  setFeedbackInterviewTarget,
  setShowFeedbackModal,
  navigateByTag,
}) {
  const [interviewSearch, setInterviewSearch] = useState("");

  const filteredInterviews = interviews.filter((item) => {
    if (!interviewSearch) return true;
    const q = interviewSearch.toLowerCase();
    return (
      item.candidateName?.toLowerCase().includes(q) ||
      item.jobTitle?.toLowerCase().includes(q) ||
      item.projectName?.toLowerCase().includes(q) ||
      item.round?.toLowerCase().includes(q) ||
      item.interviewerName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Technical Interviews & Assessments</h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {filteredInterviews.length} Scheduled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate candidate technical capabilities, join online meetings, and finalize Selection or Rejection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search interview or candidate..."
              value={interviewSearch}
              onChange={(e) => setInterviewSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
            {interviewSearch && (
              <button
                type="button"
                onClick={() => setInterviewSearch("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer flex items-center space-x-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
            <Calendar size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-700">No Interviews Scheduled</h4>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Shortlisted candidates can be scheduled for technical interview rounds using the button above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Candidate Info</th>
                <th className="py-3 px-4">Trade & Project</th>
                <th className="py-3 px-3 text-center">Round / Status</th>
                <th className="py-3 px-4">Schedule & Interviewer</th>
                <th className="py-3 px-3 text-center">Meeting</th>
                <th className="py-3 px-4 text-center">Decision Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInterviews.map((item, idx) => {
                const cand = item.candidateRef || item;
                return (
                  <tr key={item.interviewId || idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={AVATARS[idx % AVATARS.length]}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{item.candidateName}</h4>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {item.candidatePhone ? `📞 ${item.candidatePhone}` : cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${item.interviewId || "N/A"}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 truncate">{item.jobTitle || cand.jobTitle || "Trade Specialist"}</div>
                      <div className="text-[11px] text-blue-700 font-medium truncate mt-0.5">{item.projectName || cand.projectName || "Project"}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => navigateByTag && navigateByTag("Interview", cand)}
                          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 cursor-pointer hover:scale-105 transition"
                          title="Click to view Interviews section"
                        >
                          Interview
                        </button>
                        <div>
                          <span className="inline-block px-2 py-0.2 rounded-full text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {item.round || "Technical"} ({item.status || "Scheduled"})
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          <span>{item.scheduledDate}, {item.startTime}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Interviewer: <strong className="text-slate-700">{item.interviewerName}</strong>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {item.interviewLink ? (
                        <a
                          href={item.interviewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition"
                        >
                          <Video size={12} />
                          <span>Join Meet</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No link</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleQuickStage(cand, "Selected", "Candidate cleared technical interview round and is selected")}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Select Candidate (Moves to Selected Candidates Roster & Milestones)"
                        >
                          <Award size={12} />
                          <span>Select Candidate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStage(cand, "Rejected", "Candidate did not clear technical round")}
                          className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer"
                          title="Reject Candidate (Moves to Rejected Talent Pool for Reassignment)"
                        >
                          <X size={12} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackInterviewTarget(item);
                            setShowFeedbackModal(true);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer"
                          title="Record Interview Evaluation Notes"
                        >
                          <span>Feedback</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
