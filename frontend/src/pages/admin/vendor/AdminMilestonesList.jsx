import React, { useState, useEffect } from "react";
import {
  Sliders,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  SlidersHorizontal,
  Check,
  Building2,
  User,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminMilestonesList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  // Bulk Template Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [templateName, setTemplateName] = useState("Standard Recruitment 4-Milestone");
  const [templateTotal, setTemplateTotal] = useState(40000);
  const [bulkScope, setBulkScope] = useState("all"); // "all", "project", "requirement"
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState("");

  // Individual Customization Modal
  const [customAppModal, setCustomAppModal] = useState(null);
  const [agreedPayment, setAgreedPayment] = useState(40000);
  const [milestonesList, setMilestonesList] = useState([]);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await crmVendorService.getApplications();
      // Milestone management applies only to selected candidates with payment plans
      const selectedApps = (data || []).filter(
        (a) => (a.status === "Selected" || a.status === "Completed" || a.paymentPlan) && a.paymentPlan
      );
      setApplications(selectedApps);
    } catch (err) {
      console.error("Failed to load milestone data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compute Overall Financial Summaries (Only Selected Candidates)
  let totalFeeToCollect = 0;
  let totalFeeReleased = 0;

  applications.forEach((app) => {
    const total = Number(app.paymentPlan?.totalAmount || 40000);
    totalFeeToCollect += total;
    const milestones = app.paymentPlan?.milestones || [];
    milestones.forEach((m) => {
      if (m.status === "Paid") {
        totalFeeReleased += Number(m.amount) || 0;
      }
    });
  });

  const totalRemainingPending = Math.max(0, totalFeeToCollect - totalFeeReleased);

  // Flatten milestones across apps
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
    if (statusFilter !== "All" && m.status !== statusFilter) return false;
    return true;
  });

  const handleApplyBulkTemplate = async () => {
    try {
      const res = await crmVendorService.applyBulkTemplate({
        totalAmount: Number(templateTotal),
        templateName,
      });
      setShowBulkModal(false);
      setBulkSuccessMsg(
        `Successfully applied "${templateName}" (₹${Number(templateTotal).toLocaleString()}) to ${res.updatedCount} selected candidate applications.`
      );
      setTimeout(() => setBulkSuccessMsg(""), 5000);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openCustomModal = (app) => {
    setCustomAppModal(app);
    setAgreedPayment(app.paymentPlan?.totalAmount || 40000);
    setMilestonesList(
      app.paymentPlan?.milestones
        ? JSON.parse(JSON.stringify(app.paymentPlan.milestones))
        : []
    );
    setValidationError("");
  };

  const handleAddMilestone = () => {
    const newId = `M${milestonesList.length + 1}`;
    setMilestonesList([
      ...milestonesList,
      {
        id: newId,
        name: `Milestone ${milestonesList.length + 1}`,
        percentage: 0,
        amount: 0,
        dueDate: "",
        status: "Pending",
        paidDate: "",
        paymentRef: "",
      },
    ]);
  };

  const handleDeleteMilestone = (idx) => {
    const updated = milestonesList.filter((_, i) => i !== idx);
    setMilestonesList(updated);
  };

  const handleSaveCustomization = async () => {
    setValidationError("");
    const sum = milestonesList.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
    const target = Number(agreedPayment);

    // Strictly validate total milestone amounts equal agreed payment amount!
    if (Math.abs(sum - target) > 1) {
      setValidationError("Milestone total does not match the agreed payment amount.");
      return;
    }

    try {
      await crmVendorService.overrideMilestones(customAppModal.id, target, milestonesList);
      setCustomAppModal(null);
      loadData();
    } catch (err) {
      setValidationError(err.message);
    }
  };

  const handleMarkPaidDirect = async (appId, milestoneId) => {
    try {
      await crmVendorService.updateMilestoneStatus(
        appId,
        milestoneId,
        "Paid",
        `TXN-${Date.now().toString().slice(-6)}`
      );
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Milestone Payment Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View milestone fee breakdown for selected candidates, track total fee to collect, released amounts, and manage custom plans.
          </p>
        </div>

        <button
          onClick={() => setShowBulkModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Sliders className="w-4 h-4 text-cyan-300" />
          <span>Apply Bulk Template</span>
        </button>
      </div>

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Fee To Collect (Agreed)
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalFeeToCollect.toLocaleString()}</div>
          <span className="text-[11px] text-slate-400 font-medium">Across selected candidate placements</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Total Fee Released (Paid)
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹{totalFeeReleased.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Disbursed to vendor accounts</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Remaining Pending Release
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">₹{totalRemainingPending.toLocaleString()}</div>
          <span className="text-[11px] text-amber-700 font-medium">Awaiting upcoming milestone completion</span>
        </div>
      </div>

      {bulkSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{bulkSuccessMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {["All", "Due", "Paid", "Pending", "Overdue"].map((tab) => {
          const count = allMilestones.filter((m) => (tab === "All" ? true : m.status === tab)).length;
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                statusFilter === tab ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Milestones Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading milestone plans...</p>
        </div>
      ) : filteredMilestones.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Sliders className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No milestones match status</h3>
          <p className="text-xs text-slate-500 mt-1">Select another tab to inspect candidate fee milestones.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Candidate & Project</th>
                  <th className="py-3.5 px-4">Milestone</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Paid Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMilestones.map((m, idx) => (
                  <tr key={`${m.app.id}-${m.id}-${idx}`} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4 sm:px-6">
                      <span className="font-bold text-slate-900 block">{m.app.candidateName}</span>
                      <span className="text-[11px] text-slate-500">{m.app.projectName} • {m.app.vendorId}</span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{m.name}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">₹{Number(m.amount).toLocaleString()}</td>
                    <td className="py-4 px-4 text-slate-500 text-xs font-mono">{m.dueDate || "2026-09-30"}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        m.status === "Paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : m.status === "Due"
                          ? "bg-amber-100 text-amber-800"
                          : m.status === "Overdue"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs font-mono">{m.paidDate || "-"}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.status !== "Paid" && (
                          <button
                            onClick={() => handleMarkPaidDirect(m.app.id, m.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => openCustomModal(m.app)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          Customize
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Template Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Bulk Milestone Template</h3>
            <p className="text-xs text-slate-500">Apply standard 4-milestone fee breakdown across selected candidates.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Name:</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Fee Amount (₹):</label>
                <input
                  type="number"
                  value={templateTotal}
                  onChange={(e) => setTemplateTotal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Scope:</label>
                <select
                  value={bulkScope}
                  onChange={(e) => setBulkScope(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="all">All Selected Candidates</option>
                  <option value="project">Selected Candidates by Project</option>
                  <option value="requirement">Selected Candidates by Requirement</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <div className="flex justify-between"><span>M1 (25% Selection):</span><span className="font-bold">₹{(templateTotal * 0.25).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>M2 (25% GAMCA):</span><span className="font-bold">₹{(templateTotal * 0.25).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>M3 (25% Visa):</span><span className="font-bold">₹{(templateTotal * 0.25).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>M4 (25% Deployment):</span><span className="font-bold">₹{(templateTotal * 0.25).toLocaleString()}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkTemplate}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Customization Modal with Mandatory Sum Validation */}
      {customAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              Customize Milestones: {customAppModal.candidateName}
            </h3>

            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Agreed Payment (₹):</label>
                <input
                  type="number"
                  value={agreedPayment}
                  onChange={(e) => setAgreedPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Milestone Breakdown:</span>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                </div>

                {milestonesList.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => {
                          const updated = [...milestonesList];
                          updated[idx].name = e.target.value;
                          setMilestonesList(updated);
                        }}
                        className="flex-1 px-2.5 py-1 rounded border border-slate-300 font-semibold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(idx)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Amount (₹):</span>
                        <input
                          type="number"
                          value={m.amount}
                          onChange={(e) => {
                            const updated = [...milestonesList];
                            updated[idx].amount = Number(e.target.value);
                            setMilestonesList(updated);
                          }}
                          className="w-full px-2.5 py-1 rounded border border-slate-300 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Due Date:</span>
                        <input
                          type="date"
                          value={m.dueDate}
                          onChange={(e) => {
                            const updated = [...milestonesList];
                            updated[idx].dueDate = e.target.value;
                            setMilestonesList(updated);
                          }}
                          className="w-full px-2.5 py-1 rounded border border-slate-300 font-medium text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sum indicator */}
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs">
                <span>Sum of Milestone Amounts:</span>
                <span className="font-bold text-indigo-950">
                  ₹{milestonesList.reduce((acc, m) => acc + (Number(m.amount) || 0), 0).toLocaleString()} / ₹{Number(agreedPayment).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomAppModal(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomization}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
              >
                Validate & Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
