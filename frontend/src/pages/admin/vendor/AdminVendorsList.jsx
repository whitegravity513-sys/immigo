import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";
import MouFullPageView from "../../../components/vendor/MouFullPageView.jsx";
import DocumentViewerFullPage from "../../../components/vendor/DocumentViewerFullPage.jsx";
import EditVendorModal from "../../../components/admin/modals/EditVendorModal.jsx";
import DeleteConfirmModal from "../../../components/common/DeleteConfirmModal.jsx";
import ExcelExportModal from "../../../components/common/ExcelExportModal.jsx";
import { downloadUploadedDocument } from "../../../utils/printDocument.js";
import {
  AdminRejectVendorModal,
  AdminAddVendorModal,
  AdminDispatchedCredentialsModal,
  VendorStatsCards,
  VendorFilterToolbar,
  VendorTable,
  VendorDetailView,
  VendorDocumentsVaultView,
  VendorCandidateDossierView,
  VendorVerificationSuccessModal,
} from "../../../components/admin/vendor/index.js";

const DEFAULT_NEW_VENDOR = {
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
  password: "",
  tradeLicenseDocName: "",
  tradeLicenseDocUrl: "",
  tradeLicenseDocSize: "",
  recruitmentLicenseDocName: "",
  recruitmentLicenseDocUrl: "",
  recruitmentLicenseDocSize: "",
  gstDocName: "",
  gstDocUrl: "",
  gstDocSize: "",
  panDocName: "",
  panDocUrl: "",
  panDocSize: "",
};

const VENDOR_EXPORT_FIELDS = [
  { key: "companyName", label: "Agency Name", category: "Company Info", defaultSelected: true },
  { key: "id", label: "Vendor ID", category: "Company Info", defaultSelected: true, extractor: (v) => v.id || v.vendorId || "—" },
  { key: "contactPersonName", label: "Contact Person", category: "Contact", defaultSelected: true },
  { key: "email", label: "Official Email", category: "Contact", defaultSelected: true },
  { key: "phone", label: "Mobile Number", category: "Contact", defaultSelected: true },
  { key: "alternatePhone", label: "Alternate Phone", category: "Contact", defaultSelected: false },
  { key: "businessType", label: "Business Type", category: "Company Info", defaultSelected: true },
  { key: "state", label: "State", category: "Address", defaultSelected: true },
  { key: "city", label: "City", category: "Address", defaultSelected: true },
  { key: "address", label: "Registered Address", category: "Address", defaultSelected: true },
  { key: "pan", label: "PAN Number", category: "Statutory", defaultSelected: true },
  { key: "gstin", label: "GSTIN", category: "Statutory", defaultSelected: true },
  { key: "status", label: "Status", category: "Status", defaultSelected: true },
  { key: "mouStatus", label: "MOU Status", category: "Status", defaultSelected: true },
  { key: "countriesServed", label: "Countries Served", category: "Capacity", defaultSelected: false },
  { key: "experienceYears", label: "Experience (Years)", category: "Capacity", defaultSelected: false },
  { key: "monthlyCapacity", label: "Monthly Capacity", category: "Capacity", defaultSelected: false },
  { key: "createdAt", label: "Registration Date", category: "System", defaultSelected: true, extractor: (v) => (v.createdAt ? new Date(v.createdAt).toLocaleDateString("en-GB") : "—") },
];

export default function AdminVendorsList() {
  const [vendors, setVendors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonthYear] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [addVendorLoading, setAddVendorLoading] = useState(false);
  const [dispatchedVendor, setDispatchedVendor] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [verificationSuccessModal, setVerificationSuccessModal] = useState({
    open: false,
    vendorName: "",
    vendorId: "",
    email: "",
  });

  const [editingVendor, setEditingVendor] = useState(null);
  const [savingVendor, setSavingVendor] = useState(false);
  const [deleteTargetVendor, setDeleteTargetVendor] = useState(null);
  const [deletingVendor, setDeletingVendor] = useState(false);

  const [newVendorForm, setNewVendorForm] = useState(DEFAULT_NEW_VENDOR);
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "registered") return "Registered";
    if (tabParam === "pending") return "Pending Verification";
    if (tabParam === "mou") return "MOU Pending";
    if (tabParam === "approved") return "Approved";
    if (tabParam === "suspended-rejected") return "Suspended & Rejected";
    return "All";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [specFilter, setSpecFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDocsPage, setShowDocsPage] = useState(false);
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [showDraftMouPage, setShowDraftMouPage] = useState(false);
  const [showViewMouPage, setShowViewMouPage] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [previewCandidate, setPreviewCandidate] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vData, aData, pData] = await Promise.all([
        crmVendorService.getVendors(),
        crmVendorService.getApplications(),
        crmVendorService.getAvailableProjects().catch(() => []),
      ]);
      const nextVendors = vData || [];
      setVendors(nextVendors);
      setApplications(aData || []);
      setAvailableProjects(pData || []);
      setSelectedVendor((prev) => {
        if (!prev) return prev;
        const prevKey = prev.id || prev.vendorId || prev._id;
        return (
          nextVendors.find((v) => (v.id || v.vendorId || v._id) === prevKey) || prev
        );
      });
    } catch (err) {
      console.error("Failed to load vendor management data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "registered") setStatusFilter("Registered");
    else if (tabParam === "pending") setStatusFilter("Pending Verification");
    else if (tabParam === "mou") setStatusFilter("MOU Pending");
    else if (tabParam === "approved") setStatusFilter("Approved");
    else if (tabParam === "suspended") setStatusFilter("Suspended");
    else if (tabParam === "rejected") setStatusFilter("Rejected");
    else if (tabParam === "suspended-rejected") setStatusFilter("Suspended & Rejected");
    else if (!tabParam || tabParam === "all") setStatusFilter("All");

    const vendorParam = searchParams.get("vendorId");
    const viewParam = searchParams.get("view");
    if (vendorParam && vendors.length > 0) {
      const normalizedParam = String(vendorParam).trim().toLowerCase();
      const target = vendors.find((v) =>
        [v.id, v.vendorId, v._id].some((k) => k && String(k).trim().toLowerCase() === normalizedParam)
      );
      if (target) {
        setSelectedVendor(target);
        if (viewParam === "docs") {
          setShowDocsPage(true);
          setShowViewMouPage(false);
        } else if (viewParam === "mou") {
          setShowDocsPage(false);
          setShowViewMouPage(true);
        } else {
          setShowDocsPage(false);
          setShowViewMouPage(false);
        }
      }
    }
  }, [searchParams, vendors]);

  const availableStates = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.state).filter(Boolean))),
    [vendors]
  );
  const availableCities = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.city).filter(Boolean))),
    [vendors]
  );
  const availableSpecs = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.specialization).filter(Boolean))),
    [vendors]
  );

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (statusFilter === "Registered") {
        const isApproved =
          v.status === "Approved" || v.status === "Active" || v.mouStatus === "Approved";
        const isReg =
          v.status !== "Suspended" &&
          v.status !== "Rejected" &&
          !v.status?.includes("Rejected") &&
          !isApproved;
        if (!isReg) return false;
      } else if (statusFilter === "Pending Verification") {
        const hasDocs = v.documentsUploaded === true || (Array.isArray(v.documents) && v.documents.length > 0);
        const isDocReview = [
          "Documents Pending",
          "Under Review",
          "Documents Under Review",
          "Pending Verification",
          "Documents Correction Required",
        ].includes(v.status);
        if (!hasDocs || !isDocReview) return false;
      } else if (statusFilter === "MOU Pending") {
        if (
          v.status === "MOU Pending" ||
          v.status === "Pending MOU Approval" ||
          v.status === "MOU Under Review" ||
          v.status === "MOU Correction Required" ||
          v.mouStatus === "Sent" ||
          v.mouStatus === "Under Review" ||
          v.onboardingStage === "MOU_SENT" ||
          v.onboardingStage === "MOU_UNDER_REVIEW"
        ) {
          return true;
        }
        return false;
      } else if (statusFilter === "Approved") {
        const isApproved =
          (v.status === "Approved" || v.status === "Active" || v.mouStatus === "Approved") &&
          v.status !== "Suspended" &&
          v.status !== "Rejected" &&
          !v.status?.includes("Rejected");
        if (!isApproved) return false;
      } else if (statusFilter === "Suspended") {
        if (v.status !== "Suspended") return false;
      } else if (statusFilter === "Rejected") {
        if (v.status !== "Rejected" && !v.status?.includes("Rejected")) return false;
      } else if (statusFilter === "Suspended & Rejected") {
        if (v.status !== "Suspended" && v.status !== "Rejected" && !v.status?.includes("Rejected")) return false;
      } else if (statusFilter !== "All" && v.status !== statusFilter) {
        return false;
      }

      if (stateFilter !== "All" && v.state !== stateFilter) return false;
      if (cityFilter !== "All" && v.city !== cityFilter) return false;
      if (specFilter !== "All" && !v.specialization?.includes(specFilter)) return false;

      if (dateFilter === "This Month") {
        if (!v.registeredAt && !v.createdAt) return false;
        const regDate = new Date(v.registeredAt || v.createdAt);
        if (
          regDate.getMonth() !== currentMonthYear.month ||
          regDate.getFullYear() !== currentMonthYear.year
        ) {
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
  }, [vendors, statusFilter, stateFilter, cityFilter, specFilter, dateFilter, searchQuery, currentMonthYear]);

  const handleUpdateAppStatus = async (appId, newStatus, reason = "") => {
    try {
      const updatedApp = await crmVendorService.updateApplicationStatus(appId, newStatus, reason);
      loadData();
      if (selectedCandidate) {
        setSelectedCandidate((prev) => ({ ...prev, candApp: updatedApp }));
      }
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleConfirmReassignProject = async (appId, targetProjId, targetPosition) => {
    const targetProj =
      availableProjects.find((p) => String(p.id) === String(targetProjId)) ||
      availableProjects[0];
    if (!targetProj) {
      alert("No active overseas project available for reassignment.");
      return;
    }
    try {
      const updatedApp = await crmVendorService.updateApplicationProject(appId, {
        projectId: targetProj.id,
        projectName: targetProj.projectName,
        clientId: targetProj.clientId,
        clientName: targetProj.clientName,
        country: targetProj.country,
        position: targetPosition,
      });
      loadData();
      if (selectedCandidate) {
        setSelectedCandidate((prev) => ({ ...prev, candApp: updatedApp }));
      }
    } catch (err) {
      alert(err.message || "Failed to reassign candidate");
    }
  };

  const handleAcceptCandDoc = async (docIdx) => {
    if (!selectedCandidate) return;
    try {
      const updated = await crmVendorService.verifyCandidateDocument(
        selectedCandidate.id,
        docIdx,
        "Verified"
      );
      setSelectedCandidate(updated);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to accept document");
    }
  };

  const handleConfirmRejectCandDoc = async (docIdx, remarks) => {
    if (!selectedCandidate) return;
    try {
      const updated = await crmVendorService.verifyCandidateDocument(
        selectedCandidate.id,
        docIdx,
        "Rejected",
        remarks
      );
      setSelectedCandidate(updated);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to reject candidate document");
    }
  };

  const handleAcceptAllCandDocs = async () => {
    if (!selectedCandidate) return;
    try {
      const updated = await crmVendorService.verifyAllCandidateDocuments(
        selectedCandidate.id,
        "Verified"
      );
      setSelectedCandidate(updated);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to verify all documents");
    }
  };

  const handleDownloadDoc = (doc) => {
    downloadUploadedDocument(doc);
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
    } catch (err) {
      alert(err.message || "Failed to save vendor changes");
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
    } catch (err) {
      alert(err.message || "Failed to delete vendor");
    } finally {
      setDeletingVendor(false);
    }
  };

  const handleApproveRegistration = async (vendorId) => {
    try {
      const targetVendor =
        vendors.find((v) => v.id === vendorId || v.vendorId === vendorId) ||
        (selectedVendor && (selectedVendor.id === vendorId || selectedVendor.vendorId === vendorId) ? selectedVendor : null);
      const vName = targetVendor?.companyName || targetVendor?.name || "Vendor Partner";
      const vEmail = targetVendor?.officialEmail || targetVendor?.email || "";
      const vCode = targetVendor?.vendorId || vendorId;

      await crmVendorService.approveRegistration(vendorId);
      loadData();
      if (selectedVendor && (selectedVendor.id === vendorId || selectedVendor.vendorId === vendorId)) {
        setSelectedVendor((prev) => ({ ...prev, status: "Documents Pending" }));
      }
      setVerificationSuccessModal({
        open: true,
        vendorName: vName,
        vendorId: vCode,
        email: vEmail,
      });
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
      if (selectedVendor && (selectedVendor.id === vendorId || selectedVendor.vendorId === vendorId)) {
        setSelectedVendor((prev) => ({ ...prev, status: "Registration On Hold", adminRemarks: remarks }));
      }
      alert("Vendor registration placed on hold.");
    } catch (err) {
      alert(err.message || "Failed to put on hold");
    }
  };

  const handleApproveDocsAndSendMou = async (vendorId) => {
    try {
      const res = await crmVendorService.approveDocsAndSendMou(vendorId);
      loadData();
      if (selectedVendor && (selectedVendor.id === vendorId || selectedVendor.vendorId === vendorId || selectedVendor._id === vendorId)) {
        setSelectedVendor((prev) => ({
          ...prev,
          status: "MOU Pending",
          mouStatus: "Sent",
          onboardingStage: "MOU_SENT",
          documentVerified: true,
          mouDocument: res?.mouDocument || res?.vendor?.mouDocument || prev.mouDocument,
        }));
      }
      alert("Compliance documents verified! MOU has been assigned to the vendor successfully.");
    } catch (err) {
      alert(err.message || "Failed to verify documents and assign MOU");
    }
  };

  const handleRequestDocCorrection = async (vendorId) => {
    const remarks = prompt("Please enter the correction requirements for the vendor's documents:");
    if (!remarks) return;
    try {
      await crmVendorService.requestDocCorrection(vendorId, remarks);
      loadData();
      if (selectedVendor && (selectedVendor.id === vendorId || selectedVendor.vendorId === vendorId || selectedVendor._id === vendorId)) {
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
      if (selectedVendor && (selectedVendor.id === vendorId || selectedVendor.vendorId === vendorId || selectedVendor._id === vendorId)) {
        setSelectedVendor((prev) => ({
          ...prev,
          status: "Active",
          mouStatus: "Approved",
          onboardingStage: "COMPLETED",
          documentVerified: true,
          mouSigned: true,
        }));
      }
      alert("MOU verified & approved! Vendor account activated and full portal unlocked.");
    } catch (err) {
      alert(err.message || "Failed to activate vendor");
    }
  };

  const handleRequestMouCorrection = async (vendorId) => {
    const remarks = prompt(
      "Enter reason for requesting MOU re-upload:",
      "Please re-upload a clear signed & stamped MOU copy."
    );
    if (remarks === null) return;
    const cleanRemarks = remarks.trim() || "Please re-upload a clear signed & stamped MOU copy.";
    try {
      await crmVendorService.requestMouCorrection(vendorId, cleanRemarks);
      loadData();
      if (selectedVendor && (selectedVendor.id === vendorId || selectedVendor.vendorId === vendorId || selectedVendor._id === vendorId)) {
        setSelectedVendor((prev) => ({
          ...prev,
          status: "MOU Correction Required",
          mouStatus: "Correction Required",
          mouSigned: false,
          onboardingStage: "MOU_SENT",
          adminRemarks: cleanRemarks,
        }));
      }
      alert("MOU re-upload request sent to vendor.");
    } catch (err) {
      alert(err.message || "Failed to request MOU re-upload");
    }
  };

  const handleToggleSuspend = async (vendorId) => {
    try {
      await crmVendorService.suspendVendor(vendorId);
      loadData();
      if (selectedVendor && (selectedVendor.id === vendorId || selectedVendor.vendorId === vendorId || selectedVendor._id === vendorId)) {
        setSelectedVendor((prev) => ({
          ...prev,
          status: prev.status === "Suspended" ? "Active" : "Suspended",
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    try {
      const vId = selectedVendor.id || selectedVendor.vendorId || selectedVendor._id;
      const updated = await crmVendorService.rejectVendor(vId, rejectionReason);
      setShowRejectModal(false);
      setShowViewMouPage(false);
      setRejectionReason("");
      loadData();
      if (selectedVendor) {
        setSelectedVendor((prev) => ({
          ...prev,
          ...(updated || {}),
          status: "Rejected",
          mouStatus: updated?.mouStatus || (prev.mouSigned || prev.mouStatus === "Under Review" ? "Rejected" : prev.mouStatus),
          mouSigned: false,
          rejectionReason,
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

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
      const digitsOnly = newVendorForm.phone.replace(/[-\s()+]/g, "");
      if (!/^\d{10,15}$/.test(digitsOnly)) {
        alert("Please enter a valid 10 to 15 digit phone number.");
        return;
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const inferMime = (url = "") => {
      const m = String(url).match(/^data:([^;]+)/i);
      return m ? m[1] : "";
    };
    const docList = [];
    if (newVendorForm.tradeLicenseDocUrl) {
      docList.push({
        name: "Trade License / Incorporation Certificate",
        fileName: newVendorForm.tradeLicenseDocName,
        fileUrl: newVendorForm.tradeLicenseDocUrl,
        mimeType: inferMime(newVendorForm.tradeLicenseDocUrl),
        size: newVendorForm.tradeLicenseDocSize || "—",
        type: "Registration",
        status: "Pending",
        uploadedAt: todayStr,
      });
    }
    if (newVendorForm.recruitmentLicenseDocUrl) {
      docList.push({
        name: "Recruitment License",
        fileName: newVendorForm.recruitmentLicenseDocName,
        fileUrl: newVendorForm.recruitmentLicenseDocUrl,
        mimeType: inferMime(newVendorForm.recruitmentLicenseDocUrl),
        size: newVendorForm.recruitmentLicenseDocSize || "—",
        type: "License",
        status: "Pending",
        uploadedAt: todayStr,
      });
    }
    if (newVendorForm.gstDocUrl) {
      docList.push({
        name: "GST Certificate",
        fileName: newVendorForm.gstDocName,
        fileUrl: newVendorForm.gstDocUrl,
        mimeType: inferMime(newVendorForm.gstDocUrl),
        size: newVendorForm.gstDocSize || "—",
        type: "Tax",
        status: "Pending",
        uploadedAt: todayStr,
      });
    }
    if (newVendorForm.panDocUrl) {
      docList.push({
        name: "PAN Card",
        fileName: newVendorForm.panDocName,
        fileUrl: newVendorForm.panDocUrl,
        mimeType: inferMime(newVendorForm.panDocUrl),
        size: newVendorForm.panDocSize || "—",
        type: "Tax",
        status: "Pending",
        uploadedAt: todayStr,
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
      setNewVendorForm(DEFAULT_NEW_VENDOR);
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

  const clearVendorSelectionParams = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("vendorId");
    next.delete("view");
    setSearchParams(next, { replace: true });
  };

  const sharedModals = (
    <>
      <AdminRejectVendorModal
        isOpen={showRejectModal && Boolean(selectedVendor)}
        onClose={() => setShowRejectModal(false)}
        selectedVendor={selectedVendor}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onConfirmReject={handleConfirmReject}
      />

      <AdminAddVendorModal
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
        newVendorForm={newVendorForm}
        setNewVendorForm={setNewVendorForm}
        handleAddVendorSubmit={handleAddVendorSubmit}
        addVendorLoading={addVendorLoading}
      />

      <AdminDispatchedCredentialsModal
        dispatchedVendor={dispatchedVendor}
        onClose={() => setDispatchedVendor(null)}
        copiedLink={copiedLink}
        copyVendorLoginUrl={copyVendorLoginUrl}
      />

      <EditVendorModal
        isOpen={Boolean(editingVendor)}
        onClose={() => setEditingVendor(null)}
        vendor={editingVendor}
        onSave={handleSaveVendor}
        saving={savingVendor}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetVendor)}
        onClose={() => setDeleteTargetVendor(null)}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor Organization"
        message="Are you sure you want to permanently remove this vendor partner? This action will delete the vendor account and revoke portal access."
        itemName={
          deleteTargetVendor
            ? `${deleteTargetVendor.companyName} (${deleteTargetVendor.id || deleteTargetVendor.vendorId})`
            : ""
        }
        loading={deletingVendor}
        confirmText="Delete Vendor"
      />

      <VendorVerificationSuccessModal
        modalState={verificationSuccessModal}
        onClose={() => setVerificationSuccessModal({ open: false, vendorName: "", vendorId: "", email: "" })}
        onVerifyDocuments={(vId) => {
          setVerificationSuccessModal({ open: false, vendorName: "", vendorId: "", email: "" });
          const vObj = vendors.find((v) => v.id === vId || v.vendorId === vId);
          if (vObj) {
            setSelectedVendor(vObj);
            setShowDocsPage(true);
          }
        }}
      />

      <ExcelExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Vendor Agencies"
        subtitle="Select the fields you want to include in the exported vendor list."
        availableFields={VENDOR_EXPORT_FIELDS}
        data={vendors}
        filenamePrefix="Vendors_Directory"
        sheetName="Vendors"
      />
    </>
  );

  if (previewingDoc) {
    return (
      <>
        <DocumentViewerFullPage
          doc={previewingDoc}
          vendor={selectedVendor}
          candidate={previewCandidate}
          onBack={() => {
            setPreviewingDoc(null);
            setPreviewCandidate(null);
          }}
        />
        {sharedModals}
      </>
    );
  }

  if (selectedVendor && selectedCandidate) {
    return (
      <>
        <VendorCandidateDossierView
          selectedVendor={selectedVendor}
          selectedCandidate={selectedCandidate}
          applications={applications}
          availableProjects={availableProjects}
          onBackToVendor={() => setSelectedCandidate(null)}
          onBackToAll={() => {
            setSelectedCandidate(null);
            setSelectedVendor(null);
            setShowDocsPage(false);
            clearVendorSelectionParams();
          }}
          onUpdateAppStatus={handleUpdateAppStatus}
          onConfirmReassignProject={handleConfirmReassignProject}
          onAcceptCandDoc={handleAcceptCandDoc}
          onConfirmRejectCandDoc={handleConfirmRejectCandDoc}
          onAcceptAllCandDocs={handleAcceptAllCandDocs}
          onPreviewDoc={(doc) => {
            setPreviewCandidate(selectedCandidate);
            setPreviewingDoc(doc);
          }}
        />
        {sharedModals}
      </>
    );
  }

  if (selectedVendor && showDocsPage) {
    return (
      <>
        <VendorDocumentsVaultView
          selectedVendor={selectedVendor}
          onBack={() => {
            setShowDocsPage(false);
            const next = new URLSearchParams(searchParams);
            next.delete("view");
            setSearchParams(next, { replace: true });
          }}
          onBackToAll={() => {
            setSelectedVendor(null);
            setShowDocsPage(false);
            clearVendorSelectionParams();
          }}
          onEditVendor={(v) => setEditingVendor(v)}
          onDeleteVendor={(v) => setDeleteTargetVendor(v)}
          onPreviewDoc={(doc) => setPreviewingDoc(doc)}
          onDownloadDoc={handleDownloadDoc}
          onApproveDocsAndSendMou={handleApproveDocsAndSendMou}
        />
        {sharedModals}
      </>
    );
  }

  if (selectedVendor && !showDocsPage) {
    if (showDraftMouPage) {
      return (
        <>
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
          {sharedModals}
        </>
      );
    }

    if (showViewMouPage) {
      const isSelectedRejected = Boolean(
        ["Rejected", "Registration Rejected", "MOU Rejected"].includes(selectedVendor.status) ||
          selectedVendor.mouStatus === "Rejected"
      );
      const isSelectedMouApproved = Boolean(
        !isSelectedRejected &&
          (selectedVendor.status === "Approved" ||
            selectedVendor.status === "Active" ||
            selectedVendor.mouStatus === "Approved" ||
            selectedVendor.onboardingStage === "COMPLETED" ||
            selectedVendor.onboardingStage === "ACTIVE")
      );
      const isSelectedMouUnderReview = Boolean(
        !isSelectedRejected &&
          !isSelectedMouApproved &&
          selectedVendor.mouStatus !== "Correction Required" &&
          selectedVendor.status !== "MOU Correction Required" &&
          (selectedVendor.status === "Pending MOU Approval" ||
            selectedVendor.status === "MOU Under Review" ||
            selectedVendor.mouStatus === "Under Review" ||
            selectedVendor.mouSigned ||
            selectedVendor.mouStatus === "Signed" ||
            selectedVendor.onboardingStage === "MOU_UNDER_REVIEW" ||
            selectedVendor.onboardingStage === "MOU_SIGNED" ||
            Boolean(selectedVendor.signedMou?.signedAt))
      );
      return (
        <>
          <MouFullPageView
            mode="preview"
            viewerRole="admin"
            vendor={selectedVendor}
            onBack={() => {
              setShowViewMouPage(false);
              const next = new URLSearchParams(searchParams);
              next.delete("view");
              setSearchParams(next, { replace: true });
            }}
            onApprove={
              !isSelectedMouApproved && isSelectedMouUnderReview
                ? async () => {
                    await handleApproveMouAndActivate(
                      selectedVendor.id || selectedVendor.vendorId || selectedVendor._id
                    );
                    setShowViewMouPage(false);
                  }
                : undefined
            }
            onRequestCorrection={
              !isSelectedMouApproved && isSelectedMouUnderReview
                ? async () => {
                    await handleRequestMouCorrection(
                      selectedVendor.id || selectedVendor.vendorId || selectedVendor._id
                    );
                    setShowViewMouPage(false);
                  }
                : undefined
            }
            onReject={
              !isSelectedMouApproved && isSelectedMouUnderReview
                ? () => setShowRejectModal(true)
                : undefined
            }
          />
          {sharedModals}
        </>
      );
    }

    return (
      <>
        <VendorDetailView
          selectedVendor={selectedVendor}
          onBack={() => {
            setSelectedVendor(null);
            setShowDocsPage(false);
            clearVendorSelectionParams();
          }}
          onEditVendor={(v) => setEditingVendor(v)}
          onDeleteVendor={(v) => setDeleteTargetVendor(v)}
          onShowDocsPage={() => setShowDocsPage(true)}
          onToggleSuspend={handleToggleSuspend}
          onApproveRegistration={handleApproveRegistration}
          onHoldRegistration={handleHoldRegistration}
          onOpenRejectModal={() => setShowRejectModal(true)}
          onApproveDocsAndSendMou={handleApproveDocsAndSendMou}
          onRequestDocCorrection={handleRequestDocCorrection}
          onShowViewMouPage={() => setShowViewMouPage(true)}
          onApproveMouAndActivate={handleApproveMouAndActivate}
          onRequestMouCorrection={handleRequestMouCorrection}
          onPreviewDoc={(doc) => setPreviewingDoc(doc)}
          onDownloadDoc={handleDownloadDoc}
        />
        {sharedModals}
      </>
    );
  }

  return (
    <div className="space-y-3.5 w-full max-w-full overflow-hidden font-sans antialiased text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">All Vendors</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Review manpower agency partners, statutory credentials, and candidate submission statistics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-bold">
            Total Agencies: {vendors.length}
          </span>
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download Vendors list in Excel/CSV"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export Data</span>
          </button>
          <button
            onClick={() => setShowAddVendorModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      <VendorStatsCards
        vendors={vendors}
        statusFilter={statusFilter}
        onSelectFilter={(filterKey) => {
          setStatusFilter(filterKey);
          if (filterKey === "Registered") setSearchParams({ tab: "registered" });
          else if (filterKey === "Approved") setSearchParams({ tab: "approved" });
          else if (filterKey === "Suspended") setSearchParams({ tab: "suspended" });
          else if (filterKey === "Rejected") setSearchParams({ tab: "rejected" });
          else setSearchParams({});
        }}
      />

      <VendorFilterToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        onClearFilter={() => {
          setStatusFilter("All");
          setSearchParams({});
        }}
        vendorCount={filteredVendors.length}
        stateFilter={stateFilter}
        setStateFilter={setStateFilter}
        availableStates={availableStates}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        availableCities={availableCities}
        specFilter={specFilter}
        setSpecFilter={setSpecFilter}
        availableSpecs={availableSpecs}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      <VendorTable
        loading={loading}
        vendors={filteredVendors}
        onSelectVendor={(v) => setSelectedVendor(v)}
        onEditVendor={(v) => setEditingVendor(v)}
        onDeleteVendor={(v) => setDeleteTargetVendor(v)}
        onToggleSuspend={handleToggleSuspend}
        onApproveRegistration={handleApproveRegistration}
        onOpenRejectModal={(v) => {
          setSelectedVendor(v);
          setShowRejectModal(true);
        }}
      />

      {sharedModals}
    </div>
  );
}
