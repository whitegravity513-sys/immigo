import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function ConfigureMilestonesModal({ isOpen, onClose, application, onSaved }) {
  if (!isOpen || !application) return null;

  const [totalAmount, setTotalAmount] = useState(40000);
  const [milestones, setMilestones] = useState([]);
  const [saving, setSaving] = useState(false);

  // Initialize from application or generate defaults
  useEffect(() => {
    if (application) {
      if (application.paymentPlan?.milestones?.length > 0) {
        setTotalAmount(application.paymentPlan.totalAmount || 40000);
        setMilestones(
          application.paymentPlan.milestones.map((m, idx) => ({
            id: m.id || `m${idx}`,
            name: m.name || `Milestone ${idx + 1}`,
            percentage: m.percentage || Math.round(((m.amount || 10000) / (application.paymentPlan.totalAmount || 40000)) * 100),
            amount: Number(m.amount || 10000),
            status: m.status || (idx === 0 ? "Payment Required" : "Pending"),
            stages: (m.stages && m.stages.length > 0)
              ? m.stages
              : [
                  { id: `s${idx}_1`, name: "Skill & Document Clearance", status: "Locked" },
                  { id: `s${idx}_2`, name: "Processing Step", status: "Locked" },
                ],
          }))
        );
      } else {
        // Preset 3 milestones by default
        applyPreset(3, 40000);
      }
    }
  }, [application]);

  const applyPreset = (count, baseTotal = totalAmount) => {
    const total = baseTotal || 40000;
    if (count === 2) {
      setMilestones([
        {
          id: "m0",
          name: "Milestone 1: Selection & Offer Acceptance",
          percentage: 50,
          amount: Math.round(total * 0.5),
          status: "Payment Required",
          stages: [
            { id: "s0_1", name: "Trade Skill Verification & Acceptance", status: "Locked" },
            { id: "s0_2", name: "Client Offer Letter Acceptance", status: "Locked" },
          ],
        },
        {
          id: "m1",
          name: "Milestone 2: Visa Stamping & Flight Deployment",
          percentage: 50,
          amount: Math.round(total * 0.5),
          status: "Pending",
          stages: [
            { id: "s1_1", name: "Medical Check & GAMCA Fitness Clearance", status: "Locked" },
            { id: "s1_2", name: "Visa Stamping & Official Work Permit", status: "Locked" },
            { id: "s1_3", name: "Flight Ticket Booking & On-Site Mobilization", status: "Locked" },
          ],
        },
      ]);
    } else if (count === 3) {
      setMilestones([
        {
          id: "m0",
          name: "Milestone 1: Selection & Document Clearance",
          percentage: 30,
          amount: Math.round(total * 0.3),
          status: "Payment Required",
          stages: [
            { id: "s0_1", name: "Trade Skill Verification & Acceptance", status: "Locked" },
            { id: "s0_2", name: "Passport & Identity Clearance", status: "Locked" },
          ],
        },
        {
          id: "m1",
          name: "Milestone 2: Medical & Visa Processing",
          percentage: 40,
          amount: Math.round(total * 0.4),
          status: "Pending",
          stages: [
            { id: "s1_1", name: "GAMCA / Medical Fitness Test Clearance", status: "Locked" },
            { id: "s1_2", name: "Visa Stamping & Official Visa Issuance", status: "Locked" },
          ],
        },
        {
          id: "m2",
          name: "Milestone 3: Emigration & Flight Deployment",
          percentage: 30,
          amount: Math.round(total * 0.3),
          status: "Pending",
          stages: [
            { id: "s2_1", name: "Emigration (PCC / Protector) Clearance", status: "Locked" },
            { id: "s2_2", name: "Flight Ticket Booking & Mobilization", status: "Locked" },
          ],
        },
      ]);
    } else if (count === 4) {
      setMilestones([
        {
          id: "m0",
          name: "Milestone 1: Selection & Acceptance",
          percentage: 25,
          amount: Math.round(total * 0.25),
          status: "Payment Required",
          stages: [{ id: "s0_1", name: "Document Verification & Acceptance", status: "Locked" }],
        },
        {
          id: "m1",
          name: "Milestone 2: Medical Fitness Clearance",
          percentage: 25,
          amount: Math.round(total * 0.25),
          status: "Pending",
          stages: [{ id: "s1_1", name: "GAMCA Medical Test Clearance", status: "Locked" }],
        },
        {
          id: "m2",
          name: "Milestone 3: Visa Approval & Stamping",
          percentage: 25,
          amount: Math.round(total * 0.25),
          status: "Pending",
          stages: [{ id: "s2_1", name: "Visa Stamping & Work Permit Approval", status: "Locked" }],
        },
        {
          id: "m3",
          name: "Milestone 4: Deployment & Flight Mobilization",
          percentage: 25,
          amount: Math.round(total * 0.25),
          status: "Pending",
          stages: [{ id: "s3_1", name: "Flight Ticket & Arrival Induction", status: "Locked" }],
        },
      ]);
    }
  };

  const handleTotalAmountChange = (newTotal) => {
    const val = Number(newTotal) || 0;
    setTotalAmount(val);
    setMilestones((prev) =>
      prev.map((m) => ({
        ...m,
        amount: Math.round((val * (m.percentage || 0)) / 100),
      }))
    );
  };

  const handleMilestoneChange = (idx, field, value) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [field]: value };

    if (field === "percentage") {
      const pct = Number(value) || 0;
      updated[idx].amount = Math.round((totalAmount * pct) / 100);
    } else if (field === "amount") {
      const amt = Number(value) || 0;
      updated[idx].percentage = totalAmount > 0 ? Math.round((amt / totalAmount) * 100) : 0;
    }

    setMilestones(updated);
  };

  const handleAutoBalance = () => {
    if (milestones.length === 0) return;
    const currentSumWithoutLast = milestones
      .slice(0, milestones.length - 1)
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const remainder = Math.max(0, totalAmount - currentSumWithoutLast);
    const updated = [...milestones];
    const lastIdx = updated.length - 1;
    updated[lastIdx].amount = remainder;
    updated[lastIdx].percentage = totalAmount > 0 ? Math.round((remainder / totalAmount) * 100) : 0;
    setMilestones(updated);
  };

  const handleAddMilestone = () => {
    const nextIdx = milestones.length + 1;
    const currentSum = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const remaining = Math.max(0, totalAmount - currentSum);
    const defaultAmt = remaining > 0 ? remaining : Math.round(totalAmount * 0.25);
    const defaultPct = totalAmount > 0 ? Math.round((defaultAmt / totalAmount) * 100) : 25;
    const newM = {
      id: `m${Date.now()}`,
      name: `Milestone ${nextIdx}`,
      percentage: defaultPct,
      amount: defaultAmt,
      status: "Pending",
      stages: [{ id: `s${Date.now()}_1`, name: "Process Step", status: "Locked" }],
    };
    setMilestones([...milestones, newM]);
  };

  const handleRemoveMilestone = (idx) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (milestones.length === 0) {
      alert("Please configure at least 1 milestone.");
      return;
    }
    const sum = milestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
    let finalTotal = totalAmount;
    if (Math.abs(sum - totalAmount) > 0) {
      const confirmSave = window.confirm(
        `Total Placement Fee is set to ₹${Number(totalAmount).toLocaleString()}, but the sum of your milestones is ₹${sum.toLocaleString()}.\n\nDo you want to update the Total Placement Fee to ₹${sum.toLocaleString()} and save?`
      );
      if (!confirmSave) return;
      finalTotal = sum;
      setTotalAmount(sum);
    }
    setSaving(true);
    try {
      await crmVendorService.overrideMilestones(application.id, finalTotal, milestones);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to save milestones");
    } finally {
      setSaving(false);
    }
  };

  const totalCalculated = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const totalPercentage = milestones.reduce((sum, m) => sum + Number(m.percentage || 0), 0);
  const diffAmount = totalAmount - totalCalculated;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col font-sans max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-5 flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-300">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-tight">
                Candidate Selection & Milestone Plan
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Set Total Fee & Milestone Breakdown for <strong>{application.candidateName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Candidate & Project Header Banner */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate / Trade</span>
              <span className="font-black text-slate-900">{application.candidateName}</span>
              <span className="text-slate-500 font-medium ml-1.5">• {application.position || "Staff"}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Project</span>
              <span className="font-bold text-slate-800">{application.projectName}</span>
              <span className="text-blue-600 font-semibold ml-1.5">({application.country || "Overseas"})</span>
            </div>
          </div>

          {/* Total Amount Input & Presets */}
          <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-[11px] font-black uppercase text-blue-900 tracking-wider block">
                  Total Placement / Processing Amount (₹)
                </label>
                <p className="text-[10px] text-blue-700">Enter total client/placement amount to divide into milestones.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-blue-300 shadow-2xs">
                <IndianRupee size={16} className="text-blue-700" />
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  className="w-32 font-black text-slate-900 text-sm focus:outline-none"
                  placeholder="40000"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-200/60">
              <span className="text-[10px] font-bold text-blue-900">Divide Into:</span>
              <button
                type="button"
                onClick={() => applyPreset(2)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200 shadow-2xs transition cursor-pointer"
              >
                2 Milestones
              </button>
              <button
                type="button"
                onClick={() => applyPreset(3)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200 shadow-2xs transition cursor-pointer"
              >
                3 Milestones
              </button>
              <button
                type="button"
                onClick={() => applyPreset(4)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200 shadow-2xs transition cursor-pointer"
              >
                4 Milestones
              </button>
            </div>

            {/* Live Amount Balance & Validation Card */}
            <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
              diffAmount === 0 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : diffAmount > 0
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              <div className="flex items-center gap-1.5">
                {diffAmount === 0 ? (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                ) : (
                  <Clock size={15} className={diffAmount > 0 ? "text-amber-600 shrink-0" : "text-rose-600 shrink-0"} />
                )}
                <span>
                  {diffAmount === 0
                    ? `✓ Exact Match: Total fee (₹${totalAmount.toLocaleString()}) matches sum of all ${milestones.length} milestones.`
                    : diffAmount > 0
                    ? `Remaining to allocate: ₹${diffAmount.toLocaleString()} (Total Fee: ₹${totalAmount.toLocaleString()})`
                    : `Milestone sum exceeds Total Fee by ₹${Math.abs(diffAmount).toLocaleString()}`}
                </span>
              </div>
              {diffAmount !== 0 && (
                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-bold text-[10px] shadow-2xs hover:bg-slate-50 transition cursor-pointer shrink-0"
                >
                  Auto-Balance Last Milestone
                </button>
              )}
            </div>
          </div>

          {/* Milestones List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                Configured Milestones ({milestones.length})
              </span>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 flex items-center gap-1 cursor-pointer transition"
              >
                <Plus size={11} />
                <span>Add Milestone</span>
              </button>
            </div>

            {milestones.map((m, mIdx) => (
              <div
                key={m.id || mIdx}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-800 uppercase">
                        Milestone {mIdx + 1}
                      </span>
                      {mIdx === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                          Initial Payable Milestone
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => handleMilestoneChange(mIdx, "name", e.target.value)}
                      className="w-full font-bold text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Amount (₹)</span>
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => handleMilestoneChange(mIdx, "amount", e.target.value)}
                        className="w-28 font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1"
                        placeholder="Amount"
                      />
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(mIdx)}
                        className="mt-3.5 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Remove Milestone"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notification Rule Summary */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-2.5 text-indigo-950">
            <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px]">
              <p className="font-bold">Automated Workflow & Notifications:</p>
              <p className="text-indigo-900/80">
                1. Vendor will instantly receive a notification with the configured milestone breakdown.
              </p>
              <p className="text-indigo-900/80">
                2. Milestone 1 stages will be locked until Vendor submits payment and Admin approves.
              </p>
              <p className="text-indigo-900/80">
                3. On Milestone 1 completion, Milestone 2 automatically unlocks for payment.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-slate-500 font-medium">Total Configured: </span>
            <strong className="text-slate-900 font-black">₹{totalCalculated.toLocaleString()}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>{saving ? "Saving..." : "Confirm & Save Milestones"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
