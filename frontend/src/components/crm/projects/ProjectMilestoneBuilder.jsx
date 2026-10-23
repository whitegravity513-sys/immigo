import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  Calculator,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Layers,
  ArrowRight,
} from "lucide-react";

const PRESET_TEMPLATES = [
  {
    id: "preset-1",
    label: "1 Stage (100% on Selection)",
    parts: [
      {
        name: "Candidate Selection & Documentation",
        percent: 100,
        stages: [
          "Candidate Selection",
          "Document Verification",
          "Medical Check",
        ],
      },
    ],
  },
  {
    id: "preset-2",
    label: "2 Stages (50% / 50% Split)",
    parts: [
      {
        name: "Selection & Documentation",
        percent: 50,
        stages: ["Candidate Selection", "Document Verification", "Medical Check"],
      },
      {
        name: "Visa Approval & Deployment",
        percent: 50,
        stages: ["Visa Approval", "Air Ticket Booking", "Final Deployment"],
      },
    ],
  },
  {
    id: "preset-3",
    label: "3 Stages (30% / 40% / 30%)",
    parts: [
      {
        name: "Initial Selection & Screening",
        percent: 30,
        stages: ["Trade Interview & Selection", "Document Collection"],
      },
      {
        name: "Medical & Visa Processing",
        percent: 40,
        stages: ["GAMCA Medical Fit", "Work Permit & Visa Application"],
      },
      {
        name: "Flight & Overseas Deployment",
        percent: 30,
        stages: ["Ticket Confirmation", "Airport Departure", "Site Arrival"],
      },
    ],
  },
  {
    id: "preset-4",
    label: "4 Stages (25% Each)",
    parts: [
      {
        name: "Candidate Selection",
        percent: 25,
        stages: ["Interview & Selection", "Client Confirmation"],
      },
      {
        name: "Documentation & Medical",
        percent: 25,
        stages: ["Passport Verification", "GAMCA Medical"],
      },
      {
        name: "Visa Issuance",
        percent: 25,
        stages: ["Visa Quota Allocation", "Visa Stamping"],
      },
      {
        name: "Final Deployment",
        percent: 25,
        stages: ["Air Ticket", "Mobilization & Onboarding"],
      },
    ],
  },
];

export default function ProjectMilestoneBuilder({
  milestones = [],
  onChange,
  totalAmount = "",
  onTotalChange,
}) {
  const [localTotal, setLocalTotal] = useState(totalAmount || "");
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    if (totalAmount !== undefined && totalAmount !== null) {
      setLocalTotal(String(totalAmount));
    }
  }, [totalAmount]);

  const milestonesSum = (milestones || []).reduce(
    (sum, m) => sum + (Number(m.paymentAmount || m.amount) || 0),
    0
  );

  const parsedTotal = Number(localTotal) || 0;
  const isFullyAllocated = parsedTotal > 0 && milestonesSum === parsedTotal;
  const unallocatedAmount = Math.max(0, parsedTotal - milestonesSum);
  const exceedsAmount = Math.max(0, milestonesSum - parsedTotal);

  // Update All Over Total without forcibly overwriting individual milestone prices
  const handleTotalInputChange = (val) => {
    setLocalTotal(val);
    if (onTotalChange) {
      onTotalChange(val);
    }
  };

  // Optional: Auto-distribute All Over Total evenly across existing milestones
  const handleAutoDistribute = () => {
    const total = Number(localTotal);
    if (!total || total <= 0) return;
    const count = (milestones || []).length;
    if (count === 0) return;

    const base = Math.floor(total / count);
    const remainder = total - base * count;

    const updated = milestones.map((m, idx) => {
      const share = idx === 0 ? base + remainder : base;
      return {
        ...m,
        paymentAmount: String(share),
        amount: share,
      };
    });
    onChange(updated);
  };

  // Quick preset template application
  const handleApplyPreset = (preset) => {
    const total = Number(localTotal) || 0;
    const newMilestones = preset.parts.map((p, idx) => {
      let amt = "";
      if (total > 0) {
        amt = String(Math.round((total * p.percent) / 100));
      }
      return {
        id: `m${Date.now()}-${idx + 1}`,
        name: p.name,
        paymentAmount: amt,
        amount: amt ? Number(amt) : "",
        stages: p.stages.map((s, sIdx) => ({
          id: `s${Date.now()}-${idx + 1}-${sIdx + 1}`,
          name: s,
        })),
      };
    });

    if (total > 0 && newMilestones.length > 0) {
      const sum = newMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
      const diff = total - sum;
      if (diff !== 0) {
        const adjustedFirst = (Number(newMilestones[0].amount) || 0) + diff;
        newMilestones[0].amount = adjustedFirst;
        newMilestones[0].paymentAmount = String(adjustedFirst);
      }
    }

    onChange(newMilestones);
    setShowPresets(false);
  };

  const addMilestone = () => {
    const list = milestones || [];
    const newMilestone = {
      id: `m${Date.now()}`,
      name: `Milestone ${list.length + 1}`,
      paymentAmount: "",
      amount: "",
      stages: [{ id: `s${Date.now()}-1`, name: "Candidate Selection" }],
    };
    onChange([...list, newMilestone]);
  };

  const updateMilestone = (mId, field, value) => {
    onChange(
      milestones.map((m) => {
        if (m.id === mId) {
          if (field === "paymentAmount" || field === "amount") {
            return { ...m, paymentAmount: value, amount: value };
          }
          return { ...m, [field]: value };
        }
        return m;
      })
    );
  };

  const removeMilestone = (mId) => {
    const remaining = milestones.filter((m) => m.id !== mId);
    onChange(remaining);
  };

  const addStage = (mId) => {
    onChange(
      milestones.map((m) => {
        if (m.id === mId) {
          return {
            ...m,
            stages: [
              ...(m.stages || []),
              { id: `s${Date.now()}`, name: "" },
            ],
          };
        }
        return m;
      })
    );
  };

  const removeStage = (mId, sId) => {
    onChange(
      milestones.map((m) => {
        if (m.id === mId) {
          return {
            ...m,
            stages: (m.stages || []).filter((s) => s.id !== sId),
          };
        }
        return m;
      })
    );
  };

  const updateStage = (mId, sId, name) => {
    onChange(
      milestones.map((m) => {
        if (m.id === mId) {
          return {
            ...m,
            stages: (m.stages || []).map((s) =>
              s.id === sId ? { ...s, name } : s
            ),
          };
        }
        return m;
      })
    );
  };

  // Sync All Over Total to match the sum of manually entered milestone prices
  const syncTotalFromMilestones = () => {
    if (milestonesSum > 0) {
      handleTotalInputChange(String(milestonesSum));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top All Over Total Amount Box */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="space-y-2 flex-1">
            <div>
              <label className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                All Over Total Milestone Amount (₹)
              </label>
              <p className="text-[11px] text-blue-800/80">
                Enter overall project milestone fee. You can manually enter individual milestone prices below.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative w-48 sm:w-60">
                <span className="absolute left-3 top-2 text-base font-bold text-blue-600">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={localTotal}
                  onChange={(e) => handleTotalInputChange(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full pl-8 pr-3 py-1.5 text-base sm:text-lg font-bold text-blue-950 font-mono bg-white border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={handleAutoDistribute}
                disabled={!parsedTotal || parsedTotal <= 0 || (milestones || []).length === 0}
                title="Auto-distribute the All Over Total evenly across milestones"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-white hover:bg-blue-100/80 border border-blue-300 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Calculator size={13} />
                <span>Auto Distribute</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPresets((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Sparkles size={13} />
                  <span>Templates</span>
                </button>

                {showPresets && (
                  <div className="absolute left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-2 space-y-1 animate-in fade-in duration-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1">
                      Quick Milestone Templates
                    </p>
                    {PRESET_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleApplyPreset(tmpl)}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center justify-between"
                      >
                        <span>{tmpl.label}</span>
                        <ChevronRight size={13} className="text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-xs font-semibold text-blue-800 bg-blue-100/70 px-2.5 py-1.5 rounded-lg border border-blue-200">
                {(milestones || []).length} Milestones Configured
              </span>
            </div>

            {/* Live Financial Summary & Comparison */}
            <div className="flex items-center gap-3 pt-1 text-[11px] flex-wrap">
              <span className="text-blue-950">
                Milestones Sum:{" "}
                <strong className="font-mono text-blue-900 font-bold text-xs">
                  ₹{milestonesSum.toLocaleString("en-IN")}
                </strong>
              </span>

              {parsedTotal > 0 ? (
                isFullyAllocated ? (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Fully allocated
                  </span>
                ) : unallocatedAmount > 0 ? (
                  <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Unallocated: ₹{unallocatedAmount.toLocaleString("en-IN")}
                  </span>
                ) : (
                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Exceeds total by ₹{exceedsAmount.toLocaleString("en-IN")}
                  </span>
                )
              ) : null}

              {milestonesSum > 0 && parsedTotal !== milestonesSum && (
                <button
                  type="button"
                  onClick={syncTotalFromMilestones}
                  className="text-blue-700 hover:text-blue-900 underline font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Set Total to ₹{milestonesSum.toLocaleString("en-IN")}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={addMilestone}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Milestone</span>
            </button>
          </div>
        </div>
      </div>

      {/* Milestones List with Manual Price Inputs */}
      <div className="space-y-3">
        {(milestones || []).map((milestone, index) => {
          const rawAmount =
            milestone.paymentAmount !== undefined && milestone.paymentAmount !== null
              ? milestone.paymentAmount
              : (milestone.amount ?? "");

          return (
            <div
              key={milestone.id || index}
              className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden flex flex-col transition-all hover:border-blue-300"
            >
              {/* Milestone Name, Manual Price, Add Stage & Delete */}
              <div className="px-3 sm:px-4 py-2.5 bg-slate-50/90 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                {/* Milestone Name */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={milestone.name}
                    onChange={(e) =>
                      updateMilestone(milestone.id, "name", e.target.value)
                    }
                    placeholder={`Milestone ${index + 1} Name`}
                    className="w-full text-xs font-bold text-slate-800 bg-transparent border-0 border-b border-dashed border-slate-300 hover:border-indigo-400 focus:border-indigo-600 focus:ring-0 px-1 py-0.5 transition-colors"
                  />
                </div>

                {/* Manual Price Input */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Price:
                    </label>
                    <span className="text-indigo-600 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={rawAmount}
                      onChange={(e) =>
                        updateMilestone(milestone.id, "paymentAmount", e.target.value)
                      }
                      placeholder="Enter Price"
                      className="w-24 sm:w-28 text-xs font-bold text-indigo-700 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => addStage(milestone.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Stage</span>
                  </button>

                  {(milestones || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(milestone.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Remove this milestone"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Stages Row */}
              <div className="px-3 sm:px-4 py-2.5 bg-white flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 tracking-wider">
                  STAGES:
                </span>

                {(milestone.stages || []).map((stage, sIdx) => (
                  <div
                    key={stage.id || sIdx}
                    className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 group hover:border-slate-300 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-slate-400">
                      {sIdx + 1}.
                    </span>
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) =>
                        updateStage(milestone.id, stage.id, e.target.value)
                      }
                      placeholder="Stage Name"
                      className="w-28 sm:w-36 bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-0 px-0.5 py-0"
                    />
                    {(milestone.stages || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStage(milestone.id, stage.id)}
                        className="text-slate-300 hover:text-rose-500 rounded p-0.5 transition-colors cursor-pointer"
                        title="Remove stage"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                    {sIdx < (milestone.stages || []).length - 1 && (
                      <ChevronRight
                        size={12}
                        className="text-slate-300 ml-0.5 hidden sm:block shrink-0"
                      />
                    )}
                  </div>
                ))}

                {(!milestone.stages || milestone.stages.length === 0) && (
                  <span className="text-[10px] text-rose-500 font-medium italic">
                    Milestone must have at least one stage.
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {(!milestones || milestones.length === 0) && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <p className="text-xs text-gray-500 font-medium">
              No payment milestones configured.
            </p>
            <button
              type="button"
              onClick={addMilestone}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer shadow-2xs"
            >
              <Plus size={13} />
              <span>Add First Milestone</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
