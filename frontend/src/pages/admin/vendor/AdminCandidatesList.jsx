import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import crmVendorService from "../../../services/crmVendorService.js";
import DocumentViewerFullPage from "../../../components/vendor/DocumentViewerFullPage.jsx";
import CandidateDownloadModal from "../../../components/admin/vendor/candidates/CandidateDownloadModal.jsx";
import CandidateTabsBar from "../../../components/admin/vendor/candidates/CandidateTabsBar.jsx";
import CandidateFilterBar from "../../../components/admin/vendor/candidates/CandidateFilterBar.jsx";
import CandidateRosterTable from "../../../components/admin/vendor/candidates/CandidateRosterTable.jsx";
import CandidateAssignProjectModal from "../../../components/admin/vendor/candidates/CandidateAssignProjectModal.jsx";
import CandidateMasterProfileView from "../../../components/admin/vendor/candidates/CandidateMasterProfileView.jsx";

export default function AdminCandidatesList() {
  const [searchParams] = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam) {
      const cap = tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
      if (["All", "Shortlisted", "Interview", "Selected", "Rejected"].includes(cap)) return cap;
    }
    return "All";
  });

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const cap = tabParam.charAt(0).toUpperCase() + tabParam.slice(1).toLowerCase();
      if (["All", "Shortlisted", "Interview", "Selected", "Rejected"].includes(cap)) {
        setActiveTab(cap);
      }
    }
  }, [searchParams]);

  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [inlineRejectIdx, setInlineRejectIdx] = useState(null);
  const [inlineRejectReason, setInlineRejectReason] = useState("");

  const [interviewModal, setInterviewModal] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ meetingUrl: "", dateTime: "", notes: "" });
  const [interviewLoading, setInterviewLoading] = useState(false);

  const [rejectAppModal, setRejectAppModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [configureMilestonesModal, setConfigureMilestonesModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [assignProjectModal, setAssignProjectModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ clientId: "", projectId: "", position: "" });
  const [assignLoading, setAssignLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cData, vData, aData] = await Promise.all([
        crmVendorService.getCandidates(),
        crmVendorService.getVendors(),
        crmVendorService.getApplications(),
      ]);
      setCandidates(cData || []);
      setVendors(vData || []);
      setApplications(aData || []);

      import("../../../services/crmClientService.js").then((mod) => {
        mod.crmClientService.getClients().then((res) => setClients(res.clients || []));
      });
    } catch (err) {
      console.error("Failed to load candidates roster data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewCandidate = async (cand) => {
    try {
      const freshCand = (await crmVendorService.getCandidateById(cand.id)) || cand;
      setSelectedCandidate(freshCand);
      const history = await crmVendorService.getCandidateSubmissionsHistory(cand.id);
      setSubmissionHistory(history || []);
    } catch {
      setSelectedCandidate(cand);
      setSubmissionHistory([]);
    }
  };

  const refreshCandidateView = async () => {
    if (!selectedCandidate) return;
    try {
      const fresh = await crmVendorService.getCandidateById(selectedCandidate.id);
      if (fresh) setSelectedCandidate(fresh);
      const history = await crmVendorService.getCandidateSubmissionsHistory(selectedCandidate.id);
      setSubmissionHistory(history || []);
    } catch {
      // ignore
    }
    loadData();
  };

  const handleAcceptDocument = async (docIdx) => {
    if (!selectedCandidate) return;
    try {
      const updated = await crmVendorService.verifyCandidateDocument(
        selectedCandidate.id,
        docIdx,
        "Verified",
        ""
      );
      setSelectedCandidate({ ...updated });
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmInlineReject = async (docIdx) => {
    if (!selectedCandidate) return;
    if (!inlineRejectReason.trim()) {
      alert("Please enter a rejection reason for this document.");
      return;
    }
    try {
      const updated = await crmVendorService.verifyCandidateDocument(
        selectedCandidate.id,
        docIdx,
        "Rejected",
        inlineRejectReason.trim()
      );
      setSelectedCandidate({ ...updated });
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      setInlineRejectIdx(null);
      setInlineRejectReason("");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadDoc = (doc) => {
    if (doc.fileUrl && doc.fileUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.name || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const content = `CANDIDATE DOCUMENT RECORD\n=========================\nCandidate: ${selectedCandidate?.fullName || "Candidate"}\nCandidate ID: ${selectedCandidate?.id || "N/A"}\nDocument: ${doc.name || doc.type}\nFile Name: ${doc.fileName || "document.pdf"}\nStatus: ${doc.status || "Verified"}\nVerification Date: ${doc.verifiedAt || new Date().toISOString().split("T")[0]}\n\nAuthenticated on Vista Overseas Workforce Platform.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName || `${doc.name || "document"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAcceptAllCandidateDocs = async () => {
    if (!selectedCandidate) return;
    try {
      const updated = await crmVendorService.verifyAllCandidateDocuments(
        selectedCandidate.id,
        "Verified"
      );
      setSelectedCandidate({ ...updated });
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenAssignProject = (cand) => {
    setAssignProjectModal({ candidate: cand });
    setAssignForm({ clientId: "", projectId: "", position: "" });
  };

  const handleAssignProject = async () => {
    if (!assignForm.projectId || !assignForm.position) {
      alert("Please select a project and position.");
      return;
    }
    setAssignLoading(true);
    try {
      await crmVendorService.submitCandidateToProject({
        vendorId: assignProjectModal.candidate.vendorId,
        candidateId: assignProjectModal.candidate.id,
        clientId: assignForm.clientId,
        projectId: assignForm.projectId,
        position: assignForm.position,
      });
      setAssignProjectModal(null);
      await refreshCandidateView();
    } catch (err) {
      alert(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleHold = async (app) => {
    setActionLoading(app.id + "_hold");
    try {
      await crmVendorService.updateApplicationStatus(app.id, "On Hold");
      await refreshCandidateView();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenInterviewModal = (app) => {
    setInterviewModal({ application: app });
    setInterviewForm({
      meetingUrl: app.interviewDetails?.meetingUrl || "",
      dateTime: app.interviewDetails?.dateTime || "",
      notes: app.interviewDetails?.notes || "",
    });
  };

  const handleScheduleInterview = async () => {
    if (!interviewModal) return;
    if (!interviewForm.dateTime) {
      alert("Please set an interview date and time.");
      return;
    }
    setInterviewLoading(true);
    try {
      await crmVendorService.updateApplicationStatus(
        interviewModal.application.id,
        "Interview",
        "",
        {
          meetingUrl: interviewForm.meetingUrl,
          dateTime: interviewForm.dateTime,
          notes: interviewForm.notes,
        }
      );
      setInterviewModal(null);
      setInterviewForm({ meetingUrl: "", dateTime: "", notes: "" });
      await refreshCandidateView();
    } catch (err) {
      alert(err.message);
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleSelect = (app) => {
    setConfigureMilestonesModal({ application: app });
  };

  const handleOpenRejectApp = (app) => {
    setRejectAppModal({ application: app });
    setRejectReason("");
  };

  const handleConfirmRejectApp = async () => {
    if (!rejectAppModal) return;
    if (!rejectReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    setRejectLoading(true);
    try {
      await crmVendorService.updateApplicationStatus(
        rejectAppModal.application.id,
        "Rejected",
        rejectReason
      );
      setRejectAppModal(null);
      setRejectReason("");
      await refreshCandidateView();
    } catch (err) {
      alert(err.message);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleReuseCandidate = async (candidateId) => {
    const candApps = applications.filter((a) => a.candidateId === candidateId);
    const rejectedApp = candApps.find((a) => a.status === "Rejected");
    if (!rejectedApp) return;

    if (!window.confirm("Reuse this candidate? They will be moved back to the Submitted status for review.")) return;

    setActionLoading(candidateId + "_reuse");
    try {
      await crmVendorService.updateApplicationStatus(rejectedApp.id, "Submitted", {
        rejectionReason: "",
        remark: "Candidate Reused",
      });
      await refreshCandidateView();
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getVendorName = useCallback(
    (vId) => {
      const v = vendors.find((vend) => vend.id === vId);
      return v?.companyName || vId;
    },
    [vendors]
  );

  const getCandidateOverallStatus = useCallback(
    (candId) => {
      const candApps = applications.filter((a) => a.candidateId === candId);
      if (candApps.length === 0) return "Candidate Pool";
      if (candApps.some((a) => a.status === "Selected")) return "Selected";
      if (candApps.some((a) => a.status === "Interview")) return "Interview";
      if (candApps.some((a) => a.status === "Shortlisted")) return "Shortlisted";
      if (candApps.some((a) => a.status === "On Hold")) return "On Hold";
      if (candApps.some((a) => a.status === "Under Review" || a.status === "Submitted")) return "Under Review";
      if (candApps.every((a) => a.status === "Rejected")) return "Rejected";
      return "Pending";
    },
    [applications]
  );

  const countAll = candidates.length;
  const countShortlisted = useMemo(
    () => candidates.filter((c) => getCandidateOverallStatus(c.id) === "Shortlisted").length,
    [candidates, getCandidateOverallStatus]
  );
  const countInterview = useMemo(
    () => candidates.filter((c) => getCandidateOverallStatus(c.id) === "Interview").length,
    [candidates, getCandidateOverallStatus]
  );
  const countSelected = useMemo(
    () => candidates.filter((c) => getCandidateOverallStatus(c.id) === "Selected").length,
    [candidates, getCandidateOverallStatus]
  );
  const countRejected = useMemo(
    () => candidates.filter((c) => getCandidateOverallStatus(c.id) === "Rejected").length,
    [candidates, getCandidateOverallStatus]
  );

  const statusBadgeClass = (status) => {
    const map = {
      Selected: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      Interview: "bg-purple-100 text-purple-800 border border-purple-200",
      Shortlisted: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      "On Hold": "bg-amber-100 text-amber-800 border border-amber-200",
      Rejected: "bg-rose-100 text-rose-800 border border-rose-200",
      "Under Review": "bg-blue-100 text-blue-800 border border-blue-200",
      Submitted: "bg-sky-100 text-sky-800 border border-sky-200",
      "Candidate Pool": "bg-slate-100 text-slate-700 border border-slate-200",
    };
    return map[status] || "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const positionOptions = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.currentPosition).filter(Boolean))),
    [candidates]
  );
  const countryOptions = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.preferredCountry).filter(Boolean))),
    [candidates]
  );
  const vendorOptions = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.vendorId).filter(Boolean))),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const overallStatus = getCandidateOverallStatus(c.id);

      if (activeTab === "Selected") {
        if (overallStatus !== "Selected") return false;
      } else if (activeTab === "Interview") {
        if (overallStatus !== "Interview") return false;
      } else if (activeTab === "Shortlisted") {
        if (overallStatus !== "Shortlisted") return false;
      } else if (activeTab === "Rejected") {
        if (overallStatus !== "Rejected") return false;
      }

      if (positionFilter !== "All" && c.currentPosition !== positionFilter) return false;
      if (countryFilter !== "All" && c.preferredCountry !== countryFilter) return false;
      if (vendorFilter !== "All" && c.vendorId !== vendorFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const vName = getVendorName(c.vendorId).toLowerCase();
        const match =
          c.fullName?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.currentPosition?.toLowerCase().includes(q) ||
          vName.includes(q) ||
          c.skills?.some((s) => s.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    candidates,
    activeTab,
    positionFilter,
    countryFilter,
    vendorFilter,
    searchQuery,
    getCandidateOverallStatus,
    getVendorName,
  ]);

  const handleDownloadExcel = (filters, format = "csv") => {
    let data = [...candidates];

    if (filters?.status && filters.status !== "All") {
      data = data.filter((c) => getCandidateOverallStatus(c.id) === filters.status);
    }
    if (filters?.dateFrom) {
      data = data.filter((c) => new Date(c.createdAt || Date.now()) >= new Date(filters.dateFrom));
    }
    if (filters?.dateTo) {
      data = data.filter((c) => new Date(c.createdAt || Date.now()) <= new Date(filters.dateTo));
    }

    const excelRows = data.map((c, idx) => {
      const overallStatus = getCandidateOverallStatus(c.id);
      const candApps = applications.filter((a) => a.candidateId === c.id);
      const app = candApps[candApps.length - 1];
      const plan = app?.paymentPlan;
      const totalFee = plan?.totalAmount || 40000;
      const paidAmt = (plan?.milestones || [])
        .filter((m) => m.status === "Paid" || m.paymentStatus === "Approved")
        .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
      const paymentStatus = paidAmt >= totalFee ? "Fully Paid" : paidAmt > 0 ? "Partially Paid" : "Payment Due";

      return {
        "S.No": idx + 1,
        "Candidate ID": c.id || `CAND-${idx + 1}`,
        "Candidate Full Name": c.fullName || "—",
        "Father / Guardian Name": c.fatherName || c.guardianName || "—",
        Gender: c.gender || "Male",
        "Date of Birth": c.dob || c.birthDate || "—",
        Age: c.age || "—",
        "Contact Number": c.phone || "—",
        "Email Address": c.email || "—",
        "Passport Number": c.passportNumber || "—",
        "Passport Expiry": c.passportExpiry || "—",
        Nationality: c.nationality || "Indian",
        "Full Address": c.address || "—",
        "City / District": c.city || "—",
        State: c.state || "—",
        "Trade / Current Position": c.currentPosition || "—",
        "Experience (Years)": c.experienceYears != null ? `${c.experienceYears} Years` : "—",
        "Highest Qualification": c.qualification || "—",
        "Key Skills": Array.isArray(c.skills) ? c.skills.join(", ") : c.skills || "—",
        "Preferred Destination Country": c.preferredCountry || "—",
        "Sourcing Vendor / Agency": getVendorName(c.vendorId),
        "Vendor ID": c.vendorId || "—",
        "Assigned Project": app?.projectName || "Not Assigned",
        "Overall Status": overallStatus,
        "Total Placement Fee (₹)": totalFee,
        "Paid Fee (₹)": paidAmt,
        "Balance Fee (₹)": Math.max(0, totalFee - paidAmt),
        "Payment Status": paymentStatus,
        "Medical / GAMCA Status": c.medicalStatus || "Pending",
        "Date Added": c.createdAt
          ? new Date(c.createdAt).toLocaleDateString("en-IN")
          : new Date().toLocaleDateString("en-IN"),
      };
    });

    if (format === "csv") {
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob(["\uFEFF" + csvOutput], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Candidates_Full_Details_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const colWidths = Object.keys(excelRows[0] || {}).map((key) => ({
        wch: Math.max(key.length + 4, 15),
      }));
      worksheet["!cols"] = colWidths;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates Full Data");
      XLSX.writeFile(workbook, `Candidates_Full_Details_${new Date().toISOString().split("T")[0]}.xlsx`);
    }
    setDownloadModalOpen(false);
  };

  if (previewingDoc) {
    const docVendor = vendors.find((v) => v.id === selectedCandidate?.vendorId);
    return (
      <DocumentViewerFullPage
        doc={previewingDoc}
        vendor={docVendor || { companyName: getVendorName(selectedCandidate?.vendorId) }}
        candidate={selectedCandidate}
        onBack={() => setPreviewingDoc(null)}
      />
    );
  }

  if (selectedCandidate) {
    const overallStatus = getCandidateOverallStatus(selectedCandidate.id);
    const vendorName = getVendorName(selectedCandidate.vendorId);

    return (
      <CandidateMasterProfileView
        selectedCandidate={selectedCandidate}
        onBack={() => setSelectedCandidate(null)}
        overallStatus={overallStatus}
        vendorName={vendorName}
        statusBadgeClass={statusBadgeClass}
        submissionHistory={submissionHistory}
        onOpenAssignProject={handleOpenAssignProject}
        onAcceptAllCandidateDocs={handleAcceptAllCandidateDocs}
        onPreviewDoc={(doc) => setPreviewingDoc(doc)}
        onDownloadDoc={handleDownloadDoc}
        onAcceptDocument={handleAcceptDocument}
        onConfirmInlineReject={handleConfirmInlineReject}
        inlineRejectIdx={inlineRejectIdx}
        setInlineRejectIdx={setInlineRejectIdx}
        inlineRejectReason={inlineRejectReason}
        setInlineRejectReason={setInlineRejectReason}
        onHold={handleHold}
        onOpenInterviewModal={handleOpenInterviewModal}
        onSelect={handleSelect}
        onOpenRejectApp={handleOpenRejectApp}
        actionLoading={actionLoading}
        configureMilestonesModal={configureMilestonesModal}
        setConfigureMilestonesModal={setConfigureMilestonesModal}
        onSavedMilestones={refreshCandidateView}
        interviewModal={interviewModal}
        setInterviewModal={setInterviewModal}
        interviewForm={interviewForm}
        setInterviewForm={setInterviewForm}
        onScheduleInterview={handleScheduleInterview}
        interviewLoading={interviewLoading}
        rejectAppModal={rejectAppModal}
        setRejectAppModal={setRejectAppModal}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        onConfirmRejectApp={handleConfirmRejectApp}
        rejectLoading={rejectLoading}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Candidates Roster</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Central candidate database. Review profiles, verify documents and manage the selection pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
            Total Candidates: {candidates.length}
          </span>
          <button
            onClick={() => setDownloadModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={14} />
            <span>Download Data</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <CandidateTabsBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{ countAll, countShortlisted, countInterview, countSelected, countRejected }}
        />

        <CandidateFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          vendorFilter={vendorFilter}
          setVendorFilter={setVendorFilter}
          vendorOptions={vendorOptions}
          getVendorName={getVendorName}
          positionFilter={positionFilter}
          setPositionFilter={setPositionFilter}
          positionOptions={positionOptions}
          countryFilter={countryFilter}
          setCountryFilter={setCountryFilter}
          countryOptions={countryOptions}
        />
      </div>

      <CandidateRosterTable
        loading={loading}
        candidates={filteredCandidates}
        getVendorName={getVendorName}
        getCandidateOverallStatus={getCandidateOverallStatus}
        statusBadgeClass={statusBadgeClass}
        applications={applications}
        onReuseCandidate={handleReuseCandidate}
        onViewCandidate={handleViewCandidate}
        actionLoading={actionLoading}
      />

      <CandidateDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        onDownload={handleDownloadExcel}
      />

      <CandidateAssignProjectModal
        isOpen={Boolean(assignProjectModal)}
        candidate={assignProjectModal?.candidate}
        onClose={() => setAssignProjectModal(null)}
        assignForm={assignForm}
        setAssignForm={setAssignForm}
        clients={clients}
        onConfirm={handleAssignProject}
        loading={assignLoading}
      />
    </div>
  );
}
