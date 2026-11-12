import { useState } from "react";
import {
  X,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Layers,
  Info,
  AlertTriangle,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";
import { isAppRefundLocked, getAppRefundStatus } from "../../../services/refundService";

const buildMilestonesState = (application) => {
  if (!application) return { totalAmount: 0, milestones: [] };
  const synced =
    !application.milestonesOverridden && crmVendorService.syncAppMilestonesWithProject
      ? crmVendorService.syncAppMilestonesWithProject(application)
      : [];
  const rawMilestones =
    synced.length > 0
      ? synced
      : application.processMilestones?.length > 0
        ? application.processMilestones
        : application.paymentPlan?.milestones?.length > 0
          ? application.paymentPlan.milestones
          : [];

  if (rawMilestones.length === 0) {
    return { totalAmount: 0, milestones: [] };
  }

  const computedTotal = rawMilestones.reduce(
    (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
    0
  );
  const resolvedTotal = Number(
    computedTotal > 0 ? computedTotal : application.paymentPlan?.totalAmount ?? 0
  );

  const builtMilestones = rawMilestones.map((m, idx) => {
    const pm = (application.processMilestones || []).find(
      (p) => p.id === m.id || p.name === m.name
    );
    const rawStages =
      m.stages && m.stages.length > 0
        ? m.stages
        : pm?.stages && pm.stages.length > 0
          ? pm.stages
          : [
            { id: `s${idx}_1`, name: "Skill & Document Clearance", status: "Locked" },
            { id: `s${idx}_2`, name: "Processing Step", status: "Locked" },
          ];
    const amt = Number(m.paymentAmount ?? m.amount ?? 0);
    const pct =
      m.percentage !== undefined
        ? Number(m.percentage) || 0
        : resolvedTotal > 0
          ? Math.round((amt / resolvedTotal) * 100)
          : 0;

    return {
      ...m,
      id: m.id || `m${idx}`,
      name: m.name || `Milestone ${idx + 1}`,
      percentage: pct,
      amount: amt,
      paymentAmount: amt,
      status: m.status || (idx === 0 ? (amt > 0 ? "Payment Required" : "Active") : "Locked"),
      stages: rawStages.map((s, sIdx) => ({
        ...s,
        id: s.id || `s${idx}_${sIdx}`,
        name: s.name || `Stage ${sIdx + 1}`,
        status: s.status || "Locked",
      })),
    };
  });

  return { totalAmount: resolvedTotal, milestones: builtMilestones };
};

export default function ConfigureMilestonesModal({ isOpen, onClose, application, onSaved }) {
  const [totalAmount, setTotalAmount] = useState(() =>
    isOpen && application ? buildMilestonesState(application).totalAmount : 0
  );
  const [milestones, setMilestones] = useState(() =>
    isOpen && application ? buildMilestonesState(application).milestones : []
  );
  const [saving, setSaving] = useState(false);
  const [prevSyncApp, setPrevSyncApp] = useState(() => (isOpen ? application : null));

  const currentSyncApp = isOpen ? application : null;
  if (currentSyncApp !== prevSyncApp) {
    setPrevSyncApp(currentSyncApp);
    if (isOpen && application) {
      const next = buildMilestonesState(application);
      setTotalAmount(next.totalAmount);
      setMilestones(next.milestones);
    }
  }

  if (!isOpen || !application) return null;

  const refundLocked = isAppRefundLocked(application);
  const refundStatus = getAppRefundStatus(application);

  const applyPreset = (count, baseTotal = totalAmount) => {
    const total = Number(baseTotal) || 0;
    if (count === 2) {
      const m0Amt = Math.round(total * 0.5);
      const m1Amt = Math.max(0, total - m0Amt);
      setMilestones([
        {
          id: "m0",
          name: "Milestone 1: Selection & Offer Acceptance",
          percentage: 50,
          amount: m0Amt,
          paymentAmount: m0Amt,
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
          amount: m1Amt,
          paymentAmount: m1Amt,
          status: "Pending",
          stages: [
            { id: "s1_1", name: "Medical Check & GAMCA Fitness Clearance", status: "Locked" },
            { id: "s1_2", name: "Visa Stamping & Official Work Permit", status: "Locked" },
            { id: "s1_3", name: "Flight Ticket Booking & On-Site Mobilization", status: "Locked" },
          ],
        },
      ]);
    } else if (count === 3) {
      const m0Amt = Math.round(total * 0.3);
      const m1Amt = Math.round(total * 0.4);
      const m2Amt = Math.max(0, total - m0Amt - m1Amt);
      setMilestones([
        {
          id: "m0",
          name: "Milestone 1: Selection & Document Clearance",
          percentage: 30,
          amount: m0Amt,
          paymentAmount: m0Amt,
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
          amount: m1Amt,
          paymentAmount: m1Amt,
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
          amount: m2Amt,
          paymentAmount: m2Amt,
          status: "Pending",
          stages: [
            { id: "s2_1", name: "Emigration (PCC / Protector) Clearance", status: "Locked" },
            { id: "s2_2", name: "Flight Ticket Booking & Mobilization", status: "Locked" },
          ],
        },
      ]);
    } else if (count === 4) {
      const m0Amt = Math.round(total * 0.25);
      const m1Amt = Math.round(total * 0.25);
      const m2Amt = Math.round(total * 0.25);
      const m3Amt = Math.max(0, total - m0Amt - m1Amt - m2Amt);
      setMilestones([
        {
          id: "m0",
          name: "Milestone 1: Selection & Acceptance",
          percentage: 25,
          amount: m0Amt,
          paymentAmount: m0Amt,
          status: "Payment Required",
          stages: [{ id: "s0_1", name: "Document Verification & Acceptance", status: "Locked" }],
        },
        {
          id: "m1",
          name: "Milestone 2: Medical Fitness Clearance",
          percentage: 25,
          amount: m1Amt,
          paymentAmount: m1Amt,
          status: "Pending",
          stages: [{ id: "s1_1", name: "GAMCA Medical Test Clearance", status: "Locked" }],
        },
        {
          id: "m2",
          name: "Milestone 3: Visa Approval & Stamping",
          percentage: 25,
          amount: m2Amt,
          paymentAmount: m2Amt,
          status: "Pending",
          stages: [{ id: "s2_1", name: "Visa Stamping & Work Permit Approval", status: "Locked" }],
        },
        {
          id: "m3",
          name: "Milestone 4: Deployment & Flight Mobilization",
          percentage: 25,
          amount: m3Amt,
          paymentAmount: m3Amt,
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
      prev.map((m) => {
        const calcAmt = Math.round((val * (m.percentage || 0)) / 100);
        return {
          ...m,
          amount: calcAmt,
          paymentAmount: calcAmt,
        };
      })
    );
  };

  const handleMilestoneChange = (idx, field, value) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [field]: value };

    if (field === "percentage") {
      const pct = Number(value) || 0;
      const calcAmt = Math.round((totalAmount * pct) / 100);
      updated[idx].amount = calcAmt;
      updated[idx].paymentAmount = calcAmt;
    } else if (field === "amount") {
      const amt = Number(value) || 0;
      updated[idx].amount = amt;
      updated[idx].paymentAmount = amt;
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
    updated[lastIdx].paymentAmount = remainder;
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
      paymentAmount: defaultAmt,
      status: "Pending",
      stages: [{ id: `s${Date.now()}_1`, name: "Process Step", status: "Locked" }],
    };
    setMilestones([...milestones, newM]);
  };

  const handleRemoveMilestone = (idx) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleAddStage = (mIdx) => {
    const updated = [...milestones];
    if (!Array.isArray(updated[mIdx].stages)) {
      updated[mIdx].stages = [];
    }
    const nextIdx = updated[mIdx].stages.length + 1;
    updated[mIdx].stages.push({
      id: `s${mIdx}_${Date.now()}`,
      name: `Stage ${nextIdx}: Processing Step`,
      status: "Locked",
    });
    setMilestones(updated);
  };

  const handleStageNameChange = (mIdx, sIdx, val) => {
    const updated = [...milestones];
    updated[mIdx].stages[sIdx].name = val;
    setMilestones(updated);
  };

  const handleRemoveStage = (mIdx, sIdx) => {
    const updated = [...milestones];
    updated[mIdx].stages = updated[mIdx].stages.filter((_, i) => i !== sIdx);
    setMilestones(updated);
  };

  const handleSave = async () => {
    if (refundLocked) {
      alert(`Processing is frozen due to an active refund claim (${refundStatus || "Pending Admin Approval"}).`);
      return;
    }
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
      const appId = application.id || application.applicationId || application._id;
      const formatted = milestones.map((m) => ({
        ...m,
        paymentAmount: Number(m.paymentAmount ?? m.amount ?? 0),
        amount: Number(m.paymentAmount ?? m.amount ?? 0),
      }));
      await crmVendorService.overrideMilestones(appId, finalTotal, formatted, application);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to save milestones");
    } finally {
      setSaving(false);
    }
  };

  const totalCalculated = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
  const diffAmount = totalAmount - totalCalculated;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl h-[100dvh] bg-white shadow-2xl overflow-hidden border-l border-slate-200 flex flex-col font-sans animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-300">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Candidate Selection & Milestone Plan
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Set Total Fee, Milestone Amounts & Processing Stages for <strong>{application.candidateName}</strong>
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

        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {refundLocked && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-rose-950">
                  Processing Frozen — Refund Claim ({refundStatus || "Pending Admin Approval"})
                </div>
                <p className="text-[11px] text-rose-800">
                  Milestone configuration and payment progression are paused until Admin responds to the refund claim.
                </p>
              </div>
            </div>
          )}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate / Trade</span>
              <span className="font-bold text-slate-900">{application.candidateName}</span>
              <span className="text-slate-500 font-medium ml-1.5">• {application.position || "Staff"}</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Project</span>
              <span className="font-bold text-slate-800">{application.projectName}</span>
              <span className="text-blue-600 font-semibold ml-1.5">({application.country || "Overseas"})</span>
            </div>
          </div>

          <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-blue-900 tracking-wider block">
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
                  className="w-24 sm:w-32 font-bold text-slate-900 text-sm focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

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

            <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${diffAmount === 0
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

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Configured Milestones & Processing Stages ({milestones.length})
              </span>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[10px] border border-slate-200 flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <Plus size={11} />
                <span>Add Milestone</span>
              </button>
            </div>

            {milestones.map((m, mIdx) => (
              <div
                key={m.id || mIdx}
                className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-800 uppercase">
                        Milestone {mIdx + 1}
                      </span>
                      <select
                        value={m.status || "Pending"}
                        onChange={(e) => handleMilestoneChange(mIdx, "status", e.target.value)}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] border cursor-pointer focus:outline-none ${m.status === "Paid"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                      >
                        <option value="Payment Required">Payment Required</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => handleMilestoneChange(mIdx, "name", e.target.value)}
                      placeholder="e.g. Milestone 1: Selection & Offer Acceptance"
                      className="w-full font-bold text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-slate-400 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Amount (₹)</span>
                      <input
                        type="number"
                        value={m.amount}
                        onChange={(e) => handleMilestoneChange(mIdx, "amount", e.target.value)}
                        className="w-28 font-bold text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
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

                <div className="mt-2 pt-2.5 border-t border-slate-100 bg-slate-50/70 -mx-2.5 -mb-2.5 p-3 sm:p-3.5 rounded-b-xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Layers size={13} className="text-slate-700" />
                      <span className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">
                        Processing Stages ({(m.stages || []).length})
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">Steps inside this milestone</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddStage(mIdx)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-semibold border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={10} />
                      <span>Add Stage</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {(!m.stages || m.stages.length === 0) ? (
                      <div className="p-2 bg-white rounded-xl border border-dashed border-slate-200 text-center text-[10px] text-slate-400">
                        No stages added yet. Click "+ Add Stage" to attach processing stages.
                      </div>
                    ) : (
                      m.stages.map((stg, sIdx) => (
                        <div
                          key={stg.id || sIdx}
                          className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group"
                        >
                          <span className="w-5 h-5 rounded-lg bg-slate-200 text-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={stg.name}
                            onChange={(e) => handleStageNameChange(mIdx, sIdx, e.target.value)}
                            placeholder="e.g. GAMCA Medical Fitness Clearance"
                            className="flex-1 text-xs font-semibold text-slate-800 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-400 rounded px-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveStage(mIdx, sIdx)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition cursor-pointer"
                            title="Remove Stage"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

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

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs">
            <span className="text-slate-500 font-medium">Total Configured: </span>
            <strong className="text-slate-900 font-bold">₹{totalCalculated.toLocaleString()}</strong>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
              disabled={saving || refundLocked}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
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
