import React from "react";
import { Users, UserCheck, Video, CheckCircle2, XCircle } from "lucide-react";

export default function CandidateTabsBar({ activeTab, onTabChange, counts = {} }) {
  const tabs = [
    { id: "All", label: "All Candidates", count: counts.countAll || 0, icon: Users },
    { id: "Shortlisted", label: "Shortlisted", count: counts.countShortlisted || 0, icon: UserCheck },
    { id: "Interview", label: "Interview", count: counts.countInterview || 0, icon: Video },
    { id: "Selected", label: "Selected", count: counts.countSelected || 0, icon: CheckCircle2 },
    { id: "Rejected", label: "Rejected", count: counts.countRejected || 0, icon: XCircle },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
