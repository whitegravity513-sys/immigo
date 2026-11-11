import { Activity, Clock } from "lucide-react";

export default function RecentActivityStream({
  activities,
  loadingActivities,
  activityFilter,
  setActivityFilter,
  activityPage,
  setActivityPage,
  activityTotalPages,
  activityTotal,
}) {
  return (
    <div className="w-full bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden mt-1">
      <div className="p-2.5 sm:px-3 sm:py-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Activity size={15} className="text-blue-600" />
            <span>Recent Activity & Updates</span>
          </h3>
          <p className="text-[10px] text-slate-500">
            Live operational updates across Employee HR, Vendors, Projects, Clients, and Payments.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={activityFilter}
            onChange={(e) => {
              setActivityFilter(e.target.value);
              setActivityPage(1);
            }}
            className="px-2 py-1 text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="HR">Employee HR</option>
            <option value="ATTENDANCE">Attendance & Clock-Ins</option>
            <option value="LEAVE">Leave Management</option>
            <option value="VENDOR">Vendors & Partners</option>
            <option value="CANDIDATE">Candidate Workflow</option>
            <option value="PROJECT">Projects & Demands</option>
            <option value="PAYMENT">Finance & Ledgers</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {loadingActivities ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
            <span>Loading activity updates...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No activities logged yet.
          </div>
        ) : (
          activities.map((act) => (
            <div key={act._id || act.id} className="p-2.5 sm:px-3 sm:py-2 hover:bg-slate-50/80 transition flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {act.title || act.action || "System Event"}
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                    <Clock size={10} />
                    {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                  {act.description || act.details || "Activity performed"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {activityTotalPages > 1 && (
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Page {activityPage} of {activityTotalPages} ({activityTotal} total)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
              disabled={activityPage <= 1}
              className="px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 text-[11px] font-semibold cursor-pointer"
            >
              Prev
            </button>
            <button
              onClick={() => setActivityPage((p) => Math.min(activityTotalPages, p + 1))}
              disabled={activityPage >= activityTotalPages}
              className="px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 text-[11px] font-semibold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

