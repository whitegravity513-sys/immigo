import React, { useState } from "react";
import {
  Search,
  Plus,
  List,
  LayoutGrid,
  Building2,
  MapPin,
} from "lucide-react";
import { formatSalary } from "../shared/vendorHRUtils.jsx";

export default function VendorHRJobsSection({
  jobs = [],
  applications = [],
  setShowSubmitModal,
  setSubmitForm,
  setCandidateSearch,
  setActiveMenu,
}) {
  const [jobSearch, setJobSearch] = useState("");
  const [jobDeptFilter, setJobDeptFilter] = useState("ALL");
  const [jobViewMode, setJobViewMode] = useState("list");

  const uniqueDepartments = Array.from(
    new Set(jobs.map((j) => j.department || j.tradeCategory).filter(Boolean))
  );

  const filteredJobs = jobs.filter((j) => {
    if (jobDeptFilter !== "ALL" && (j.department || j.tradeCategory) !== jobDeptFilter) {
      return false;
    }
    if (!jobSearch) return true;
    const q = jobSearch.toLowerCase();
    return (
      j.title?.toLowerCase().includes(q) ||
      j.jobId?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q) ||
      j.projectName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner with Search, Department Filter, View Switcher & Action */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Open Job Requirements</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              {filteredJobs.length} Active Trades
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active manpower positions and specialized trades authorized for your vendor recruitment team.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Search trade, code, location..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 w-44 sm:w-56"
            />
          </div>

          {/* Department Filter */}
          {uniqueDepartments.length > 0 && (
            <select
              value={jobDeptFilter}
              onChange={(e) => setJobDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="ALL">All Trade Sectors</option>
              {uniqueDepartments.map((dept, idx) => (
                <option key={idx} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setJobViewMode("list")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                jobViewMode === "list"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="List View"
            >
              <List size={14} />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setJobViewMode("grid")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                jobViewMode === "grid"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Submit Candidate</span>
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {jobViewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase text-[10.5px] border-b border-slate-200/80 tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Trade & Sector</th>
                  <th className="py-2.5 px-3">Project & Location</th>
                  <th className="py-2.5 px-3">Experience</th>
                  <th className="py-2.5 px-3">Salary Package</th>
                  <th className="py-2.5 px-3 text-center">Slots / Sourced</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400">
                      No trade requirements match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const jobCands = applications.filter((a) => a.jobId === job.jobId || a.jobTitle === job.title);
                    const remaining = (job.openings || 10) - (job.filledPositions || 0);

                    return (
                      <tr key={job.jobId} className="hover:bg-blue-50/30 transition group">
                        <td className="py-2.5 px-3.5">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition text-xs">
                            {job.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-slate-400 text-[10px]">
                              {job.jobId}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600 uppercase">
                              {job.department || job.tradeCategory || "MEP"}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                            <Building2 size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]" title={job.projectName}>
                              {job.projectName || "Overseas Deployment"}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-slate-400 shrink-0" />
                            <span>{job.location || "Dubai, UAE"}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap text-xs">
                          {job.experienceLevel || "3-5 Yrs"}
                        </td>

                        <td className="py-2.5 px-3 font-bold text-blue-700 whitespace-nowrap text-xs">
                          {formatSalary(job.salaryRange)}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10.5px] border border-emerald-200 whitespace-nowrap">
                              {remaining} Slots
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (setCandidateSearch) setCandidateSearch(job.title);
                                if (setActiveMenu) setActiveMenu("candidates");
                              }}
                              className="font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded text-[10.5px] border border-indigo-200 transition cursor-pointer whitespace-nowrap"
                              title="View Candidates for this Job"
                            >
                              {jobCands.length} Sourced
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            {job.status || "Open"}
                          </span>
                        </td>

                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSubmitForm((prev) => ({
                                ...prev,
                                jobId: job.jobId,
                                projectId: job.projectId || prev.projectId,
                              }));
                              setShowSubmitModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Plus size={13} />
                            <span>Submit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.jobId}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                    {job.department || "MEP"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {job.status || "Open"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{job.title}</h3>
                <p className="text-xs text-slate-500">{job.location || "Dubai, UAE"}</p>

                <div className="space-y-1 text-xs text-slate-600 font-medium pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <span className="font-semibold text-slate-800">{job.experienceLevel || "3-5 Yrs"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Salary Package:</span>
                    <span className="font-bold text-blue-600">{formatSalary(job.salaryRange)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining Openings:</span>
                    <span className="font-bold text-emerald-700">{job.openings - (job.filledPositions || 0)} Slots</span>
                  </div>
                </div>

                {Array.isArray(job.skills) && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {job.skills.map((sk, sIdx) => (
                      <span key={sIdx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                        {typeof sk === "object" ? sk.name || sk.skill || JSON.stringify(sk) : String(sk)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setSubmitForm((prev) => ({
                    ...prev,
                    jobId: job.jobId,
                    projectId: job.projectId || prev.projectId,
                  }));
                  setShowSubmitModal(true);
                }}
                className="w-full mt-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer text-center flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Candidate for this Trade</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
