import { useState, useEffect, useCallback } from "react";
import {
  Send,
  Search,
  Clock,
  ArrowLeft,
  Eye,
  FileText,
  Calendar,
  UserCheck,
  Download,
  Check,
  Printer,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";
import DateInput from "../../../components/common/DateInput.jsx";
import DocumentViewerFullPage from "../../../components/vendor/DocumentViewerFullPage.jsx";
import { downloadUploadedDocument, printUploadedDocument } from "../../../utils/printDocument.js";

export default function AdminSubmissionsList() {
  const [submissions, setSubmissions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewSub, setReviewSub] = useState(null);
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [shortlistRemark, setShortlistRemark] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("10:00 AM");
  const [interviewLocation, setInterviewLocation] = useState("Client Office / Video Call");
  const [interviewRemarks, setInterviewRemarks] = useState("");
  const [holdRemark, setHoldRemark] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [docStatuses, setDocStatuses] = useState({});

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const [data, cData] = await Promise.all([
        crmVendorService.getApplications(),
        crmVendorService.getCandidates().catch(() => []),
        crmVendorService.getAvailableProjects().catch(() => []),
      ]);
      setSubmissions((data || []).filter(sub => sub.status !== "Rejected"));
      setCandidates(Array.isArray(cData) ? cData : []);
    } catch (err) {
      console.error("Failed to load candidate submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadSubmissions();
    }, 0);
    const handleRefresh = () => loadSubmissions();
    window.addEventListener("immigo:application-update", handleRefresh);
    window.addEventListener("immigo:vendor-hr-refresh", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      clearTimeout(t);
      window.removeEventListener("immigo:application-update", handleRefresh);
      window.removeEventListener("immigo:vendor-hr-refresh", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, [loadSubmissions]);

  const getSubmissionDocs = (sub) => {
    if (!sub) return [];
    if (Array.isArray(sub.documents) && sub.documents.length > 0) {
      return sub.documents;
    }
    const matched = candidates.find(
      (c) => c.id === sub.candidateId || c.candidateId === sub.candidateId
    );
    return Array.isArray(matched?.documents) ? matched.documents : [];
  };

  const handleOpenReview = (sub) => {
    setReviewSub(sub);
    setShortlistRemark(sub.shortlistRemark || "");
    setInterviewDate(sub.interviewDetails?.date || new Date().toISOString().split("T")[0]);
    setInterviewTime(sub.interviewDetails?.time || "10:00 AM");
    setInterviewLocation(sub.interviewDetails?.location || "Client Office / Video Call");
    setInterviewRemarks(sub.interviewDetails?.remark || "");
    setHoldRemark(sub.holdReason || sub.adminRemark || "");
    setRejectionReason(sub.rejectionReason || "");

    const docsState = {};
    const docs = getSubmissionDocs(sub);
    docs.forEach((d, idx) => {
      docsState[d.id || idx] = d.status || "Pending";
    });
    setDocStatuses(docsState);
  };

  const handleVerifyDoc = (docId) => {
    setDocStatuses((prev) => ({
      ...prev,
      [docId]: prev[docId] === "Verified" ? "Pending" : "Verified",
    }));
  };

  const handleVerifyAllDocs = () => {
    const nextState = {};
    Object.keys(docStatuses).forEach((k) => {
      nextState[k] = "Verified";
    });
    setDocStatuses(nextState);
  };

  const handleShortlistSubmit = async () => {
    if (!reviewSub) return;
    try {
      const targetId = reviewSub.id || reviewSub.applicationId || reviewSub._id;
      await crmVendorService.updateApplicationStatus(targetId, "Shortlisted", {
        remark: shortlistRemark || "Candidate documents verified. Fit for client interview.",
      });
      loadSubmissions();
      setReviewSub(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleScheduleInterviewSubmit = async () => {
    if (!reviewSub) return;
    if (!interviewDate) {
      alert("Please select an interview date.");
      return;
    }
    try {
      const targetId = reviewSub.id || reviewSub.applicationId || reviewSub._id;
      await crmVendorService.updateApplicationStatus(targetId, "Interview Scheduled", {
        interviewDate,
        interviewTime,
        interviewLocation,
        interviewRemarks: interviewRemarks || "Client trade interview scheduled.",
      });
      loadSubmissions();
      setReviewSub(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSelectSubmit = async () => {
    if (!reviewSub) return;
    try {
      const targetId = reviewSub.id || reviewSub.applicationId || reviewSub._id;
      await crmVendorService.updateApplicationStatus(targetId, "Selected", {
        remark: interviewRemarks || "Cleared interview and selected for deployment.",
      });
      loadSubmissions();
      setReviewSub(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectSubmit = async () => {
    if (!reviewSub) return;
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    try {
      const targetId = reviewSub.id || reviewSub.applicationId || reviewSub._id;
      await crmVendorService.updateApplicationStatus(targetId, "Rejected", {
        rejectionReason,
      });
      loadSubmissions();
      setReviewSub(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleHoldSubmit = async () => {
    if (!reviewSub) return;
    try {
      const targetId = reviewSub.id || reviewSub.applicationId || reviewSub._id;
      await crmVendorService.updateApplicationStatus(targetId, "On Hold", {
        remark:
          holdRemark.trim() || "Candidate placed on hold after evaluation.",
      });
      loadSubmissions();
      setReviewSub(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = submissions.filter((sub) => {
    if (activeTab !== "All" && sub.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sub.candidateName?.toLowerCase().includes(q) ||
        sub.projectName?.toLowerCase().includes(q) ||
        sub.clientName?.toLowerCase().includes(q) ||
        sub.vendorId?.toLowerCase().includes(q) ||
        sub.position?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Submitted":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Submitted</span>;
      case "Under Review":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Under Review</span>;
      case "Shortlisted":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Shortlisted</span>;
      case "Interview Scheduled":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Interview Scheduled</span>;
      case "Selected":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Selected</span>;
      case "On Hold":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">On Hold</span>;
      case "Rejected":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      case "Processing":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">Processing</span>;
      case "Completed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">Completed</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded bg-slate-100 font-bold">{status}</span>;
    }
  };

  const isFinalized = reviewSub && ["Selected", "Rejected", "Processing", "Completed"].includes(reviewSub.status);
  const subStatus = reviewSub?.status || "";
  const isOnHoldStatus = subStatus === "On Hold";
  const isShortlistedStatus = subStatus === "Shortlisted";
  const isInterviewStatus = subStatus === "Interview" || subStatus === "Interview Scheduled";
  const reviewDocs = getSubmissionDocs(reviewSub);

  if (previewingDoc) {
    return (
      <DocumentViewerFullPage
        doc={previewingDoc}
        candidate={
          candidates.find((c) => c.id === reviewSub?.candidateId) ||
          (reviewSub
            ? {
                fullName: reviewSub.candidateName,
                id: reviewSub.candidateId,
                currentPosition: reviewSub.position,
              }
            : null)
        }
        onBack={() => setPreviewingDoc(null)}
      />
    );
  }

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto font-sans">
      {!reviewSub ? (
        <>
      {}
      <div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Candidate Submissions & Verification</h1>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Verify candidate compliance documents, shortlist candidates with remarks, schedule interviews, and finalize project selections.
        </p>
      </div>

      {}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {["All", "Under Review", "Submitted", "Shortlisted", "Interview Scheduled", "On Hold", "Selected", "Completed"].map((tab) => {
          const count = submissions.filter((s) => (tab === "All" ? true : s.status === tab)).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === tab ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by candidate, project, client, requirement or vendor..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
        />
      </div>

      {}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading candidate submissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Send className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No candidate submissions found</h3>
          <p className="text-xs text-slate-500 mt-1">No candidate applications match your current search/tab criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-[10px] sm:px-6">Candidate</th>
                  <th className="py-2 px-3 text-[10px]">Vendor</th>
                  <th className="py-2 px-3 text-[10px]">Client & Project</th>
                  <th className="py-2 px-3 text-[10px]">Position</th>
                  <th className="py-2 px-3 text-[10px]">Submitted Date</th>
                  <th className="py-2 px-3 text-[10px]">Status</th>
                  <th className="py-2 px-3 text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-1.5 px-3 sm:px-6">
                      <span className="font-bold text-slate-900 block">{sub.candidateName}</span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {sub.candidateId}</span>
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-slate-700">{sub.vendorId}</td>
                    <td className="py-1.5 px-3">
                      <span className="font-bold text-slate-900 block truncate max-w-[200px]">{sub.projectName}</span>
                      <span className="text-[11px] text-slate-500">{sub.clientName}</span>
                    </td>
                    <td className="py-1.5 px-3 font-bold text-indigo-700">{sub.position}</td>
                    <td className="py-1.5 px-3 text-slate-500 text-xs font-medium">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-1.5 px-3">{getStatusBadge(sub.status)}</td>
                    <td className="py-1.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenReview(sub)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Eye size={13} />
                        <span>Review & Action</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => setReviewSub(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Submissions</span>
            </button>
          </div>
          
          <div className="bg-white rounded-2xl w-full p-5 sm:p-6 shadow-2xs border border-slate-200 space-y-5">
            {}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 gap-3 flex-wrap">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
                  Application Review & Verification
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {reviewSub.candidateName} — {reviewSub.position}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Project: {reviewSub.projectName} ({reviewSub.clientName}) • Vendor: {reviewSub.vendorId}
                </p>
              </div>
              {getStatusBadge(reviewSub.status)}
            </div>

            {reviewSub.status === "On Hold" && reviewSub.holdReason && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Clock size={14} className="text-amber-600 shrink-0" />
                <span>
                  <strong>On Hold Note:</strong> {reviewSub.holdReason}
                </span>
              </div>
            )}

            {}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-600" />
                  Candidate Uploaded Documents ({reviewDocs.length})
                </h4>
                {reviewDocs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleVerifyAllDocs}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    Verify All Docs
                  </button>
                )}
              </div>

              {reviewDocs.length === 0 ? (
                <p className="text-xs text-slate-500 bg-white p-4 rounded-lg border border-dashed border-slate-200 text-center">
                  No documents uploaded for this candidate.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {reviewDocs.map((doc, idx) => {
                    const docKey = doc.id || idx;
                    const isVerified = docStatuses[docKey] === "Verified";
                    return (
                      <div
                        key={docKey}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate min-w-0">
                          <span className="font-bold text-slate-800 block truncate">
                            {doc.name || doc.type || "Document"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {doc.fileName || "document"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewingDoc(doc)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={!doc.fileUrl}
                            onClick={() => printUploadedDocument(doc)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
                            title="Print Document"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={!doc.fileUrl}
                            onClick={() => downloadUploadedDocument(doc)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-blue-700 cursor-pointer"
                            title="Download Document"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyDoc(docKey)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                              isVerified
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                            }`}
                          >
                            {isVerified ? (
                              <>
                                <Check size={12} />
                                <span>Verified</span>
                              </>
                            ) : (
                              <span>Verify</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {}
            <div className="space-y-4 pt-1">
              {!isOnHoldStatus && !isShortlistedStatus && !isInterviewStatus && !isFinalized && (
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck size={14} className="text-purple-600" />
                      1. Shortlist Candidate with Remarks
                    </span>
                  </div>

                  <input
                    type="text"
                    value={shortlistRemark}
                    onChange={(e) => setShortlistRemark(e.target.value)}
                    placeholder="e.g. Documents verified. Candidate fit for client interview."
                    className="w-full p-2.5 rounded-lg border border-purple-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <button
                    type="button"
                    onClick={handleShortlistSubmit}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    Shortlist Candidate
                  </button>
                </div>
              )}

              {!isOnHoldStatus && !isFinalized && (
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-600" />
                      2. Schedule Interview
                    </span>
                    {isInterviewStatus && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        Interview Scheduled
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Interview Date</label>
                      <DateInput
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full p-2 rounded-lg border border-indigo-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Interview Time</label>
                      <input
                        type="text"
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        placeholder="e.g. 10:30 AM"
                        className="w-full p-2 rounded-lg border border-indigo-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Venue / Location</label>
                      <input
                        type="text"
                        value={interviewLocation}
                        onChange={(e) => setInterviewLocation(e.target.value)}
                        placeholder="e.g. Video Call / Client Office"
                        className="w-full p-2 rounded-lg border border-indigo-200 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={interviewRemarks}
                    onChange={(e) => setInterviewRemarks(e.target.value)}
                    placeholder="Interview instructions or remarks for candidate & vendor..."
                    className="w-full p-2.5 rounded-lg border border-indigo-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={handleScheduleInterviewSubmit}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    Confirm Interview Schedule
                  </button>
                </div>
              )}

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  {isOnHoldStatus
                    ? "On Hold — Final Outcome Decision"
                    : "3. Final Outcome (After Interview)"}
                </span>

                <div className={`grid grid-cols-1 ${isInterviewStatus ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-2">
                    <span className="font-bold text-emerald-900 text-xs block">
                      Select Candidate
                    </span>
                    <p className="text-[11px] text-emerald-700">
                      Initializes candidate deployment timeline and generates project milestone payment plan.
                    </p>
                    <button
                      type="button"
                      onClick={handleSelectSubmit}
                      disabled={isFinalized}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark as Selected
                    </button>
                  </div>

                  <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/70 space-y-2">
                    <span className="font-bold text-rose-900 text-xs block">
                      Reject Candidate
                    </span>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Rejection reason..."
                      disabled={isFinalized}
                      className="w-full p-2 rounded-lg border border-rose-300 bg-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleRejectSubmit}
                      disabled={isFinalized}
                      className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark as Rejected
                    </button>
                  </div>

                  {isInterviewStatus && (
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                      <span className="font-bold text-amber-900 text-xs block">
                        Put On Hold
                      </span>
                      <input
                        type="text"
                        value={holdRemark}
                        onChange={(e) => setHoldRemark(e.target.value)}
                        placeholder="Optional hold note..."
                        disabled={isFinalized}
                        className="w-full p-2 rounded-lg border border-amber-300 bg-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={handleHoldSubmit}
                        disabled={isFinalized}
                        className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Mark as On Hold
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
