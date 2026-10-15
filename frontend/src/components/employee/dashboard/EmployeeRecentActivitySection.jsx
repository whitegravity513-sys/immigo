import React, { useState, useEffect } from "react";
import { Activity, Clock, CheckCircle2, FileText, Calendar, RefreshCw } from "lucide-react";
import activityService from "../../../services/activityService.js";

export default function EmployeeRecentActivitySection({ user }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyActivities();
  }, []);

  const loadMyActivities = async () => {
    setLoading(true);
    try {
      const res = await activityService.getEmployeeActivities({ limit: 6 });
      setActivities(res.activities || []);
    } catch (err) {
      console.error("Error loading employee activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-blue-600" />
            <span>My Recent Activity</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Your personal record of attendance, leave requests, and submitted work logs.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMyActivities}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-blue-600" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center text-xs text-slate-400">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading your recent activities...
        </div>
      ) : activities.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500">
          <Activity size={24} className="mx-auto text-slate-300 mb-1.5" />
          No recent activity recorded today. Your daily work logs and check-ins will appear here.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {activities.map((act) => (
            <div
              key={act._id || act.id}
              className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-800">{act.action}</span>
                  {act.entityName && (
                    <span className="text-slate-500 ml-1.5">({act.entityName})</span>
                  )}
                  {act.details && (
                    <span className="text-slate-400 block text-[11px] truncate mt-0.5">{act.details}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {act.status && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {act.status}
                  </span>
                )}
                <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                  {formatDate(act.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
