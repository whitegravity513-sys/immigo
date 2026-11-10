import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  CalendarCheck,
  Clock,
  TrendingUp,
  CheckCircle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Building2,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";

export default function HRPerformanceReportSection({ hrId = null, vendorId = null, isSuperAdmin = false }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [hrId, vendorId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (hrId) params.hrId = hrId;
      if (vendorId) params.vendorId = vendorId;

      const res = await apiClient.get("/hr/performance-reports", { params });

      if (res.data?.success) {
        setReport(res.data.report);
      } else {
        setError("Failed to load HR performance metrics");
      }
    } catch (err) {
      console.error("Error loading HR performance report:", err);
      setError(err?.response?.data?.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const completionRate =
    report?.totalMeetingsScheduled > 0
      ? Math.round((report.meetingsCompleted / report.totalMeetingsScheduled) * 100)
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors border-b border-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>HR Performance & Operational Reports</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Live Audit Data
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate status flow, meeting attendance & outcomes, transition velocity, and vendor statistics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetchReport();
            }}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
            title="Refresh Report"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="text-slate-400">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-5 space-y-5 bg-slate-50/30">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin text-purple-600" />
              <span>Compiling live HR performance data...</span>
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          ) : (
            <>
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Candidates Processed</span>
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {report?.candidatesProcessed || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Unique profiles updated
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Avg Transition Velocity</span>
                    <Clock size={16} className="text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {report?.avgTransitionHours || 0} <span className="text-xs font-normal text-slate-500">hrs</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Between pipeline stages
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Meetings Completed</span>
                    <CalendarCheck size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {report?.meetingsCompleted || 0}
                    <span className="text-xs text-slate-400 font-normal"> / {report?.totalMeetingsScheduled || 0}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {completionRate}% success rate
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Active Vendor Partners</span>
                    <Briefcase size={16} className="text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-indigo-600 mt-1">
                    {report?.vendorPerformance?.length || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Integrated sub-agencies
                  </div>
                </div>
              </div>

              {/* Status Distribution & Meeting Outcomes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Candidate Status Distribution */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-blue-600" />
                    <span>Candidate Status Distribution</span>
                  </h4>

                  {Object.keys(report?.statusDistribution || {}).length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      No candidate data recorded.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(report.statusDistribution).map(([st, cnt]) => (
                        <div key={st} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{st}</span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                              {cnt}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meeting Outcomes Breakdown */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>Meeting Outcomes Breakdown</span>
                  </h4>

                  {Object.keys(report?.outcomeBreakdown || {}).length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-4 text-center">
                      No meeting outcomes logged yet. Complete meetings to record results.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(report.outcomeBreakdown).map(([outc, count]) => (
                        <div
                          key={outc}
                          className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
                        >
                          <span className="text-xs font-bold text-slate-800">{outc}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Performance by HR */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-cyan-600" />
                  <span>Vendor Performance by HR</span>
                </h4>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2 px-2.5">Vendor Name</th>
                        <th className="py-2 px-2.5 text-center">Candidates in Pool</th>
                        <th className="py-2 px-2.5 text-center">Activities Logged</th>
                        <th className="py-2 px-2.5 text-center">Meetings Scheduled</th>
                        <th className="py-2 px-2.5 text-center">Meetings Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(report?.vendorPerformance || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                            No vendor records found.
                          </td>
                        </tr>
                      ) : (
                        report.vendorPerformance.map((v) => (
                          <tr key={v.vendorId} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-2.5 font-bold text-slate-900">
                              {v.companyName}
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {v.vendorId}
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-bold text-blue-600">
                              {v.totalCandidates}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-medium text-slate-700">
                              {v.activitiesLogged}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-semibold text-slate-800">
                              {v.meetingsScheduled}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-bold text-emerald-600">
                              {v.meetingsCompleted}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-HR Staff Breakdown (Super Admin / Admin view) */}
              {isSuperAdmin && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-purple-600" />
                    <span>HR Staff Productivity & Performance</span>
                  </h4>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2 px-2.5">HR Officer</th>
                          <th className="py-2 px-2.5">HR Specialization</th>
                          <th className="py-2 px-2.5 text-center">Assigned Vendors</th>
                          <th className="py-2 px-2.5 text-center">Candidates Processed</th>
                          <th className="py-2 px-2.5 text-center">Audit Actions</th>
                          <th className="py-2 px-2.5 text-center">Meetings Held</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(report?.hrPerformance || []).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                              No HR accounts found.
                            </td>
                          </tr>
                        ) : (
                          report.hrPerformance.map((hr) => (
                            <tr key={hr.id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-2.5">
                                <div className="font-bold text-slate-900">{hr.name}</div>
                                <div className="text-[10px] text-slate-400">{hr.email}</div>
                              </td>
                              <td className="py-2.5 px-2.5">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    hr.hrType === "VENDOR_HR"
                                      ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                                      : "bg-purple-100 text-purple-800 border border-purple-200"
                                  }`}
                                >
                                  {hr.hrType === "VENDOR_HR" ? "Vendor HR" : "Employee HR"}
                                </span>
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-slate-600">
                                {Array.isArray(hr.assignedVendors) && hr.assignedVendors.length > 0
                                  ? `${hr.assignedVendors.length} Assigned`
                                  : "All"}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-bold text-blue-600">
                                {hr.candidatesProcessed}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-semibold text-slate-700">
                                {hr.totalActivities}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-bold text-emerald-600">
                                {hr.meetingsCompleted} / {hr.meetingsScheduled}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

