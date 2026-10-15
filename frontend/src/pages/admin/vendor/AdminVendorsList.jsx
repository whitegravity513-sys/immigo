import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  X,
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
  Trash2,
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
import MouFullPageView from "../../../components/vendor/MouFullPageView.jsx";
import DocumentViewerFullPage from "../../../components/vendor/DocumentViewerFullPage.jsx";
import EditVendorModal from "../../../components/admin/modals/EditVendorModal.jsx";
import DeleteConfirmModal from "../../../components/common/DeleteConfirmModal.jsx";
import {
  AdminRejectVendorModal,
  AdminAddVendorModal,
  AdminDispatchedCredentialsModal,
} from "../../../components/admin/vendor/index.js";

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

  // Edit & Delete Vendor Modal State
  const [editingVendor, setEditingVendor] = useState(null);
  const [savingVendor, setSavingVendor] = useState(false);
  const [deleteTargetVendor, setDeleteTargetVendor] = useState(null);
  const [deletingVendor, setDeletingVendor] = useState(false);
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
  const location = useLocation();

  // Filters State for All Vendors Table
  const [statusFilter, setStatusFilter] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "registered") return "Registered";
    if (tabParam === "pending") return "Pending Verification";
    if (tabParam === "mou") return "MOU Pending";
    if (tabParam === "approved") return "Approved";
    if (tabParam === "rejected") return "Rejected";
    if (tabParam === "suspended") return "Suspended";
    if (tabParam === "suspended-rejected") return "Suspended & Rejected";
    return "All";
  });

  // Selected Vendor Detail View & Full Page States (Zero Popups)
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDocsPage, setShowDocsPage] = useState(false);
  const [showDraftMouPage, setShowDraftMouPage] = useState(false);
  const [showViewMouPage, setShowViewMouPage] = useState(false);
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (!tabParam || tabParam === "all") {
      setStatusFilter("All");
      setSelectedVendor(null);
      setShowDocsPage(false);
      setShowDraftMouPage(false);
      setShowViewMouPage(false);
      setPreviewingDoc(null);
    } else if (tabParam === "registered") {
      setStatusFilter("Registered");
      setSelectedVendor(null);
      setShowDraftMouPage(false);
      setShowViewMouPage(false);
    } else if (tabParam === "pending") {
      setStatusFilter("Pending Verification");
      setSelectedVendor(null);
      setShowDraftMouPage(false);
      setShowViewMouPage(false);
    } else if (tabParam === "mou") {
      setStatusFilter("MOU Pending");
      setSelectedVendor(null);
      setShowDraftMouPage(false);
      setShowViewMouPage(false);
    } else if (tabParam === "approved") {
      setStatusFilter("Approved");
      setSelectedVendor(null);
      setShowDraftMouPage(false);
      setShowViewMouPage(false);
    } else if (tabParam === "rejected") {
      setStatusFilter("Rejected");
      setSelectedVendor(null);
      setShowDraftMouPage(false);
      setShowViewMouPage(false);
    } else if (tabParam === "suspended") {
      setStatusFilter("Suspended");
      setSelectedVendor(null);
      setShowDraftMouPage(false);
      setShowViewMouPage(false);
    } else if (tabParam === "suspended-rejected") {
      setStatusFilter("Suspended & Rejected");
      setSelectedVendor(null);
      setShowDraftMouPage(false);
      setShowViewMouPage(false);
    }
  }, [searchParams, location.pathname, location.search]);

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [specFilter, setSpecFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

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
  const [newMilestoneAmount, setNewMilestoneAmount] = useState("10000");

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
        amount: Number(newMilestoneAmount) || 0,
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

  const handleDownloadDoc = (doc) => {
    if (doc?.fileUrl && doc.fileUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.name || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const content = `OFFICIAL STATUTORY DOCUMENT\n==========================\nDocument: ${doc?.name || doc?.type}\nFile Name: ${doc?.fileName || "document.pdf"}\nAgency: ${selectedVendor?.companyName || "Vendor Agency"}\nUploaded: ${doc?.uploadedAt || new Date().toISOString().split("T")[0]}\nStatus: ${doc?.status || "Verified"}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc?.fileName || `${doc?.name || "document"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveVendor = async (updatedData) => {
    setSavingVendor(true);
    try {
      const vId = updatedData.id || updatedData.vendorId;
      const saved = await crmVendorService.updateVendor(vId, updatedData);
      loadData();
      if (selectedVendor && (selectedVendor.id === vId || selectedVendor.vendorId === vId)) {
        setSelectedVendor(saved);
      }
      setEditingVendor(null);
      alert("Vendor profile updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update vendor profile.");
    } finally {
      setSavingVendor(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!deleteTargetVendor) return;
    setDeletingVendor(true);
    try {
      const vId = deleteTargetVendor.id || deleteTargetVendor.vendorId;
      await crmVendorService.deleteVendor(vId);
      loadData();
      if (selectedVendor && (selectedVendor.id === vId || selectedVendor.vendorId === vId)) {
        setSelectedVendor(null);
      }
      setDeleteTargetVendor(null);
      alert("Vendor removed successfully.");
    } catch (err) {
      alert(err.message || "Failed to delete vendor.");
    } finally {
      setDeletingVendor(false);
    }
  };

  const handleApproveRegistration = async (vendorId) => {
    try {
      await crmVendorService.approveRegistration(vendorId);
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, status: "Documents Pending" }));
      }
      alert("Vendor registration approved! Approval notification with login credentials instructions has been sent to vendor.");
    } catch (err) {
      alert(err.message || "Failed to approve registration");
    }
  };

  const handleHoldRegistration = async (vendorId) => {
    const remarks = prompt("Please enter a remark or reason for putting registration on hold:");
    if (remarks === null) return;
    try {
      await crmVendorService.holdRegistration(vendorId, remarks);
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, status: "Registration On Hold", adminRemarks: remarks }));
      }
      alert("Vendor registration placed on hold.");
    } catch (err) {
      alert(err.message || "Failed to put on hold");
    }
  };

  const handleApprove = async (vendorId) => {
    try {
      await crmVendorService.approveVendor(vendorId);
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, status: "Active" }));
      }
      alert("Vendor activated successfully.");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveDocsAndSendMou = async (vendorId) => {
    try {
      const res = await crmVendorService.approveDocsAndSendMou(vendorId);
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({
          ...prev,
          status: "MOU Pending",
          mouStatus: "Sent",
          mouDocument: res.vendor?.mouDocument || prev.mouDocument,
        }));
      }
      alert("Compliance documents verified! MOU auto-populated and sent to vendor successfully.");
    } catch (err) {
      alert(err.message || "Failed to verify documents and send MOU");
    }
  };

  const handleRequestDocCorrection = async (vendorId) => {
    const remarks = prompt("Please enter the correction requirements for the vendor's documents:");
    if (!remarks) return;
    try {
      await crmVendorService.requestDocCorrection(vendorId, remarks);
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, status: "Documents Correction Required", adminRemarks: remarks }));
      }
      alert("Document correction requested from vendor.");
    } catch (err) {
      alert(err.message || "Failed to request correction");
    }
  };

  const handleApproveMouAndActivate = async (vendorId) => {
    try {
      await crmVendorService.approveMouAndActivate(vendorId);
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({
          ...prev,
          status: "Active",
          mouStatus: "Approved",
          mouSigned: true,
        }));
      }
      alert("MOU approved and vendor activated successfully! The operational dashboard has been unlocked.");
    } catch (err) {
      alert(err.message || "Failed to activate vendor");
    }
  };

  const handleRequestMouCorrection = async (vendorId) => {
    const remarks = prompt("Please enter the reason/correction required for the submitted MOU:");
    if (!remarks) return;
    try {
      await crmVendorService.requestMouCorrection(vendorId, remarks);
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, status: "MOU Correction Required", adminRemarks: remarks }));
      }
      alert("MOU correction requested from vendor.");
    } catch (err) {
      alert(err.message || "Failed to request MOU correction");
    }
  };

  const handleVerifyMOU = async (vendorId) => {
    try {
      await crmVendorService.signOrVerifyMOU(vendorId, "Approved");
      loadData();
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, mouSigned: true, mouStatus: "Approved", status: "Active" }));
      }
      alert("Vendor MOU verified and vendor activated successfully!");
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
      (a) => a.status === "Completed" || (a.status === "Selected" && a.processing?.currentStageIndex === 7)
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
    if (statusFilter === "Registered") {
      const isReg = ["Pending", "Under Review", "Pending Verification", "MOU Pending", "Pending MOU Approval"].includes(v.status);
      if (!isReg) return false;
    } else if (statusFilter === "Pending Verification") {
      if (v.status !== "Pending" && v.status !== "Under Review" && v.status !== "Pending Verification") return false;
    } else if (statusFilter === "MOU Pending") {
      if (v.status === "MOU Pending" || v.status === "Pending MOU Approval" || v.mouStatus === "Sent" || v.mouStatus === "Signed") return true;
      const isMouPending = (!v.mouSigned || v.mouStatus !== "Approved") && v.status !== "Rejected" && v.status !== "Suspended";
      if (!isMouPending) return false;
    } else if (statusFilter === "Approved") {
      const isMouComplete = v.mouSigned === true || v.mouStatus === "Approved";
      if (v.status !== "Approved" || !isMouComplete) return false;
    } else if (statusFilter === "Suspended & Rejected") {
      if (v.status !== "Suspended" && v.status !== "Rejected") return false;
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
      case "Active":
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {status}
          </span>
        );
      case "Registration Pending":
      case "Pending":
      case "Pending Verification":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Registration Pending
          </span>
        );
      case "Registration Approved":
      case "Documents Pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Documents Pending
          </span>
        );
      case "Documents Under Review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Docs Under Review
          </span>
        );
      case "Documents Verified":
      case "MOU Pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            MOU Pending
          </span>
        );
      case "MOU Under Review":
      case "Pending MOU Approval":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <FileCheck className="w-3.5 h-3.5 text-sky-600" />
            MOU Under Review
          </span>
        );
      case "Registration On Hold":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Ban className="w-3.5 h-3.5 text-amber-600" />
            Registration On Hold
          </span>
        );
      case "Documents Correction Required":
      case "MOU Correction Required":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            Correction Required
          </span>
        );
      case "Suspended":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            Suspended
          </span>
        );
      case "Registration Rejected":
      case "Documents Rejected":
      case "MOU Rejected":
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

  const getVendorDocStatus = (vendor) => {
    if (!vendor) return { label: "Under Verification", badgeClass: "bg-amber-50 text-amber-800 border-amber-200", icon: Clock };
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const regDate = new Date(vendor.registeredAt || vendor.createdAt || now).getTime();
    const isDocSubmitted = vendor.documentsUploaded || (Array.isArray(vendor.documents) && vendor.documents.length > 0);

    if (vendor.status === "Rejected") {
      return {
        label: "Rejected / Expired",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        icon: XCircle,
      };
    }

    if (!isDocSubmitted && (now - regDate) > SEVEN_DAYS_MS && vendor.status !== "Approved" && vendor.status !== "Suspended") {
      return {
        label: "Rejected (7-Day Expired)",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
        icon: XCircle,
      };
    }

    if (!isDocSubmitted) {
      const daysLeft = Math.max(0, 7 - Math.floor((now - regDate) / (24 * 60 * 60 * 1000)));
      return {
        label: `Under Verification (Docs Pending - ${daysLeft}d left)`,
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        icon: Clock,
      };
    }

    const isVerifiedByAdmin = vendor.status === "Approved" || vendor.mouStatus === "Sent" || vendor.mouStatus === "Approved" || vendor.status === "MOU Pending";
    if (!isVerifiedByAdmin) {
      return {
        label: "Under Verification (Pending Admin Approval)",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        icon: Clock,
      };
    }

    return {
      label: "Document Verified",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: ShieldCheck,
    };
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
  // VIEW: FULL PAGE STATUTORY DOCUMENT VIEWER (ZERO POPUPS)
  // =========================================================================
  if (previewingDoc) {
    return (
      <DocumentViewerFullPage
        doc={previewingDoc}
        vendor={selectedVendor}
        onBack={() => setPreviewingDoc(null)}
      />
    );
  }

  // =========================================================================
  // VIEW 3: FULL PAGE VENDOR STATUTORY DOCUMENTS VAULT
  // =========================================================================
  if (selectedVendor && showDocsPage) {
    const vendorDocs = selectedVendor.documents || [];

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

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setEditingVendor(selectedVendor)}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                title="Edit Vendor"
              >
                <Edit size={14} />
              </button>

              <button
                type="button"
                onClick={() => setDeleteTargetVendor(selectedVendor)}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                title="Delete Vendor"
              >
                <Trash2 size={14} />
              </button>
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
        {(() => {
          const isVerified = Boolean(
            selectedVendor.documentVerified ||
            selectedVendor.status === "Approved" ||
            selectedVendor.status === "Verified" ||
            selectedVendor.mouSigned ||
            selectedVendor.mouStatus === "Approved"
          );

          if (isVerified && vendorDocs.length > 0) {
            return (
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
                            onClick={() => setPreviewingDoc(doc)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition flex items-center gap-1"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleDownloadDoc(doc)}
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
            );
          }

          if (vendorDocs.length > 0 && !isVerified) {
            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Paperclip size={18} className="text-amber-600" />
                    <span>Agency Credentials (Pending Verification) ({vendorDocs.length})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Pending Admin Verification
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApproveDocsAndSendMou(selectedVendor.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={13} />
                      <span>Approve & Verify Credentials</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendorDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm">{doc.name}</h3>
                            <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                              {doc.fileName} • {doc.size || "1.2 MB"}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          Pending Review
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                        <span className="text-slate-500 font-medium text-[11px]">
                          Category: <strong className="text-slate-800">{doc.type || "Statutory"}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewingDoc(doc)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition flex items-center gap-1"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleDownloadDoc(doc)}
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
            );
          }

          return (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <Clock size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Agency Credentials Under Verification
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Statutory agency credentials and compliance documents will appear in "Verified Agency Credentials" once submitted and approved by Admin.
              </p>
            </div>
          );
        })()}
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

    if (previewingDoc) {
      return (
        <DocumentViewerFullPage
          doc={previewingDoc}
          vendor={selectedVendor}
          onBack={() => setPreviewingDoc(null)}
        />
      );
    }

    if (showDraftMouPage) {
      return (
        <MouFullPageView
          mode="draft"
          vendor={selectedVendor}
          onBack={() => setShowDraftMouPage(false)}
          onSuccess={(payload) => {
            setSelectedVendor((prev) => ({
              ...prev,
              status: "MOU Pending",
              mouStatus: "Sent",
              mouDocument: {
                ...(prev?.mouDocument || {}),
                ...payload,
              },
            }));
            setShowDraftMouPage(false);
            loadData();
          }}
        />
      );
    }

    if (showViewMouPage) {
      return (
        <MouFullPageView
          mode="preview"
          vendor={selectedVendor}
          onBack={() => setShowViewMouPage(false)}
          onApprove={() => {
            handleApprove(selectedVendor.id);
            setShowViewMouPage(false);
          }}
        />
      );
    }

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
                onClick={() => setEditingVendor(selectedVendor)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit size={14} className="text-slate-500" />
                <span>Edit Vendor</span>
              </button>

              <button
                onClick={() => setDeleteTargetVendor(selectedVendor)}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setShowDocsPage(true)}
                className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText size={14} className="text-blue-600" />
                <span>View Statutory Documents (Full Page)</span>
              </button>

              {/* Active & Suspend Actions */}
              {(selectedVendor.status === "Active" || selectedVendor.status === "Approved" || selectedVendor.status === "Suspended") && (
                <button
                  type="button"
                  onClick={() => handleToggleSuspend(selectedVendor.id)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedVendor.status === "Suspended"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  }`}
                  title={selectedVendor.status === "Suspended" ? "Activate Verified Vendor" : "Suspend Verified Vendor"}
                >
                  <Ban size={14} />
                  <span>{selectedVendor.status === "Suspended" ? "Activate Vendor" : "Suspend Vendor"}</span>
                </button>
              )}

              {/* Step 1 & 2: Registration Pending / Review Actions */}
              {(selectedVendor.status === "Registration Pending" || selectedVendor.status === "Pending" || selectedVendor.status === "Registration On Hold") && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApproveRegistration(selectedVendor.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Approve Registration and send portal credentials email"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve Registration</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHoldRegistration(selectedVendor.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    title="Put registration on hold with remark"
                  >
                    <Clock size={14} />
                    <span>Hold</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    title="Reject Vendor Registration"
                  >
                    <XCircle size={14} />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {/* Step 6 & 7: Documents Uploaded / Review Actions */}
              {(selectedVendor.status === "Documents Pending" || selectedVendor.status === "Documents Under Review" || selectedVendor.status === "Under Review" || selectedVendor.status === "Documents Correction Required") && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApproveDocsAndSendMou(selectedVendor.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Approve uploaded documents and auto-populate MOU agreement"
                  >
                    <Send size={14} />
                    <span>Approve Docs & Generate MOU</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestDocCorrection(selectedVendor.id)}
                    className="px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    title="Request corrections on documents"
                  >
                    <Clock size={14} />
                    <span>Request Correction</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle size={14} />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {/* Step 7 & 8: MOU Review & Activation Actions */}
              {(selectedVendor.status === "MOU Pending" || selectedVendor.status === "MOU Under Review" || selectedVendor.status === "Pending MOU Approval" || selectedVendor.status === "MOU Correction Required") && (
                <>
                  <button
                    onClick={() => setShowViewMouPage(true)}
                    className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>Review MOU Agreement</span>
                  </button>
                  <button
                    onClick={() => handleApproveMouAndActivate(selectedVendor.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Approve signed MOU and activate vendor dashboard"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve MOU & Activate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestMouCorrection(selectedVendor.id)}
                    className="px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    title="Request corrections on MOU"
                  >
                    <Clock size={14} />
                    <span>Request MOU Correction</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle size={14} />
                    <span>Reject</span>
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

        {/* VENDOR COMPLIANCE & STATUTORY DOCUMENTS */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <span>Vendor Compliance & Statutory Documents</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory registration, tax licenses, and banking verification documents submitted by this agency.
              </p>
            </div>
            <button
              onClick={() => setShowViewMouPage(true)}
              className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <FileText size={14} />
              <span>Preview Official MOU</span>
            </button>
          </div>

          {/* Documents Grid */}
          {(!selectedVendor.documents || selectedVendor.documents.length === 0) ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No documents uploaded yet by this vendor.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Documents will appear here once the vendor uploads their incorporation, PAN, or GST certificates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {selectedVendor.documents.map((doc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{doc.name || doc.type || "Document"}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">{doc.fileName || "document.pdf"}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {doc.status || "Uploaded"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    <button
                      type="button"
                      onClick={() => setPreviewingDoc(doc)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(doc)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bank Settlement Details */}
          {selectedVendor.bankDetails && (selectedVendor.bankDetails.accountNumber || selectedVendor.bankDetails.bankName) && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
                Bank Settlement Account
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Name</span>
                  <span className="font-bold text-slate-900">{selectedVendor.bankDetails.accountName || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Bank Name</span>
                  <span className="font-bold text-slate-900">{selectedVendor.bankDetails.bankName || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Number</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedVendor.bankDetails.accountNumber || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">IFSC Code</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedVendor.bankDetails.ifsc || "N/A"}</span>
                </div>
              </div>
            </div>
          )}

          {/* MOU Execution Summary */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
              MOU Partnership Agreement Status
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    MOU Ref: MOU-VND-{selectedVendor.id || "001"}-2026
                  </span>
                  {selectedVendor.mouSigned || selectedVendor.mouStatus === "Approved" || selectedVendor.mouStatus === "Signed" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Digitally Executed
                    </span>
                  ) : selectedVendor.mouStatus === "Sent" || selectedVendor.status === "MOU Pending" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      Issued &bull; Awaiting Vendor Signature
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Pending Document Verification
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px]">
                  {selectedVendor.signedMou?.signedAt
                    ? `Signed by ${selectedVendor.signedMou.signatoryName || selectedVendor.contactPersonName} (${selectedVendor.signedMou.designation || "Signatory"}) on ${new Date(selectedVendor.signedMou.signedAt).toLocaleDateString("en-IN")}`
                    : "Official recruitment partnership agreement between Vista Overseas and this vendor agency."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowViewMouPage(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                View Agreement
              </button>
            </div>
          </div>
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

      {/* 3 LIFECYCLE SUMMARY CARDS (Separate Registered, Verified, and Suspended/Rejected) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Newly Registered Agencies */}
        <div
          onClick={() => {
            setStatusFilter("Registered");
            setSearchParams({ tab: "registered" });
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === "Registered" || statusFilter === "Pending Verification"
              ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400"
              : "bg-white border-amber-200/90 hover:bg-amber-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusFilter === "Registered" || statusFilter === "Pending Verification" ? "text-amber-100" : "text-amber-700"
            }`}>
              1. Newly Registered
            </span>
            <span className={`p-1.5 rounded-lg text-xs font-bold ${
              statusFilter === "Registered" || statusFilter === "Pending Verification" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            }`}>
              Pending Review
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className={`text-2xl sm:text-3xl font-black ${
              statusFilter === "Registered" || statusFilter === "Pending Verification" ? "text-white" : "text-slate-900"
            }`}>
              {vendors.filter((v) => ["Pending", "Under Review", "Pending Verification", "MOU Pending", "Pending MOU Approval"].includes(v.status)).length}
            </span>
            <span className={`text-xs font-semibold ${
              statusFilter === "Registered" || statusFilter === "Pending Verification" ? "text-amber-100" : "text-slate-500"
            }`}>
              Agencies Registered
            </span>
          </div>
          <p className={`text-[11px] mt-1.5 font-medium ${
            statusFilter === "Registered" || statusFilter === "Pending Verification" ? "text-amber-100" : "text-slate-500"
          }`}>
            Awaiting compliance verification or MOU issuance
          </p>
        </div>

        {/* Card 2: Client Verified & Approved */}
        <div
          onClick={() => {
            setStatusFilter("Approved");
            setSearchParams({ tab: "approved" });
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === "Approved"
              ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400"
              : "bg-white border-emerald-200/90 hover:bg-emerald-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusFilter === "Approved" ? "text-emerald-100" : "text-emerald-700"
            }`}>
              2. Verified & Approved
            </span>
            <span className={`p-1.5 rounded-lg text-xs font-bold ${
              statusFilter === "Approved" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            }`}>
              Active Partner
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className={`text-2xl sm:text-3xl font-black ${
              statusFilter === "Approved" ? "text-white" : "text-slate-900"
            }`}>
              {vendors.filter((v) => v.status === "Approved" && (v.mouSigned === true || v.mouStatus === "Approved")).length}
            </span>
            <span className={`text-xs font-semibold ${
              statusFilter === "Approved" ? "text-emerald-100" : "text-slate-500"
            }`}>
              Verified Vendors
            </span>
          </div>
          <p className={`text-[11px] mt-1.5 font-medium ${
            statusFilter === "Approved" ? "text-emerald-100" : "text-slate-500"
          }`}>
            Client verified, MOU signed, and authorized to deploy
          </p>
        </div>

        {/* Card 3: Suspended / Rejected */}
        <div
          onClick={() => {
            setStatusFilter("Suspended & Rejected");
            setSearchParams({ tab: "suspended-rejected" });
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected"
              ? "bg-slate-900 text-white border-slate-950 shadow-md ring-2 ring-slate-400"
              : "bg-white border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected" ? "text-slate-200" : "text-slate-700"
            }`}>
              3. Suspended & Rejected
            </span>
            <span className={`p-1.5 rounded-lg text-xs font-bold ${
              statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
            }`}>
              On Hold / Declined
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className={`text-2xl sm:text-3xl font-black ${
              statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected" ? "text-white" : "text-slate-900"
            }`}>
              {vendors.filter((v) => v.status === "Suspended" || v.status === "Rejected").length}
            </span>
            <span className={`text-xs font-semibold ${
              statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected" ? "text-slate-300" : "text-slate-500"
            }`}>
              Inactive Agencies
            </span>
          </div>
          <p className={`text-[11px] mt-1.5 font-medium ${
            statusFilter === "Suspended & Rejected" || statusFilter === "Suspended" || statusFilter === "Rejected" ? "text-slate-300" : "text-slate-500"
          }`}>
            Suspended verified vendors or rejected applications
          </p>
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

          {/* Active Filter Indicator & Count */}
          <div className="flex items-center gap-2">
            {statusFilter !== "All" && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                <span>
                  Filter:{" "}
                  {statusFilter === "Registered"
                    ? "Registered (Pending)"
                    : statusFilter === "MOU Pending"
                    ? "MOU In-Process"
                    : statusFilter === "Approved"
                    ? "Verified & Approved"
                    : statusFilter}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("All");
                    setSearchParams({});
                  }}
                  className="hover:text-blue-900 p-0.5 rounded cursor-pointer"
                  title="Clear filter"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              {filteredVendors.length} {filteredVendors.length === 1 ? "vendor" : "vendors"}
            </span>
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
                  <th className="py-3.5 px-4">Agency / Vendor Name</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">MOU Status</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((v) => {
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVendor(v)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      <td className="py-4 px-4 sm:px-5 font-mono font-bold text-blue-700">{v.id}</td>

                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900 group-hover:text-blue-600 transition text-sm">
                          {v.companyName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {v.officialEmail || v.phone || "Verified Partner"}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-semibold">
                        <div>{v.contactPersonName || "N/A"}</div>
                        {v.contactPersonPhone && (
                          <div className="text-[11px] text-slate-400 font-normal">{v.contactPersonPhone}</div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-700 font-medium text-xs">
                        {[v.city, v.state].filter(Boolean).join(", ") || "India"}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {v.mouSigned || v.mouStatus === "Approved" || v.mouStatus === "Signed" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Executed
                          </span>
                        ) : v.mouStatus === "Sent" || v.status === "MOU Pending" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            MOU Sent
                          </span>
                        ) : v.status === "Pending MOU Approval" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Signed (Pending)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">{getStatusBadge(v.status)}</td>

                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Suspend option: Only for verified/approved vendors */}
                          {(v.status === "Approved" || v.status === "Suspended") && (
                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(v.id)}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                v.status === "Suspended"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                              }`}
                              title={v.status === "Suspended" ? "Activate Vendor" : "Suspend Vendor"}
                            >
                              <Ban size={12} />
                              <span>{v.status === "Suspended" ? "Activate" : "Suspend"}</span>
                            </button>
                          )}

                          {/* Reject option: Only for registered / pending vendors */}
                          {["Pending", "Under Review", "Pending Verification"].includes(v.status) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVendor(v);
                                setShowRejectModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                              title="Reject Registration"
                            >
                              <XCircle size={12} />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingVendor(v)}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                            title="Edit Vendor"
                          >
                            <Edit size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTargetVendor(v)}
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                            title="Delete Vendor"
                          >
                            <Trash2 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVendor(v);
                              setShowDocsPage(false);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
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
      <AdminRejectVendorModal
        isOpen={showRejectModal && Boolean(selectedVendor)}
        onClose={() => setShowRejectModal(false)}
        selectedVendor={selectedVendor}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onConfirmReject={handleConfirmReject}
      />


      {/* ADD VENDOR MODAL */}
      <AdminAddVendorModal
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
        newVendorForm={newVendorForm}
        setNewVendorForm={setNewVendorForm}
        handleAddVendorSubmit={handleAddVendorSubmit}
        addVendorLoading={addVendorLoading}
      />

      {/* CREDENTIALS DISPATCHED CONFIRMATION MODAL */}
      <AdminDispatchedCredentialsModal
        dispatchedVendor={dispatchedVendor}
        onClose={() => setDispatchedVendor(null)}
        copiedLink={copiedLink}
        copyVendorLoginUrl={copyVendorLoginUrl}
      />

      {/* Edit Vendor Modal */}
      <EditVendorModal
        isOpen={Boolean(editingVendor)}
        onClose={() => setEditingVendor(null)}
        vendor={editingVendor}
        onSave={handleSaveVendor}
        saving={savingVendor}
      />

      {/* Delete Vendor Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetVendor)}
        onClose={() => setDeleteTargetVendor(null)}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor Organization"
        message="Are you sure you want to permanently remove this vendor partner? This action will delete the vendor account and revoke portal access."
        itemName={deleteTargetVendor ? `${deleteTargetVendor.companyName} (${deleteTargetVendor.id || deleteTargetVendor.vendorId})` : ""}
        loading={deletingVendor}
        confirmText="Delete Vendor"
      />
    </div>
  );
}
