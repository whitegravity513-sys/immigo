import React, { useState, useEffect } from "react";
import {
  Activity,
  Clock,
  User,
  Building2,
  Calendar,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Video,
} from "lucide-react";
import candidateActivityService from "../../../services/candidateActivityService.js";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function CandidateActivityTimeline({
  candidateId,
  candidateName = "",
  vendorId = "",
  vendorName = "",
  onActivityAdded = () => {},
}) {
  const { user, isVendor, isAdmin, isSuperAdmin } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarkText, setRemarkText] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newStage, setNewStage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (candidateId) {
      loadActivities();
    }
  }, [candidateId]);

  const showToast = (msg, type = "success") => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await candidateActivityService.getCandidateActivities(candidateId);
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to load activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim() && !newStatus && !newStage) return;

    try {
      setSubmitting(true);
      const res = await candidateActivityService.addCandidateRemark(candidateId, {
        remarks: remarkText.trim(),
        actionType: newStatus ? "STATUS_UPDATE" : newStage ? "STAGE_UPDATE" : "REMARK_ADDED",
        newStatus: newStatus || undefined,
        newStage: newStage || undefined,
        candidateName,
        vendorId,
        vendorName,
      });

      if (res?.success) {
        showToast("Process update and permanent activity log recorded.");
        setRemarkText("");
        setNewStatus("");
        setNewStage("");
        await loadActivities();
        onActivityAdded();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to record process remark", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {notice && (
        <div
          className={`px-4 py-2 text-xs font-bold text-center border-b ${
            notice.type === "error"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {notice.msg}
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
            <Activity size={16} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Candidate Activity & Audit Timeline</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Immutable
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Permanent chronological record of candidate stages, statuses, remarks, and meetings.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
          {activities.length} Records
        </span>
      </div>

      {/* Add Process Remark / Quick Status Update Bar */}
      <div className="p-3.5 bg-blue-50/40 border-b border-blue-100">
        <form onSubmit={handleAddRemark} className="space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Add process remark or candidate notes..."
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs"
            >
              <option value="">Status (No Change)</option>
              <option value="Applied">Applied</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Selected">Selected</option>
              <option value="On Hold">On Hold</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs"
            >
              <option value="">Stage (No Change)</option>
              <option value="Screening">Screening</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="Client Interview">Client Interview</option>
              <option value="Document Verification">Document Verification</option>
              <option value="Medical & Biometrics">Medical & Biometrics</option>
              <option value="Visa Processing">Visa Processing</option>
              <option value="Flight & Deployment">Flight & Deployment</option>
            </select>

            <button
              type="submit"
              disabled={submitting || (!remarkText.trim() && !newStatus && !newStage)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Send size={12} />
              <span>{submitting ? "Saving..." : "Add Update"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Chronological Timeline */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading activity timeline...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
            No activity history recorded yet for this candidate. Any status, stage, or remark update will automatically appear here.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => {
              const isMeeting = act.actionType?.includes("MEETING");
              const isStatus = act.actionType === "STATUS_UPDATE" || act.previousStatus;
              const isStage = act.actionType === "STAGE_UPDATE" || act.previousStage;

              return (
                <div key={act.id || act._id} className="relative group">
                  {/* Timeline bullet dot */}
                  <div
                    className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                      isMeeting
                        ? "bg-purple-600"
                        : isStatus
                        ? "bg-blue-600"
                        : isStage
                        ? "bg-amber-500"
                        : "bg-emerald-600"
                    }`}
                  />

                  {/* Card Content */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all shadow-2xs">
                    {/* User and Role Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2 mb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User size={13} className="text-slate-500" />
                          <span>{act.updatedByName || act.userName || "System Admin"}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/70 text-blue-800 border border-blue-200/60">
                          {act.updatedByRole || act.userType || "Admin"}
                        </span>

                        {act.vendorName && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            &bull; <Building2 size={11} /> {act.vendorName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <Clock size={12} />
                        <span>
                          {act.date || new Date(act.createdAt).toLocaleDateString("en-GB")}{" "}
                          &bull;{" "}
                          {act.time || new Date(act.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Candidate Name Reference */}
                    {act.candidateName && (
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                        Candidate: <strong className="text-slate-800">{act.candidateName}</strong>
                      </div>
                    )}

                    {/* Status Change Strip */}
                    {(act.previousStatus || act.newStatus) && (
                      <div className="flex items-center gap-2 text-xs font-bold my-1 text-slate-800">
                        <span className="text-slate-500 text-[11px] uppercase font-semibold">Status:</span>
                        {act.previousStatus ? (
                          <>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                              {act.previousStatus}
                            </span>
                            <ArrowRight size={13} className="text-slate-400" />
                          </>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                          {act.newStatus || act.status}
                        </span>
                      </div>
                    )}

                    {/* Stage Change Strip */}
                    {(act.previousStage || act.newStage) && (
                      <div className="flex items-center gap-2 text-xs font-bold my-1 text-slate-800">
                        <span className="text-slate-500 text-[11px] uppercase font-semibold">Stage:</span>
                        {act.previousStage ? (
                          <>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                              {act.previousStage}
                            </span>
                            <ArrowRight size={13} className="text-slate-400" />
                          </>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                          {act.newStage}
                        </span>
                      </div>
                    )}

                    {/* Milestone Change Strip */}
                    {(act.previousMilestone || act.newMilestone) && (
                      <div className="flex items-center gap-2 text-xs font-bold my-1 text-slate-800">
                        <span className="text-slate-500 text-[11px] uppercase font-semibold">Milestone:</span>
                        {act.previousMilestone ? (
                          <>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                              {act.previousMilestone}
                            </span>
                            <ArrowRight size={13} className="text-slate-400" />
                          </>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                          {act.newMilestone}
                        </span>
                      </div>
                    )}

                    {/* Remarks / Description */}
                    {(act.remarks || act.description) && (
                      <p className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                        <strong className="text-slate-900 font-semibold">Remarks: </strong>
                        {act.remarks || act.description}
                      </p>
                    )}

                    {/* Meeting Link Reference if applicable */}
                    {act.metadata?.meetingLink && (
                      <div className="mt-2 flex items-center gap-2">
                        <a
                          href={act.metadata.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px] hover:bg-blue-100 transition-colors"
                        >
                          <Video size={12} />
                          <span>Join Meeting ({act.metadata.meetingDate || "Link"})</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

