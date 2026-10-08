import React, { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Settings, ChevronRight } from "lucide-react";

export default function ProjectMilestoneBuilder({ milestones, onChange }) {
  const addMilestone = () => {
    const newMilestone = {
      id: `m${Date.now()}`,
      name: `Milestone ${milestones.length + 1}`,
      paymentAmount: "",
      stages: [{ id: `s${Date.now()}-1`, name: "New Stage" }],
    };
    onChange([...milestones, newMilestone]);
  };

  const updateMilestone = (mId, field, value) => {
    onChange(
      milestones.map((m) => (m.id === mId ? { ...m, [field]: value } : m))
    );
  };

  const addStage = (mId) => {
    onChange(
      milestones.map((m) => {
        if (m.id === mId) {
          return {
            ...m,
            stages: [...m.stages, { id: `s${Date.now()}`, name: "" }],
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
          return { ...m, stages: m.stages.filter((s) => s.id !== sId) };
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
            stages: m.stages.map((s) => (s.id === sId ? { ...s, name } : s)),
          };
        }
        return m;
      })
    );
  };

  const removeMilestone = (mId) => {
    onChange(milestones.filter((m) => m.id !== mId));
  };

  return (
    <div className="space-y-3">
      {/* Top Controller */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addMilestone}
          className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Milestone</span>
        </button>
      </div>

      <div className="space-y-2">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden flex flex-col">
            
            {/* Milestone Header / Config - Unified Row */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[150px]">
                <input
                  type="text"
                  value={milestone.name}
                  onChange={(e) => updateMilestone(milestone.id, "name", e.target.value)}
                  placeholder={`Milestone ${index + 1} Name`}
                  className="w-full text-xs font-bold text-slate-800 bg-transparent border-0 border-b border-slate-300 hover:border-indigo-400 focus:border-indigo-600 focus:ring-0 px-0 py-0.5 transition-colors"
                />
              </div>
              <div className="w-28 shrink-0 flex items-center gap-1">
                <span className="text-slate-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={milestone.amount || milestone.paymentAmount || ""}
                  onChange={(e) => {
                    updateMilestone(milestone.id, "paymentAmount", e.target.value);
                    updateMilestone(milestone.id, "amount", e.target.value);
                  }}
                  placeholder="Amount"
                  className="w-full text-xs font-bold text-indigo-700 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 px-2 py-1 shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => addStage(milestone.id)}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded transition-colors"
              >
                <Plus size={12} /> Add Stage
              </button>
              <button
                type="button"
                onClick={() => removeMilestone(milestone.id)}
                className="shrink-0 p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Stages Row container */}
            <div className="px-3 py-2 bg-white flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Stages:</span>
              
              {milestone.stages.map((stage, sIdx) => (
                <div key={stage.id} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 group">
                  <span className="text-[9px] font-black text-slate-400">{sIdx + 1}.</span>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => updateStage(milestone.id, stage.id, e.target.value)}
                    placeholder="Stage Name"
                    className="w-24 sm:w-32 bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-0 px-0.5 py-0"
                  />
                  {milestone.stages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStage(milestone.id, stage.id)}
                      className="text-slate-300 hover:text-rose-500 rounded transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                  {sIdx < milestone.stages.length - 1 && (
                    <ChevronRight size={12} className="text-slate-300 ml-0.5 hidden sm:block" />
                  )}
                </div>
              ))}
              
              {milestone.stages.length === 0 && (
                <span className="text-[10px] text-rose-500 font-medium italic">Milestone must have at least one stage.</span>
              )}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
