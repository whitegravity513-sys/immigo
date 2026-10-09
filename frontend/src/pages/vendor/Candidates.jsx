import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Send,
  FileText,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Sparkles,
  Download,
  Trash2,
  Tag,
  RotateCcw,
  Clock,
  UserCheck,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

export function Candidates() {
  const navigate = useNavigate();
  const vendor = crmVendorService.getCurrentVendor();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [statusTab, setStatusTab] = useState("Available"); // Available (Available, Rejected, On Hold), Selected (Shortlisted, Selected), All

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const [candData, appData] = await Promise.all([
        crmVendorService.getCandidates(vendor?.id, {
          search,
          position: positionFilter,
          country: countryFilter,
        }),
        crmVendorService.getApplications(vendor?.id),
      ]);

      // Calculate candidate deployment status from applications history
      let enriched = candData.map((c) => {
        const cApps = (appData || []).filter((a) => a.candidateId === c.id);
        const selectedApp = cApps.find((a) => ["Selected", "Shortlisted", "Completed"].includes(a.status));
        const rejectedApp = cApps.find((a) => a.status === "Rejected");
        const holdApp = cApps.find((a) => a.status === "On Hold");

        let poolStatus = "Available";
        let lastProjectInfo = null;

        if (selectedApp) {
          poolStatus = selectedApp.status; // Selected or Shortlisted
          lastProjectInfo = selectedApp.projectName || selectedApp.clientName;
        } else if (rejectedApp) {
          poolStatus = "Rejected";
          lastProjectInfo = rejectedApp.projectName || rejectedApp.clientName;
        } else if (holdApp) {
          poolStatus = "On Hold";
          lastProjectInfo = holdApp.projectName || holdApp.clientName;
        }

        return {
          ...c,
          poolStatus,
          lastProjectInfo,
        };
      });

      // Filter by tag if selected
      if (selectedTag !== "All") {
        enriched = enriched.filter(
          (c) =>
            (c.tags || []).some((t) => t.toLowerCase() === selectedTag.toLowerCase()) ||
            c.currentPosition?.toLowerCase().includes(selectedTag.toLowerCase()) ||
            c.preferredCountry?.toLowerCase() === selectedTag.toLowerCase()
        );
      }

      // Filter by statusTab
      if (statusTab === "Available") {
        // Includes Available, Rejected, and On Hold (all candidates reusable for new projects)
        enriched = enriched.filter((c) => ["Available", "Rejected", "On Hold"].includes(c.poolStatus));
      } else if (statusTab === "Selected") {
        // Includes Shortlisted and Selected on active project
        enriched = enriched.filter((c) => ["Selected", "Shortlisted", "Completed"].includes(c.poolStatus));
      }

      setCandidates(enriched);
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, positionFilter, countryFilter, selectedTag, statusTab, vendor?.id]);

  const handleDelete = async (candidateId, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from your pool?`)) {
      await crmVendorService.deleteCandidate(candidateId);
      fetchCandidates();
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const totalPages = Math.ceil(candidates.length / ITEMS_PER_PAGE) || 1;
  const paginatedCandidates = candidates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Candidate Pool & Reusability Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage candidate database. Rejected or On Hold candidates remain available & reusable for new project applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <Link
            to="/vendor/submit-candidate"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Send size={14} className="text-indigo-600" />
            <span>Submit to Project</span>
          </Link>

          <Link
            to="/vendor/candidates/add"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Add Candidate</span>
          </Link>
        </div>
      </div>

      {/* Candidate Availability Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => { setStatusTab("Available"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusTab === "Available"
              ? "bg-white text-blue-700 shadow-2xs font-extrabold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Available & Reusable Candidates (Fresh / Rejected / Hold)
        </button>
        <button
          type="button"
          onClick={() => { setStatusTab("Selected"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusTab === "Selected"
              ? "bg-white text-emerald-700 shadow-2xs font-extrabold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Active Shortlisted / Selected Candidates
        </button>
        <button
          type="button"
          onClick={() => { setStatusTab("All"); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusTab === "All"
              ? "bg-white text-slate-900 shadow-2xs font-extrabold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All Candidates
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search candidate by name, ID, skill, trade, experience, tags..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div>
            <select
              value={positionFilter}
              onChange={(e) => { setPositionFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white cursor-pointer font-semibold"
            >
              <option value="All">All Trade Positions</option>
              <option value="Electrician">Electrician</option>
              <option value="Welder 6G / TIG">Welder 6G / TIG</option>
              <option value="Mason / Tile Layer">Mason / Tile Layer</option>
              <option value="Civil Site Supervisor">Civil Site Supervisor</option>
              <option value="Plumber & Pipe Fitter">Plumber & Pipe Fitter</option>
              <option value="Heavy Equipment Operator">Heavy Equipment Operator</option>
            </select>
          </div>

          <div>
            <select
              value={countryFilter}
              onChange={(e) => { setCountryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white cursor-pointer font-semibold"
            >
              <option value="All">All Preferred Countries</option>
              <option value="UAE">UAE</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Qatar">Qatar</option>
              <option value="Oman">Oman</option>
              <option value="Kuwait">Kuwait</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-xs font-semibold">Loading candidates...</div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Users size={22} />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Candidates Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || positionFilter !== "All"
                ? "No candidates matched your search criteria. Try resetting filters."
                : "Add your first candidate to start submitting profiles to client projects."}
            </p>
            <Link
              to="/vendor/candidates/add"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Add Candidate</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Trade / Position</th>
                    <th className="py-3 px-4">Availability & Reusability</th>
                    <th className="py-3 px-4">Experience & Qual.</th>
                    <th className="py-3 px-4">Skills & Tags</th>
                    <th className="py-3 px-4">Pref. Country</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCandidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidate Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {c.photo ? (
                            <img
                              src={c.photo}
                              alt={c.fullName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                              {c.fullName ? c.fullName.slice(0, 2).toUpperCase() : "CD"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              to={`/vendor/candidates/${c.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 block truncate"
                            >
                              {c.fullName}
                            </Link>
                            <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                              {c.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {c.currentPosition}
                        </span>
                      </td>

                      {/* Availability & Reusability Status */}
                      <td className="py-3.5 px-4">
                        {c.poolStatus === "Rejected" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <RotateCcw size={11} className="text-rose-600 shrink-0" />
                              <span>Rejected (Reusable)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                              Prev: {c.lastProjectInfo || "Other project"}
                            </span>
                          </div>
                        ) : c.poolStatus === "On Hold" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock size={11} className="text-amber-600 shrink-0" />
                              <span>On Hold (Reusable)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                              Prev: {c.lastProjectInfo || "Other project"}
                            </span>
                          </div>
                        ) : ["Selected", "Shortlisted", "Completed"].includes(c.poolStatus) ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <UserCheck size={11} className="text-indigo-600 shrink-0" />
                              <span>{c.poolStatus}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate max-w-[140px]">
                              {c.lastProjectInfo}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                              <span>Available (Ready)</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Experience & Qualification */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Briefcase size={12} className="text-slate-400" />
                          <span>{c.experienceYears} Years Exp</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px] mt-0.5">
                          {c.qualification || "Trade Certified"}
                        </div>
                      </td>

                      {/* Skills & Tags */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(c.tags || c.skills || []).slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Preferred Country */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin size={12} className="text-blue-500" />
                          <span>{c.preferredCountry || "Gulf"}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Link
                          to={`/vendor/candidates/${c.id}`}
                          className="inline-flex items-center px-2 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye size={13} className="mr-1" />
                          <span>View</span>
                        </Link>

                        <Link
                          to={`/vendor/submit-candidate?candidateId=${c.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          title={c.poolStatus === "Rejected" || c.poolStatus === "On Hold" ? "Reuse in New Project" : "Submit to Project"}
                        >
                          {c.poolStatus === "Rejected" || c.poolStatus === "On Hold" ? (
                            <>
                              <RotateCcw size={12} className="mr-1" />
                              <span>Reuse</span>
                            </>
                          ) : (
                            <>
                              <Send size={12} className="mr-1" />
                              <span>Submit</span>
                            </>
                          )}
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.fullName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete candidate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-semibold">
                Showing <strong className="text-slate-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                <strong className="text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, candidates.length)}</strong> of{" "}
                <strong className="text-slate-800">{candidates.length}</strong> candidates
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => handlePageChange(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === pg
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Candidates;
