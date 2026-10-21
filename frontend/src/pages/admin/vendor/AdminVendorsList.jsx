import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";
import MouFullPageView from "../../../components/vendor/MouFullPageView.jsx";
import DocumentViewerFullPage from "../../../components/vendor/DocumentViewerFullPage.jsx";
import EditVendorModal from "../../../components/admin/modals/EditVendorModal.jsx";
import DeleteConfirmModal from "../../../components/common/DeleteConfirmModal.jsx";
import ExcelExportModal from "../../../components/common/ExcelExportModal.jsx";
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
  recruitmentLicenseDocName: "",
  gstDocName: "",
  panDocName: "",
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
  const [candidates, setCandidates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vData, cData, aData] = await Promise.all([
        crmVendorService.getVendors(),
        crmVendorService.getCandidates(),
        crmVendorService.getApplications(),
      ]);
      setVendors(vData || []);
      setCandidates(cData || []);
      setApplications(aData || []);
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
    else if (tabParam === "suspended-rejected") setStatusFilter("Suspended & Rejected");
    else if (!tabParam) setStatusFilter("All");

    const vendorParam = searchParams.get("vendorId");
    if (vendorParam && vendors.length > 0) {
      const target = vendors.find((v) => v.id === vendorParam || v.vendorId === vendorParam);
      if (target) {
        setSelectedVendor(target);
        if (searchParams.get("view") === "docs") setShowDocsPage(true);
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
  }, [vendors, statusFilter, stateFilter, cityFilter, specFilter, dateFilter, searchQuery]);

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
    const targetProj = AVAILABLE_PROJECTS.find((p) => p.id === targetProjId) || AVAILABLE_PROJECTS[0];
    try {
      const updatedApp = await crmVendorService.updateApplicationProject(appId, {
        projectId: targetProj.id,
        projectName: targetProj.projectName,
        clientName: targetProj.clientName,
        country: targetProj.country,
        tradePosition: targetPosition,
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

  if (selectedVendor && selectedCandidate) {
    return (
      <VendorCandidateDossierView
        selectedVendor={selectedVendor}
        selectedCandidate={selectedCandidate}
        applications={applications}
        availableProjects={AVAILABLE_PROJECTS}
        onBackToVendor={() => setSelectedCandidate(null)}
        onBackToAll={() => {
          setSelectedCandidate(null);
          setSelectedVendor(null);
          setShowDocsPage(false);
        }}
        onUpdateAppStatus={handleUpdateAppStatus}
        onConfirmReassignProject={handleConfirmReassignProject}
        onAcceptCandDoc={handleAcceptCandDoc}
        onConfirmRejectCandDoc={handleConfirmRejectCandDoc}
        onAcceptAllCandDocs={handleAcceptAllCandDocs}
      />
    );
  }

  if (previewingDoc) {
    return (
      <DocumentViewerFullPage
        doc={previewingDoc}
        vendor={selectedVendor}
        onBack={() => setPreviewingDoc(null)}
      />
    );
  }

  if (selectedVendor && showDocsPage) {
    return (
      <VendorDocumentsVaultView
        selectedVendor={selectedVendor}
        onBack={() => setShowDocsPage(false)}
        onBackToAll={() => {
          setSelectedVendor(null);
          setShowDocsPage(false);
        }}
        onEditVendor={(v) => setEditingVendor(v)}
        onDeleteVendor={(v) => setDeleteTargetVendor(v)}
        onPreviewDoc={(doc) => setPreviewingDoc(doc)}
        onDownloadDoc={handleDownloadDoc}
        onApproveDocsAndSendMou={handleApproveDocsAndSendMou}
      />
    );
  }

  if (selectedVendor && !showDocsPage) {
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
      <VendorDetailView
        selectedVendor={selectedVendor}
        onBack={() => {
          setSelectedVendor(null);
          setShowDocsPage(false);
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
          else if (filterKey === "Suspended & Rejected") setSearchParams({ tab: "suspended-rejected" });
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
    </div>
  );
}
