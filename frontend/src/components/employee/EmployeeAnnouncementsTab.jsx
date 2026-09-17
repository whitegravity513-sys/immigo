import React from "react";
import { AlertCircle } from "lucide-react";

export default function EmployeeAnnouncementsTab({ announcements = [], fmtDate }) {
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

  const getPriorityBadge = (p) => {
    switch (p) {
      case "High":
        return "bg-rose-500 text-white";
      case "Medium":
        return "bg-amber-500 text-white";
      default:
        return "bg-slate-400 text-white";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Internal Company Announcements</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Official broadcasts, corporate notifications, and organizational updates
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div
            key={a._id || a.id}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryBadge(
                    a.category || "Company Notification"
                  )}`}
                >
                  {a.category || "Company Notification"}
                </span>
                {a.priority && a.priority === "High" && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getPriorityBadge(a.priority)}`}>
                    High Priority
                  </span>
                )}
              </div>

              <span className="text-xs font-bold text-slate-400">
                {a.date ? new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : (fmtDate ? fmtDate(a.createdAt) : "—")}
              </span>
            </div>

            <h4 className="text-base font-black text-slate-800 tracking-tight">{a.title}</h4>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{a.message}</p>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-12 text-center text-slate-400 font-semibold text-sm flex flex-col items-center justify-center">
            <AlertCircle size={36} className="text-slate-300 mb-3" />
            No announcements broadcasted yet.
          </div>
        )}
      </div>
    </div>
  );
}
