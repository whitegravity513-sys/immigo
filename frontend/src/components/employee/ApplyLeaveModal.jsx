import React from "react";
import { FileUp, AlertCircle } from "lucide-react";
import DateInput from "../common/DateInput.jsx";
import { getIndiaDateString } from "../../utils/formatters.js";

export default function ApplyLeaveModal({
  leaveForm,
  setLeaveForm,
  handleLeaveSubmit,
  handleLeaveFile,
  fileLabel,
  loading,
}) {
  const todayStr = getIndiaDateString();
  const isPastSelected = Boolean(
    (leaveForm.startDate && leaveForm.startDate < todayStr) ||
      (leaveForm.endDate && leaveForm.endDate < todayStr)
  );
  const isInvalidRange = Boolean(
    leaveForm.startDate && leaveForm.endDate && leaveForm.endDate < leaveForm.startDate
  );

  let totalDays = 0;
  if (leaveForm.startDate && leaveForm.endDate && !isInvalidRange) {
    const [sy, sm, sd] = String(leaveForm.startDate).split("-").map(Number);
    const [ey, em, ed] = String(leaveForm.endDate).split("-").map(Number);
    if (sy && sm && sd && ey && em && ed) {
      const startUtc = Date.UTC(sy, sm - 1, sd);
      const endUtc = Date.UTC(ey, em - 1, ed);
      if (endUtc >= startUtc) {
        totalDays = Math.floor((endUtc - startUtc) / (1000 * 3600 * 24)) + 1;
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-4 sm:p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3.5">Apply for Leave</h3>
        <form onSubmit={handleLeaveSubmit} className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Leave Type *
            </label>
            <select
              required
              value={leaveForm.leaveType || "Casual Leave"}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold cursor-pointer"
            >
              <option value="Casual Leave">Casual Leave (CL)</option>
              <option value="Sick Leave">Sick / Medical Leave (SL)</option>
              <option value="Paid Leave">Paid / Privilege Leave (PL)</option>
              <option value="Work From Home">Work From Home (WFH)</option>
              <option value="Half Day Leave">Half Day Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
              <option value="Maternity / Paternity">Maternity / Paternity Leave</option>
              <option value="Bereavement Leave">Bereavement Leave</option>
              <option value="Other">Other Reason</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Start Date
              </label>
              <DateInput
                min={todayStr}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                value={leaveForm.startDate}
                onChange={(e) => {
                  const nextStart = e.target.value;
                  setLeaveForm((prev) => ({
                    ...prev,
                    startDate: nextStart,
                    endDate: !prev.endDate || (nextStart && prev.endDate < nextStart) ? nextStart : prev.endDate,
                  }));
                }}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                End Date
              </label>
              <DateInput
                min={leaveForm.startDate && leaveForm.startDate >= todayStr ? leaveForm.startDate : todayStr}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {isPastSelected && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
              <AlertCircle size={13} className="shrink-0" />
              <span>Leave cannot be applied for past dates. Please select today or a future date.</span>
            </div>
          )}

          {!isPastSelected && isInvalidRange && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
              <AlertCircle size={13} className="shrink-0" />
              <span>End date cannot be earlier than the start date.</span>
            </div>
          )}

          {totalDays > 0 && !isPastSelected && (
            <div className="p-2.5 bg-blue-50/80 border border-blue-200 text-blue-800 rounded-lg text-xs font-semibold flex items-center justify-between">
              <span>Leave Duration:</span>
              <strong className="font-bold">{totalDays} Day(s) (Standard 1 leave / day)</strong>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reason</label>
            <textarea
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-y font-sans"
              placeholder="Describe why you need leave…"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Supporting Document <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>
            <div className="relative border border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/50 rounded-lg p-2.5 transition-all">
              <label className="flex flex-col items-center gap-1 cursor-pointer text-slate-500">
                <FileUp size={18} className="text-green-600" />
                <span className="text-[11px] font-bold">{fileLabel ? "Change File" : "Select Image / PDF"}</span>
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleLeaveFile} />
              </label>
            </div>
            {fileLabel && (
              <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-md px-2 py-0.5 w-fit">
                ✓ {fileLabel}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isPastSelected || isInvalidRange}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-xs transition-all text-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting…" : "Submit Leave Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
