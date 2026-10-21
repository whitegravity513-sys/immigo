import React, { useState } from "react";
import {
  Megaphone,
  Bell,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function EmployeeAnnouncementsTab({ announcements = [], fmtDate }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case "Important Announcements":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Internal Updates":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Company Notification":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const categories = [
    "all",
    ...Array.from(new Set(announcements.map((a) => a.category).filter(Boolean))),
  ];

  const filteredAnnouncements =
    selectedCategory === "all"
      ? announcements
      : announcements.filter((a) => a.category === selectedCategory);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full min-h-[calc(100vh-125px)] flex flex-col space-y-3 text-left">
      {/* Header bar */}
      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
            <Megaphone size={14} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Internal Company Announcements</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {announcements.length}
              </span>
            </h2>
            <p className="text-[10px] text-slate-500">
              Official broadcasts, corporate notifications, and organizational updates
            </p>
          </div>
        </div>

        {/* Filter pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? `All (${announcements.length})` : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Announcements List Container */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs flex-1 flex flex-col overflow-hidden">
        {filteredAnnouncements.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <Megaphone size={18} className="text-slate-400" />
            </div>
            <div className="text-xs font-bold text-slate-700">No Announcements Found</div>
            <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm">
              There are currently no announcements broadcasted under this category.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 flex-1">
            {filteredAnnouncements.map((a) => {
              const aId = a._id || a.id;
              const isExpanded = expandedId === aId;
              const isHigh = a.priority === "High";

              return (
                <div
                  key={aId}
                  className={`p-2.5 sm:px-3.5 transition-colors ${
                    isHigh ? "bg-rose-50/20 hover:bg-rose-50/40" : "hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                          isHigh
                            ? "bg-rose-50 text-rose-600 border-rose-200 shadow-2xs"
                            : a.priority === "Medium"
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "bg-blue-50 text-blue-600 border-blue-200"
                        }`}
                      >
                        <Bell size={13} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {a.title}
                          </h4>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${getCategoryBadge(
                              a.category || "Company Notification"
                            )}`}
                          >
                            {a.category || "Company Notification"}
                          </span>
                          {isHigh && (
                            <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-600 text-white">
                              High Priority
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-0.5">
                          <span className="flex items-center gap-1 text-slate-500 font-semibold">
                            <Calendar size={11} className="text-slate-400" />
                            {a.date
                              ? new Date(a.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : fmtDate
                                ? fmtDate(a.createdAt)
                                : "—"}
                          </span>
                        </div>

                        <p
                          className={`text-xs text-slate-600 leading-relaxed mt-1 whitespace-pre-line ${
                            !isExpanded && a.message?.length > 180 ? "line-clamp-2" : ""
                          }`}
                        >
                          {a.message}
                        </p>

                        {a.message?.length > 180 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(aId)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isExpanded ? "Show Less" : "Read Full Announcement"}</span>
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
