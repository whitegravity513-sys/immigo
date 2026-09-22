import React, { useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, Info, X, ChevronRight, Sparkles } from "lucide-react";

export default function AdminUpdateToast({ notification, onClose, onView }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isLeave = notification.type === "LEAVE_UPDATE";
  const isExpense = notification.type === "EXPENSE_UPDATE";
  const isAttendance = notification.type === "ATTENDANCE_UPDATE";
  const isAnnouncement = notification.type === "ANNOUNCEMENT";

  const getBadgeInfo = () => {
    if (isLeave) return { label: "Leave Update", bg: "bg-blue-100 text-blue-800 border-blue-200" };
    if (isExpense) return { label: "Expense Claim", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    if (isAttendance) return { label: "Attendance Record", bg: "bg-amber-100 text-amber-800 border-amber-200" };
    if (isAnnouncement) return { label: "Company Notice", bg: "bg-purple-100 text-purple-800 border-purple-200" };
    return { label: "Admin Update", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
  };

  const badge = getBadgeInfo();

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-600/30 p-4 relative overflow-hidden backdrop-blur-md">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500" />

        <div className="flex items-start gap-3 mt-1">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
            <Bell size={18} className="animate-bounce" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.bg}`}>
                {badge.label}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Just Now</span>
            </div>

            <h4 className="text-xs font-black text-slate-900 leading-snug truncate">
              {notification.title || "Admin Update Received"}
            </h4>

            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2">
              {notification.message}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (onView) onView(notification);
                  onClose();
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              >
                <span>View Details</span>
                <ChevronRight size={12} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close X */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
