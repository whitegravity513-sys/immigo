import React, { useState } from "react";
import {
  CalendarPlus,
  FileText,
  FileUp,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  AlertCircle,
  Filter
} from "lucide-react";

export default function LeaveManagementSection({
  leaveBalance = 0,
  leaveForm,
  setLeaveForm,
  handleLeaveSubmit,
  handleLeaveFile,
  fileLabel,
  loading,
  leaveHistory = [],
  fmtDate,
  setPreviewDoc,
}) {
  const [statusFilter, setStatusFilter] = useState("All");

  // Calculate statistics
  const pendingCount = leaveHistory.filter((l) => l.status === "Pending").length;
  const approvedCount = leaveHistory.filter((l) => l.status === "Approved").length;
  const rejectedCount = leaveHistory.filter((l) => l.status === "Rejected").length;

  // Filter list
  const filteredHistory = leaveHistory.filter((lv) => {
    if (statusFilter === "All") return true;
    return lv.status === statusFilter;
  });

  // Calculate duration
  let leaveDurationDays = 0;
  if (leaveForm.startDate && leaveForm.endDate) {
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      const timeDiff = Math.abs(end.getTime() - start.getTime());
      leaveDurationDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Applied</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {leaveHistory.length} <span className="text-xs font-semibold text-slate-400">Requests</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">All time applications</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {approvedCount} <span className="text-xs font-semibold text-slate-400">Requests</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">HR verified & granted</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {pendingCount} <span className="text-xs font-semibold text-slate-400">Requests</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Awaiting management approval</div>
        </div>
      </div>

      {/* ── Unified Layout: Form on Left, History Table on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Apply for Leave Form (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 sticky top-24">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CalendarPlus size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Apply for Leave</h3>
              <p className="text-[11px] text-slate-500 font-medium">Submit your leave request for approval</p>
            </div>
          </div>

          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {leaveDurationDays > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center justify-between">
                <span>Requested Duration:</span>
                <strong className="font-bold text-blue-700">
                  {leaveDurationDays} Day{leaveDurationDays > 1 ? "s" : ""}
                </strong>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Reason / Justification
              </label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all min-h-[90px] resize-y font-medium leading-relaxed"
                placeholder="Briefly describe the reason for your leave request…"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Supporting Document (Optional)
              </label>
              <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-3.5 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                <FileUp size={16} className="text-slate-400" />
                <span className="text-xs text-slate-600 font-semibold truncate">
                  {fileLabel || "Click to upload medical certificate or ticket"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleLeaveFile}
                  accept="image/*,application/pdf"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Submitting Application…" : "Submit Leave Application"}
            </button>
          </form>
        </div>

        {/* Right Column: Leave Request History & Status (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header & Status Filter Pills */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Leave Applications History</h3>
              <p className="text-[11px] text-slate-500 font-medium">Track your previous leave approvals and remarks</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              {["All", "Pending", "Approved", "Rejected"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    Dates & Duration
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    Doc
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    Status & Remark
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredHistory.map((lv) => (
                  <tr key={lv._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                      <div>{fmtDate(lv.startDate)}</div>
                      <div className="text-slate-400 text-[11px]">to {fmtDate(lv.endDate)}</div>
                      {lv.totalDays && (
                        <div className="text-[10px] text-blue-600 font-bold mt-0.5">
                          {lv.totalDays} day{lv.totalDays > 1 ? "s" : ""}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 max-w-[180px]">
                      <span className="leading-snug block line-clamp-2">{lv.reason}</span>
                      {lv.leaveType && (
                        <span className="mt-1 inline-block text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                          {lv.leaveType}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {lv.document ? (
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          onClick={() => setPreviewDoc(lv.document)}
                        >
                          <Eye size={12} /> View
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-lg border ${
                          lv.status === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : lv.status === "Rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {lv.status}
                      </span>
                      {lv.adminRemark && (
                        <div
                          className={`text-[11px] font-medium p-2 rounded-lg border mt-1.5 ${
                            lv.status === "Rejected"
                              ? "bg-rose-50 text-rose-800 border-rose-100"
                              : "bg-slate-50 text-slate-600 border-slate-100"
                          }`}
                        >
                          <span className="font-bold uppercase text-[9px] tracking-wider block text-slate-500 mb-0.5">
                            Admin Remark:
                          </span>
                          {lv.adminRemark}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-400 font-medium">
                      {statusFilter === "All"
                        ? "No leave requests submitted yet. Use the form on the left to apply."
                        : `No ${statusFilter.toLowerCase()} leave requests found.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
