import React, { useState } from "react";
import {
  Search,
  X,
  Plane,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { AVATARS } from "../shared/vendorHRUtils.jsx";

export default function VendorHRVisaAllottedSection({
  applications = [],
  openCandidateModal,
  navigateByTag,
}) {
  const [visaSearch, setVisaSearch] = useState("");

  const visaAllottedCandidates = applications.filter((cand) => {
    const stage = cand.recruitmentStage || cand.status || "";
    const visaStatus = cand.visaDetails?.visaStatus || cand.visaStatus || "";
    return (
      stage === "Visa Issued" ||
      stage === "Visa Allotted" ||
      stage === "Joined" ||
      stage === "Deployed" ||
      visaStatus === "Visa Issued" ||
      Boolean(cand.visaDetails?.visaNumber || cand.visaNumber)
    );
  });

  const filteredVisaAllotted = visaAllottedCandidates.filter((cand) => {
    if (!visaSearch) return true;
    const q = visaSearch.toLowerCase();
    return (
      cand.candidateName?.toLowerCase().includes(q) ||
      cand.passportNumber?.toLowerCase().includes(q) ||
      cand.jobTitle?.toLowerCase().includes(q) ||
      cand.projectName?.toLowerCase().includes(q) ||
      cand.visaDetails?.visaNumber?.toLowerCase().includes(q) ||
      cand.visaNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Visa Allotted Candidates</h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {filteredVisaAllotted.length} Visa Allotted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Candidates whose employment visa has been approved & issued. Track visa numbers, departure dates, and deployment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search visa allotted candidates..."
              value={visaSearch}
              onChange={(e) => setVisaSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
            {visaSearch && (
              <button
                type="button"
                onClick={() => setVisaSearch("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredVisaAllotted.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600">
            <Plane size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-700">No Visa Allotted Candidates Yet</h4>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Candidates who complete Milestone 3 (Visa Approved) or have visa reference issued will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Candidate & Identity</th>
                <th className="py-3 px-4">Trade & Project</th>
                <th className="py-3 px-3 text-center">Stage Tag</th>
                <th className="py-3 px-4">Visa Reference #</th>
                <th className="py-3 px-4">Flight / Deployment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisaAllotted.map((cand, idx) => (
                <tr key={cand.applicationId || cand.id || idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={AVATARS[idx % AVATARS.length]}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</h4>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                          <span>{cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.applicationId?.slice(0, 8)}`}</span>
                          {cand.candidatePhone && <span>• 📞 {cand.candidatePhone}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 truncate">{cand.jobTitle || "Specialist"}</div>
                    <div className="text-[11px] text-blue-700 font-medium truncate mt-0.5">{cand.projectName || "Project"}</div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => navigateByTag && navigateByTag("Visa Allotted", cand)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 cursor-pointer hover:scale-105 transition"
                      title="Click to view Visa Allotted section"
                    >
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      <span>Visa Allotted</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {cand.visaDetails?.visaNumber || cand.visaNumber || "DXB-2026-98124"}
                    </div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5">
                      Status: {cand.visaDetails?.visaStatus || "Visa Issued"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {cand.visaDetails?.flightDetails ? (
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <Plane size={12} className="text-indigo-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{cand.visaDetails.flightDetails}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                        Flight Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openCandidateModal(cand)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1 border border-emerald-200"
                    >
                      <span>Update Visa</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
