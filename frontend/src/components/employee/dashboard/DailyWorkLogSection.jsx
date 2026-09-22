import React, { useState, useEffect } from "react";
import { apiClient } from "../../../services/apiClient.js";
import {
  FileText,
  Save,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

export default function DailyWorkLogSection() {
  const [logText, setLogText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Past logs history drawer
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch today's log on mount
  useEffect(() => {
    let isMounted = true;
    const fetchTodayLog = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/employee/worklog/today");
        if (isMounted && res.data?.log) {
          setLogText(res.data.log.logText || "");
          setSavedText(res.data.log.logText || "");
          setLastSavedAt(res.data.log.updatedAt || res.data.log.submittedAt);
        }
      } catch (err) {
        console.error("Failed to load today worklog:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTodayLog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save today's log
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!logText.trim()) {
      setStatusMsg({ type: "error", text: "Please enter your work details before saving." });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 4000);
      return;
    }

    setSaving(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const res = await apiClient.post("/employee/worklog", {
        logText: logText.trim(),
      });
      setSavedText(res.data.log.logText);
      setLastSavedAt(res.data.log.updatedAt || res.data.log.submittedAt);
      setStatusMsg({ type: "success", text: "Work log saved successfully! Admin can now review it." });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 5000);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to save work log. Please try again.",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Fetch history
  const toggleHistory = async () => {
    const nextState = !showHistory;
    setShowHistory(nextState);
    if (nextState && historyLogs.length === 0) {
      setLoadingHistory(true);
      try {
        const res = await apiClient.get("/employee/worklog/history");
        setHistoryLogs(res.data.logs || []);
      } catch (err) {
        console.error("Failed to load work log history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  const isDirty = logText.trim() !== savedText.trim();

  // Quick insertion helpers
  const insertBullet = () => {
    setLogText((prev) => (prev ? `${prev}\n• ` : "• "));
  };

  const formatISTTime = (isoString) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden h-full flex flex-col justify-between">
      {/* Card Header */}
      <div className="p-3.5 sm:p-4 bg-slate-100/90 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            <FileText size={17} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Today's Work Log
            </h3>
            <p className="text-[10px] text-slate-600 font-bold">
              Save your daily tasks & accomplishments for Admin & Team Lead review
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {lastSavedAt ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
              <CheckCircle2 size={12} className="text-emerald-600" />
              Saved {formatISTTime(lastSavedAt)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold">
              <Clock size={12} className="text-amber-600" />
              Not saved yet
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        {/* Alerts */}
        {statusMsg.text && (
          <div
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${statusMsg.type === "success"
              ? "bg-emerald-50 border-2 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-2 border-rose-300 text-rose-900"
              }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Input Area */}
        <div className="relative">
          {loading ? (
            <div className="h-28 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-300">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                Loading your work record...
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                rows={3}
                placeholder="List your tasks, accomplishments, or project progress today..."
                className="w-full text-xs text-slate-900 bg-white hover:bg-slate-50/50 focus:bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl p-3 outline-none transition-all placeholder:text-slate-400 font-medium leading-relaxed resize-y min-h-[88px]"
              />

              {/* Character & quick tools bar */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={insertBullet}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 font-bold border border-slate-300 transition-colors cursor-pointer"
                  >
                    + Bullet Point
                  </button>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 font-semibold">Visible to Admin</span>
                </div>

                <div className="flex items-center gap-2">
                  {isDirty && (
                    <span className="text-amber-700 font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved changes
                    </span>
                  )}
                  <span className="font-bold text-slate-700">{logText.length} chars</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <History size={13} />
            <span>{showHistory ? "Hide Past Logs" : "View Past Work Logs"}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !logText.trim()}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer ${saving || !logText.trim()
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : isDirty
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 active:scale-95"
                : "bg-slate-900 hover:bg-black text-white active:scale-95"
              }`}
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={13} />
                {savedText ? "Update Today's Log" : "Save Today's Work Log"}
              </>
            )}
          </button>
        </div>

        {/* Expandable History Drawer */}
        {showHistory && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Sparkles size={12} className="text-blue-600" />
                Recent Work Log History (Past 30 Days)
              </span>
              <span className="text-[10px] text-slate-500">{historyLogs.length} logs found</span>
            </div>

            {loadingHistory ? (
              <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-600" />
                Loading past logs...
              </div>
            ) : historyLogs.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                No past logs recorded yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {historyLogs.map((item) => (
                  <div
                    key={item._id || item.date}
                    className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {item.date}
                      </span>
                      <span>
                        Updated {formatISTTime(item.updatedAt || item.submittedAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[11px]">
                      {item.logText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
