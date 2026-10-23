import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FileCheck2,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Trash2,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";
import ExcelExportModal from "../../../components/common/ExcelExportModal.jsx";

const DOC_VERIFICATION_EXPORT_FIELDS = [
  { key: "candidateId", label: "Candidate ID", category: "Identification", defaultSelected: true },
  { key: "fullName", label: "Full Name", category: "Personal", defaultSelected: true },
  { key: "email", label: "Email Address", category: "Contact", defaultSelected: true },
  { key: "phone", label: "Mobile / Phone", category: "Contact", defaultSelected: true },
  { key: "accountStatus", label: "Account Status", category: "Status", defaultSelected: true },
  { key: "documentStatus", label: "Document Status", category: "Status", defaultSelected: true },
  { key: "totalDocs", label: "Total Documents", category: "Documents", defaultSelected: true, extractor: (c) => (c.documents || []).length },
  { key: "verifiedDocs", label: "Verified Documents", category: "Documents", defaultSelected: true, extractor: (c) => (c.documents || []).filter((d) => d.status === "Verified").length },
  { key: "pendingDocs", label: "Pending Documents", category: "Documents", defaultSelected: true, extractor: (c) => (c.documents || []).filter((d) => d.status === "Pending Verification").length },
  { key: "reuploadDocs", label: "Re-upload Required Docs", category: "Documents", defaultSelected: true, extractor: (c) => (c.documents || []).filter((d) => d.status === "Re-upload Required").length },
];

export default function AdminDocumentVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "All";

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/candidates/list?limit=100");
      if (res.data?.candidates) {
        setCandidates(res.data.candidates);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const candidateDocGroups = [];
  (candidates || []).forEach((c) => {
    const matchingDocs = (c.documents || []).filter((d) => {
      const statusMatches = filterStatus === "All" || d.status === filterStatus;
      const searchMatches =
        !search ||
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.candidateId.toLowerCase().includes(search.toLowerCase()) ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.docType && d.docType.toLowerCase().includes(search.toLowerCase()));
      return statusMatches && searchMatches;
    });

    if (matchingDocs.length > 0) {
      candidateDocGroups.push({
        candidate: c,
        documents: matchingDocs,
      });
    }
  });

  const handleVerify = async (cand, doc) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/admin/candidates/${cand.candidateId}/documents/${doc.id}/verify`
      );
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Document "${doc.name}" verified for ${cand.fullName}.`,
        });
        fetchDocs();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to verify document.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("A reason for rejection/re-upload is mandatory.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/admin/candidates/${selectedCandidate.candidateId}/documents/${selectedDoc.id}/reject`,
        {
          rejectionReason: rejectionReason.trim(),
        }
      );
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Document "${selectedDoc.name}" flagged for re-upload. Candidate notified.`,
        });
        setRejectModalOpen(false);
        setRejectionReason("");
        fetchDocs();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: "Failed to update document status.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDeleteCandidate = async (e, cand) => {
    e.stopPropagation();
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
        fetchDocs();
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
          <h1 className="text-base sm:text-lg font-bold text-[#0f2744]">
            Candidate Document Verification Desk
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Review submitted identity, resume, passport, and certificates to unlock candidate project eligibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, doc name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-semibold cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Verified">Verified</option>
            <option value="Re-upload Required">Re-upload Required</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2744] hover:bg-[#163660] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Download Candidate Excel"
          >
            <Download size={13} />
            <span>Download Excel</span>
          </button>

          <button
            onClick={fetchDocs}
            disabled={loading}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 font-medium text-xs flex items-center justify-center gap-2">
          <RefreshCw size={14} className="animate-spin text-blue-600" />
          <span>Loading documents queue...</span>
        </div>
      ) : candidateDocGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 font-medium text-xs">
          No documents found matching the filter criteria.
        </div>
      ) : (
        <div className="space-y-2.5">
          {candidateDocGroups.map(({ candidate, documents }) => {
            const isExpanded = expandedCandidateId === candidate.candidateId;
            const verifiedCount = documents.filter((d) => d.status === "Verified").length;
            const pendingCount = documents.filter((d) => d.status === "Pending Verification").length;
            const reuploadCount = documents.filter((d) => d.status === "Re-upload Required").length;

            return (
              <div
                key={candidate.candidateId}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                {/* Candidate Single Row Summary - Click to View Documents */}
                <div
                  onClick={() =>
                    setExpandedCandidateId((prev) =>
                      prev === candidate.candidateId ? null : candidate.candidateId
                    )
                  }
                  className="p-3 bg-white hover:bg-slate-50/90 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {candidate.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {candidate.fullName}
                        </span>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                          {candidate.candidateId}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            candidate.accountStatus === "Approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {candidate.accountStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{candidate.email}</span>
                        {candidate.phone && (
                          <>
                            <span>&bull;</span>
                            <span>{candidate.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      {documents.length} {documents.length === 1 ? "Doc" : "Docs"}{" "}
                      <span className="text-emerald-700 font-bold">({verifiedCount} Verified)</span>
                      {pendingCount > 0 && (
                        <span className="text-amber-700 font-bold ml-1">({pendingCount} Pending)</span>
                      )}
                      {reuploadCount > 0 && (
                        <span className="text-rose-700 font-bold ml-1">({reuploadCount} Re-upload)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/candidates/${candidate.candidateId}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      title="View Full Profile Page"
                    >
                      <ExternalLink size={12} />
                      <span className="hidden sm:inline">Profile</span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      <FileText size={12} />
                      <span>{isExpanded ? "Hide" : "View Documents"}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteCandidate(e, candidate)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Candidate"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Documents Table - Visible only when clicked */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-2 sm:p-3 overflow-x-auto animate-in fade-in duration-150">
                    <table className="w-full text-left border-collapse text-xs bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2 px-3">Document Title</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Uploaded Date</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Auditor Note</th>
                          <th className="py-2 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {documents.map((document) => (
                          <tr key={document.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span>{document.name}</span>
                                {document.fileUrl && (
                                  <a
                                    href={document.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Preview file"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[9px] font-mono text-slate-500">
                              {document.docType}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {new Date(document.uploadedAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                                  document.status === "Verified"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : document.status === "Re-upload Required"
                                    ? "bg-rose-50 text-rose-800 border border-rose-200"
                                    : "bg-blue-50 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {document.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                              {document.rejectionReason ? (
                                <span className="text-rose-600 font-medium">{document.rejectionReason}</span>
                              ) : document.verifiedBy ? (
                                <span className="text-emerald-700">Verified by {document.verifiedBy}</span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {document.fileUrl && (
                                  <a
                                    href={document.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                  >
                                    Preview
                                  </a>
                                )}
                                {document.status !== "Verified" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVerify(candidate, document);
                                    }}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-lg shadow-2xs transition-colors cursor-pointer"
                                  >
                                    Verify
                                  </button>
                                )}
                                {document.status !== "Re-upload Required" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCandidate(candidate);
                                      setSelectedDoc(document);
                                      setRejectModalOpen(true);
                                    }}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Request Re-upload
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectModalOpen && selectedDoc && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                <RotateCcw size={16} />
                Request Document Replacement
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Document: <strong>{selectedDoc.name}</strong> for candidate{" "}
              <strong>{selectedCandidate.fullName}</strong> ({selectedCandidate.candidateId}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Re-upload (Mandatory)
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Document is blurry, expired passport, or missing seal/signature..."
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
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Submitting..." : "Send Request to Candidate"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ExcelExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Candidate Verification Desk"
        subtitle="Select the candidate columns you want to include in the exported file."
        availableFields={DOC_VERIFICATION_EXPORT_FIELDS}
        data={candidates}
        filenamePrefix="Candidate_Verification_Desk"
        sheetName="Candidates"
      />
    </div>
  );
}
