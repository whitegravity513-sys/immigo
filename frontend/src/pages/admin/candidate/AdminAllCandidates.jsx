import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Download,
  Trash2,
} from "lucide-react";
import apiClient from "../../../services/apiClient.js";
import ExcelExportModal from "../../../components/common/ExcelExportModal.jsx";

const ALL_CANDIDATES_EXPORT_FIELDS = [
  { key: "candidateId", label: "Candidate ID", category: "Identification", defaultSelected: true },
  { key: "fullName", label: "Full Name", category: "Personal", defaultSelected: true },
  { key: "email", label: "Email Address", category: "Contact", defaultSelected: true },
  { key: "phone", label: "Mobile / Phone", category: "Contact", defaultSelected: true },
  { key: "trade", label: "Trade / Preferred Role", category: "Professional", defaultSelected: true, extractor: (c) => c.profile?.trade || c.profile?.preferredJobRole || "—" },
  { key: "accountStatus", label: "Account Status", category: "Compliance", defaultSelected: true },
  { key: "documentStatus", label: "Document Status", category: "Compliance", defaultSelected: true },
  { key: "jobApplicationAccess", label: "Job Access Status", category: "Compliance", defaultSelected: true },
  { key: "profileCompletion", label: "Profile Completion", category: "Profile", defaultSelected: true, extractor: (c) => (c.profileCompletionPercentage ? `${c.profileCompletionPercentage}%` : "0%") },
  { key: "experience", label: "Total Experience", category: "Professional", defaultSelected: true, extractor: (c) => (c.profile?.totalExperienceYears ? `${c.profile.totalExperienceYears} Years` : "—") },
  { key: "state", label: "State", category: "Personal", defaultSelected: true, extractor: (c) => c.profile?.state || "—" },
  { key: "city", label: "City", category: "Personal", defaultSelected: true, extractor: (c) => c.profile?.city || "—" },
  { key: "passportNumber", label: "Passport Number", category: "Compliance", defaultSelected: false, extractor: (c) => c.profile?.passportNumber || "—" },
  { key: "registeredAt", label: "Registration Date", category: "System", defaultSelected: true, extractor: (c) => (c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB") : "—") },
];

export default function AdminAllCandidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountStatus, setAccountStatus] = useState("All");
  const [documentStatus, setDocumentStatus] = useState("All");
  const [jobAccess, setJobAccess] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exportModalOpen, setExportModalOpen] = useState(false);

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

  const handleDeleteCandidate = async (cand) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete candidate ${cand.fullName} (${cand.candidateId})?`
    );
    if (!confirmDelete) return;

    try {
      const res = await apiClient.delete(`/admin/candidates/${cand.candidateId}`);
      if (res.data?.success) {
        alert(`Candidate ${cand.fullName} deleted successfully.`);
        fetchCandidates();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete candidate.");
    }
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
            onClick={() => setExportModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download Candidates in Excel/CSV"
          >
            <Download size={13} className="text-slate-500" />
            <span>Export Data</span>
          </button>

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
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Candidate ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Documents</th>
                <th className="py-3.5 px-4">Job Access</th>
                <th className="py-3.5 px-4">Profile %</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
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
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 text-xs">
                      {c.candidateId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{c.fullName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {c.profile?.trade || c.profile?.preferredJobRole || "Candidate"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium text-xs">{c.email}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{c.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
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
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
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
                    <td className="py-3.5 px-4">
                      {c.jobApplicationAccess === "Unlocked" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700">
                          <Unlock size={13} />
                          Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <Lock size={13} />
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${c.profile?.profileCompletionPercent || 20}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">
                        {c.profile?.profileCompletionPercent || 20}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/candidates/${c.candidateId}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleDeleteCandidate(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Candidate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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

      <ExcelExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Candidate Directory"
        subtitle="Select the candidate fields you want to include in the exported file."
        availableFields={ALL_CANDIDATES_EXPORT_FIELDS}
        data={candidates}
        filenamePrefix="Candidates_Directory"
        sheetName="Candidates"
      />
    </div>
  );
}
