import React, { useState, useEffect } from "react";
import { apiClient } from "../../../services/apiClient.js";
import {
  FileText,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
  Loader2,
  Lock,
  Save,
} from "lucide-react";

export default function DailyWorkLogSection({
  status,
  statusRecord,
  isCheckedOut: propIsCheckedOut = false,
  onDraftLogChange,
  onWorkLogSaved,
}) {
  const [logText, setLogText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [backendCheckedOut, setBackendCheckedOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTodayLog = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/employee/worklog/today");
        if (isMounted) {
          if (res.data?.isCheckedOut !== undefined) {
            setBackendCheckedOut(Boolean(res.data.isCheckedOut));
          }
          if (res.data?.log) {
            const existing = res.data.log.logText || "";
            setLogText(existing);
            setSavedText(existing);
            setLastSavedAt(res.data.log.updatedAt || res.data.log.submittedAt);
            setIsSubmitted(true);
            if (onWorkLogSaved) onWorkLogSaved(existing);
          } else if (res.data?.isSubmitted) {
            setIsSubmitted(true);
          }
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

  const hasCheckedOut = Boolean(
    propIsCheckedOut ||
    status === "Checked Out" ||
    statusRecord?.checkOutTime ||
    backendCheckedOut
  );

  const hasCheckedIn = Boolean(
    hasCheckedOut ||
    status === "Active" ||
    status === "On Break" ||
    statusRecord?.checkInTime
  );

  const isLocked = hasCheckedOut && (isSubmitted || Boolean(savedText && lastSavedAt));
  const hasSavedDraft = Boolean(savedText && lastSavedAt);
  const isDirty = logText.trim() !== savedText.trim();

  const handleTextChange = (val) => {
    if (isLocked || !hasCheckedIn) return;
    setLogText(val);
    if (onDraftLogChange) onDraftLogChange(val);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (isLocked) {
      setStatusMsg({
        type: "error",
        text: "Your shift is checked out and today's work log is locked.",
      });
      return;
    }

    if (!hasCheckedIn) {
      setStatusMsg({
        type: "error",
        text: "Please check in your shift first before saving today's work log.",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 5000);
      return;
    }

    if (!logText.trim()) {
      setStatusMsg({
        type: "error",
        text: "Please enter your work details before saving.",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 4000);
      return;
    }

    setSaving(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const res = await apiClient.post("/employee/worklog", {
        logText: logText.trim(),
      });
      const submittedLog = res.data?.log;
      const finalSavedText = submittedLog?.logText || logText.trim();
      setLogText(finalSavedText);
      setSavedText(finalSavedText);
      setLastSavedAt(submittedLog?.updatedAt || submittedLog?.submittedAt || new Date());
      setIsSubmitted(true);
      if (onWorkLogSaved) onWorkLogSaved(finalSavedText);
      setStatusMsg({
        type: "success",
        text: hasCheckedOut
          ? "Work log submitted and locked for Admin review."
          : "Work log saved! You can now click Check Out to finish your shift.",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 6000);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to save work log. Please try again.",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 6000);
    } finally {
      setSaving(false);
    }
  };

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

  const insertBullet = () => {
    if (isLocked || !hasCheckedIn) return;
    const next = logText ? `${logText}\n• ` : "• ";
    setLogText(next);
    if (onDraftLogChange) onDraftLogChange(next);
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
    <div id="daily-worklog-section" className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            <FileText size={12} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 leading-tight">
            Today's Work Log
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
              <CheckCircle2 size={11} className="text-emerald-600" />
              Submitted {formatISTTime(lastSavedAt)} • Locked
            </span>
          ) : hasSavedDraft && !isDirty ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
              <CheckCircle2 size={11} className="text-emerald-600" />
              Saved {formatISTTime(lastSavedAt)} • Ready to Check Out
            </span>
          ) : hasCheckedIn ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-300 text-sky-800 text-[10px] font-bold">
              <Save size={10} className="text-sky-600" />
              Enter Work Before Check-Out
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold">
              <Lock size={10} className="text-amber-600" />
              Check-In Required
            </span>
          )}
        </div>
      </div>

      <div className="p-2.5 space-y-1.5">
        {statusMsg.text && (
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-300 text-emerald-900"
                : "bg-rose-50 border border-rose-300 text-rose-900"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={14} className="shrink-0 text-rose-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="relative">
          {loading ? (
            <div className="h-16 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
                <Loader2 size={14} className="animate-spin text-blue-600" />
                Loading...
              </div>
            </div>
          ) : (
            <>
              <textarea
                id="daily-worklog-textarea"
                value={logText}
                onChange={(e) => handleTextChange(e.target.value)}
                readOnly={isLocked || !hasCheckedIn}
                disabled={isLocked || !hasCheckedIn}
                rows={2}
                placeholder={
                  isLocked
                    ? "Work log submitted and locked."
                    : hasCheckedIn
                      ? "Enter tasks or accomplishments completed today before checking out..."
                      : "Check in to your shift first to log today's work..."
                }
                className={`w-full text-xs rounded-lg p-2 outline-none transition-all font-medium leading-relaxed resize-y min-h-[48px] border ${
                  isLocked || !hasCheckedIn
                    ? "bg-slate-50 text-slate-700 border-slate-200 cursor-not-allowed select-text opacity-95"
                    : "bg-white text-slate-900 hover:bg-slate-50/50 focus:bg-white border-2 border-slate-300 focus:border-blue-600 placeholder:text-slate-400"
                }`}
              />

              {!isLocked && hasCheckedIn && (
                <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-600 font-medium">
                  <button
                    type="button"
                    onClick={insertBullet}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 font-bold border border-slate-300 transition-colors cursor-pointer text-[10px]"
                  >
                    + Bullet Point
                  </button>
                  <span className="font-bold text-slate-500">{logText.length} chars</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <button
            type="button"
            onClick={toggleHistory}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <History size={13} />
            <span>{showHistory ? "Hide Past Logs" : "View Past Work Logs"}</span>
          </button>

          {isLocked ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Submitted & Locked</span>
            </div>
          ) : !hasCheckedIn ? (
            <button
              type="button"
              disabled={true}
              title="Please check in your shift first"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80"
            >
              <Lock size={12} />
              <span>Check In First</span>
            </button>
          ) : hasSavedDraft && !isDirty ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Work Log Saved</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !logText.trim()}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                saving || !logText.trim()
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 active:scale-95"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={12} />
                  <span>{hasSavedDraft ? "Update Work Log" : "Save Work Log"}</span>
                </>
              )}
            </button>
          )}
        </div>

        {showHistory && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Clock size={12} className="text-blue-600" />
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
                        Submitted {formatISTTime(item.submittedAt || item.updatedAt)}
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
