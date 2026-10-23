import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  Clock,
  RotateCcw,
  Award,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";

export default function AdminCandidateProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [notification, setNotification] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Document reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadCandidateData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/candidates/${id}`);
      if (res.data?.candidate) {
        setCandidate(res.data.candidate);
        setApplications(res.data.applications || []);
      } else {
        setNotification({ type: "error", message: "Candidate not found." });
      }
    } catch (err) {
      console.error("Failed to load candidate details:", err);
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to load candidate profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidateData();
  }, [id]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Delete candidate
  const handleDeleteCandidate = async () => {
    if (!candidate) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(`/admin/candidates/${candidate.candidateId}`);
      if (res.data?.success) {
        alert(`Candidate ${candidate.fullName} has been deleted successfully.`);
        navigate("/admin/candidates/all");
      }
    } catch (err) {
      showNotification(
        "error",
        err.response?.data?.message || "Failed to delete candidate."
      );
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // Approve Account
  const handleApproveAccount = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/admin/candidates/${candidate.candidateId}/approve`);
      if (res.data?.success) {
        showNotification("success", "Candidate account approved successfully.");
        loadCandidateData();
      }
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Failed to approve account.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Account
  const handleRejectAccount = async () => {
    const reason = window.prompt("Enter rejection reason for candidate account:");
    if (!reason || !reason.trim()) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/admin/candidates/${candidate.candidateId}/reject`, {
        reason: reason.trim(),
      });
      if (res.data?.success) {
        showNotification("success", "Candidate account rejected.");
        loadCandidateData();
      }
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Failed to reject account.");
    } finally {
      setActionLoading(false);
    }
  };

  // Document Verification
  const handleVerifyDocument = async (doc) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/admin/candidates/${candidate.candidateId}/documents/${doc.id}/verify`
      );
      if (res.data?.success) {
        showNotification("success", `Document "${doc.name}" marked as Verified.`);
        loadCandidateData();
      }
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Failed to verify document.");
    } finally {
      setActionLoading(false);
    }
  };

  // Document Reject / Re-upload
  const handleRejectDocument = async () => {
    if (!rejectionReason.trim()) {
      alert("A reason for rejection/re-upload is mandatory.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/admin/candidates/${candidate.candidateId}/documents/${selectedDoc.id}/reject`,
        { rejectionReason: rejectionReason.trim() }
      );
      if (res.data?.success) {
        showNotification("success", `Document "${selectedDoc.name}" flagged for re-upload.`);
        setRejectModalOpen(false);
        setRejectionReason("");
        setSelectedDoc(null);
        loadCandidateData();
      }
    } catch (err) {
      showNotification("error", "Failed to update document status.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium text-xs flex flex-col items-center justify-center gap-3">
        <RefreshCw size={20} className="animate-spin text-blue-600" />
        <span>Loading candidate profile...</span>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <p className="text-slate-600 text-sm font-semibold">Candidate details could not be found.</p>
        <Link
          to="/admin/candidates/all"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Candidates List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in duration-150 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {candidate.accountStatus !== "Approved" && (
              <button
                type="button"
                onClick={handleApproveAccount}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2744] hover:bg-[#163660] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <CheckCircle2 size={13} />
                <span>Approve Account</span>
              </button>
            )}

            {candidate.accountStatus !== "Rejected" && (
              <button
                type="button"
                onClick={handleRejectAccount}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <XCircle size={13} />
                <span>Reject Account</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete Candidate</span>
            </button>
          </div>
        </div>

        {/* Candidate Profile Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm uppercase">
              {candidate.fullName?.charAt(0) || "C"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  {candidate.fullName}
                </h1>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {candidate.candidateId}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    candidate.accountStatus === "Approved"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : candidate.accountStatus === "Rejected"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {candidate.accountStatus}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    candidate.jobApplicationAccess === "Unlocked"
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {candidate.jobApplicationAccess === "Unlocked" ? "Job Access Unlocked" : "Job Access Locked"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-slate-400" />
                  {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" />
                    {candidate.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400" />
                  Joined: {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Personal & Contact Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "skills"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Professional & Skills
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "documents"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Documents & Compliance ({(candidate.documents || []).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === "applications"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Applications & Projects ({applications.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Personal & Contact Details */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <User size={14} className="text-blue-600" />
              Basic Identity & Profile
            </h2>
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Candidate ID</span>
                <span className="font-mono font-bold text-blue-700">{candidate.candidateId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Full Name</span>
                <span className="font-bold text-slate-900">{candidate.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Date of Birth</span>
                <span className="font-semibold text-slate-800">{candidate.profile?.dob || "Not specified"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Gender</span>
                <span className="font-semibold text-slate-800">{candidate.profile?.gender || "Not specified"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Account Status</span>
                <span className="font-semibold text-slate-800">{candidate.accountStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Document Status</span>
                <span className="font-semibold text-slate-800">{candidate.documentStatus}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <MapPin size={14} className="text-blue-600" />
              Contact & Address
            </h2>
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Primary Email</span>
                <span className="font-semibold text-slate-900">{candidate.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Primary Phone</span>
                <span className="font-semibold text-slate-900">{candidate.phone || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px] font-medium">Residential Address</span>
                <span className="font-semibold text-slate-800">
                  {candidate.profile?.address || "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">City</span>
                <span className="font-semibold text-slate-800">{candidate.profile?.city || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">State / Region</span>
                <span className="font-semibold text-slate-800">{candidate.profile?.state || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Postal / Pincode</span>
                <span className="font-semibold text-slate-800">{candidate.profile?.pincode || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Country</span>
                <span className="font-semibold text-slate-800">{candidate.profile?.country || "India"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Professional & Skills */}
      {activeTab === "skills" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Briefcase size={14} className="text-blue-600" />
            Trade, Experience & Passports
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-medium">Trade Domain</span>
              <span className="font-bold text-slate-900 text-sm">{candidate.profile?.trade || "General"}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-medium">Preferred Role</span>
              <span className="font-bold text-slate-900 text-sm">{candidate.profile?.preferredJobRole || "Any Eligible"}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-medium">Experience</span>
              <span className="font-bold text-slate-900 text-sm">{candidate.profile?.experienceYears || candidate.profile?.totalExperienceYears || 0} Years</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] font-medium">Passport Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{candidate.profile?.passportNumber || "Not Provided"}</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-bold text-slate-700 block mb-2">Verified Skill Tags:</span>
            <div className="flex flex-wrap gap-1.5">
              {(candidate.profile?.skills || []).length > 0 ? (
                candidate.profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No specific skills listed.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Documents & Compliance */}
      {activeTab === "documents" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-blue-600" />
              Candidate Submitted Documents
            </h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {(candidate.documents || []).length} Documents Total
            </span>
          </div>

          {(candidate.documents || []).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No documents submitted by this candidate yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {candidate.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{doc.name}</span>
                      <span className="text-[10px] uppercase font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {doc.docType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      {doc.rejectionReason && (
                        <span className="text-rose-600 font-semibold">
                          &bull; Reason: {doc.rejectionReason}
                        </span>
                      )}
                      {doc.verifiedBy && (
                        <span className="text-emerald-700 font-semibold">
                          &bull; Verified by: {doc.verifiedBy}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.status === "Verified"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : doc.status === "Re-upload Required"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {doc.status}
                    </span>

                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <ExternalLink size={12} />
                        <span>Preview</span>
                      </a>
                    )}

                    {doc.status !== "Verified" && (
                      <button
                        type="button"
                        onClick={() => handleVerifyDocument(doc)}
                        disabled={actionLoading}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        Verify
                      </button>
                    )}

                    {doc.status !== "Re-upload Required" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setRejectModalOpen(true);
                        }}
                        disabled={actionLoading}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Request Re-upload
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Applications & Projects */}
      {activeTab === "applications" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Award size={14} className="text-blue-600" />
            Job Applications & Project Alignments
          </h2>

          {applications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              This candidate has not applied to or been assigned any project opportunities yet.
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.applicationId || app._id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{app.projectName || app.jobTitle || "Project Assignment"}</span>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {app.applicationId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Applied Date: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      app.status === "Selected"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : app.status === "Rejected"
                        ? "bg-rose-50 text-rose-800 border border-rose-200"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                <Trash2 size={16} />
                Delete Candidate Confirmation
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete candidate{" "}
              <strong className="text-slate-900">{candidate.fullName}</strong> ({candidate.candidateId})?
              All associated documents, submissions, and application histories will also be removed.
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>This action cannot be undone.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCandidate}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete Candidate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Re-upload Request Modal */}
      {rejectModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                <RotateCcw size={16} />
                Request Document Replacement
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Document: <strong>{selectedDoc.name}</strong> for candidate{" "}
              <strong>{candidate.fullName}</strong> ({candidate.candidateId}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Re-upload (Mandatory)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Document is blurry, expired passport, or missing signature..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
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
                onClick={handleRejectDocument}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Submitting..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
