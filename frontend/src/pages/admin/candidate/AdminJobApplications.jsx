import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  RefreshCw,
  ExternalLink,
  X,
  Check,
  UserX,
  AlertCircle,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";

export default function AdminJobApplications({ prefilteredStatus = "All" }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(prefilteredStatus);
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  const [interviewForm, setInterviewForm] = useState({
    scheduledDate: "",
    scheduledTime: "",
    mode: "Online Video",
    locationOrLink: "",
    interviewerName: "",
    remarks: "",
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search,
      });
      const res = await apiClient.get(`/admin/candidates/applications/list?${params.toString()}`);
      if (res.data?.applications) {
        setApplications(res.data.applications);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, search]);

  const handleUpdateStatus = async (app, targetStatus) => {
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/admin/candidates/applications/${app.applicationId}/status`, {
        status: targetStatus,
        remarks: `Status updated to ${targetStatus} by Admin`,
      });
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Application ${app.applicationId} updated to "${targetStatus}".`,
        });
        fetchApplications();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to update application status.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewForm.scheduledDate || !interviewForm.scheduledTime) {
      alert("Please select interview date and time.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/admin/candidates/applications/${selectedApp.applicationId}/schedule-interview`,
        interviewForm
      );
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Interview scheduled successfully for ${selectedApp.candidateName}. Email invitation dispatched.`,
        });
        setInterviewModalOpen(false);
        fetchApplications();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to schedule interview.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="space-y-3.5">
      {notification && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between shadow-xs transition-all text-xs ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#0f2744]">
            Candidate Job Applications
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Review submissions, shortlist talent, schedule candidate interviews, and finalize project selections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, job, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-semibold cursor-pointer"
          >
            <option value="All">All Application Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Interview Completed">Interview Completed</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
            <option value="No Show">No Show</option>
          </select>

          <button
            onClick={fetchApplications}
            disabled={loading}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Application ID</th>
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">Project & Position</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Applied Date</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-blue-600" />
                      <span>Loading applications...</span>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No applications found in this view.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.applicationId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 text-[11px]">
                      {app.applicationId}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{app.candidateName}</div>
                      <div className="font-mono text-[10px] text-slate-500 font-medium">
                        {app.candidateId} &bull; {app.candidatePhone}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{app.projectName}</div>
                      <div className="text-[10px] text-blue-600 font-medium">{app.position}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium text-[11px]">
                      {app.destinationCountry}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === "Selected"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : app.status === "Interview Scheduled"
                            ? "bg-sky-50 text-sky-800 border border-sky-200"
                            : app.status === "Shortlisted"
                            ? "bg-purple-50 text-purple-800 border border-purple-200"
                            : app.status === "Rejected"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {app.status === "Applied" && (
                          <button
                            onClick={() => handleUpdateStatus(app, "Shortlisted")}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Shortlist
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setInterviewForm({
                              scheduledDate: app.interview?.scheduledDate || "",
                              scheduledTime: app.interview?.scheduledTime || "",
                              mode: app.interview?.mode || "Video Call",
                              locationOrLink: app.interview?.locationOrLink || "",
                              interviewerName: app.interview?.interviewerName || "",
                              remarks: app.interview?.remarks || "",
                            });
                            setInterviewModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Interview
                        </button>

                        {app.status !== "Selected" && (
                          <button
                            onClick={() => handleUpdateStatus(app, "Selected")}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Select
                          </button>
                        )}

                        {app.status !== "Rejected" && (
                          <button
                            onClick={() => handleUpdateStatus(app, "Rejected")}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {interviewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#0f2744] flex items-center gap-1.5">
                <Calendar size={16} />
                Schedule Candidate Interview
              </h3>
              <button
                onClick={() => setInterviewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Scheduling interview for <strong>{selectedApp.candidateName}</strong> ({selectedApp.candidateId}) for position <strong>{selectedApp.position}</strong> ({selectedApp.projectName}).
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={interviewForm.scheduledDate}
                    onChange={(e) =>
                      setInterviewForm({ ...interviewForm, scheduledDate: e.target.value })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={interviewForm.scheduledTime}
                    onChange={(e) =>
                      setInterviewForm({ ...interviewForm, scheduledTime: e.target.value })
                    }
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Interview Mode</label>
                <select
                  value={interviewForm.mode}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, mode: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Online Video">Online Video (Google Meet / Zoom)</option>
                  <option value="In-Person Office">In-Person Office / Client Venue</option>
                  <option value="Telephonic">Telephonic Assessment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location or Meeting Link
                </label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/... or Office Room A"
                  value={interviewForm.locationOrLink}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, locationOrLink: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Interviewer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Immigo Senior Recruitment Officer"
                  value={interviewForm.interviewerName}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, interviewerName: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remarks / Instructions for Candidate
                </label>
                <textarea
                  rows={2}
                  placeholder="Please have original passport and trade certificates available..."
                  value={interviewForm.remarks}
                  onChange={(e) =>
                    setInterviewForm({ ...interviewForm, remarks: e.target.value })
                  }
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInterviewModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleInterview}
                disabled={actionLoading}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Scheduling..." : "Confirm & Send Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
