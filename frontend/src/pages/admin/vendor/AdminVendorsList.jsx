import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Eye,
  FileText,
  Download,
  ArrowLeft,
  Users,
  Send,
  UserCheck,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Edit,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Paperclip,
  FileCheck,
  Plus,
  Copy,
  Check,
  Lock,
  UploadCloud,
  ExternalLink,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";

export default function AdminVendorsList() {
  const [vendors, setVendors] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin Add Vendor Modal State
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [addVendorLoading, setAddVendorLoading] = useState(false);
  const [dispatchedVendor, setDispatchedVendor] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    companyName: "",
    businessType: "Private Limited",
    registrationNumber: "",
    establishmentYear: "2018",
    gstin: "",
    pan: "",
    website: "",

    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    pinCode: "",
    address: "",

    contactPersonName: "",
    designation: "Managing Director",
    phone: "",
    alternatePhone: "",
    email: "",

    specialization: "Construction, Electrical, Welding",
    countriesServed: "UAE, Saudi Arabia, Qatar",
    experienceYears: "5",
    availableCandidates: "150",
    monthlyCapacity: "50",

    password: "Password@123",

    tradeLicenseDocName: "",
    recruitmentLicenseDocName: "",
    gstDocName: "",
    panDocName: "",
  });

  const [searchParams, setSearchParams] = useSearchParams();

  // Filters State for All Vendors Table
  const [statusFilter, setStatusFilter] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "pending") return "Pending Verification";
    if (tabParam === "mou") return "MOU Pending";
    if (tabParam === "approved") return "Approved";
    if (tabParam === "rejected") return "Rejected";
    if (tabParam === "suspended") return "Suspended";
    return "All";
  });

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "pending") {
      setStatusFilter("Pending Verification");
    } else if (tabParam === "mou") {
      setStatusFilter("MOU Pending");
    } else if (tabParam === "approved") {
      setStatusFilter("Approved");
    } else if (tabParam === "rejected") {
      setStatusFilter("Rejected");
    } else if (tabParam === "suspended") {
      setStatusFilter("Suspended");
    } else if (tabParam === "all") {
      setStatusFilter("All");
    }
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [specFilter, setSpecFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Selected Vendor Detail View & Statutory Documents Full Page View State
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDocsPage, setShowDocsPage] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Selected Candidate Full Page State inside Vendor Detail
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [rejectCandDocModal, setRejectCandDocModal] = useState(null);
  const [candDocRemarks, setCandDocRemarks] = useState("");

  // Candidate Search within Vendor Detail
  const [candSearchQuery, setCandSearchQuery] = useState("");

  // Application Pipeline & Reassign Project Action States
  const [showAppRejectModal, setShowAppRejectModal] = useState(null); // { appId, candName }
  const [appRejectReason, setAppRejectReason] = useState("");
  const [showReassignProjModal, setShowReassignProjModal] = useState(null); // { appId, candName, currentProjName }
  const [reassignProjId, setReassignProjId] = useState("PRJ-101");
  const [reassignPosition, setReassignPosition] = useState("");

  const availableProjects = [
    { id: "PRJ-101", clientId: "cl-1", clientName: "Al-Futtaim Construction Group", projectName: "Dubai South Luxury Tower Phase 2", country: "UAE", code: "REQ-0008" },
    { id: "PRJ-102", clientId: "cl-2", clientName: "Arabtec Holding PJSC", projectName: "Riyadh Metro Line 3 Extension", country: "Saudi Arabia", code: "REQ-0012" },
    { id: "PRJ-103", clientId: "cl-3", clientName: "Emaar Properties", projectName: "Downtown Commercial Mall Renovation", country: "UAE", code: "REQ-0020" },
    { id: "PRJ-104", clientId: "cl-4", clientName: "Petrofac Facilities", projectName: "Kuwait Oil Refinery Expansion", country: "Kuwait", code: "REQ-0025" },
    { id: "PRJ-105", clientId: "cl-5", clientName: "Qatari Diar Real Estate", projectName: "Doha Airport Terminal 2 Expansion", country: "Qatar", code: "REQ-0030" },
  ];

  // Interview Modal & Add Milestone States
  const [showInterviewModal, setShowInterviewModal] = useState(null); // { appId, candName }
  const [interviewUrl, setInterviewUrl] = useState("https://zoom.us/j/9876543210");
  const [interviewDate, setInterviewDate] = useState("10 Oct 2026, 02:30 PM");
  const [interviewNotes, setInterviewNotes] = useState("Client technical interview round via Zoom.");

  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(null); // { appId, candName }
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestonePercentage, setNewMilestonePercentage] = useState("25");
  const [newMilestoneAmount, setNewMilestoneAmount] = useState("10000");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");

  const handleUpdateAppStatus = async (appId, newStatus, reason = "") => {
    try {
      const updatedApp = await crmVendorService.updateApplicationStatus(appId, newStatus, reason);
      loadData();
      if (selectedCandidate) {
        setSelectedCandidate((prev) => ({
          ...prev,
          candApp: updatedApp || { ...prev?.candApp, status: newStatus },
        }));
      }
    } catch (err) {
      alert(err.message || "Failed to update status.");
    }
  };

  const handleConfirmScheduleInterview = async () => {
    if (!showInterviewModal) return;
    try {
      const updatedApp = await crmVendorService.updateApplicationStatus(
        showInterviewModal.appId,
        "Interview",
        "",
        {
          meetingUrl: interviewUrl.trim(),
          dateTime: interviewDate.trim(),
          notes: interviewNotes.trim(),
        }
      );
      setShowInterviewModal(null);
      loadData();
      if (selectedCandidate) {
        setSelectedCandidate((prev) => ({ ...prev, candApp: updatedApp }));
      }
    } catch (err) {
      alert(err.message || "Failed to schedule interview.");
    }
  };

  const handleConfirmAddMilestone = async () => {
    if (!showAddMilestoneModal) return;
    if (!newMilestoneName.trim()) {
      alert("Please enter milestone name.");
      return;
    }
    try {
      const updatedApp = await crmVendorService.addApplicationMilestone(showAddMilestoneModal.appId, {
        name: newMilestoneName.trim(),
        percentage: Number(newMilestonePercentage) || 0,
        amount: Number(newMilestoneAmount) || 0,
        dueDate: newMilestoneDueDate.trim(),
      });
      setShowAddMilestoneModal(null);
      setNewMilestoneName("");
      loadData();
      if (selectedCandidate) {
        setSelectedCandidate((prev) => ({ ...prev, candApp: updatedApp }));
      }
    } catch (err) {
      alert(err.message || "Failed to add milestone.");
    }
  };

  const handleConfirmReassignProject = async () => {
    if (!showReassignProjModal) return;
    const targetProj = availableProjects.find((p) => p.id === reassignProjId) || availableProjects[0];
    try {
      const updatedApp = await crmVendorService.updateApplicationProject(showReassignProjModal.appId, {
        clientId: targetProj.clientId,
        clientName: targetProj.clientName,
        projectId: targetProj.id,
        projectName: targetProj.projectName,
        requirementCode: targetProj.code,
        position: reassignPosition.trim() || selectedCandidate?.currentPosition || "Technician",
        country: targetProj.country,
      });
      setShowReassignProjModal(null);
      setReassignPosition("");
      loadData();
      if (selectedCandidate) {
        setSelectedCandidate((prev) => ({ ...prev, candApp: updatedApp }));
      }
    } catch (err) {
      alert(err.message || "Failed to reassign project.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptCandDoc = async (docIdx) => {
    if (!selectedCandidate) return;
    try {
      const updated = await crmVendorService.verifyCandidateDocument(
        selectedCandidate.id,
        docIdx,
        "Verified",
        ""
      );
      setSelectedCandidate({ ...selectedCandidate, ...updated });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmRejectCandDoc = async () => {
    if (!selectedCandidate || !rejectCandDocModal) return;
    if (!candDocRemarks.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    try {
      const updated = await crmVendorService.verifyCandidateDocument(
        selectedCandidate.id,
        rejectCandDocModal.docIdx,
        "Rejected",
        candDocRemarks
      );
      setSelectedCandidate({ ...selectedCandidate, ...updated });
      setRejectCandDocModal(null);
      setCandDocRemarks("");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAcceptAllCandDocs = async () => {
    if (!selectedCandidate) return;
    try {
      const updated = await crmVendorService.verifyAllCandidateDocuments(
        selectedCandidate.id,
        "Verified"
      );
      setSelectedCandidate({ ...selectedCandidate, ...updated });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const vData = await crmVendorService.getVendors();
      const cData = await crmVendorService.getCandidates();
      const aData = await crmVendorService.getApplications();

      setVendors(vData || []);
      setCandidates(cData || []);
      setApplications(aData || []);
    } catch (err) {
      console.error("Failed to load vendor management data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId) => {
    try {
      await crmVendorService.approveVendor(vendorId);
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, status: "Approved" }));
      }
      alert("Vendor approved successfully. Verification link and login credentials have been sent to their registered email.");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerifyMOU = async (vendorId) => {
    try {
      await crmVendorService.signOrVerifyMOU(vendorId, "Approved");
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, mouSigned: true, mouStatus: "Approved" }));
      }
      alert("Vendor MOU verified and approved successfully!");
    } catch (err) {
      alert(err.message || "Failed to verify MOU");
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    try {
      await crmVendorService.rejectVendor(selectedVendor.id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason("");
      loadData();
      if (selectedVendor) {
        setSelectedVendor((prev) => ({
          ...prev,
          status: "Rejected",
          rejectionReason,
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleSuspend = async (vendorId) => {
    try {
      await crmVendorService.suspendVendor(vendorId);
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({
          ...prev,
          status: prev.status === "Suspended" ? "Approved" : "Suspended",
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Admin Add New Vendor Submit Handler
  const handleAddVendorSubmit = async (e) => {
    e.preventDefault();
    if (!newVendorForm.companyName.trim() || !newVendorForm.email.trim()) {
      alert("Please enter Agency Company Name and Vendor Email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newVendorForm.email.trim())) {
      alert("Please enter a valid email address (e.g. vendor@company.com).");
      return;
    }

    if (newVendorForm.phone.trim()) {
      const digitsOnly = newVendorForm.phone.replace(/[\s\-\(\)\+]/g, "");
      if (!/^\d{10,15}$/.test(digitsOnly)) {
        alert("Please enter a valid 10 to 15 digit phone number.");
        return;
      }
    }

    // Build document list from statutory upload fields
    const docList = [];
    if (newVendorForm.tradeLicenseDocName?.trim()) {
      docList.push({
        name: "Trade License / Incorporation Certificate",
        fileName: newVendorForm.tradeLicenseDocName.trim(),
        size: "1.8 MB",
        type: "Registration",
      });
    }
    if (newVendorForm.recruitmentLicenseDocName?.trim()) {
      docList.push({
        name: "Recruitment License",
        fileName: newVendorForm.recruitmentLicenseDocName.trim(),
        size: "1.4 MB",
        type: "License",
      });
    }
    if (newVendorForm.gstDocName?.trim()) {
      docList.push({
        name: "GST Certificate",
        fileName: newVendorForm.gstDocName.trim(),
        size: "950 KB",
        type: "Tax",
      });
    }
    if (newVendorForm.panDocName?.trim()) {
      docList.push({
        name: "PAN Card",
        fileName: newVendorForm.panDocName.trim(),
        size: "720 KB",
        type: "Tax",
      });
    }

    try {
      setAddVendorLoading(true);
      const registered = await crmVendorService.registerVendor({
        ...newVendorForm,
        documents: docList,
        status: "Approved",
      });
      setDispatchedVendor(registered);
      setShowAddVendorModal(false);

      // Reset form
      setNewVendorForm({
        companyName: "",
        businessType: "Private Limited",
        registrationNumber: "",
        establishmentYear: "2018",
        gstin: "",
        pan: "",
        website: "",

        country: "India",
        state: "Maharashtra",
        city: "Mumbai",
        pinCode: "",
        address: "",

        contactPersonName: "",
        designation: "Managing Director",
        phone: "",
        alternatePhone: "",
        email: "",

        specialization: "Construction, Electrical, Welding",
        countriesServed: "UAE, Saudi Arabia, Qatar",
        experienceYears: "5",
        availableCandidates: "150",
        monthlyCapacity: "50",

        password: "Password@123",

        tradeLicenseDocName: "",
        recruitmentLicenseDocName: "",
        gstDocName: "",
        panDocName: "",
      });
      loadData();
    } catch (err) {
      alert(err.message || "Failed to register vendor.");
    } finally {
      setAddVendorLoading(false);
    }
  };

  const copyVendorLoginUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper calculations for vendor metrics
  const getVendorMetrics = (vId) => {
    const vCands = candidates.filter((c) => c.vendorId === vId);
    const vApps = applications.filter((a) => a.vendorId === vId);

    const totalCandidates = vCands.length;
    const submitted = vApps.filter((a) => a.status === "Submitted").length;
    const underReview = vApps.filter((a) => a.status === "Under Review").length;
    const shortlisted = vApps.filter((a) => a.status === "Shortlisted").length;
    const selected = vApps.filter((a) => a.status === "Selected").length;
    const rejected = vApps.filter((a) => a.status === "Rejected").length;
    const inProcessing = vApps.filter(
      (a) => a.status === "Selected" && (a.processing?.currentStageIndex ?? 0) < 7
    ).length;
    const completed = vApps.filter(
      (a) => a.status === "Selected" && a.processing?.currentStageIndex === 7
    ).length;

    return {
      totalCandidates,
      submitted,
      underReview,
      shortlisted,
      selected,
      rejected,
      inProcessing,
      completed,
    };
  };

  // Filter lists for dropdowns
  const availableStates = Array.from(new Set(vendors.map((v) => v.state).filter(Boolean)));
  const availableCities = Array.from(new Set(vendors.map((v) => v.city).filter(Boolean)));
  const availableSpecs = Array.from(new Set(vendors.map((v) => v.specialization).filter(Boolean)));

  // Filtered vendors list
  const filteredVendors = vendors.filter((v) => {
    if (statusFilter === "Pending Verification") {
      if (v.status !== "Pending") return false;
    } else if (statusFilter === "MOU Pending") {
      const isMouPending = (!v.mouSigned || v.mouStatus !== "Approved") && v.status !== "Rejected";
      if (!isMouPending) return false;
    } else if (statusFilter === "Approved") {
      const isMouComplete = v.mouSigned === true || v.mouStatus === "Approved";
      if (v.status !== "Approved" || !isMouComplete) return false;
    } else if (statusFilter !== "All" && v.status !== statusFilter) {
      return false;
    }

    if (stateFilter !== "All" && v.state !== stateFilter) return false;
    if (cityFilter !== "All" && v.city !== cityFilter) return false;
    if (specFilter !== "All" && !v.specialization?.includes(specFilter)) return false;

    if (dateFilter === "This Month") {
      const regDate = new Date(v.registeredAt || Date.now());
      const now = new Date();
      if (regDate.getMonth() !== now.getMonth() || regDate.getFullYear() !== now.getFullYear()) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.companyName?.toLowerCase().includes(q) ||
        v.id?.toLowerCase().includes(q) ||
        v.contactPersonName?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.state?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Approved
          </span>
        );
      case "Pending":
      case "Pending Verification":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Verification
          </span>
        );
      case "Suspended":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            Suspended
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Rejected
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 text-xs rounded-full font-bold bg-slate-100">{status}</span>;
    }
  };

  // =========================================================================
  // VIEW 4: FULL PAGE CANDIDATE DOSSIER & DOCUMENT VERIFICATION VAULT
  // =========================================================================
  if (selectedVendor && selectedCandidate) {
    const candDocs = selectedCandidate.documents || [];
    const currentApp = applications.find((a) => a.candidateId === selectedCandidate.id) || selectedCandidate.candApp;
    const appId = currentApp?.id;
    const appStatus = currentApp?.status || "Submitted";

    return (
      <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800 pb-12">
        {/* Top Navigation Bar with Back Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Vendor Profile ({selectedVendor.companyName})</span>
            </button>

            <button
              onClick={() => {
                setSelectedCandidate(null);
                setSelectedVendor(null);
                setShowDocsPage(false);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft size={16} className="text-blue-600" />
              <span>Back to All Vendors</span>
            </button>
          </div>

          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            Candidate Dossier • {selectedCandidate.id}
          </span>
        </div>

        {/* CANDIDATE HEADER CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {selectedCandidate.photo ? (
                  <img src={selectedCandidate.photo} alt={selectedCandidate.fullName} className="w-full h-full object-cover" />
                ) : (
                  selectedCandidate.fullName?.substring(0, 2).toUpperCase() || "CN"
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCandidate.fullName}</h1>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {selectedCandidate.id}
                  </span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                    {appStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-3 flex-wrap">
                  <span>Trade: <strong className="text-blue-700">{selectedCandidate.currentPosition || "Technician"}</strong></span>
                  <span>•</span>
                  <span>Experience: <strong className="text-slate-800">{selectedCandidate.experienceYears || "5"} Years</strong></span>
                  <span>•</span>
                  <span>Destination: <strong className="text-indigo-700">{selectedCandidate.preferredCountry || "UAE"}</strong></span>
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Sourcing Partner</span>
              <span className="font-extrabold text-slate-900 text-sm block">{selectedVendor.companyName}</span>
              <span className="font-mono text-slate-500 text-[11px] block">{selectedVendor.id}</span>
            </div>
          </div>

          {/* Project Submission Context & Admin Action Bar */}
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 text-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-blue-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Applied Project</span>
                <span className="font-bold text-blue-900 text-sm">{currentApp?.projectName || "Riyadh Metro Line 3"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Client Company</span>
                <span className="font-bold text-slate-800 text-sm">{currentApp?.clientName || "Saudi Oger Contracting"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Requirement Code</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{currentApp?.requirementCode || "REQ-0008"}</span>
              </div>
            </div>

            {/* Admin Application Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-700 text-xs">Application Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    appStatus === "Selected"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : appStatus === "Shortlisted"
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : appStatus === "Interview"
                      ? "bg-purple-100 text-purple-800 border border-purple-300"
                      : appStatus === "Rejected"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {appStatus}
                </span>
              </div>

              {appId && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleUpdateAppStatus(appId, "Shortlisted")}
                    disabled={appStatus === "Shortlisted"}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <UserCheck size={14} />
                    <span>Shortlist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateAppStatus(appId, "Interview")}
                    disabled={appStatus === "Interview"}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Briefcase size={14} />
                    <span>Interview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateAppStatus(appId, "Selected")}
                    disabled={appStatus === "Selected"}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 size={14} />
                    <span>Select</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAppRejectModal({ appId, candName: selectedCandidate.fullName });
                      setAppRejectReason("");
                    }}
                    disabled={appStatus === "Rejected"}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <XCircle size={14} />
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowReassignProjModal({ appId, candName: selectedCandidate.fullName, currentProjName: currentApp?.projectName });
                      setReassignProjId("PRJ-101");
                      setReassignPosition(selectedCandidate.currentPosition || "");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink size={14} />
                    <span>Edit / Change Project</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Personal & Skill Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                Personal Information
              </h3>
              <div className="flex justify-between"><span className="text-slate-400">Date of Birth:</span><span className="font-bold text-slate-900">{selectedCandidate.dob || "1994-06-15"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Gender / Nationality:</span><span className="font-bold text-slate-900">{selectedCandidate.gender || "Male"} • {selectedCandidate.nationality || "Indian"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Mobile Phone:</span><span className="font-bold text-slate-900">{selectedCandidate.phone || "+91 98765 00112"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Email Address:</span><span className="font-bold text-slate-900 truncate block">{selectedCandidate.email || "candidate@email.com"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Full Address:</span><span className="font-semibold text-slate-800">{selectedCandidate.address || "H.No 44, Patel Nagar, India"}</span></div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                Trade & Skill Information
              </h3>
              <div className="flex justify-between"><span className="text-slate-400">Trade Position:</span><span className="font-extrabold text-blue-700 text-sm">{selectedCandidate.currentPosition || "Technician"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total Experience:</span><span className="font-bold text-slate-900">{selectedCandidate.experienceYears || "5"} Years</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Qualification:</span><span className="font-bold text-slate-900">{selectedCandidate.qualification || "Diploma in Technology"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Previous Employer:</span><span className="font-semibold text-slate-800">{selectedCandidate.previousCompany || "L&T Construction"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Preferred Destination:</span><span className="font-bold text-indigo-700">{selectedCandidate.preferredCountry || "UAE"}</span></div>
            </div>
          </div>
        </div>

        {/* CANDIDATE VERIFICATION DOCUMENTS VAULT */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Paperclip size={18} className="text-blue-600" />
                <span>Candidate Verification Documents Vault</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Admin manual verification panel. Inspect candidate identity, resume, passport, and skill certificates.
              </p>
            </div>

            {candDocs.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAllCandDocs}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Verify & Accept All Docs</span>
                </button>
              </div>
            )}
          </div>

          {candDocs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <FileText size={24} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No Statutory Documents Uploaded</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The sourcing vendor has not submitted any documents for this candidate yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {candDocs.map((doc, idx) => {
                const docStatus = doc.status || "Pending Review";
                const isVerified = docStatus === "Verified";
                const isRejected = docStatus === "Rejected";

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition space-y-3 ${
                      isVerified
                        ? "border-emerald-200 bg-emerald-50/30"
                        : isRejected
                        ? "border-rose-200 bg-rose-50/30"
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
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {doc.fileName} • {doc.size || "1.2 MB"}
                          </span>
                        </div>
                      </div>

                      {isVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : isRejected ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0 flex items-center gap-1">
                          <XCircle size={12} className="text-rose-600" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1">
                          <Clock size={12} className="text-amber-600" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </div>

                    {isRejected && doc.remarks && (
                      <div className="p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-900 font-semibold text-[11px]">
                        <strong>Rejection Remark:</strong> {doc.remarks}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                      <button
                        type="button"
                        onClick={() => alert(`Downloading candidate document: ${doc.fileName}`)}
                        className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {!isVerified && (
                          <button
                            type="button"
                            onClick={() => handleAcceptCandDoc(idx)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            <span>Accept</span>
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectCandDocModal({ docIdx: idx, docName: doc.name });
                              setCandDocRemarks("");
                            }}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <XCircle size={12} />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CANDIDATE REJECTION REMARKS MODAL */}
        {rejectCandDocModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Reject Document • {rejectCandDocModal.docName}
              </h3>
              <p className="text-xs text-slate-500">
                Specify why this candidate document is being rejected (e.g. image blurry, document expired, name mismatch).
              </p>

              <textarea
                rows={3}
                value={candDocRemarks}
                onChange={(e) => setCandDocRemarks(e.target.value)}
                placeholder="Enter rejection remark / reason..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectCandDocModal(null)}
                  className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejectCandDoc}
                  className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATION REJECTION MODAL */}
        {showAppRejectModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Reject Candidate Application • {showAppRejectModal.candName}
              </h3>
              <p className="text-xs text-slate-500">
                Please state the reason for rejecting this candidate application.
              </p>

              <textarea
                rows={3}
                value={appRejectReason}
                onChange={(e) => setAppRejectReason(e.target.value)}
                placeholder="e.g. Does not meet client specific GCC experience requirement..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAppRejectModal(null)}
                  className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateAppStatus(showAppRejectModal.appId, "Rejected", appRejectReason);
                    setShowAppRejectModal(null);
                  }}
                  className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REASSIGN / EDIT PROJECT MODAL */}
        {showReassignProjModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Edit / Reassign Project • {showReassignProjModal.candName}
              </h3>
              <p className="text-xs text-slate-500">
                Currently applied to: <strong>{showReassignProjModal.currentProjName}</strong>. Select new target project below.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Client Project</label>
                  <select
                    value={reassignProjId}
                    onChange={(e) => setReassignProjId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold"
                  >
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectName} ({p.clientName} • {p.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Trade Position</label>
                  <input
                    type="text"
                    value={reassignPosition}
                    onChange={(e) => setReassignPosition(e.target.value)}
                    placeholder="e.g. Electrician, Welder, Mason"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReassignProjModal(null)}
                  className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReassignProject}
                  className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Project Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: FULL PAGE VENDOR STATUTORY DOCUMENTS VAULT
  // =========================================================================
  if (selectedVendor && showDocsPage) {
    const vendorDocs =
      selectedVendor.documents && selectedVendor.documents.length > 0
        ? selectedVendor.documents
        : [
            {
              id: "DOC-001",
              name: "Certificate of Incorporation / Registration",
              fileName: `${selectedVendor.companyName?.replace(/\s+/g, "_")}_Registration.pdf`,
              size: "2.4 MB",
              type: "Statutory",
              uploadedAt: "2026-09-01",
              status: "Verified",
            },
            {
              id: "DOC-002",
              name: "GST Registration Certificate",
              fileName: "GSTIN_Registration_Certificate.pdf",
              size: "1.1 MB",
              type: "Taxation",
              uploadedAt: "2026-09-01",
              status: "Verified",
            },
            {
              id: "DOC-003",
              name: "PAN Card (Company / Proprietor)",
              fileName: "Company_PAN_Card.pdf",
              size: "850 KB",
              type: "Taxation",
              uploadedAt: "2026-09-01",
              status: "Verified",
            },
            {
              id: "DOC-004",
              name: "MEA License / Recruitment License Certificate",
              fileName: "MEA_License_Approved.pdf",
              size: "3.2 MB",
              type: "Licensing",
              uploadedAt: "2026-09-02",
              status: "Verified",
            },
            {
              id: "DOC-005",
              name: "Bank Cancelled Cheque & Account Mandate",
              fileName: "Bank_Cancelled_Cheque.pdf",
              size: "620 KB",
              type: "Banking",
              uploadedAt: "2026-09-02",
              status: "Verified",
            },
            {
              id: "DOC-006",
              name: "ISO 9001 / Quality Compliance Certificate",
              fileName: "ISO_9001_Compliance.pdf",
              size: "1.7 MB",
              type: "Compliance",
              uploadedAt: "2026-09-05",
              status: "Verified",
            },
          ];

    return (
      <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800 pb-12">
        {/* Top Navigation Bar with Back Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowDocsPage(false)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Vendor Profile</span>
            </button>

            <button
              onClick={() => {
                setSelectedVendor(null);
                setShowDocsPage(false);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft size={16} className="text-blue-600" />
              <span>Back to All Vendors</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              Statutory Vault • {selectedVendor.id}
            </span>
          </div>
        </div>

        {/* VENDOR HEADER CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                <FileCheck size={26} />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {selectedVendor.companyName}
                  </h1>
                  {getStatusBadge(selectedVendor.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Official statutory credentials, registration certificates, tax compliance, and recruitment licenses.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>All Compliance Documents Verified</span>
              </span>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Commercial Reg No</span>
              <span className="text-slate-900 font-bold">{selectedVendor.registrationNumber || "CR-887412"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Business Specialization</span>
              <span className="text-slate-900 font-bold">{selectedVendor.specialization || "Technical Trades & Manpower"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Email</span>
              <span className="text-slate-900 font-bold truncate block">{selectedVendor.contactPersonEmail || selectedVendor.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Registered Location</span>
              <span className="text-slate-900 font-bold">{selectedVendor.city ? `${selectedVendor.city}, ${selectedVendor.state}` : "India"}</span>
            </div>
          </div>
        </div>

        {/* DOCUMENTS LIST GRID */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Paperclip size={18} className="text-blue-600" />
              <span>Verified Agency Credentials ({vendorDocs.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Secure SSL Encrypted Document Repository</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorDocs.map((doc, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{doc.name}</h3>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        {doc.fileName} • {doc.size || "1.2 MB"}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                  <span className="text-slate-500 font-medium text-[11px]">
                    Category: <strong className="text-slate-800">{doc.type || "Statutory"}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert(`Previewing statutory document: ${doc.fileName}`)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition flex items-center gap-1"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => alert(`Downloading statutory document: ${doc.fileName}`)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition flex items-center gap-1 shadow-2xs"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: SINGLE VENDOR DETAILS PAGE VIEW
  // =========================================================================
  if (selectedVendor && !showDocsPage) {
    const metrics = getVendorMetrics(selectedVendor.id);
    const vendorCandidates = candidates.filter((c) => c.vendorId === selectedVendor.id);
    const vendorApps = applications.filter((a) => a.vendorId === selectedVendor.id);

    // Filter candidates inside vendor detail
    const filteredVendorCandidates = vendorCandidates.filter((c) => {
      if (candSearchQuery.trim()) {
        const q = candSearchQuery.toLowerCase();
        const matchesCand =
          c.fullName?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.currentPosition?.toLowerCase().includes(q);
        if (!matchesCand) return false;
      }
      return true;
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800 pb-12">
        {/* Back Button Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <button
            onClick={() => {
              setSelectedVendor(null);
              setShowDocsPage(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>← Back to All Vendors</span>
          </button>

          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            Vendor Dossier • {selectedVendor.id}
          </span>
        </div>

        {/* VENDOR HEADER CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 pb-5">
            {/* Logo & Company Title */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                {selectedVendor.companyName?.substring(0, 2).toUpperCase() || "VN"}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {selectedVendor.companyName}
                  </h1>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {selectedVendor.id}
                  </span>
                  {getStatusBadge(selectedVendor.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap font-medium">
                  <span>Reg No: {selectedVendor.registrationNumber || "N/A"}</span>
                  <span>•</span>
                  <span>Est Date: {selectedVendor.registeredAt ? new Date(selectedVendor.registeredAt).toLocaleDateString("en-IN") : "12 Sep 2026"}</span>
                  <span>•</span>
                  <span>Type: {selectedVendor.businessType || "Manpower Agency"}</span>
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
              <button
                onClick={() => alert(`Editing vendor settings for ${selectedVendor.companyName}`)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit size={14} className="text-slate-500" />
                <span>Edit Vendor</span>
              </button>

              <button
                onClick={() => setShowDocsPage(true)}
                className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText size={14} className="text-blue-600" />
                <span>View Statutory Documents (Full Page)</span>
              </button>

              <button
                onClick={() => handleToggleSuspend(selectedVendor.id)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                {selectedVendor.status === "Suspended" ? "Activate Vendor" : "Suspend Vendor"}
              </button>

              {selectedVendor.status === "Pending" && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Reject Vendor
                  </button>
                  <button
                    onClick={() => handleApprove(selectedVendor.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Approve Vendor
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
              <Users size={16} className="text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Person</span>
                <span className="font-bold text-slate-900">{selectedVendor.contactPersonName || "N/A"}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
              <Mail size={16} className="text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
                <span className="font-bold text-slate-900 truncate block">{selectedVendor.contactPersonEmail || selectedVendor.email}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
              <Phone size={16} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Mobile Phone</span>
                <span className="font-bold text-slate-900">{selectedVendor.contactPersonPhone || selectedVendor.phone || "N/A"}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center gap-2.5">
              <MapPin size={16} className="text-rose-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
                <span className="font-bold text-slate-900">
                  {selectedVendor.city ? `${selectedVendor.city}, ${selectedVendor.state}` : selectedVendor.country || "India"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* VENDOR PERFORMANCE SUMMARY CARDS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <span>Vendor Performance Summary</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Metrics calculated exclusively for {selectedVendor.companyName}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Candidates</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.totalCandidates}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Submitted</span>
              <span className="text-2xl font-black text-blue-700 mt-1 block">{metrics.submitted + metrics.underReview}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Shortlisted</span>
              <span className="text-2xl font-black text-indigo-700 mt-1 block">{metrics.shortlisted}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Selected</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{metrics.selected}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Rejected</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">{metrics.rejected}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">In Processing</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">{metrics.inProcessing}</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider block">Completed</span>
              <span className="text-2xl font-black text-cyan-700 mt-1 block">{metrics.completed}</span>
            </div>
          </div>
        </div>

        {/* VENDOR CANDIDATES & DOCUMENTS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Vendor Candidates & Submissions</h2>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={candSearchQuery}
                onChange={(e) => setCandSearchQuery(e.target.value)}
                placeholder="Search candidate name, ID, position..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {filteredVendorCandidates.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No candidate records found for this vendor.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Candidate ID</th>
                    <th className="py-3 px-3">Candidate Name</th>
                    <th className="py-3 px-3">Position</th>
                    <th className="py-3 px-3">Experience</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3">Client</th>
                    <th className="py-3 px-3">Submitted Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Resume & Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVendorCandidates.map((c) => {
                    const candApp = vendorApps.find((a) => a.candidateId === c.id) || {
                      projectName: "Riyadh Metro Line 3",
                      clientName: "Saudi Oger Contracting",
                      requirementCode: "REQ-0008",
                      submittedAt: c.createdAt || "2026-09-12",
                      status: "Under Review",
                    };

                    const docsCount = (c.documents || []).length || 3;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-3 font-mono font-bold text-blue-700">{c.id}</td>
                        <td className="py-3.5 px-3 font-extrabold text-slate-900">{c.fullName}</td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700">{c.currentPosition || "Technician"}</td>
                        <td className="py-3.5 px-3 text-slate-600">{c.experienceYears || "5"} Years</td>
                        <td className="py-3.5 px-3 font-bold text-blue-700">{candApp.projectName}</td>
                        <td className="py-3.5 px-3 text-slate-700 font-medium">{candApp.clientName}</td>
                        <td className="py-3.5 px-3 text-slate-500">
                          {candApp.submittedAt ? candApp.submittedAt.split("T")[0] : "2026-09-12"}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-800">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                            {candApp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => setSelectedCandidate({ ...c, candApp })}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <FileText size={13} />
                            <span>View Profile & Documents ({docsCount})</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: ALL VENDORS TABLE PAGE VIEW
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800">
      {/* PAGE HEADER & TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Vendors</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Review manpower agency partners, statutory credentials, and candidate submission statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
            Total Agencies: {vendors.length}
          </span>
          <button
            onClick={() => setShowAddVendorModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        {/* Row 1: Search + Status Tabs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Vendor ID, agency name, contact person, city..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "All", label: "All Vendors", tabKey: "all" },
              { id: "Pending Verification", label: "Pending Verification", tabKey: "pending" },
              { id: "MOU Pending", label: "MOU Pending", tabKey: "mou" },
              { id: "Approved", label: "Approved Vendors", tabKey: "approved" },
              { id: "Rejected", label: "Rejected", tabKey: "rejected" },
              { id: "Suspended", label: "Suspended", tabKey: "suspended" },
            ].map((tab) => {
              const count = vendors.filter((v) => {
                if (tab.id === "Pending Verification") return v.status === "Pending";
                if (tab.id === "MOU Pending") return (!v.mouSigned || v.mouStatus !== "Approved") && v.status !== "Rejected";
                if (tab.id === "Approved") return v.status === "Approved" && (v.mouSigned || v.mouStatus === "Approved");
                if (tab.id === "All") return true;
                return v.status === tab.id;
              }).length;

              const isTabActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setSearchParams(tab.tabKey === "all" ? {} : { tab: tab.tabKey });
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isTabActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 bg-slate-50"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isTabActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: State, City, Specialization, Date Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Filter by State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="All">All States</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Filter by City
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Cities</option>
              {availableCities.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Filter by Specialization
            </label>
            <select
              value={specFilter}
              onChange={(e) => setSpecFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Specializations</option>
              {availableSpecs.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Registration Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Dates</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* VENDOR TABLE */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading vendors...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No vendors found</h3>
          <p className="text-xs text-slate-500 mt-1">No agencies matched your filter selection.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5">Vendor ID</th>
                  <th className="py-3.5 px-4">Vendor Name</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4 text-center">Total Candidates</th>
                  <th className="py-3.5 px-4 text-center">Selected</th>
                  <th className="py-3.5 px-4 text-center">Rejected</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((v) => {
                  const m = getVendorMetrics(v.id);

                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVendor(v)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      <td className="py-4 px-4 sm:px-5 font-mono font-bold text-blue-700">{v.id}</td>

                      {/* Clickable Vendor Name */}
                      <td className="py-4 px-4 font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                        {v.companyName}
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-semibold">{v.contactPersonName || "N/A"}</td>
                      <td className="py-4 px-4 text-slate-700 font-medium">{v.state || "Maharashtra"}</td>
                      <td className="py-4 px-4 text-slate-700 font-medium">{v.city || "Mumbai"}</td>
                      <td className="py-4 px-4 text-slate-600 text-xs truncate max-w-[150px]">
                        {v.specialization || "Technical Trades"}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-900">{m.totalCandidates}</td>
                      <td className="py-4 px-4 text-center font-extrabold text-emerald-600">{m.selected}</td>
                      <td className="py-4 px-4 text-center font-extrabold text-rose-600">{m.rejected}</td>

                      <td className="py-4 px-4">{getStatusBadge(v.status)}</td>

                      <td className="py-4 px-4 text-slate-500 text-xs">
                        {v.registeredAt ? new Date(v.registeredAt).toLocaleDateString("en-IN") : "12 Sep 2026"}
                      </td>

                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVendor(v);
                              setShowDocsPage(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            title="View Statutory Documents (Full Page)"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Docs</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedVendor(v);
                              setShowDocsPage(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
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

      {/* Rejection Reason Modal */}
      {showRejectModal && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confirm Rejection</h3>
            <p className="text-xs text-slate-500">
              Please enter the reason for rejecting agency registration for <strong>{selectedVendor.companyName}</strong>.
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. MEA recruitment license expired or invalid commercial registration doc..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD VENDOR MODAL */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="text-blue-600" size={22} />
                  <span>Register New Vendor Agency</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Fill out agency legal details, operational location, contact info, statutory document uploads, and portal access credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVendorModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleAddVendorSubmit} className="space-y-6 text-xs">
              {/* SECTION 1: AGENCY LEGAL & BUSINESS DETAILS */}
              <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                <h4 className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                  <Building2 size={14} className="text-blue-600" />
                  <span>1. Agency Legal & Statutory Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Agency / Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newVendorForm.companyName}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, companyName: e.target.value })}
                      placeholder="e.g. Apex Global Manpower Consultants"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Business Structure / Type</label>
                    <select
                      value={newVendorForm.businessType}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, businessType: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                    >
                      <option value="Proprietorship">Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="LLP">LLP (Limited Liability Partnership)</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="Public Limited">Public Limited</option>
                      <option value="Other">Other Registration</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trade License / Reg #</label>
                    <input
                      type="text"
                      value={newVendorForm.registrationNumber}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, registrationNumber: e.target.value })}
                      placeholder="e.g. REG-IND-99421"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Establishment Year</label>
                    <input
                      type="text"
                      value={newVendorForm.establishmentYear}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, establishmentYear: e.target.value })}
                      placeholder="e.g. 2018"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={newVendorForm.gstin}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, gstin: e.target.value })}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      value={newVendorForm.pan}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, pan: e.target.value })}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company Website URL</label>
                    <input
                      type="text"
                      value={newVendorForm.website}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, website: e.target.value })}
                      placeholder="https://www.apexmanpower.com"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTACT PERSON & OFFICE LOCATION */}
              <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                <h4 className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                  <UserCheck size={14} className="text-blue-600" />
                  <span>2. Contact Person & Office Location</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      value={newVendorForm.contactPersonName}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, contactPersonName: e.target.value })}
                      placeholder="e.g. Rajesh Varma"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={newVendorForm.designation}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, designation: e.target.value })}
                      placeholder="e.g. Managing Director"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newVendorForm.email}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, email: e.target.value })}
                      placeholder="vendor@company.com"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Mobile / Phone</label>
                    <input
                      type="text"
                      value={newVendorForm.phone}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Alternate Phone Number</label>
                    <input
                      type="text"
                      value={newVendorForm.alternatePhone}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, alternatePhone: e.target.value })}
                      placeholder="+91 98765 00000"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={newVendorForm.city}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, city: e.target.value })}
                      placeholder="Mumbai"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={newVendorForm.state}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, state: e.target.value })}
                      placeholder="Maharashtra"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={newVendorForm.country}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, country: e.target.value })}
                      placeholder="India"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pin Code</label>
                    <input
                      type="text"
                      value={newVendorForm.pinCode}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, pinCode: e.target.value })}
                      placeholder="400013"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Complete Office Address</label>
                  <input
                    type="text"
                    value={newVendorForm.address}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, address: e.target.value })}
                    placeholder="Suite 402, Trade Link Towers, Senapati Bapat Marg, Lower Parel, Mumbai"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* SECTION 3: OPERATIONS & CAPACITIES */}
              <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                <h4 className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                  <Briefcase size={14} className="text-blue-600" />
                  <span>3. Operational Capacities & Trades</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Specialization Trades</label>
                    <input
                      type="text"
                      value={newVendorForm.specialization}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, specialization: e.target.value })}
                      placeholder="e.g. Construction, Electrical, Welding, Healthcare"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Countries / Destinations Served</label>
                    <input
                      type="text"
                      value={newVendorForm.countriesServed}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, countriesServed: e.target.value })}
                      placeholder="e.g. UAE, Saudi Arabia, Qatar, Oman"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Industry Experience (Yrs)</label>
                    <input
                      type="text"
                      value={newVendorForm.experienceYears}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, experienceYears: e.target.value })}
                      placeholder="e.g. 8"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Available Candidate Pool</label>
                    <input
                      type="text"
                      value={newVendorForm.availableCandidates}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, availableCandidates: e.target.value })}
                      placeholder="e.g. 150"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Monthly Capacity</label>
                    <input
                      type="text"
                      value={newVendorForm.monthlyCapacity}
                      onChange={(e) => setNewVendorForm({ ...newVendorForm, monthlyCapacity: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: STATUTORY DOCUMENTS & PORTAL CREDENTIALS */}
              <div className="space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                <h4 className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200/80 pb-2">
                  <Paperclip size={14} className="text-blue-600" />
                  <span>4. Statutory Document Uploads & Credentials</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Trade License / Reg Cert Doc</span>
                      <span className="text-[10px] text-slate-400 font-normal">PDF Only</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newVendorForm.tradeLicenseDocName}
                        onChange={(e) => setNewVendorForm({ ...newVendorForm, tradeLicenseDocName: e.target.value })}
                        placeholder="Trade_License_Certificate.pdf"
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                      />
                      <label className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition text-xs shadow-2xs">
                        <UploadCloud size={16} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "application/pdf") {
                                alert("Please upload a PDF file.");
                                return;
                              }
                              setNewVendorForm((prev) => ({ ...prev, tradeLicenseDocName: file.name }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Recruitment License Document</span>
                      <span className="text-[10px] text-slate-400 font-normal">PDF Only</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newVendorForm.recruitmentLicenseDocName}
                        onChange={(e) => setNewVendorForm({ ...newVendorForm, recruitmentLicenseDocName: e.target.value })}
                        placeholder="Recruitment_Agency_License.pdf"
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                      />
                      <label className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition text-xs shadow-2xs">
                        <UploadCloud size={16} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "application/pdf") {
                                alert("Please upload a PDF file.");
                                return;
                              }
                              setNewVendorForm((prev) => ({ ...prev, recruitmentLicenseDocName: file.name }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>GST Certificate Document</span>
                      <span className="text-[10px] text-slate-400 font-normal">PDF Only</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newVendorForm.gstDocName}
                        onChange={(e) => setNewVendorForm({ ...newVendorForm, gstDocName: e.target.value })}
                        placeholder="GSTIN_Registration_Certificate.pdf"
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                      />
                      <label className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition text-xs shadow-2xs">
                        <UploadCloud size={16} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "application/pdf") {
                                alert("Please upload a PDF file.");
                                return;
                              }
                              setNewVendorForm((prev) => ({ ...prev, gstDocName: file.name }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>PAN Card Copy Document <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">PDF Only</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={newVendorForm.panDocName}
                        onChange={(e) => setNewVendorForm({ ...newVendorForm, panDocName: e.target.value })}
                        placeholder="PAN_Card_Copy.pdf"
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-mono"
                      />
                      <label className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer flex items-center gap-1.5 shrink-0 transition text-xs shadow-2xs">
                        <UploadCloud size={16} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "application/pdf") {
                                alert("Please upload a PDF file.");
                                return;
                              }
                              setNewVendorForm((prev) => ({ ...prev, panDocName: file.name }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <label className="block font-bold text-slate-800 mb-1">
                    Vendor Portal Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVendorForm.password}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, password: e.target.value })}
                    placeholder="Password@123"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white text-blue-900"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    This password will be dispatched to vendor email address for initial portal login.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/90 rounded-2xl border border-blue-200 text-blue-900 flex items-start gap-2.5">
                <Mail size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold leading-relaxed">
                  Upon creation, vendor account status will be set to <strong>Approved</strong>. An automated dispatch notification containing Vendor ID, Password, and Login URL will be generated and ready to copy.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addVendorLoading}
                  className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  {addVendorLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Create Vendor & Generate Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS DISPATCHED CONFIRMATION MODAL */}
      {dispatchedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-5 relative animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Vendor Account Created & Credentials Dispatched! 🎉</h3>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Login ID, Password, and direct portal access link have been dispatched to:
              </p>
              <p className="text-sm font-extrabold text-blue-700 underline">{dispatchedVendor.email}</p>
            </div>

            {/* Generated Details Box */}
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 text-left text-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Agency Name:</span>
                <span className="font-bold text-slate-900">{dispatchedVendor.companyName}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Vendor ID:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {dispatchedVendor.id}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-semibold">Login Password:</span>
                <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {dispatchedVendor.password || "Password@123"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Vendor Portal URL:</span>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                  <span className="font-mono text-[11px] text-slate-700 truncate flex-1">
                    {dispatchedVendor.loginUrl || `${window.location.origin}/vendor/login`}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyVendorLoginUrl(dispatchedVendor.loginUrl || `${window.location.origin}/vendor/login`)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedLink ? "Copied!" : "Copy URL"}</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDispatchedVendor(null)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              Done & View Vendor List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
