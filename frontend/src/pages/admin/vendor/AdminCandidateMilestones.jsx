import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserCheck, Sliders, Plus, Trash2, ChevronRight, ArrowLeft, Clock, Lock } from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminCandidateMilestones() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appId = searchParams.get("appId");

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [totalAmount, setTotalAmount] = useState(40000);
  const [milestonesList, setMilestonesList] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [appId]);

  const loadData = async () => {
    if (!appId) return;
    try {
      setLoading(true);
      const apps = await crmVendorService.getApplications();
      const app = apps.find(a => String(a.id) === String(appId));
      if (app) {
        setApplication(app);
        
        const plan = app.paymentPlan || {
          totalAmount: 40000,
          milestones: [
            { id: "M1", name: "Milestone 1 - Selection", percentage: 25, amount: 10000, dueDate: "2026-09-20", status: "Paid", stages: [{ id: "s1", name: "Document Verification", status: "Completed" }, { id: "s2", name: "Client Selection", status: "Completed" }] },
            { id: "M2", name: "Milestone 2 - GAMCA Medical", percentage: 25, amount: 10000, dueDate: "2026-09-30", status: "Due", stages: [{ id: "s3", name: "Medical Check", status: "Pending" }, { id: "s4", name: "GAMCA Clearance", status: "Pending" }] },
            { id: "M3", name: "Milestone 3 - Visa Stamping", percentage: 25, amount: 10000, dueDate: "2026-10-15", status: "Pending", stages: [{ id: "s5", name: "Visa Submission", status: "Pending" }, { id: "s6", name: "Stamping Approved", status: "Pending" }] },
            { id: "M4", name: "Milestone 4 - On-Site Deployment", percentage: 25, amount: 10000, dueDate: "2026-10-31", status: "Pending", stages: [{ id: "s7", name: "Flight Ticketing", status: "Pending" }, { id: "s8", name: "Arrival & Induction", status: "Pending" }] },
          ],
        };

        setTotalAmount(plan.totalAmount || 40000);
        setMilestonesList(plan.milestones || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
      stages: [{ id: `s${Date.now()}-1`, name: "New Process", status: "Pending" }],
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

  const handleAddStage = (idx) => {
    const updated = [...milestonesList];
    if (!updated[idx].stages) updated[idx].stages = [];
    updated[idx].stages.push({ id: `s${Date.now()}`, name: "", status: "Pending" });
    setMilestonesList(updated);
  };

  const handleRemoveStage = (mIdx, sId) => {
    const updated = [...milestonesList];
    updated[mIdx].stages = updated[mIdx].stages.filter((s) => s.id !== sId);
    setMilestonesList(updated);
  };

  const handleStageFieldChange = (mIdx, sId, field, value) => {
    const updated = [...milestonesList];
    updated[mIdx].stages = updated[mIdx].stages.map((s) => (s.id === sId ? { ...s, [field]: value } : s));
    setMilestonesList(updated);
  };

  const handleSaveMilestones = async () => {
    if (!application) return;
    setSaveLoading(true);
    try {
      await crmVendorService.overrideMilestones(
        application.id,
        totalAmount,
        milestonesList
      );
      alert(`Milestone Payment Plan & Processes updated successfully!`);
      navigate(-1);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center max-w-4xl mx-auto">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Loading candidate milestones...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-12 text-center max-w-4xl mx-auto">
        <p className="text-sm font-bold text-slate-800">Application not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline text-xs">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Candidates List
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-blue-600" /> Milestones & Processing Configurator
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage milestones, payments, and linked processes for <strong>{application.candidateName}</strong> on <strong>{application.projectName}</strong>.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Total Payment Amount Header */}
        <div className="p-5 bg-blue-50/70 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Placement Fee Amount</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-black text-slate-500 text-base">₹</span>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                className="w-40 px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="text-right bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Active Milestones</span>
            <span className="font-black text-blue-800 text-base">{milestonesList.length} Stages</span>
          </div>
        </div>

        {/* Milestone List Editor */}
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2">
            <h4 className="font-bold text-slate-900 text-sm">Milestone Breakdown</h4>
            <button
              type="button"
              onClick={handleAddMilestoneRow}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Milestone</span>
            </button>
          </div>

          <div className="space-y-4">
            {milestonesList.map((m, idx) => (
              <div
                key={m.id || idx}
                className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                <div className="p-4 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Milestone Name</label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => handleMilestoneChange(idx, "name", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Share (%)</label>
                    <input
                      type="number"
                      value={m.percentage}
                      onChange={(e) => handleMilestoneChange(idx, "percentage", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={m.amount}
                      onChange={(e) => handleMilestoneChange(idx, "amount", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Status</label>
                    <select
                      value={m.status}
                      onChange={(e) => handleMilestoneChange(idx, "status", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Due">Due</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestoneRow(idx)}
                      className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl cursor-pointer transition-colors"
                      title="Remove Milestone"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="px-4 py-3 bg-white flex flex-wrap gap-2 items-center border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-2 flex items-center gap-1">
                    <Clock size={12} /> Linked Processes:
                  </span>
                  
                  {(m.stages || []).map((stage, sIdx) => {
                    const isLocked = m.status !== "Paid";
                    return (
                      <div key={stage.id} className={`flex items-center gap-1 border rounded-lg px-2 py-1 group ${isLocked ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/50 border-blue-100'}`}>
                        <span className="text-[10px] font-black text-slate-400">{sIdx + 1}.</span>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => handleStageFieldChange(idx, stage.id, "name", e.target.value)}
                          placeholder="Process Name"
                          className="w-28 sm:w-36 bg-transparent text-xs font-bold text-slate-800 focus:outline-none focus:ring-0 px-1 py-0.5"
                        />
                        
                        {isLocked ? (
                          <div className="flex items-center gap-1 ml-1 px-1.5 py-0.5 bg-slate-200/50 rounded text-slate-400 text-[10px] font-bold" title="Payment must be 'Paid' to start this process">
                            <Lock size={10} /> Pending Payment
                          </div>
                        ) : (
                          <select
                            value={stage.status || "Pending"}
                            onChange={(e) => handleStageFieldChange(idx, stage.id, "status", e.target.value)}
                            className={`bg-white border text-[10px] font-bold rounded px-1.5 py-0.5 focus:outline-none ml-1 cursor-pointer transition-colors ${stage.status === 'Completed' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                          </select>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(idx, stage.id)}
                          className="text-slate-300 hover:text-rose-500 rounded transition-colors ml-1"
                        >
                          <Trash2 size={13} />
                        </button>
                        {sIdx < (m.stages || []).length - 1 && (
                          <ChevronRight size={14} className="text-slate-300 ml-1 hidden sm:block" />
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleAddStage(idx)}
                    className="ml-2 shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={12} /> Add Process
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveMilestones}
            disabled={saveLoading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {saveLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save Milestones & Processes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
