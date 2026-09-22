import React from "react";
import { FileUp } from "lucide-react";

export default function ApplyLeaveModal({
  leaveBalance,
  leaveForm,
  setLeaveForm,
  handleLeaveSubmit,
  handleLeaveFile,
  fileLabel,
  loading,
}) {
  return (
    <div className="max-w-lg mx-auto space-y-6">


      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6">
        <h3 className="text-base font-black text-slate-800 mb-5">Apply for Leave</h3>
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Leave Type *
            </label>
            <select
              required
              value={leaveForm.leaveType || "Casual Leave"}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold cursor-pointer"
            >
              <option value="Casual Leave">Casual Leave (CL)</option>
              <option value="Sick Leave">Sick / Medical Leave (SL)</option>
              <option value="Paid Leave">Paid / Privilege Leave (PL)</option>
              <option value="Half Day Leave">Half Day Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
              <option value="Maternity / Paternity">Maternity / Paternity Leave</option>
              <option value="Bereavement Leave">Bereavement Leave</option>
              <option value="Other">Other Reason</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {["startDate", "endDate"].map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {key === "startDate" ? "Start Date" : "End Date"}
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={leaveForm[key]}
                  onChange={(e) => setLeaveForm({ ...leaveForm, [key]: e.target.value })}
                  required
                />
              </div>
            ))}
          </div>

          {leaveForm.startDate && leaveForm.endDate &&
            (() => {
              const start = new Date(leaveForm.startDate);
              const end = new Date(leaveForm.endDate);
              if (isNaN(start) || isNaN(end) || end < start) return null;
              const timeDiff = Math.abs(end.getTime() - start.getTime());
              const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
              return (
                <div className="p-3 bg-blue-50/80 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center justify-between">
                  <span>Leave Duration:</span>
                  <strong className="font-bold">{totalDays} Day(s) (Standard 1 leave / day)</strong>
                </div>
              );
            })()}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[90px] resize-y font-sans"
              placeholder="Describe why you need leave…"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Supporting Document <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>
            <div className="relative border border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/50 rounded-xl p-4 transition-all">
              <label className="flex flex-col items-center gap-1.5 cursor-pointer text-slate-500">
                <FileUp size={22} className="text-green-600" />
                <span className="text-xs font-bold">{fileLabel ? "Change File" : "Select Image / PDF"}</span>
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleLeaveFile} />
              </label>
            </div>
            {fileLabel && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1 w-fit">
                ✓ {fileLabel}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm cursor-pointer disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit Leave Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
