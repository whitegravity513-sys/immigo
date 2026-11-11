import { Fragment, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Sliders,
  CheckCircle2,
  Clock,
  Lock,
  Search,
  Layers,
  ChevronDown,
  ChevronUp,
  Receipt,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function AdminMilestonesList() {
  const { user, isSuperAdmin, isVendorHR } = useAuth();
  const actorLabel = isVendorHR ? "Vendor HR" : isSuperAdmin ? "Super Admin" : (user?.name || "Admin");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAppIds, setExpandedAppIds] = useState([]);
  const [actionBusyKey, setActionBusyKey] = useState("");

  const resolveMilestones = (app) => {
    const syncedMs = !app.milestonesOverridden
      ? crmVendorService.syncAppMilestonesWithProject(app)
      : [];
    if (syncedMs.length > 0) return syncedMs;
    if (app.processMilestones?.length > 0) return app.processMilestones;
    return app.paymentPlan?.milestones || [];
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await crmVendorService.getAvailableProjects().catch(() => []);
      const data = await crmVendorService.getApplications();
      const postSelectionStatuses = new Set([
        "Selected",
        "Completed",
        "Processing",
        "Offer Released",
        "Offer Accepted",
        "Visa Processing",
        "Visa Issued",
        "Visa Allotted",
        "Joined",
        "Deployed",
      ]);
      const selectedApps = (data || []).filter(
        (a) =>
          (postSelectionStatuses.has(a.status) ||
            postSelectionStatuses.has(a.recruitmentStage)) &&
          resolveMilestones(a).length > 0
      );
      setApplications(selectedApps);
    } catch (err) {
      console.error("Failed to load milestone data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 0);
    const handleRefresh = () => loadData();
    window.addEventListener("immigo:application-update", handleRefresh);
    window.addEventListener("immigo:vendor-hr-refresh", handleRefresh);
    window.addEventListener("immigo:dashboard-update", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      clearTimeout(t);
      window.removeEventListener("immigo:application-update", handleRefresh);
      window.removeEventListener("immigo:vendor-hr-refresh", handleRefresh);
      window.removeEventListener("immigo:dashboard-update", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, [loadData]);

  let totalFeeToCollect = 0;
  let totalFeeReleased = 0;

  applications.forEach((app) => {
    const milestones = resolveMilestones(app);
    const msSum = milestones.reduce((acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0), 0);
    const total = msSum > 0 ? msSum : Number(app.paymentPlan?.totalAmount || 0);
    totalFeeToCollect += total;

    milestones.forEach((m) => {
      if (m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed") {
        totalFeeReleased += Number(m.paymentAmount ?? m.amount ?? 0);
      }
    });
  });

  const totalRemainingPending = Math.max(0, totalFeeToCollect - totalFeeReleased);

  const filteredApps = applications.filter((app) => {
    const milestones = resolveMilestones(app);
    const msSum = milestones.reduce((acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0), 0);
    const totalAmt = msSum > 0 ? msSum : Number(app.paymentPlan?.totalAmount || 0);
    const paidMilestones = milestones.filter(
      (m) => m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed"
    );
    const paidAmt = paidMilestones.reduce(
      (acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0),
      0
    );
    const isFullyPaid = milestones.length > 0 && paidMilestones.length === milestones.length;
    const isPartiallyPaid = paidMilestones.length > 0 && !isFullyPaid;
    const isDue = totalAmt > paidAmt;

    if (statusFilter === "Fully Paid" && !isFullyPaid) return false;
    if (statusFilter === "Partially Paid" && !isPartiallyPaid) return false;
    if (statusFilter === "Due" && !isDue) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = app.candidateName?.toLowerCase().includes(q);
      const matchProj = app.projectName?.toLowerCase().includes(q);
      const matchVendor = String(app.vendorId || "").toLowerCase().includes(q);
      if (!matchName && !matchProj && !matchVendor) return false;
    }

    return true;
  });

  const toggleExpand = (id) => {
    setExpandedAppIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleQuickStatusChange = async (appId, milestoneId, newStatus) => {
    try {
      setActionBusyKey(`pay_${appId}_${milestoneId}`);
      await crmVendorService.quickUpdateMilestoneStatus(appId, milestoneId, newStatus);
      await loadData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setActionBusyKey("");
    }
  };

  const handleApproveSubmittedPayment = async (app, milestoneId) => {
    const resolvedAppId = app.id || app.applicationId || app._id;
    try {
      setActionBusyKey(`app_${resolvedAppId}_${milestoneId}`);
      await crmVendorService.approveMilestonePayment(
        resolvedAppId,
        milestoneId,
        actorLabel,
        "Payment verified and approved",
        app
      );
      await loadData();
    } catch (err) {
      alert("Failed to approve payment: " + err.message);
    } finally {
      setActionBusyKey("");
    }
  };

  const handleRejectSubmittedPayment = async (app, milestoneId) => {
    const resolvedAppId = app.id || app.applicationId || app._id;
    const reason = window.prompt("Reason for rejecting vendor payment receipt:", "Invalid payment reference");
    if (reason === null) return;
    try {
      setActionBusyKey(`rej_${resolvedAppId}_${milestoneId}`);
      await crmVendorService.rejectMilestonePayment(resolvedAppId, milestoneId, reason.trim() || "Rejected by reviewer");
      await loadData();
    } catch (err) {
      alert("Failed to reject payment: " + err.message);
    } finally {
      setActionBusyKey("");
    }
  };

  const handleInlineStageStatus = async (app, milestoneId, stageId, newStatus) => {
    const resolvedAppId = app.id || app.applicationId || app._id;
    try {
      setActionBusyKey(`stg_${resolvedAppId}_${milestoneId}_${stageId}`);
      await crmVendorService.updateStageStatus(
        resolvedAppId,
        milestoneId,
        stageId,
        newStatus,
        `Stage marked ${newStatus} by ${actorLabel}`,
        actorLabel,
        app
      );
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to update stage status");
    } finally {
      setActionBusyKey("");
    }
  };

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Candidate Milestone Payments
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Manage milestone payments and processing stages for selected candidates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Placement Fee (Agreed)
          </span>
          <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
            ₹{totalFeeToCollect.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Across {applications.length} selected candidates
          </span>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Total Fee Released (Paid)
          </span>
          <div className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5">
            ₹{totalFeeReleased.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">
            Paid & verified across milestones
          </span>
        </div>

        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
            Remaining Pending Due
          </span>
          <div className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
            ₹{totalRemainingPending.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Awaiting upcoming milestone completion
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["All", "Due", "Partially Paid", "Fully Paid"].map((tab) => {
            const count = applications.filter((app) => {
              const ms = resolveMilestones(app);
              const msSum = ms.reduce((acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0), 0);
              const tAmt = msSum > 0 ? msSum : Number(app.paymentPlan?.totalAmount || 0);
              const pMs = ms.filter(
                (m) => m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed"
              );
              const pAmt = pMs.reduce(
                (acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0),
                0
              );
              const isFull = ms.length > 0 && pMs.length === ms.length;
              const isPartial = pMs.length > 0 && !isFull;
              const isD = tAmt > pAmt;

              if (tab === "All") return true;
              if (tab === "Due") return isD;
              if (tab === "Partially Paid") return isPartial;
              if (tab === "Fully Paid") return isFull;
              return true;
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === tab
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search candidate, project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading milestone accounts...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Sliders className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No candidate placements found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Select another filter tab or clear search to inspect candidate fee milestones.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-[10px] sm:px-6">Candidate & Project</th>
                  <th className="py-2 px-3 text-[10px]">Placement Fee & Balance</th>
                  <th className="py-2 px-3 text-[10px]">Milestones Breakdown</th>
                  <th className="py-2 px-3 text-[10px]">Payment Status</th>
                  <th className="py-2 px-3 text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => {
                  const resolvedAppId = app.id || app.applicationId || app._id;
                  const milestones = resolveMilestones(app);
                  const msSum = milestones.reduce(
                    (acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0),
                    0
                  );
                  const totalAmt = msSum > 0 ? msSum : Number(app.paymentPlan?.totalAmount || 0);
                  const paidMilestones = milestones.filter(
                    (m) => m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed"
                  );
                  const paidAmt = paidMilestones.reduce(
                    (acc, m) => acc + Number(m.paymentAmount ?? m.amount ?? 0),
                    0
                  );
                  const balanceAmt = Math.max(0, totalAmt - paidAmt);
                  const percentPaid =
                    totalAmt > 0 ? Math.round((paidAmt / totalAmt) * 100) : 0;
                  const isFullyPaid =
                    milestones.length > 0 && paidMilestones.length === milestones.length;
                  const isPartiallyPaid = paidMilestones.length > 0 && !isFullyPaid;
                  const hasSubmittedReceipt = milestones.some(
                    (m) =>
                      m.status === "Submitted" ||
                      m.paymentStatus === "Submitted" ||
                      m.paymentStatus === "Pending Verification"
                  );
                  const isExpanded = expandedAppIds.includes(resolvedAppId);

                  return (
                    <Fragment key={resolvedAppId}>
                      <tr className="hover:bg-slate-50/70 transition">
                        {}
                        <td className="py-1.5 px-3 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm border border-slate-200 shrink-0">
                              {app.candidateName?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-sm">
                                {app.candidateName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {app.projectName} • {app.vendorName || app.vendorId || "VND"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {}
                        <td className="py-1.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            ₹{totalAmt.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <span className="text-emerald-700 font-medium">
                              Paid: ₹{paidAmt.toLocaleString()}
                            </span>
                            {balanceAmt > 0 && (
                              <span className="text-slate-600 font-medium ml-1.5">
                                • Due: ₹{balanceAmt.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {}
                        <td className="py-1.5 px-3">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                            {milestones.map((m, mIdx) => {
                              const isPaid =
                                m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed";
                              const isSub =
                                m.status === "Submitted" || m.paymentStatus === "Submitted" || m.paymentStatus === "Pending Verification";
                              const mAmt = Number(m.paymentAmount ?? m.amount ?? 0);

                              return (
                                <span
                                  key={m.id || mIdx}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                                    isPaid
                                      ? "bg-slate-50 text-emerald-800 border-emerald-200"
                                      : isSub
                                      ? "bg-slate-50 text-slate-800 border-slate-300"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                  title={`${m.name}: ₹${mAmt.toLocaleString()} (${
                                    isPaid ? "Paid" : isSub ? "Submitted" : "Pending"
                                  })`}
                                >
                                  {isPaid ? (
                                    <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                                  ) : (
                                    <Clock size={11} className="text-slate-400 shrink-0" />
                                  )}
                                  <span>M{mIdx + 1}:</span>
                                  <span className="font-semibold">₹{mAmt.toLocaleString()}</span>
                                </span>
                              );
                            })}
                          </div>

                          {}
                          <div className="flex items-center gap-2 mt-2 w-48">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">
                              {percentPaid}% ({paidMilestones.length}/{milestones.length})
                            </span>
                          </div>
                        </td>

                        {}
                        <td className="py-1.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                              isFullyPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : hasSubmittedReceipt
                                ? "bg-indigo-100 text-indigo-800"
                                : isPartiallyPaid
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isFullyPaid
                              ? "Fully Paid"
                              : hasSubmittedReceipt
                              ? "Receipt Submitted"
                              : isPartiallyPaid
                              ? `Partially Paid (${paidMilestones.length}/${milestones.length})`
                              : "Payment Due"}
                          </span>
                        </td>

                        {}
                        <td className="py-1.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/admin/vendor/milestones-manage?appId=${resolvedAppId}`}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Manage stages and milestones for candidate"
                            >
                              <Sliders size={12} />
                              <span>Manage Stages</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleExpand(resolvedAppId)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                              title={isExpanded ? "Hide Details" : "View Breakdown"}
                            >
                              <span>{isExpanded ? "Hide" : "Details"}</span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={5} className="p-4 sm:px-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-5">
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-emerald-600" />
                                    <span>1. Milestone Payments &amp; Receipt Approval — {app.candidateName}</span>
                                  </h4>
                                  <span className="text-xs font-bold text-slate-500">
                                    Total: ₹{totalAmt.toLocaleString()} • Paid: ₹{paidAmt.toLocaleString()} • Due: ₹{balanceAmt.toLocaleString()}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {milestones.map((m, mIdx) => {
                                    const isPaid =
                                      m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed";
                                    const isSub =
                                      m.status === "Submitted" || m.paymentStatus === "Submitted" || m.paymentStatus === "Pending Verification";
                                    const mAmt = Number(m.paymentAmount ?? m.amount ?? 0);

                                    return (
                                      <div
                                        key={m.id || mIdx}
                                        className={`p-3 rounded-xl border ${
                                          isPaid
                                            ? "bg-emerald-50/40 border-emerald-200"
                                            : isSub
                                            ? "bg-amber-50/50 border-amber-300"
                                            : "bg-slate-50 border-slate-200"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5 gap-1">
                                          <span className="font-bold text-slate-700">Milestone {mIdx + 1}</span>
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                              isPaid
                                                ? "bg-emerald-100 text-emerald-800"
                                                : isSub
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-slate-200 text-slate-700"
                                            }`}
                                          >
                                            {isPaid ? "Paid" : isSub ? "Pending Verification" : "Payment Due"}
                                          </span>
                                        </div>
                                        <h5 className="font-bold text-slate-900 text-xs truncate">
                                          {m.name}
                                        </h5>
                                        <div className="text-sm font-bold text-slate-900 mt-1">
                                          ₹{mAmt.toLocaleString()}
                                        </div>
                                        {m.paymentRef && (
                                          <p className="text-[10px] text-slate-600 font-mono mt-1 truncate bg-white px-1.5 py-0.5 rounded border border-slate-200" title={m.paymentRef}>
                                            {m.paymentRef}
                                          </p>
                                        )}

                                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                                          {isPaid ? (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => window.open(`/invoice/${resolvedAppId}/${m.id}`, "_blank")}
                                                className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                                              >
                                                <Receipt size={11} />
                                                <span>Invoice / Receipt</span>
                                              </button>
                                              <button
                                                type="button"
                                                disabled={Boolean(actionBusyKey)}
                                                onClick={() => handleQuickStatusChange(resolvedAppId, m.id, "Pending")}
                                                className="py-1 px-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-[10px] font-semibold cursor-pointer transition"
                                              >
                                                Reset
                                              </button>
                                            </>
                                          ) : isSub ? (
                                            <>
                                              <button
                                                type="button"
                                                disabled={Boolean(actionBusyKey)}
                                                onClick={() => handleApproveSubmittedPayment(app, m.id)}
                                                className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs disabled:opacity-50"
                                              >
                                                <CheckCircle2 size={11} />
                                                <span>Approve Payment</span>
                                              </button>
                                              <button
                                                type="button"
                                                disabled={Boolean(actionBusyKey)}
                                                onClick={() => handleRejectSubmittedPayment(app, m.id)}
                                                className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition disabled:opacity-50"
                                              >
                                                <XCircle size={11} />
                                                <span>Reject</span>
                                              </button>
                                            </>
                                          ) : (
                                            <button
                                              type="button"
                                              disabled={Boolean(actionBusyKey)}
                                              onClick={() => handleQuickStatusChange(resolvedAppId, m.id, "Paid")}
                                              className="w-full py-1 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs disabled:opacity-50"
                                            >
                                              <CheckCircle2 size={11} />
                                              <span>Approve / Mark Paid</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="pt-4 border-t border-slate-200 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers size={14} className="text-indigo-600" />
                                    <span>2. Processing Stages Update</span>
                                  </h4>
                                  <Link
                                    to={`/admin/vendor/milestones-manage?appId=${resolvedAppId}`}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold inline-flex items-center gap-1 transition"
                                  >
                                    <Sliders size={11} />
                                    <span>Open Full Stage Editor</span>
                                  </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {milestones.map((m, mIdx) => {
                                    const isPaid =
                                      m.status === "Paid" || m.paymentStatus === "Approved" || m.status === "Completed";
                                    const mAmt = Number(m.paymentAmount ?? m.amount ?? 0);
                                    const canUpdate = isPaid || mAmt === 0;
                                    const stages = Array.isArray(m.stages) ? m.stages : [];

                                    return (
                                      <div
                                        key={m.id || mIdx}
                                        className={`p-3 rounded-xl border ${
                                          canUpdate ? "bg-slate-50/70 border-slate-200" : "bg-slate-100/70 border-slate-200 opacity-75"
                                        } space-y-2`}
                                      >
                                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-1.5">
                                          <span className="text-[11px] font-bold text-slate-800 truncate">
                                            M{mIdx + 1}: {m.name}
                                          </span>
                                          {!canUpdate && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                                              <Lock size={10} />
                                              <span>Locked</span>
                                            </span>
                                          )}
                                        </div>

                                        {stages.length === 0 ? (
                                          <p className="text-[10px] text-slate-400">No stages configured.</p>
                                        ) : (
                                          <div className="space-y-1.5">
                                            {stages.map((stg, sIdx) => {
                                              const isDone = stg.status === "Completed";
                                              const isBusy = actionBusyKey === `stg_${resolvedAppId}_${m.id}_${stg.id}`;
                                              return (
                                                <div
                                                  key={stg.id || sIdx}
                                                  className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                                                >
                                                  <span className={`font-medium truncate ${isDone ? "text-emerald-800 font-bold" : "text-slate-700"}`}>
                                                    {sIdx + 1}. {stg.name}
                                                  </span>
                                                  {canUpdate ? (
                                                    <select
                                                      disabled={Boolean(actionBusyKey)}
                                                      value={stg.status || "Pending"}
                                                      onChange={(e) => handleInlineStageStatus(app, m.id, stg.id, e.target.value)}
                                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer outline-none ${
                                                        isDone
                                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                          : stg.status === "In Progress"
                                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                                          : "bg-slate-50 text-slate-600 border-slate-200"
                                                      }`}
                                                    >
                                                      <option value="Pending">Pending</option>
                                                      <option value="In Progress">In Progress</option>
                                                      <option value="Completed">{isBusy ? "Saving..." : "Completed"}</option>
                                                    </select>
                                                  ) : (
                                                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                                                      Locked
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
