import React, { useState, useEffect } from "react";
import {
  Sliders,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Building2,
  User,
  Search,
  CreditCard,
  IndianRupee,
  Layers,
  ChevronDown,
  ChevronUp,
  Receipt,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminMilestonesList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAppIds, setExpandedAppIds] = useState([]);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [templateName, setTemplateName] = useState("Standard Recruitment 4-Milestone");
  const [templateTotal, setTemplateTotal] = useState(40000);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await crmVendorService.getApplications();
      const selectedApps = (data || []).filter(
        (a) =>
          (a.status === "Selected" || a.status === "Completed" || a.paymentPlan) &&
          (a.paymentPlan || a.processMilestones)
      );
      setApplications(selectedApps);
    } catch (err) {
      console.error("Failed to load milestone data:", err);
    } finally {
      setLoading(false);
    }
  };

  let totalFeeToCollect = 0;
  let totalFeeReleased = 0;

  applications.forEach((app) => {
    const milestones =
      app.processMilestones?.length > 0
        ? app.processMilestones
        : app.paymentPlan?.milestones || [];
    const total =
      Number(app.paymentPlan?.totalAmount) ||
      milestones.reduce((acc, m) => acc + (Number(m.paymentAmount || m.amount) || 0), 0) ||
      40000;
    totalFeeToCollect += total;

    milestones.forEach((m) => {
      if (m.status === "Paid" || m.paymentStatus === "Approved") {
        totalFeeReleased += Number(m.paymentAmount || m.amount) || 0;
      }
    });
  });

  const totalRemainingPending = Math.max(0, totalFeeToCollect - totalFeeReleased);

  const filteredApps = applications.filter((app) => {
    const milestones =
      app.processMilestones?.length > 0
        ? app.processMilestones
        : app.paymentPlan?.milestones || [];
    const totalAmt =
      Number(app.paymentPlan?.totalAmount) ||
      milestones.reduce((acc, m) => acc + (Number(m.paymentAmount || m.amount) || 0), 0) ||
      40000;
    const paidMilestones = milestones.filter(
      (m) => m.status === "Paid" || m.paymentStatus === "Approved"
    );
    const paidAmt = paidMilestones.reduce(
      (acc, m) => acc + (Number(m.paymentAmount || m.amount) || 0),
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
      await crmVendorService.quickUpdateMilestoneStatus(appId, milestoneId, newStatus);
      await loadData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleApplyBulkTemplate = async () => {
    try {
      const res = await crmVendorService.applyBulkTemplate({
        totalAmount: Number(templateTotal),
        templateName,
      });
      setShowBulkModal(false);
      setBulkSuccessMsg(
        `Successfully applied "${templateName}" (₹${Number(
          templateTotal
        ).toLocaleString()}) to ${res.updatedCount} selected candidate applications.`
      );
      setTimeout(() => setBulkSuccessMsg(""), 5000);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto font-sans">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-2.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Milestone Payment Management
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Track and manage recruitment milestone stages, fee disbursements, and payment settlements per candidate.
          </p>
        </div>

        
      </div>

      {}
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

      {bulkSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{bulkSuccessMsg}</span>
        </div>
      )}

      {}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["All", "Due", "Partially Paid", "Fully Paid"].map((tab) => {
            const count = applications.filter((app) => {
              const ms =
                app.processMilestones?.length > 0
                  ? app.processMilestones
                  : app.paymentPlan?.milestones || [];
              const tAmt =
                Number(app.paymentPlan?.totalAmount) ||
                ms.reduce((acc, m) => acc + (Number(m.paymentAmount || m.amount) || 0), 0) ||
                40000;
              const pMs = ms.filter(
                (m) => m.status === "Paid" || m.paymentStatus === "Approved"
              );
              const pAmt = pMs.reduce(
                (acc, m) => acc + (Number(m.paymentAmount || m.amount) || 0),
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
                  const milestones =
                    app.processMilestones?.length > 0
                      ? app.processMilestones
                      : app.paymentPlan?.milestones || [];
                  const totalAmt =
                    Number(app.paymentPlan?.totalAmount) ||
                    milestones.reduce(
                      (acc, m) => acc + (Number(m.paymentAmount || m.amount) || 0),
                      0
                    ) ||
                    40000;
                  const paidMilestones = milestones.filter(
                    (m) => m.status === "Paid" || m.paymentStatus === "Approved"
                  );
                  const paidAmt = paidMilestones.reduce(
                    (acc, m) => acc + (Number(m.paymentAmount || m.amount) || 0),
                    0
                  );
                  const balanceAmt = Math.max(0, totalAmt - paidAmt);
                  const percentPaid =
                    totalAmt > 0 ? Math.round((paidAmt / totalAmt) * 100) : 0;
                  const isFullyPaid =
                    milestones.length > 0 && paidMilestones.length === milestones.length;
                  const isPartiallyPaid = paidMilestones.length > 0 && !isFullyPaid;
                  const isExpanded = expandedAppIds.includes(app.id);

                  return (
                    <React.Fragment key={app.id}>
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
                                m.status === "Paid" || m.paymentStatus === "Approved";
                              const isSub =
                                m.status === "Submitted" || m.paymentStatus === "Submitted";
                              const mAmt = Number(m.paymentAmount || m.amount || 0);

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
                            className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                              isFullyPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : isPartiallyPaid
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isFullyPaid
                              ? "Fully Paid"
                              : isPartiallyPaid
                              ? `Partially Paid (${paidMilestones.length}/${milestones.length})`
                              : "Payment Due"}
                          </span>
                        </td>

                        {}
                        <td className="py-1.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleExpand(app.id)}
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
                            <div className="bg-white rounded-xl border border-slate-200 p-2.5 space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                  Itemized Milestones for {app.candidateName}
                                </h4>
                                <span className="text-xs font-bold text-slate-500">
                                  Total: ₹{totalAmt.toLocaleString()} • Paid: ₹{paidAmt.toLocaleString()} • Due: ₹{balanceAmt.toLocaleString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {milestones.map((m, mIdx) => {
                                  const isPaid =
                                    m.status === "Paid" || m.paymentStatus === "Approved";
                                  const isSub =
                                    m.status === "Submitted" || m.paymentStatus === "Submitted";
                                  const mAmt = Number(m.paymentAmount || m.amount || 0);

                                  return (
                                    <div
                                      key={m.id || mIdx}
                                      className={`p-3 rounded-xl border ${
                                        isPaid
                                          ? "bg-emerald-50/40 border-emerald-200"
                                          : isSub
                                          ? "bg-amber-50/40 border-amber-200"
                                          : "bg-slate-50 border-slate-200"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5 gap-1">
                                        <span className="font-extrabold text-slate-700">Milestone {mIdx + 1}</span>
                                        <select
                                          value={isPaid ? "Paid" : "Pending"}
                                          onChange={(e) => handleQuickStatusChange(app.id, m.id, e.target.value)}
                                          className={`px-2 py-0.5 rounded-lg font-black text-[10px] border cursor-pointer focus:outline-none transition ${
                                            isPaid
                                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                              : "bg-amber-100 text-amber-800 border-amber-300"
                                          }`}
                                          title="Quick Status Update (Pending or Paid)"
                                        >
                                          <option value="Pending">Pending</option>
                                          <option value="Paid">Paid</option>
                                        </select>
                                      </div>
                                      <h5 className="font-extrabold text-slate-900 text-xs truncate">
                                        {m.name}
                                      </h5>
                                      <div className="text-sm font-black text-slate-900 mt-1">
                                        ₹{mAmt.toLocaleString()}
                                      </div>
                                      {m.paymentRef && (
                                        <p className="text-[10px] text-slate-500 font-mono mt-1 truncate" title={m.paymentRef}>
                                          {m.paymentRef}
                                        </p>
                                      )}

                                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                                        {isPaid ? (
                                          <button
                                            type="button"
                                            onClick={() => window.open(`/invoice/${app.id}/${m.id}`, '_blank')}
                                            className="w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                                          >
                                            <Receipt size={11} />
                                            <span>Invoice / Receipt</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleQuickStatusChange(app.id, m.id, "Paid")}
                                            className="w-full py-1 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                                          >
                                            <CheckCircle2 size={11} />
                                            <span>Mark Paid</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Bulk Milestone Template</h3>
            <p className="text-xs text-slate-500">
              Apply a standard recruitment milestone model to all selected candidate applications.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Template Preset:
                </label>
                <select
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                >
                  <option value="Standard Recruitment 4-Milestone">
                    Standard Recruitment (4-Milestone: 25% each)
                  </option>
                  <option value="3-Phase Technical Deployment">
                    3-Phase Deployment (30% / 40% / 30%)
                  </option>
                  <option value="Express Placement (2-Milestone)">
                    Express Placement (2-Milestone: 50% / 50%)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Agreed Placement Fee (₹):
                </label>
                <input
                  type="number"
                  value={templateTotal}
                  onChange={(e) => setTemplateTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkTemplate}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Apply to All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
