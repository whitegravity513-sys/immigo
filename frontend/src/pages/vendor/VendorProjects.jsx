import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Building2,
  MapPin,
  Users,
  Search,
  Filter,
  Eye,
  Send,
  Calendar,
  Clock,
  Briefcase,
  Globe,
  List,
  LayoutGrid,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

export default function VendorProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("All");
  const [viewMode, setViewMode] = useState("list"); // Default to list view as requested

  const vendor = crmVendorService.getCurrentVendor();

  useEffect(() => {
    loadProjects();
  }, [vendor?.id]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await crmVendorService.getAvailableProjects(vendor?.id);
      setProjects(data || []);
    } catch (err) {
      console.error("Failed to load available projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const countries = Array.from(new Set(projects.map((p) => p.country).filter(Boolean)));

  const filteredProjects = projects.filter((p) => {
    if (countryFilter !== "All" && p.country?.toLowerCase() !== countryFilter.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.projectName?.toLowerCase().includes(q);
      const matchClient = p.clientName?.toLowerCase().includes(q);
      const matchCountry = p.country?.toLowerCase().includes(q);
      const matchLocation = p.location?.toLowerCase().includes(q);
      const matchTrade = (p.manpowerRequirements || []).some((r) =>
        (r.position || r.positionTitle || "").toLowerCase().includes(q)
      );
      return matchName || matchClient || matchCountry || matchLocation || matchTrade;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Assigned Overseas Projects
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse and view active international client manpower demand projects.
          </p>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, client, country, trade position..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Country Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Globe size={14} className="text-blue-600" />
            <span>Country:</span>
          </div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="All">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* List / Grid View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 ml-auto md:ml-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Table List View"
            >
              <List size={14} />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={14} />
              <span>Grid View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Content */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading assigned overseas projects...
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FolderKanban size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No projects matched your search criteria. Check back soon for new international demands.
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* TABLE / LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban size={16} className="text-blue-600" />
              <h2 className="text-sm font-extrabold text-slate-900">
                All Available Projects List ({filteredProjects.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Showing active client demands
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Project & ID</th>
                  <th className="py-3 px-4">Client / Employer</th>
                  <th className="py-3 px-4">Country & Location</th>
                  <th className="py-3 px-4">Required Trades & Roles</th>
                  <th className="py-3 px-4 text-center">Vacancies</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((proj) => {
                  const trades = proj.manpowerRequirements || [];
                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Project Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Link
                            to={`/vendor/projects/${proj.id}`}
                            className="font-extrabold text-slate-900 text-xs hover:text-blue-600 transition-colors block"
                          >
                            {proj.projectName}
                          </Link>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-400">
                              ID: {proj.id}
                            </span>
                            {proj.startDate && (
                              <span className="text-[10px] text-slate-400">
                                &bull; Start: {proj.startDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Building2 size={13} className="text-blue-600 shrink-0" />
                          <span className="truncate max-w-[140px]">{proj.clientName}</span>
                        </div>
                      </td>

                      {/* Country & Location */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200/80">
                            <MapPin size={10} className="text-blue-500" />
                            <span>{proj.country || "Overseas"}</span>
                          </span>
                          {proj.location && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-[130px]">
                              {proj.location}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trades */}
                      <td className="py-3.5 px-4">
                        {trades.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1 max-w-[280px]">
                            {trades.slice(0, 3).map((t, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                              >
                                {t.position || t.positionTitle || "Role"}
                                {t.quantity ? ` (${t.quantity})` : ""}
                              </span>
                            ))}
                            {trades.length > 3 && (
                              <Link
                                to={`/vendor/projects/${proj.id}`}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors"
                              >
                                +{trades.length - 3} more
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            General Demands
                          </span>
                        )}
                      </td>

                      {/* Headcount */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <Users size={12} className="text-blue-600" />
                          <span>{proj.totalHeadcount || "Open"}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{proj.status || "Active Demand"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <Link
                            to={`/vendor/projects/${proj.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition shadow-2xs"
                            title="View Project Dossier"
                          >
                            <Eye size={12} className="text-slate-500" />
                            <span>View</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((proj) => {
            const trades = proj.manpowerRequirements || [];
            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Tags */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {proj.country || "Overseas"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {proj.status || "Active Demand"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {proj.id}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1.5 leading-snug">
                        {proj.projectName}
                      </h3>
                      <p className="text-xs text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Building2 size={13} className="shrink-0" />
                        <span>{proj.clientName}</span>
                      </p>
                    </div>

                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Briefcase size={20} />
                    </div>
                  </div>

                  {/* Location & Duration info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Location
                      </span>
                      <span className="text-slate-700 font-semibold truncate block">
                        {proj.location || proj.country || "On-site Deployment"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Total Vacancies
                      </span>
                      <span className="text-slate-900 font-extrabold flex items-center gap-1">
                        <Users size={12} className="text-blue-600" />
                        <span>{proj.totalHeadcount || "Open Demands"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Trades Required */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                      Required Trade Positions ({trades.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {trades.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-200/60 text-indigo-900 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <span>{t.position || t.positionTitle || "Specialist"}</span>
                          {t.quantity ? (
                            <span className="font-bold text-indigo-600">({t.quantity})</span>
                          ) : null}
                          {t.salary ? (
                            <span className="text-[10px] text-slate-500 font-mono">
                              &bull; {t.currency || ""} {t.salary}
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <Link
                    to={`/vendor/projects/${proj.id}`}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Eye size={13} className="text-slate-500" />
                    <span>View Project Dossier</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

