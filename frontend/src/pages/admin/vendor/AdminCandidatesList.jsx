import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  Eye,
  FileText,
  Download,
  Building2,
  Calendar,
  Briefcase,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Paperclip,
  Check,
  UserCheck,
  AlertTriangle,
  ArrowLeft,
  Video,
  Plus,
  ChevronRight,
  Star,
  Pause,
  Milestone,
  MoreVertical,
  Edit2,
  X,
  Sliders,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";
import ConfigureMilestonesModal from "../../../components/admin/vendor/ConfigureMilestonesModal.jsx";
import DocumentViewerFullPage from "../../../components/vendor/DocumentViewerFullPage.jsx";
import * as XLSX from "xlsx";

const DownloadModal = ({ isOpen, onClose, onDownload }) => {
  const [status, setStatus] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Download Candidate Data</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Export candidate roster and full placement records</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Status Filter</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500">
              <option value="All">All Statuses</option>
              <option value="Interview">Interview</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-0.5">
            <span className="font-bold block">💡 Microsoft Office Expired / Unactivated?</span>
            <p className="text-blue-800">Use <strong>Download CSV (.csv)</strong> to open your candidate data in any spreadsheet, Google Sheets, or browser without Microsoft Office activation errors.</p>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onDownload({ status, dateFrom, dateTo }, "csv")}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              title="Recommended for all PCs without MS Office license"
            >
              <Download size={13} />
              <span>Download CSV (.csv)</span>
            </button>
            <button
              type="button"
              onClick={() => onDownload({ status, dateFrom, dateTo }, "xlsx")}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Download size={13} />
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminCandidatesList() {
  const [searchParams] = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Filter Tabs
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
  
  // Download Modal
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  // Multi-Filter Dropdowns
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [vendorFilter, setVendorFilter] = useState("All");

  // Profile Full Page State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState([]);

  // Document Verification State (Zero Popups, Full Page View + Inline Rejection)
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [inlineRejectIdx, setInlineRejectIdx] = useState(null);
  const [inlineRejectReason, setInlineRejectReason] = useState("");

  // Interview Modal State
  const [interviewModal, setInterviewModal] = useState(null); // { application }
  const [interviewForm, setInterviewForm] = useState({ meetingUrl: "", dateTime: "", notes: "" });
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Reject Application Modal
  const [rejectAppModal, setRejectAppModal] = useState(null); // { application }
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  // Configure Milestones on Select / Edit Modal (fee, milestones, stages)
  const [configureMilestonesModal, setConfigureMilestonesModal] = useState(null); // { application }

  // Action loading state
  const [actionLoading, setActionLoading] = useState(null); // appId + action

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const cData = await crmVendorService.getCandidates();
      const vData = await crmVendorService.getVendors();
      const aData = await crmVendorService.getApplications();
      // Need clients for Assign Project
      import("../../../services/crmClientService.js").then((mod) => {
        mod.crmClientService.getClients().then(res => setClients(res.clients || []));
      });
      setCandidates(cData || []);
      setVendors(vData || []);
      setApplications(aData || []);
    } catch (err) {
      console.error("Failed to load candidates roster data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCandidate = async (cand) => {
    try {
      const freshCand = (await crmVendorService.getCandidateById(cand.id)) || cand;
      setSelectedCandidate(freshCand);
      const history = await crmVendorService.getCandidateSubmissionsHistory(cand.id);
      setSubmissionHistory(history || []);
    } catch (err) {
      setSelectedCandidate(cand);
      setSubmissionHistory([]);
    }
  };

  // Refresh candidate + submission history after action
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

  // ─── Document Actions (Zero Popups) ──────────────────────────────────────────
  const handleAcceptDocument = async (docIdx) => {
    if (!selectedCandidate) return;
    try {
      const updated = await crmVendorService.verifyCandidateDocument(selectedCandidate.id, docIdx, "Verified", "");
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
      const updated = await crmVendorService.verifyAllCandidateDocuments(selectedCandidate.id, "Verified");
      setSelectedCandidate({ ...updated });
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    } catch (err) {
      alert(err.message);
    }
  };

  // ─── Candidate Application Actions (Admin Review Workflow) ───────────────────

  // Assign to Project Modal
  const [assignProjectModal, setAssignProjectModal] = useState(null); // { candidate }
  const [assignForm, setAssignForm] = useState({ clientId: "", projectId: "", position: "" });
  const [assignLoading, setAssignLoading] = useState(false);

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

  // Put on Hold
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

  // Open Interview Modal
  const handleOpenInterviewModal = (app) => {
    setInterviewModal({ application: app });
    setInterviewForm({ meetingUrl: app.interviewDetails?.meetingUrl || "", dateTime: app.interviewDetails?.dateTime || "", notes: app.interviewDetails?.notes || "" });
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

  // Select candidate — opens milestone configurator
  const handleSelect = (app) => {
    setConfigureMilestonesModal({ application: app });
  };

  // Open Reject Modal
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
      await crmVendorService.updateApplicationStatus(rejectedApp.id, "Submitted", { rejectionReason: "", remark: "Candidate Reused" });
      await refreshCandidateView();
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getVendorName = (vId) => {
    const v = vendors.find((vend) => vend.id === vId);
    return v?.companyName || vId;
  };

  // Candidate's overall status across all project applications
  const getCandidateOverallStatus = (candId) => {
    const candApps = applications.filter((a) => a.candidateId === candId);
    if (candApps.length === 0) return "Candidate Pool";
    if (candApps.some((a) => a.status === "Selected")) return "Selected";
    if (candApps.some((a) => a.status === "Interview")) return "Interview";
    if (candApps.some((a) => a.status === "Shortlisted")) return "Shortlisted";
    if (candApps.some((a) => a.status === "On Hold")) return "On Hold";
    if (candApps.some((a) => a.status === "Under Review" || a.status === "Submitted")) return "Under Review";
    if (candApps.every((a) => a.status === "Rejected")) return "Rejected";
    return "Pending";
  };

  const countAll = candidates.length;
  const countShortlisted = candidates.filter(c => getCandidateOverallStatus(c.id) === "Shortlisted").length;
  const countInterview = candidates.filter(c => getCandidateOverallStatus(c.id) === "Interview").length;
  const countSelected = candidates.filter(c => getCandidateOverallStatus(c.id) === "Selected").length;
  const countRejected = candidates.filter(c => getCandidateOverallStatus(c.id) === "Rejected").length;

  const statusBadgeClass = (status) => {
    const map = {
      "Selected": "bg-emerald-100 text-emerald-800 border border-emerald-200",
      "Interview": "bg-purple-100 text-purple-800 border border-purple-200",
      "Shortlisted": "bg-indigo-100 text-indigo-800 border border-indigo-200",
      "On Hold": "bg-amber-100 text-amber-800 border border-amber-200",
      "Rejected": "bg-rose-100 text-rose-800 border border-rose-200",
      "Under Review": "bg-blue-100 text-blue-800 border border-blue-200",
      "Submitted": "bg-sky-100 text-sky-800 border border-sky-200",
      "Candidate Pool": "bg-slate-100 text-slate-700 border border-slate-200",
    };
    return map[status] || "bg-slate-100 text-slate-700 border border-slate-200";
  };

  // ─── Filter Logic ─────────────────────────────────────────────────────────────
  const positionOptions = Array.from(new Set(candidates.map((c) => c.currentPosition).filter(Boolean)));
  const countryOptions = Array.from(new Set(candidates.map((c) => c.preferredCountry).filter(Boolean)));
  const vendorOptions = Array.from(new Set(candidates.map((c) => c.vendorId).filter(Boolean)));

  const filteredCandidates = candidates.filter((c) => {
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

  const handleDownloadExcel = (filters, format = "csv") => {
    let data = [...candidates];
    
    // Filter by status
    if (filters?.status && filters.status !== "All") {
      data = data.filter(c => getCandidateOverallStatus(c.id) === filters.status);
    }
    
    // Filter by date
    if (filters?.dateFrom) {
      data = data.filter(c => new Date(c.createdAt || Date.now()) >= new Date(filters.dateFrom));
    }
    if (filters?.dateTo) {
      data = data.filter(c => new Date(c.createdAt || Date.now()) <= new Date(filters.dateTo));
    }

    const excelRows = data.map((c, idx) => {
      const overallStatus = getCandidateOverallStatus(c.id);
      const candApps = applications.filter((a) => a.candidateId === c.id);
      const app = candApps[candApps.length - 1]; // latest application
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
        "Gender": c.gender || "Male",
        "Date of Birth": c.dob || c.birthDate || "—",
        "Age": c.age || "—",
        "Contact Number": c.phone || "—",
        "Email Address": c.email || "—",
        "Passport Number": c.passportNumber || "—",
        "Passport Expiry": c.passportExpiry || "—",
        "Nationality": c.nationality || "Indian",
        "Full Address": c.address || "—",
        "City / District": c.city || "—",
        "State": c.state || "—",
        "Trade / Current Position": c.currentPosition || "—",
        "Experience (Years)": c.experienceYears != null ? `${c.experienceYears} Years` : "—",
        "Highest Qualification": c.qualification || "—",
        "Key Skills": Array.isArray(c.skills) ? c.skills.join(", ") : (c.skills || "—"),
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
        "Date Added": c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
      };
    });

    if (format === "csv") {
      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      // Prepend UTF-8 BOM so currency symbols and Indian names render cleanly in all spreadsheet viewers
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
      // Auto-fit column widths
      const colWidths = Object.keys(excelRows[0] || {}).map((key) => ({
        wch: Math.max(key.length + 4, 15),
      }));
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates Full Data");
      
      const filename = `Candidates_Full_Details_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
    }
    setDownloadModalOpen(false);
  };

  // =========================================================================
  // VIEW: FULL PAGE CANDIDATE DOCUMENT VIEWER (ZERO POPUPS)
  // =========================================================================
  if (previewingDoc) {
    const docVendor = vendors.find((v) => v.id === selectedCandidate?.vendorId);
    return (
      <DocumentViewerFullPage
        doc={previewingDoc}
        vendor={docVendor}
        candidate={selectedCandidate}
        onBack={() => setPreviewingDoc(null)}
      />
    );
  }

  // =========================================================================
  // VIEW 2: FULL CANDIDATE DETAIL PAGE
  // =========================================================================
  if (selectedCandidate) {
    const overallStatus = getCandidateOverallStatus(selectedCandidate.id);
    const vendorName = getVendorName(selectedCandidate.vendorId);

    return (
      <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800 pb-16">

        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCandidate(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={16} className="text-blue-600" />
            <span>Back to All Candidates</span>
          </button>
          <span className="text-xs font-mono font-bold text-slate-400">
            Candidate Master Profile • {selectedCandidate.id}
          </span>
        </div>

        {/* ── CANDIDATE HEADER CARD ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {selectedCandidate.photo ? (
                  <img src={selectedCandidate.photo} alt={selectedCandidate.fullName} className="w-full h-full object-cover" />
                ) : (
                  selectedCandidate.fullName.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCandidate.fullName}</h1>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {selectedCandidate.id}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${statusBadgeClass(overallStatus)}`}>
                    {overallStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-3 flex-wrap">
                  <span>Trade: <strong className="text-blue-700">{selectedCandidate.currentPosition}</strong></span>
                  <span>•</span>
                  <span>Experience: <strong className="text-slate-800">{selectedCandidate.experienceYears} Years</strong></span>
                  <span>•</span>
                  <span>Destination: <strong className="text-indigo-700">{selectedCandidate.preferredCountry}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-2 bg-blue-50 text-blue-800 text-xs font-bold rounded-xl border border-blue-200">
                {submissionHistory.length} Project Application{submissionHistory.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => handleOpenAssignProject(selectedCandidate)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Briefcase size={14} />
                Assign Project
              </button>
            </div>
          </div>

          {/* SOURCE VENDOR */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Building2 size={22} className="text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Source Vendor Partner</span>
                <span className="font-extrabold text-slate-900 text-sm">{vendorName}</span>
                <span className="font-mono text-slate-500 text-[11px] block">Vendor ID: {selectedCandidate.vendorId}</span>
              </div>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              <span>Sourced Date: </span>
              <strong className="text-slate-800">
                {selectedCandidate.createdAt ? new Date(selectedCandidate.createdAt).toLocaleDateString("en-IN") : "—"}
              </strong>
            </div>
          </div>

          {/* PERSONAL & TRADE DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Personal Information</h3>
              <div className="flex justify-between"><span className="text-slate-400">Date of Birth:</span><span className="font-bold text-slate-900">{selectedCandidate.dob || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Gender / Nationality:</span><span className="font-bold text-slate-900">{selectedCandidate.gender || "—"} • {selectedCandidate.nationality || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Mobile Phone:</span><span className="font-bold text-slate-900">{selectedCandidate.phone}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Email Address:</span><span className="font-bold text-slate-900">{selectedCandidate.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Full Address:</span><span className="font-semibold text-slate-800">{selectedCandidate.address}</span></div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Trade & Skill Information</h3>
              <div className="flex justify-between"><span className="text-slate-400">Trade Position:</span><span className="font-extrabold text-blue-700 text-sm">{selectedCandidate.currentPosition}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Experience:</span><span className="font-bold text-slate-900">{selectedCandidate.experienceYears} Years</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Qualification:</span><span className="font-bold text-slate-900">{selectedCandidate.qualification}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Previous Employer:</span><span className="font-semibold text-slate-800">{selectedCandidate.previousCompany || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Preferred Destination:</span><span className="font-bold text-indigo-700">{selectedCandidate.preferredCountry}</span></div>
              <div className="pt-1">
                <span className="text-slate-400 block mb-1 font-semibold">Technical Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCandidate.skills || []).map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">{sk}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── DOCUMENT VERIFICATION VAULT ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Paperclip size={18} className="text-blue-600" />
                <span>Candidate Verification Documents Vault</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Inspect identity documents, passport, resume & skill certificates submitted by vendor.
              </p>
            </div>
            {(() => {
              const candDocs = selectedCandidate.documents || [];
              const allDocsVerified = candDocs.length > 0 && candDocs.every((d) => (d.status || "").toLowerCase() === "verified");
              if (candDocs.length === 0) return null;
              if (allDocsVerified) {
                return (
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>All Documents Verified</span>
                  </span>
                );
              }
              return (
                <button
                  onClick={handleAcceptAllCandidateDocs}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Verify & Accept All</span>
                </button>
              );
            })()}
          </div>

          {(!selectedCandidate.documents || selectedCandidate.documents.length === 0) ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <FileText size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Documents Uploaded</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The sourcing vendor has not submitted any documents for this candidate yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {selectedCandidate.documents.map((doc, idx) => {
                const docStatus = doc.status || "Pending Review";
                const isVerified = docStatus === "Verified";
                const isRejected = docStatus === "Rejected";

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition space-y-3 ${
                      isVerified ? "border-emerald-200 bg-emerald-50/30"
                      : isRejected ? "border-rose-200 bg-rose-50/30"
                      : "border-slate-200 bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                          <FileText size={18} />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block text-xs">{doc.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{doc.fileName} • {doc.size || "—"}</span>
                        </div>
                      </div>

                      {isVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" /> Verified
                        </span>
                      ) : isRejected ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0 flex items-center gap-1">
                          <XCircle size={12} className="text-rose-600" /> Rejected
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1">
                          <Clock size={12} className="text-amber-600" /> Pending
                        </span>
                      )}
                    </div>

                    {isRejected && doc.remarks && (
                      <div className="p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-900 font-semibold text-[11px]">
                        <strong>Rejection Remark:</strong> {doc.remarks}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80 text-[11px] gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewingDoc(doc)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition shadow-2xs"
                          title="Open document in dedicated full-page view"
                        >
                          <Eye size={13} className="text-blue-600" />
                          <span>View Document</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer flex items-center gap-1 transition"
                          title="Download document file directly"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>
                      </div>

                      {isVerified ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-200 shadow-2xs">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Verified</span>
                        </div>
                      ) : isRejected ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200">
                            Rejected
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAcceptDocument(idx)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs transition"
                          >
                            Accept Now
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAcceptDocument(idx)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs transition flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInlineRejectIdx(inlineRejectIdx === idx ? null : idx);
                              setInlineRejectReason("");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs transition flex items-center gap-1"
                          >
                            <XCircle size={12} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {inlineRejectIdx === idx && (
                      <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2 animate-fadeIn">
                        <label className="text-[11px] font-bold text-rose-900 block">
                          Specify Rejection Reason for {doc.name}:
                        </label>
                        <input
                          type="text"
                          value={inlineRejectReason}
                          onChange={(e) => setInlineRejectReason(e.target.value)}
                          placeholder="e.g. Expired validity, blurred image, name mismatch..."
                          className="w-full px-3 py-1.5 rounded-lg border border-rose-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInlineRejectIdx(null)}
                            className="px-2.5 py-1 rounded-lg text-slate-600 text-[11px] font-bold hover:bg-slate-200/60 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmInlineReject(idx)}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer shadow-2xs"
                          >
                            Confirm Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── PROJECT APPLICATION HISTORY + ADMIN ACTIONS ────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Project Applications ({submissionHistory.length})
            </h2>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Admin Review Panel
            </span>
          </div>

          {submissionHistory.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-2xl text-slate-500 italic text-center text-xs border border-dashed border-slate-300">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No project applications found. Vendor has not submitted this candidate to any project yet.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {submissionHistory.map((sub) => {
                const isSelected = sub.status === "Selected" || sub.status === "Completed";
                const isInterview = sub.status === "Interview";
                const isRejected = sub.status === "Rejected";
                const isShortlisted = sub.status === "Shortlisted";
                const isOnHold = sub.status === "On Hold";

                return (
                  <div
                    key={sub.id}
                    className={`rounded-2xl border transition overflow-hidden ${
                      isSelected ? "bg-emerald-50/50 border-emerald-200"
                      : isShortlisted ? "bg-indigo-50/50 border-indigo-200"
                      : isInterview ? "bg-purple-50/50 border-purple-200"
                      : isRejected ? "bg-rose-50/50 border-rose-200"
                      : isOnHold ? "bg-amber-50/50 border-amber-200"
                      : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    {/* Application Info Row */}
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <span className="font-mono text-[10px] font-bold text-slate-400 block">{sub.id}</span>
                          <h4 className="font-black text-slate-900 text-base mt-0.5">{sub.projectName}</h4>
                          <p className="text-xs text-slate-600 mt-1 font-semibold">
                            Client: <strong className="text-slate-900">{sub.clientName}</strong>
                            {" • "}Position: {sub.position}
                            {sub.country ? ` (${sub.country})` : ""}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Submitted: {sub.submittedAt ? sub.submittedAt.split("T")[0] : "—"}
                          </p>

                          {isRejected && sub.rejectionReason && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-900 font-semibold text-xs flex items-center gap-2">
                              <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                              <span>Rejection Reason: {sub.rejectionReason}</span>
                            </div>
                          )}

                          {isInterview && sub.interviewDetails && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-purple-100/70 border border-purple-200 text-purple-900 font-semibold text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <Video size={13} className="text-purple-600 shrink-0" />
                                <span className="font-bold">Interview Scheduled:</span>
                                <span>{sub.interviewDetails.dateTime ? new Date(sub.interviewDetails.dateTime).toLocaleString("en-IN") : "—"}</span>
                              </div>
                              {sub.interviewDetails.meetingUrl && (
                                <div>
                                  <a
                                    href={sub.interviewDetails.meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-700 underline font-bold"
                                  >
                                    🔗 Join Zoom / Meeting
                                  </a>
                                </div>
                              )}
                              {sub.interviewDetails.notes && (
                                <div className="text-purple-700">Notes: {sub.interviewDetails.notes}</div>
                              )}
                            </div>
                          )}
                        </div>

                        <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-2xs self-start ${statusBadgeClass(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>

                      {/* ── Admin Action Buttons ─── */}
                      {!isSelected && !isRejected && (
                        <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap gap-2">
                          {/* On Hold */}
                          {!isOnHold && (
                            <button
                              onClick={() => handleHold(sub)}
                              disabled={actionLoading === sub.id + "_hold"}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs disabled:opacity-50"
                            >
                              <Pause size={12} />
                              <span>{actionLoading === sub.id + "_hold" ? "Updating..." : "On Hold"}</span>
                            </button>
                          )}

                          {/* Schedule Interview */}
                          <button
                            onClick={() => handleOpenInterviewModal(sub)}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                          >
                            <Video size={12} />
                            <span>{isInterview ? "Update Interview" : "Schedule Interview"}</span>
                          </button>

                          {/* Select */}
                          <button
                            onClick={() => handleSelect(sub)}
                            disabled={actionLoading === sub.id + "_select"}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs disabled:opacity-50"
                          >
                            <UserCheck size={12} />
                            <span>{actionLoading === sub.id + "_select" ? "Selecting..." : "Select Candidate"}</span>
                          </button>

                          {/* Reject */}
                          <button
                            onClick={() => handleOpenRejectApp(sub)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                          >
                            <XCircle size={12} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {/* Selected: Show processing stages & milestones + add milestone */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-emerald-200/60 space-y-3">
                          {/* Processing stages */}
                          {sub.processing && sub.processing.stages && (
                            <div>
                              <p className="text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wider">
                                Processing Timeline
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {sub.processing.stages.map((stg, i) => (
                                  <div
                                    key={i}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                      stg.status === "completed" ? "bg-emerald-100 text-emerald-800"
                                      : stg.status === "in_progress" ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-500"
                                    }`}
                                  >
                                    {stg.status === "completed" ? <CheckCircle2 size={11} /> : stg.status === "in_progress" ? <ChevronRight size={11} /> : <Clock size={11} />}
                                    <span>{stg.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Milestones & Processing Stages */}
                          {sub.paymentPlan && sub.paymentPlan.milestones?.length > 0 ? (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                  Payment Milestones — Total: ₹{sub.paymentPlan.totalAmount?.toLocaleString("en-IN")}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setConfigureMilestonesModal({ application: sub })}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition border border-indigo-200 shadow-2xs"
                                    title="Edit milestones and processing stages"
                                  >
                                    <Sliders size={11} />
                                    <span>Configure Plan</span>
                                  </button>
                                  <button
                                    onClick={() => setConfigureMilestonesModal({ application: sub })}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                    title="Add new milestone or stages"
                                  >
                                    <Plus size={11} />
                                    <span>Add Milestone</span>
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(sub.paymentPlan.milestones || []).map((ms, mi) => (
                                  <button
                                    key={mi}
                                    type="button"
                                    onClick={() => setConfigureMilestonesModal({ application: sub })}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer hover:shadow-xs flex items-center gap-1.5 ${
                                      ms.status === "Paid"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                                        : ms.status === "Due"
                                        ? "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                    title="Click to edit milestone and stages"
                                  >
                                    <span>{ms.name} — ₹{Number(ms.amount).toLocaleString("en-IN")} [{ms.status}]</span>
                                    <Sliders size={10} className="text-slate-400" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                              <div>
                                <p className="text-xs font-bold text-blue-900">Payment Milestones & Processing Stages</p>
                                <p className="text-[10px] text-blue-700">Configure fee milestones and customize individual stage steps for this candidate.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setConfigureMilestonesModal({ application: sub })}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                              >
                                <Sliders size={12} />
                                <span>Configure Milestones & Stages</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rejected: Info note */}
                      {isRejected && (
                        <div className="mt-4 pt-4 border-t border-rose-200/60">
                          <p className="text-[11px] text-slate-500 italic">
                            Candidate returned to vendor pool. Vendor can re-submit this candidate to another project.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MODALS ─────────────────────────────────────────────────── */}

        {/* Interview Schedule Modal */}
        {interviewModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Interview Scheduling</span>
                  <h3 className="text-base font-black text-slate-900">Schedule Interview</h3>
                </div>
                <button onClick={() => setInterviewModal(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg">✕</button>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Candidate:</span><span className="font-bold">{interviewModal.application.candidateName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Project:</span><span className="font-bold">{interviewModal.application.projectName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Position:</span><span className="font-bold text-purple-700">{interviewModal.application.position}</span></div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={interviewForm.dateTime}
                    onChange={(e) => setInterviewForm({ ...interviewForm, dateTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Zoom / Meeting URL</label>
                  <input
                    type="url"
                    value={interviewForm.meetingUrl}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meetingUrl: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interview Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={interviewForm.notes}
                    onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                    placeholder="Additional instructions for vendor/candidate..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-purple-600 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <button type="button" onClick={() => setInterviewModal(null)} className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={handleScheduleInterview}
                  disabled={interviewLoading}
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Video size={13} />
                  <span>{interviewLoading ? "Scheduling..." : "Confirm & Schedule"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Application Modal */}
        {rejectAppModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Reject Application</span>
                  <h3 className="text-base font-black text-slate-900">Reject Candidate from Project</h3>
                </div>
                <button onClick={() => setRejectAppModal(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg">✕</button>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Candidate:</span><span className="font-bold">{rejectAppModal.application.candidateName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Project:</span><span className="font-bold">{rejectAppModal.application.projectName}</span></div>
              </div>

              <p className="text-xs text-slate-500">
                Candidate will be returned to vendor pool and vendor can re-submit to other projects.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Did not meet specific client requirements, skills mismatch, etc."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                <button type="button" onClick={() => setRejectAppModal(null)} className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={handleConfirmRejectApp}
                  disabled={rejectLoading}
                  className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle size={13} />
                  <span>{rejectLoading ? "Rejecting..." : "Confirm Rejection"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configure Milestones Modal */}
        <ConfigureMilestonesModal
          isOpen={!!configureMilestonesModal}
          onClose={() => setConfigureMilestonesModal(null)}
          application={configureMilestonesModal?.application}
          onSaved={refreshCandidateView}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: ALL CANDIDATES ROSTER TABLE
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Candidates Roster</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Central candidate database. Review profiles, verify documents and manage the selection pipeline — Shortlist → Interview → Select / Reject.
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

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: "All", label: "All Candidates", count: countAll, icon: Users },
            { id: "Shortlisted", label: "Shortlisted", count: countShortlisted, icon: UserCheck },
            { id: "Interview", label: "Interview", count: countInterview, icon: Video },
            { id: "Selected", label: "Selected", count: countSelected, icon: CheckCircle2 },
            { id: "Rejected", label: "Rejected", count: countRejected, icon: XCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, ID, vendor..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
          </div>

          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Sourcing Vendors</option>
            {vendorOptions.map((v) => (
              <option key={v} value={v}>{getVendorName(v)}</option>
            ))}
          </select>

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Trade Positions</option>
            {positionOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Preferred Destinations</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading candidates roster...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No candidates found</h3>
          <p className="text-xs text-slate-500 mt-1">No candidate records matched your tab selection or filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5">Candidate</th>
                  <th className="py-3.5 px-4">Vendor Partner</th>
                  <th className="py-3.5 px-4">Trade Position</th>
                  <th className="py-3.5 px-4">Experience</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((c) => {
                  const vendorName = getVendorName(c.vendorId);
                  const overallStatus = getCandidateOverallStatus(c.id);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleViewCandidate(c)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      <td className="py-4 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 overflow-hidden font-black text-xs flex items-center justify-center shrink-0">
                            {c.photo ? (
                              <img src={c.photo} alt={c.fullName} className="w-full h-full object-cover" />
                            ) : (
                              c.fullName.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition block">
                              {c.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{c.id} • {c.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div>
                          <span className="font-extrabold text-slate-900 block">{vendorName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{c.vendorId}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-800">{c.currentPosition}</td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{c.experienceYears} Yrs</td>
                      <td className="py-4 px-4 font-bold text-indigo-700">{c.preferredCountry}</td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${statusBadgeClass(overallStatus)}`}>
                          {overallStatus}
                        </span>
                        {overallStatus === "Rejected" && (() => {
                          const candApps = applications.filter(a => a.candidateId === c.id);
                          const rejectedApp = [...candApps].reverse().find(a => a.status === "Rejected");
                          if (rejectedApp) {
                            const reasonStr = typeof rejectedApp.rejectionReason === 'string' ? rejectedApp.rejectionReason : (rejectedApp.rejectionReason?.rejectionReason || "Not specified");
                            return (
                               <div className="text-[10px] text-rose-600 mt-2 font-medium bg-rose-50/50 p-1.5 rounded-lg border border-rose-100">
                                 <span className="block font-bold">Stage: {rejectedApp.rejectionStage || "Verification"}</span>
                                 Reason: {reasonStr}
                               </div>
                            )
                          }
                          return null;
                        })()}
                      </td>

                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {overallStatus === "Rejected" && (
                            <button
                               onClick={() => handleReuseCandidate(c.id)}
                               disabled={actionLoading === c.id + "_reuse"}
                               className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold text-[11px] shadow-2xs transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                               <span>{actionLoading === c.id + "_reuse" ? "..." : "Reuse"}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleViewCandidate(c)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye size={14} />
                            <span>Review</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Download Modal */}
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        onDownload={handleDownloadExcel}
      />

      {/* Assign Project Modal */}
      {assignProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Assign Project to Candidate</h3>
                <p className="text-xs text-slate-500 mt-1">Assign {assignProjectModal.candidate.fullName} to an available project.</p>
              </div>
              <button onClick={() => setAssignProjectModal(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Client & Project *</label>
                <select
                  value={assignForm.projectId}
                  onChange={(e) => {
                    const projId = e.target.value;
                    let cId = "";
                    let defaultPos = "";
                    for (const c of clients) {
                      const proj = c.projects?.find(p => String(p.id) === String(projId));
                      if (proj) {
                        cId = c.id;
                        if (proj.manpowerRequirements?.length > 0) {
                          defaultPos = proj.manpowerRequirements[0].position || proj.manpowerRequirements[0].positionTitle;
                        }
                        break;
                      }
                    }
                    setAssignForm({ ...assignForm, projectId: projId, clientId: cId, position: defaultPos });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 focus:outline-none"
                >
                  <option value="">-- Select Project --</option>
                  {clients.map(c => c.projects?.map(p => (
                    <option key={p.id} value={p.id}>{c.companyName} - {p.projectName}</option>
                  )))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Trade / Position *</label>
                <input
                  type="text"
                  value={assignForm.position}
                  onChange={(e) => setAssignForm({ ...assignForm, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 focus:outline-none"
                  placeholder="e.g. Electrician, Heavy Driver"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAssignProjectModal(null)} className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button
                type="button"
                onClick={handleAssignProject}
                disabled={assignLoading || !assignForm.projectId || !assignForm.position}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {assignLoading ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
