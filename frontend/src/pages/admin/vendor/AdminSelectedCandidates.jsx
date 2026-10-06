import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  UserCheck,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  Building2,
  ExternalLink,
  Sliders,
  Plus,
  Trash2,
  DollarSign,
  Edit,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminSelectedCandidates() {
  const [selectedApps, setSelectedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Milestone Edit Modal State
  const [milestoneModalApp, setMilestoneModalApp] = useState(null);
  const [totalAmount, setTotalAmount] = useState(40000);
  const [milestonesList, setMilestonesList] = useState([]);

  useEffect(() => {
    loadSelected();
  }, []);

  const loadSelected = async () => {
    try {
      setLoading(true);
      const data = await crmVendorService.getApplications();
      const filtered = (data || []).filter((a) => a.status === "Selected" || a.status === "Completed");
      setSelectedApps(filtered);
    } catch (err) {
      console.error("Failed to load selected candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMilestoneModal = (app) => {
    setMilestoneModalApp(app);
    const plan = app.paymentPlan || {
      totalAmount: 40000,
      milestones: [
        { id: "M1", name: "Milestone 1 - Selection", percentage: 25, amount: 10000, dueDate: "2026-09-20", status: "Paid" },
        { id: "M2", name: "Milestone 2 - GAMCA Medical", percentage: 25, amount: 10000, dueDate: "2026-09-30", status: "Due" },
        { id: "M3", name: "Milestone 3 - Visa Stamping", percentage: 25, amount: 10000, dueDate: "2026-10-15", status: "Pending" },
        { id: "M4", name: "Milestone 4 - On-Site Deployment", percentage: 25, amount: 10000, dueDate: "2026-10-31", status: "Pending" },
      ],
    };

    setTotalAmount(plan.totalAmount || 40000);
    setMilestonesList(plan.milestones || []);
  };

  const handleAddMilestoneRow = () => {
    const nextIdx = milestonesList.length + 1;
    const newM = {
      id: `M${nextIdx}`,
      name: `Milestone ${nextIdx} - Custom Stage`,
      percentage: 10,
      amount: Math.round(totalAmount * 0.1),
      dueDate: "",
      status: "Pending",
    };
    setMilestonesList([...milestonesList, newM]);
  };

  const handleRemoveMilestoneRow = (idx) => {
    const updated = milestonesList.filter((_, i) => i !== idx);
    setMilestonesList(updated);
  };

  const handleMilestoneChange = (idx, field, value) => {
    const updated = [...milestonesList];
    updated[idx] = { ...updated[idx], [field]: value };

    if (field === "percentage") {
      const pct = Number(value) || 0;
      updated[idx].amount = Math.round((totalAmount * pct) / 100);
    } else if (field === "amount") {
      const amt = Number(value) || 0;
      updated[idx].percentage = totalAmount > 0 ? Math.round((amt / totalAmount) * 100) : 0;
    }

    setMilestonesList(updated);
  };

  const handleSaveMilestones = async () => {
    if (!milestoneModalApp) return;
    try {
      await crmVendorService.overrideMilestones(
        milestoneModalApp.id,
        totalAmount,
        milestonesList
      );
      alert(`Milestone Payment Plan updated for ${milestoneModalApp.candidateName}!`);
      setMilestoneModalApp(null);
      loadSelected();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = selectedApps.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.candidateName?.toLowerCase().includes(q) ||
      app.projectName?.toLowerCase().includes(q) ||
      app.clientName?.toLowerCase().includes(q) ||
      app.vendorId?.toLowerCase().includes(q) ||
      app.position?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Selected Candidates & Milestone Management</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage client-selected candidates, customize default project milestone payments, and track deployment progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
            Total Selected: {selectedApps.length}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter selected candidates by candidate, project, role..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
        />
      </div>

      {/* Selected Candidates Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading selected candidates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No selected candidates</h3>
          <p className="text-xs text-slate-500 mt-1">Candidates marked as Selected will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5">Candidate Name</th>
                  <th className="py-3.5 px-4">Vendor Partner</th>
                  <th className="py-3.5 px-4">Client Company</th>
                  <th className="py-3.5 px-4">Project Name</th>
                  <th className="py-3.5 px-4">Position</th>
                  <th className="py-3.5 px-4">Processing Stage</th>
                  <th className="py-3.5 px-4">Milestones & Payments</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => {
                  const stageIdx = app.processing?.currentStageIndex ?? 0;
                  const stageName = app.processing?.stages?.[stageIdx]?.name || "Medical";
                  const milestones = app.paymentPlan?.milestones || [];
                  const paidCount = milestones.filter((m) => m.status === "Paid").length;
                  const totalCount = milestones.length || 4;
                  const planTotal = app.paymentPlan?.totalAmount || 40000;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-4 sm:px-5 font-black text-slate-900">
                        {app.candidateName}
                        <span className="block font-mono text-[10px] text-blue-600 font-normal">{app.id}</span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-700">{app.vendorId}</td>
                      <td className="py-4 px-4 text-slate-800 font-medium">{app.clientName}</td>
                      <td className="py-4 px-4 font-bold text-blue-700">{app.projectName}</td>
                      <td className="py-4 px-4 font-semibold text-indigo-700">{app.position}</td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {stageName} ({stageIdx + 1}/8)
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {paidCount}/{totalCount} Paid (₹{planTotal.toLocaleString()})
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenMilestoneModal(app)}
                            className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            title="Set/Edit custom milestone payments for this candidate"
                          >
                            <Sliders size={13} />
                            <span>Milestones</span>
                          </button>

                          <Link
                            to={`/admin/vendor/processing?appId=${app.id}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1"
                          >
                            <span>Processing</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
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

      {/* MANAGE / EDIT MILESTONES MODAL */}
      {milestoneModalApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Milestone Payment Plan Configurator
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {milestoneModalApp.candidateName} • {milestoneModalApp.projectName}
                </h3>
              </div>
              <button
                onClick={() => setMilestoneModalApp(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Total Payment Amount Header */}
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Placement Fee Amount</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-bold text-slate-500">INR (₹)</span>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                    className="w-32 px-2.5 py-1 rounded-lg border border-slate-300 font-black text-slate-900 text-sm focus:border-blue-600 bg-white"
                  />
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Default Project Milestones</span>
                <span className="font-bold text-blue-900 text-xs">4 Standard Milestones (Selection, GAMCA, Visa, Mobilization)</span>
              </div>
            </div>

            {/* Milestone List Editor */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-xs">Custom Milestone Breakdown</h4>
                <button
                  type="button"
                  onClick={handleAddMilestoneRow}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Milestone</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {milestonesList.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    <div className="sm:col-span-4">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Milestone Name</label>
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => handleMilestoneChange(idx, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Share (%)</label>
                      <input
                        type="number"
                        value={m.percentage}
                        onChange={(e) => handleMilestoneChange(idx, "percentage", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Amount (₹)</label>
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => handleMilestoneChange(idx, "amount", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Status</label>
                      <select
                        value={m.status}
                        onChange={(e) => handleMilestoneChange(idx, "status", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Due">Due</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1 text-right pt-3 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestoneRow(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Remove Milestone"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMilestoneModalApp(null)}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMilestones}
                className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Milestone Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
