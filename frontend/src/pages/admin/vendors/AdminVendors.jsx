import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  CreditCard,
  FileCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Edit3,
  Sliders,
  Check,
  Ban,
  Layers,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminVendors() {
  const [activeTab, setActiveTab] = useState("vendors"); // "vendors", "applications", "milestones"
  const [vendors, setVendors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vendor Filter State
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("All");

  // Application Filter State
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("All");

  // Milestone Filter State
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState("All");

  // Modals State
  const [reviewVendorModal, setReviewVendorModal] = useState(null); // vendor object
  const [rejectVendorReason, setRejectVendorReason] = useState("");

  const [rejectAppModal, setRejectAppModal] = useState(null); // application object
  const [rejectAppReason, setRejectAppReason] = useState("");

  const [advanceStageModal, setAdvanceStageModal] = useState(null); // application object
  const [targetStageIndex, setTargetStageIndex] = useState(0);
  const [stageNote, setStageNote] = useState("");

  const [payMilestoneModal, setPayMilestoneModal] = useState(null); // { app, milestone }
  const [paymentRefInput, setPaymentRefInput] = useState("");

  const [overrideMilestoneModal, setOverrideMilestoneModal] = useState(null); // application object
  const [customTotalAmount, setCustomTotalAmount] = useState(40000);
  const [customMilestones, setCustomMilestones] = useState([]);
  const [overrideError, setOverrideError] = useState("");

  const [bulkTemplateModal, setBulkTemplateModal] = useState(false);
  const [bulkTotalAmount, setBulkTotalAmount] = useState(40000);

  // Global action status message
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [vList, aList] = await Promise.all([
        crmVendorService.getVendors(),
        crmVendorService.getApplications(),
      ]);
      setVendors(vList || []);
      setApplications(aList || []);
    } catch (err) {
      console.error("Error loading admin vendor data:", err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg, type = "success") => {
    setActionFeedback({ msg, type });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // ------------------------------------------------------------------
  // VENDOR APPROVAL / REJECTION / SUSPENSION HANDLERS
  // ------------------------------------------------------------------
  const handleApproveVendor = async (vendorId) => {
    try {
      await crmVendorService.approveVendor(vendorId);
      setReviewVendorModal(null);
      showFeedback("Vendor approved successfully. Verification notice sent.");
      loadAllData();
    } catch (err) {
      alert(err.message || "Failed to approve vendor.");
    }
  };

  const handleRejectVendor = async (vendorId) => {
    if (!rejectVendorReason.trim()) {
      alert("Please provide a reason for rejecting the vendor.");
      return;
    }
    try {
      await crmVendorService.rejectVendor(vendorId, rejectVendorReason);
      setReviewVendorModal(null);
      setRejectVendorReason("");
      showFeedback("Vendor application marked as rejected.", "error");
      loadAllData();
    } catch (err) {
      alert(err.message || "Failed to reject vendor.");
    }
  };

  const handleToggleSuspendVendor = async (vendorId) => {
    try {
      const v = await crmVendorService.suspendVendor(vendorId);
      showFeedback(`Vendor ${v.companyName} status updated to: ${v.status}.`);
      loadAllData();
    } catch (err) {
      alert(err.message || "Failed to toggle vendor status.");
    }
  };

  // ------------------------------------------------------------------
  // CANDIDATE APPLICATION REVIEW HANDLERS
  // ------------------------------------------------------------------
  const handleShortlistApp = async (appId) => {
    try {
      await crmVendorService.updateApplicationStatus(appId, "Shortlisted");
      showFeedback("Candidate shortlisted for client interview.");
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSelectApp = async (appId) => {
    try {
      await crmVendorService.updateApplicationStatus(appId, "Selected");
      showFeedback("Candidate SELECTED! 8-stage processing pipeline and milestone plan initialized.");
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectApp = async () => {
    if (!rejectAppReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    try {
      await crmVendorService.updateApplicationStatus(
        rejectAppModal.id,
        "Rejected",
        rejectAppReason
      );
      setRejectAppModal(null);
      setRejectAppReason("");
      showFeedback("Candidate application marked as Rejected. Candidate profile preserved in vendor pool.", "info");
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAdvanceStage = async () => {
    try {
      await crmVendorService.updateProcessingStage(
        advanceStageModal.id,
        Number(targetStageIndex),
        stageNote
      );
      setAdvanceStageModal(null);
      setStageNote("");
      showFeedback("Deployment stage successfully updated.");
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ------------------------------------------------------------------
  // MILESTONE & FINANCIAL OVERRIDE HANDLERS
  // ------------------------------------------------------------------
  const handlePayMilestone = async () => {
    try {
      const { app, milestone } = payMilestoneModal;
      await crmVendorService.updateMilestoneStatus(
        app.id,
        milestone.id,
        "Paid",
        paymentRefInput || `TXN-${Date.now().toString().slice(-6)}`
      );
      setPayMilestoneModal(null);
      setPaymentRefInput("");
      showFeedback(`Milestone marked as PAID. ₹${milestone.amount.toLocaleString()} released.`);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openOverrideModal = (app) => {
    setOverrideMilestoneModal(app);
    setCustomTotalAmount(app.paymentPlan?.totalAmount || 40000);
    setCustomMilestones(
      app.paymentPlan?.milestones
        ? JSON.parse(JSON.stringify(app.paymentPlan.milestones))
        : [
            { id: "M1", name: "Milestone 1 - Selection", amount: 10000, percentage: 25, status: "Due" },
            { id: "M2", name: "Milestone 2 - Medical Clearance", amount: 10000, percentage: 25, status: "Pending" },
            { id: "M3", name: "Milestone 3 - Visa Stamped", amount: 10000, percentage: 25, status: "Pending" },
            { id: "M4", name: "Milestone 4 - Site Mobilization", amount: 10000, percentage: 25, status: "Pending" },
          ]
    );
    setOverrideError("");
  };

  const handleSaveMilestoneOverride = async () => {
    setOverrideError("");
    const sum = customMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
    const target = Number(customTotalAmount);

    if (Math.abs(sum - target) > 1) {
      setOverrideError(
        `Validation Failed: The sum of all milestone amounts (₹${sum.toLocaleString()}) must strictly equal the total payment amount (₹${target.toLocaleString()}). Difference: ₹${Math.abs(
          sum - target
        ).toLocaleString()}`
      );
      return;
    }

    try {
      await crmVendorService.overrideMilestones(
        overrideMilestoneModal.id,
        target,
        customMilestones
      );
      setOverrideMilestoneModal(null);
      showFeedback("Payment milestones overridden and saved successfully.");
      loadAllData();
    } catch (err) {
      setOverrideError(err.message);
    }
  };

  const handleApplyBulkTemplate = async () => {
    try {
      const res = await crmVendorService.applyBulkTemplate({
        totalAmount: Number(bulkTotalAmount),
      });
      setBulkTemplateModal(false);
      showFeedback(
        `Applied standard 4-milestone template (₹${Number(
          bulkTotalAmount
        ).toLocaleString()} total) across ${res.updatedCount} selected candidate applications.`
      );
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ------------------------------------------------------------------
  // FILTERING LOGIC
  // ------------------------------------------------------------------
  const filteredVendors = vendors.filter((v) => {
    if (vendorStatusFilter !== "All" && v.status !== vendorStatusFilter) return false;
    if (vendorSearch.trim()) {
      const q = vendorSearch.toLowerCase();
      return (
        v.companyName?.toLowerCase().includes(q) ||
        v.id?.toLowerCase().includes(q) ||
        v.contactPersonName?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.country?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredApplications = applications.filter((a) => {
    if (appStatusFilter !== "All" && a.status !== appStatusFilter) return false;
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase();
      return (
        a.candidateName?.toLowerCase().includes(q) ||
        a.projectName?.toLowerCase().includes(q) ||
        a.clientName?.toLowerCase().includes(q) ||
        a.position?.toLowerCase().includes(q) ||
        a.vendorId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Flatten milestones for Tab 3
  const allMilestones = [];
  applications.forEach((app) => {
    if (app.paymentPlan?.milestones) {
      app.paymentPlan.milestones.forEach((m) => {
        allMilestones.push({
          ...m,
          app,
        });
      });
    }
  });

  const filteredMilestones = allMilestones.filter((m) => {
    if (milestoneStatusFilter !== "All" && m.status !== milestoneStatusFilter) return false;
    return true;
  });

  // Top Statistics
  const pendingVendorsCount = vendors.filter((v) => v.status === "Pending").length;
  const approvedVendorsCount = vendors.filter((v) => v.status === "Approved").length;
  const pendingReviewAppsCount = applications.filter((a) => a.status === "Submitted").length;
  const selectedAppsCount = applications.filter((a) => a.status === "Selected" || a.status === "Completed").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Feedback */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-md animate-in fade-in duration-200 ${
            actionFeedback.type === "error"
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            <span>{actionFeedback.msg}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs uppercase font-bold tracking-wider hover:opacity-75 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Central Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Vendor & Deployment Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Admin oversight: verify agency partners, review candidate submissions, manage 8-stage deployment milestones, and disburse recruitment fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkTemplateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Bulk Milestone Template</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Pending Vendors
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingVendorsCount}</div>
          <span className="text-[11px] text-slate-400">Awaiting document verification</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Approved Agencies
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{approvedVendorsCount}</div>
          <span className="text-[11px] text-slate-400">Active overseas partners</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Submissions to Review
          </span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{pendingReviewAppsCount}</div>
          <span className="text-[11px] text-slate-400">Candidates awaiting selection</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Selected / In Pipeline
          </span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{selectedAppsCount}</div>
          <span className="text-[11px] text-slate-400">8-stage processing active</span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("vendors")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "vendors"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vendor Directory & Verification ({vendors.length})</span>
          {pendingVendorsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-bold">
              {pendingVendorsCount} New
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "applications"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidate Review & Deployment ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("milestones")}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "milestones"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Milestones & Overrides ({allMilestones.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: VENDORS VERIFICATION & DIRECTORY */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "vendors" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search vendor by agency name, ID, contact person, country..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["All", "Pending", "Approved", "Suspended", "Rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setVendorStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    vendorStatusFilter === st
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Vendor Company</th>
                    <th className="py-3.5 px-4">Contact Person</th>
                    <th className="py-3.5 px-4">Specialization & Territory</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Review / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200">
                            {v.companyName?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{v.companyName}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {v.id} • {v.registrationNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800">{v.contactPersonName}</div>
                        <div className="text-[11px] text-slate-500">{v.email}</div>
                        <div className="text-[11px] text-slate-400">{v.phone}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-slate-800 font-medium">{v.specialization}</div>
                        <div className="text-[11px] text-slate-500">
                          {v.city}, {v.country}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-500 text-xs">
                        {v.registeredAt ? new Date(v.registeredAt).toLocaleDateString() : "-"}
                      </td>

                      <td className="py-4 px-4">
                        {v.status === "Approved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Approved
                          </span>
                        ) : v.status === "Pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Pending Review
                          </span>
                        ) : v.status === "Suspended" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                            <Ban className="w-3 h-3 text-slate-500" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setReviewVendorModal(v)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>

                          <button
                            onClick={() => handleToggleSuspendVendor(v.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title={v.status === "Suspended" ? "Activate Vendor" : "Suspend Vendor"}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: CANDIDATE SUBMISSIONS & DEPLOYMENT REVIEW */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search candidates, project, trade, client, or vendor..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["All", "Submitted", "Shortlisted", "Selected", "Rejected", "Completed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setAppStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    appStatusFilter === st
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Candidate</th>
                    <th className="py-3.5 px-4">Vendor Partner</th>
                    <th className="py-3.5 px-4">Target Project & Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Processing Stage</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((app) => {
                    const isSelected = app.status === "Selected" || app.status === "Completed";
                    const isRejected = app.status === "Rejected";
                    const stageIdx = app.processing?.currentStageIndex ?? 0;
                    const stageName = app.processing?.stages?.[stageIdx]?.name;

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-bold text-slate-900">{app.candidateName}</div>
                          <span className="text-[11px] font-mono text-slate-400">
                            App: {app.id} • Cand: {app.candidateId}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-800">{app.vendorId}</span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900">{app.projectName}</div>
                          <div className="text-[11px] text-slate-500">
                            {app.position} • {app.country}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {app.status === "Selected" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Selected
                            </span>
                          ) : app.status === "Shortlisted" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              Shortlisted
                            </span>
                          ) : app.status === "Rejected" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Submitted
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {isSelected && app.processing ? (
                            <div className="text-xs">
                              <span className="font-semibold text-indigo-700 block">
                                Stage {stageIdx + 1}/8: {stageName}
                              </span>
                              <button
                                onClick={() => {
                                  setAdvanceStageModal(app);
                                  setTargetStageIndex(Math.min(7, stageIdx + 1));
                                }}
                                className="text-[11px] text-blue-600 hover:underline font-semibold mt-0.5 cursor-pointer"
                              >
                                Advance Stage ↗
                              </button>
                            </div>
                          ) : isRejected ? (
                            <span className="text-xs text-rose-600 italic">
                              {app.rejectionReason || "Criteria not met"}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Initial Screening</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {app.status === "Submitted" && (
                              <>
                                <button
                                  onClick={() => handleShortlistApp(app.id)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition cursor-pointer"
                                  title="Mark Shortlisted"
                                >
                                  Shortlist
                                </button>
                                <button
                                  onClick={() => handleSelectApp(app.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                                  title="Approve / Select Candidate"
                                >
                                  Select
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectAppModal(app);
                                    setRejectAppReason("");
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                                  title="Reject Candidate with Reason"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {app.status === "Shortlisted" && (
                              <>
                                <button
                                  onClick={() => handleSelectApp(app.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                                >
                                  Select
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectAppModal(app);
                                    setRejectAppReason("");
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {isSelected && (
                              <button
                                onClick={() => openOverrideModal(app)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                title="Override Payment Milestones"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Milestones</span>
                              </button>
                            )}

                            {isRejected && (
                              <span className="text-[11px] text-slate-400 italic">
                                Reusable in Pool
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: PAYMENT MILESTONES & OVERRIDES */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              {["All", "Due", "Paid", "Pending"].map((st) => (
                <button
                  key={st}
                  onClick={() => setMilestoneStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    milestoneStatusFilter === st
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500">
              Showing {filteredMilestones.length} milestones across active deployments
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Candidate & Project</th>
                    <th className="py-3.5 px-4">Milestone</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Disbursement Info</th>
                    <th className="py-3.5 px-4 text-right">Release Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMilestones.map((m, idx) => (
                    <tr key={`${m.app.id}-${m.id}-${idx}`} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-4 sm:px-6">
                        <span className="font-bold text-slate-900 block">{m.app.candidateName}</span>
                        <span className="text-[11px] text-slate-500">
                          {m.app.projectName} • {m.app.vendorId}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800">{m.name}</span>
                        <span className="block text-[11px] text-slate-400">
                          {m.percentage}% share
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-900">
                          ₹{Number(m.amount).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {m.status === "Paid" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Paid
                          </span>
                        ) : m.status === "Due" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            Upcoming
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500">
                        {m.status === "Paid" ? (
                          <div>
                            <span className="font-mono text-slate-800">{m.paymentRef}</span>
                            <span className="block text-[10px] text-slate-400">{m.paidDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Awaiting release</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {m.status !== "Paid" ? (
                          <button
                            onClick={() => {
                              setPayMilestoneModal({ app: m.app, milestone: m });
                              setPaymentRefInput(`TXN-${Date.now().toString().slice(-6)}`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Released
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 1: REVIEW VENDOR */}
      {/* ================================================================== */}
      {reviewVendorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {reviewVendorModal.companyName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {reviewVendorModal.id} • Reg: {reviewVendorModal.registrationNumber}
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                {reviewVendorModal.status}
              </span>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Contact Person:</span>
                  <span className="font-semibold text-slate-800">
                    {reviewVendorModal.contactPersonName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Direct Email:</span>
                  <span className="font-semibold text-slate-800">{reviewVendorModal.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Official Phone:</span>
                  <span className="font-semibold text-slate-800">{reviewVendorModal.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Location:</span>
                  <span className="font-semibold text-slate-800">
                    {reviewVendorModal.city}, {reviewVendorModal.country}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Trade Specialization:</span>
                  <span className="font-semibold text-slate-800">
                    {reviewVendorModal.specialization}
                  </span>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Attached Statutory Documents:</h4>
                <div className="space-y-1.5">
                  {reviewVendorModal.documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between bg-white"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="font-medium text-slate-800">{doc.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">
                            ({doc.fileName})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Reviewing file: ${doc.fileName}`)}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Inspect File ↗
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection reason box if rejecting */}
              {reviewVendorModal.status !== "Approved" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rejection Feedback (if rejecting):
                  </label>
                  <input
                    type="text"
                    value={rejectVendorReason}
                    onChange={(e) => setRejectVendorReason(e.target.value)}
                    placeholder="e.g. License expired or commercial registration missing..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewVendorModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Close
              </button>

              {reviewVendorModal.status !== "Approved" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRejectVendor(reviewVendorModal.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Reject Agency
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveVendor(reviewVendorModal.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    Approve Agency
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 2: REJECT CANDIDATE APPLICATION WITH REASON */}
      {/* ================================================================== */}
      {rejectAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <XCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reject Application for {rejectAppModal.candidateName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Project: <strong>{rejectAppModal.projectName}</strong>. The candidate will remain active and reusable for other client demands.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Specific Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectAppReason}
                onChange={(e) => setRejectAppReason(e.target.value)}
                placeholder="e.g. Client trade interview score below requirement, position filled, or visa quota mismatch..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRejectAppModal(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectApp}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 3: ADVANCE PROCESSING STAGE */}
      {/* ================================================================== */}
      {advanceStageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Advance Processing Stage
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Candidate: <strong>{advanceStageModal.candidateName}</strong> • {advanceStageModal.projectName}
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Deployment Stage:
                </label>
                <select
                  value={targetStageIndex}
                  onChange={(e) => setTargetStageIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  <option value={0}>Stage 1: Candidate Selected</option>
                  <option value={1}>Stage 2: Documents Pending</option>
                  <option value={2}>Stage 3: Documents Verified</option>
                  <option value={3}>Stage 4: Medical (GAMCA)</option>
                  <option value={4}>Stage 5: Visa Processing</option>
                  <option value={5}>Stage 6: Ticket / Travel</option>
                  <option value={6}>Stage 7: Deployed on Site</option>
                  <option value={7}>Stage 8: Mobilization Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Note / Update:
                </label>
                <input
                  type="text"
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  placeholder="e.g. GAMCA medical test passed at approved center..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdvanceStageModal(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdvanceStage}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Update Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 4: PAY MILESTONE */}
      {/* ================================================================== */}
      {payMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Disburse Milestone Payment
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Release <strong>₹{payMilestoneModal.milestone.amount.toLocaleString()}</strong> to vendor {payMilestoneModal.app.vendorId} for candidate {payMilestoneModal.app.candidateName}.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction / Banking Reference No:
                </label>
                <input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="TXN-XXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPayMilestoneModal(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePayMilestone}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
              >
                Confirm & Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 5: INDIVIDUAL MILESTONE OVERRIDE (STRICT SUM VALIDATION) */}
      {/* ================================================================== */}
      {overrideMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Override Payment Plan: {overrideMilestoneModal.candidateName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Fine-tune milestone breakdown. The sum of all milestone amounts MUST strictly equal the total payment amount.
            </p>

            {overrideError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {overrideError}
              </div>
            )}

            <div className="space-y-4 mb-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Contracted Fee (₹):
                </label>
                <input
                  type="number"
                  value={customTotalAmount}
                  onChange={(e) => setCustomTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-700 block">Milestones:</span>
                {customMilestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block text-xs">{m.name}</span>
                      <span className="text-[10px] text-slate-400">Status: {m.status}</span>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => {
                          const updated = [...customMilestones];
                          updated[idx].amount = Number(e.target.value);
                          setCustomMilestones(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Sum Verification */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                <span>Current Sum of Milestones:</span>
                <span className="font-bold text-blue-900">
                  ₹
                  {customMilestones
                    .reduce((acc, m) => acc + (Number(m.amount) || 0), 0)
                    .toLocaleString()}{" "}
                  / ₹{Number(customTotalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOverrideMilestoneModal(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMilestoneOverride}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
              >
                Validate & Save Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL 6: BULK TEMPLATE APPLICATION */}
      {/* ================================================================== */}
      {bulkTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Apply Standard 4-Milestone Template
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Instantly applies a 4-tier milestone structure (25% Selection, 25% GAMCA, 25% Visa, 25% Site Mobilization) to ALL Selected candidates.
            </p>

            <div className="space-y-3 mb-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Total Recruitment Fee per Candidate (₹):
                </label>
                <input
                  type="number"
                  value={bulkTotalAmount}
                  onChange={(e) => setBulkTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm text-slate-900"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>1. Selection (25%):</span>
                  <span className="font-semibold">₹{Math.round(bulkTotalAmount * 0.25).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>2. GAMCA Medical (25%):</span>
                  <span className="font-semibold">₹{Math.round(bulkTotalAmount * 0.25).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>3. Visa Stamping (25%):</span>
                  <span className="font-semibold">₹{Math.round(bulkTotalAmount * 0.25).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>4. Deployment on Site (25%):</span>
                  <span className="font-semibold">₹{Math.round(bulkTotalAmount * 0.25).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkTemplateModal(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkTemplate}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Apply to All Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
