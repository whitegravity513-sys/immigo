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
  Send,
  Info,
} from "lucide-react";

export default function DailyWorkLogSection({
  status,
  statusRecord,
  isCheckedOut: propIsCheckedOut = false,
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
            setLogText(res.data.log.logText || "");
            setSavedText(res.data.log.logText || "");
            setLastSavedAt(res.data.log.updatedAt || res.data.log.submittedAt);
            setIsSubmitted(true);
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

  const alreadySubmitted = isSubmitted || Boolean(savedText && lastSavedAt);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (alreadySubmitted) {
      setStatusMsg({
        type: "error",
        text: "Your daily work log has already been submitted and cannot be edited.",
      });
      return;
    }

    if (!hasCheckedOut) {
      setStatusMsg({
        type: "error",
        text: "Daily work log can only be submitted after completing shift check-out.",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 5000);
      return;
    }

    if (!logText.trim()) {
      setStatusMsg({
        type: "error",
        text: "Please enter your work details before submitting.",
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
      setSavedText(submittedLog?.logText || logText.trim());
      setLastSavedAt(submittedLog?.submittedAt || new Date());
      setIsSubmitted(true);
      setStatusMsg({
        type: "success",
        text: "Work log submitted successfully! It is now locked for Admin review.",
      });
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 6000);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to submit work log. Please ensure you have checked out.",
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
    if (alreadySubmitted) return;
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
          {alreadySubmitted ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
              <CheckCircle2 size={11} className="text-emerald-600" />
              Submitted {formatISTTime(lastSavedAt)} • Locked
            </span>
          ) : hasCheckedOut ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-300 text-sky-800 text-[10px] font-bold">
              <Send size={10} className="text-sky-600" />
              Ready to Submit
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold">
              <Lock size={10} className="text-amber-600" />
              Check-Out Required
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
                value={logText}
                onChange={(e) => !alreadySubmitted && setLogText(e.target.value)}
                readOnly={alreadySubmitted}
                disabled={alreadySubmitted}
                rows={2}
                placeholder={
                  alreadySubmitted
                    ? "Work log submitted and locked."
                    : hasCheckedOut
                      ? "Enter tasks or accomplishments completed today..."
                      : "Check out shift first to submit work log..."
                }
                className={`w-full text-xs rounded-lg p-2 outline-none transition-all font-medium leading-relaxed resize-y min-h-[48px] border ${
                  alreadySubmitted
                    ? "bg-slate-50 text-slate-700 border-slate-200 cursor-not-allowed select-text opacity-95"
                    : "bg-white text-slate-900 hover:bg-slate-50/50 focus:bg-white border-2 border-slate-300 focus:border-blue-600 placeholder:text-slate-400"
                }`}
              />

              {!alreadySubmitted && (
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

          {alreadySubmitted ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Submitted & Locked</span>
            </div>
          ) : !hasCheckedOut ? (
            <button
              type="button"
              disabled={true}
              title="Please check out your shift first to submit"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80"
            >
              <Lock size={12} />
              <span>Check Out First to Submit</span>
            </button>
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
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={12} />
                  <span>Submit Today's Log</span>
                </>
              )}
            </button>
          )}
        </div>

        {showHistory && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
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
