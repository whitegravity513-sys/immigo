import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  X,
  Check,
  FileText,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";

export default function AdminNewRegistrations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get("id");

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [internalRemarks, setInternalRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/admin/candidates/list?accountStatus=Pending Approval&search=${encodeURIComponent(search)}`
      );
      if (res.data?.candidates) {
        setCandidates(res.data.candidates);

        if (highlightedId) {
          const match = res.data.candidates.find((c) => c.candidateId === highlightedId);
          if (match) {
            setSelectedCandidate(match);
            setDetailsModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load new registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [search]);

  const handleApprove = async (cand) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/admin/candidates/${cand.candidateId}/approve`);
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Candidate ${cand.fullName} (${cand.candidateId}) approved successfully! Approval email sent to ${cand.email}.`,
        });
        setDetailsModalOpen(false);
        fetchRegistrations();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to approve registration.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/admin/candidates/${selectedCandidate.candidateId}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Registration for ${selectedCandidate.fullName} rejected. Rejection notification sent.`,
        });
        setRejectModalOpen(false);
        setDetailsModalOpen(false);
        setRejectionReason("");
        fetchRegistrations();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to reject registration.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleSaveRemarks = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.put(`/admin/candidates/${selectedCandidate.candidateId}/remarks`, {
        internalRemarks,
      });
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: "Internal remarks saved successfully.",
        });
        setRemarksModalOpen(false);
        fetchRegistrations();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to update remarks.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDeleteCandidate = async (cand) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete candidate ${cand.fullName} (${cand.candidateId})?`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await apiClient.delete(`/admin/candidates/${cand.candidateId}`);
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Candidate ${cand.fullName} deleted successfully.`,
        });
        fetchRegistrations();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to delete candidate.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 4000);
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
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-[#0f2744]">
              New Candidate Registrations
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {candidates.length} Pending
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Review applicant identities, approve active login access, or reject ineligible registrations with an official notification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchRegistrations}
            disabled={loading}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh List"
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
                <th className="py-2.5 px-3">Candidate ID</th>
                <th className="py-2.5 px-3">Candidate Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Mobile Number</th>
                <th className="py-2.5 px-3">Registration Date</th>
                <th className="py-2.5 px-3">Account Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-blue-600" />
                      <span>Loading pending registrations...</span>
                    </div>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1.5" />
                    <p className="text-xs font-bold text-slate-800">No Pending Registrations</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      All submitted candidate accounts have been reviewed.
                    </p>
                  </td>
                </tr>
              ) : (
                candidates.map((cand) => (
                  <tr key={cand.candidateId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 text-[11px]">
                      {cand.candidateId}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {cand.fullName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {cand.email}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {cand.phone}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {new Date(cand.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Approval
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/candidates/${cand.candidateId}`)}
                          className="px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                          title="View Full Profile Page"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleApprove(cand)}
                          disabled={actionLoading}
                          className="px-2 py-0.5 text-[11px] font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-md shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                          title="Approve Registration"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setRejectModalOpen(true);
                          }}
                          className="px-2 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                          title="Reject Registration"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setInternalRemarks(cand.internalRemarks || "");
                            setRemarksModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                          title="Internal Remarks"
                        >
                          <MessageSquare size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCandidate(cand)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                          title="Delete Candidate"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                <XCircle size={16} />
                Reject Candidate Registration
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Rejecting registration for <strong>{selectedCandidate.fullName}</strong> ({selectedCandidate.candidateId}). Please enter a mandatory reason. An official rejection notification email will be dispatched.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Reason (Mandatory)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete details, invalid contact information, or duplicate submission..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Sending..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {remarksModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#0f2744] flex items-center gap-1.5">
                <MessageSquare size={16} />
                Internal Admin Remarks
              </h3>
              <button
                onClick={() => setRemarksModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Internal notes for candidate <strong>{selectedCandidate.fullName}</strong> ({selectedCandidate.candidateId}). Invisible to the candidate.
            </p>

            <textarea
              rows={4}
              value={internalRemarks}
              onChange={(e) => setInternalRemarks(e.target.value)}
              placeholder="Add internal remarks, interviewer notes, or background check comments..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRemarksModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRemarks}
                disabled={actionLoading}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
