
export default function VendorActivityLogsTab({ activityLogs }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
        Full Vendor Audit Logs
      </h3>
      {activityLogs.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          No audit logs recorded for this vendor yet.
        </div>
      ) : (
        activityLogs.map((log) => (
          <div
            key={log._id || log.id}
            className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between"
          >
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">{log.title || log.action}</div>
              <div className="text-xs text-slate-300">{log.description}</div>
              {log.remarks && <div className="text-[11px] text-slate-400 italic">"{log.remarks}"</div>}
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

