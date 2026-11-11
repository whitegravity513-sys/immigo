import React from "react";

export default function VendorHRScheduleModal({
  show,
  onClose,
  onSubmit,
  scheduleForm,
  setScheduleForm,
  scheduleInterviewTarget,
  setScheduleInterviewTarget,
  applications = [],
  hrUserName = "Vendor HR Officer",
  actionLoading = false,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Schedule Interview Round</h3>
            <p className="text-xs text-slate-500">Coordinate technical or HR evaluation session</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Candidate *</label>
            <select
              required
              value={scheduleInterviewTarget?.applicationId || scheduleInterviewTarget?.id || scheduleForm.applicationId}
              onChange={(e) => {
                const match = applications.find(
                  (a) => String(a.applicationId || a.id || a._id) === String(e.target.value)
                );
                if (setScheduleInterviewTarget) setScheduleInterviewTarget(match);
                setScheduleForm({ ...scheduleForm, applicationId: e.target.value });
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs cursor-pointer"
            >
              <option value="">Choose a candidate for interview</option>
              {applications
                .filter((a) => !["Selected", "Rejected", "Joined", "Deployed"].includes(a.recruitmentStage || a.status))
                .map((a) => {
                  const appKey = a.applicationId || a.id || a._id;
                  return (
                    <option key={appKey} value={appKey}>
                      {a.candidateName} — {a.jobTitle || a.position} [{a.recruitmentStage || a.status || "Shortlisted"}]
                    </option>
                  );
                })}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Interview Round</label>
            <select
              value={scheduleForm.round}
              onChange={(e) => setScheduleForm({ ...scheduleForm, round: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs cursor-pointer font-bold"
            >
              <option value="Technical Interview">Technical Interview</option>
              <option value="Client Evaluation">Client Evaluation</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Scheduled Date</label>
              <input
                type="text"
                value={scheduleForm.scheduledDate}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                placeholder="e.g. Today or 15-Nov"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Start Time</label>
              <input
                type="text"
                value={scheduleForm.startTime}
                onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                placeholder="e.g. 11:00 AM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Interviewer (Vendor HR or Admin / Super Admin)</label>
            <select
              value={scheduleForm.interviewerName}
              onChange={(e) => setScheduleForm({ ...scheduleForm, interviewerName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs cursor-pointer font-bold"
            >
              <option value="Vendor HR">Vendor HR ({hrUserName})</option>
              <option value="Admin / Super Admin">Admin / Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Google Meet / Video Link</label>
            <input
              type="url"
              value={scheduleForm.interviewLink}
              onChange={(e) => setScheduleForm({ ...scheduleForm, interviewLink: e.target.value })}
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Scheduling..." : "Confirm Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

