import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ShieldCheck,
  Lock,
  Unlock,
  RefreshCw,
  X,
  ExternalLink,
  Briefcase,
  Award,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";

export default function AdminAllCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountStatus, setAccountStatus] = useState("All");
  const [documentStatus, setDocumentStatus] = useState("All");
  const [jobAccess, setJobAccess] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        search,
      });
      if (accountStatus !== "All") params.append("accountStatus", accountStatus);
      if (documentStatus !== "All") params.append("documentStatus", documentStatus);
      if (jobAccess !== "All") params.append("jobApplicationAccess", jobAccess);

      const res = await apiClient.get(`/admin/candidates/list?${params.toString()}`);
      if (res.data?.candidates) {
        setCandidates(res.data.candidates);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load candidates directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, accountStatus, documentStatus, jobAccess, page]);

  const openCandidateDetails = async (cand) => {
    setSelectedCandidate(cand);
    setDetailsModalOpen(true);
    setActiveTab("personal");
    try {
      const res = await apiClient.get(`/admin/candidates/${cand.candidateId}`);
      if (res.data?.candidate) {
        setSelectedCandidate(res.data.candidate);
      }
    } catch {}
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#0f2744]">
            All Candidates Directory
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Complete database of candidates, profile completion, compliance verification, and deployment eligibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, ID, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={accountStatus}
            onChange={(e) => {
              setAccountStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="All">All Account Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={documentStatus}
            onChange={(e) => {
              setDocumentStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="All">All Doc Statuses</option>
            <option value="Not Submitted">Not Submitted</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Verified">Verified</option>
            <option value="Re-upload Required">Re-upload Required</option>
          </select>

          <button
            onClick={fetchCandidates}
            disabled={loading}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Candidate ID</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Contact Details</th>
                <th className="py-2.5 px-3">Account Status</th>
                <th className="py-2.5 px-3">Documents</th>
                <th className="py-2.5 px-3">Job Access</th>
                <th className="py-2.5 px-3">Profile %</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-blue-600" />
                      <span>Loading candidate directory...</span>
                    </div>
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                    No candidates found matching the active filters.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.candidateId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 text-[11px]">
                      {c.candidateId}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{c.fullName}</div>
                      <div className="text-[10px] text-slate-500">
                        {c.profile?.trade || c.profile?.preferredJobRole || "Candidate"}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-slate-800 font-medium text-[11px]">{c.email}</div>
                      <div className="text-[10px] text-slate-500">{c.phone}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.accountStatus === "Approved"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : c.accountStatus === "Pending Approval"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {c.accountStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          c.documentStatus === "Verified"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.documentStatus === "Pending Verification"
                            ? "bg-blue-100 text-blue-800"
                            : c.documentStatus === "Re-upload Required"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.documentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {c.jobApplicationAccess === "Unlocked" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700">
                          <Unlock size={11} />
                          Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Lock size={11} />
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${c.profile?.profileCompletionPercent || 20}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 mt-0.5 block">
                        {c.profile?.profileCompletionPercent || 20}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openCandidateDetails(c)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {detailsModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-[#0f2744]">
                  {selectedCandidate.fullName}
                </h3>
                <span className="text-xs font-mono font-bold text-blue-600">
                  {selectedCandidate.candidateId}
                </span>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-slate-200 text-xs font-bold gap-4">
              <button
                onClick={() => setActiveTab("personal")}
                className={`pb-2 transition-colors cursor-pointer ${
                  activeTab === "personal"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab("professional")}
                className={`pb-2 transition-colors cursor-pointer ${
                  activeTab === "professional"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Professional & Skills
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`pb-2 transition-colors cursor-pointer ${
                  activeTab === "documents"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Documents ({selectedCandidate.documents?.length || 0})
              </button>
            </div>

            {activeTab === "personal" && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Email:</span>
                    <span className="font-bold text-slate-900">{selectedCandidate.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Phone:</span>
                    <span className="font-bold text-slate-900">{selectedCandidate.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Date of Birth:</span>
                    <span className="font-semibold text-slate-800">{selectedCandidate.profile?.dob || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Gender:</span>
                    <span className="font-semibold text-slate-800">{selectedCandidate.profile?.gender || "Not specified"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Address:</span>
                    <span className="font-semibold text-slate-800">
                      {[selectedCandidate.profile?.address, selectedCandidate.profile?.city, selectedCandidate.profile?.state, selectedCandidate.profile?.pincode].filter(Boolean).join(", ") || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "professional" && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Trade / Skill Domain:</span>
                    <span className="font-bold text-slate-900">{selectedCandidate.profile?.trade || "General"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Preferred Role:</span>
                    <span className="font-bold text-slate-900">{selectedCandidate.profile?.preferredJobRole || "Any Eligible"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Experience (Years):</span>
                    <span className="font-semibold text-slate-800">{selectedCandidate.profile?.experienceYears || 0} Years</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Passport Number:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedCandidate.profile?.passportNumber || "Not Provided"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium mb-1">Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {(selectedCandidate.profile?.skills || []).length > 0 ? (
                        selectedCandidate.profile.skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[11px]">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">None specified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-2">
                {(selectedCandidate.documents || []).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No documents uploaded yet.
                  </div>
                ) : (
                  selectedCandidate.documents.map((d) => (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{d.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Uploaded: {new Date(d.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === "Verified"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.status === "Re-upload Required"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {d.status}
                        </span>
                        {d.fileUrl && (
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"
                            title="Preview Document"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
