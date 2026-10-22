import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Plus,
  Building2,
  MapPin,
  MoreVertical,
  Eye,
  Edit2,
  Clock,
  Trash2,
  Edit3,
  ArrowRight,
} from "lucide-react";
import StatusBadge from "../ui/StatusBadge.jsx";
import LoadingSkeleton from "../ui/LoadingSkeleton.jsx";

export default function ProjectsTableView({
  projects,
  loading,
  search,
  statusFilter,
  clientFilter,
  onToggleStatus,
  onEditProject,
  onDeleteProject,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
      {loading ? (
        <div className="p-6">
          <LoadingSkeleton count={4} />
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-3">
            <FolderKanban size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-900">No Projects Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "All" || clientFilter !== "All"
              ? "Try clearing your filters or search keywords."
              : "No projects have been registered under clients yet."}
          </p>
          <div className="mt-4">
            <Link
              to="/client/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              <Plus size={15} />
              <span>Add First Project</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto min-h-[340px] pb-16">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3">Project ID</th>
                  <th className="py-2 px-3">Project Name & Type</th>
                  <th className="py-2 px-3">Client Company</th>
                  <th className="py-2 px-3">Country & Location</th>
                  <th className="py-2 px-3 text-center">Headcount</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((proj, idx) => {
                  const isNearBottom = projects.length > 4 && idx >= projects.length - 2;
                  const isMenuOpen = openMenuId === proj.id;

                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="py-1.5 px-3 font-mono font-bold text-blue-700 text-xs">
                        <Link
                          to={`/client/projects/${proj.id}`}
                          className="hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                        >
                          {proj.id}
                        </Link>
                      </td>

                      <td className="py-1.5 px-3">
                        <Link
                          to={`/client/projects/${proj.id}`}
                          className="font-bold text-gray-900 hover:text-blue-600 block text-xs"
                        >
                          {proj.projectName}
                        </Link>
                        <span className="text-[11px] text-gray-400">
                          {proj.projectType || "General"} • {proj.duration || "24 Months"}
                        </span>
                      </td>

                      <td className="py-1.5 px-3">
                        <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <Building2 size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{proj.clientName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID: {proj.clientId}
                        </span>
                      </td>

                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <MapPin size={13} className="text-blue-500 shrink-0" />
                          <span>{proj.country}</span>
                        </div>
                        {proj.location && (
                          <span className="text-[11px] text-gray-400 block truncate max-w-[150px]">
                            {proj.location}
                          </span>
                        )}
                      </td>

                      <td className="py-1.5 px-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-bold text-xs border border-blue-200">
                          {proj.totalManpower} Persons
                        </span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {proj.manpowerRequirements?.length || 0} Trades
                        </span>
                      </td>

                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={proj.status} size="sm" />
                          <button
                            type="button"
                            onClick={(e) =>
                              onToggleStatus(e, proj.clientId, proj.id, proj.status)
                            }
                            className="px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 rounded transition-colors cursor-pointer"
                            title={`Click to set ${proj.status === "Active" ? "Inactive" : "Active"}`}
                          >
                            {proj.status === "Active" ? "Set Inactive" : "Set Active"}
                          </button>
                        </div>
                      </td>

                      <td className="py-1.5 px-3 text-center">
                        <div className="relative inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(isMenuOpen ? null : proj.id)
                            }
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                              isMenuOpen
                                ? "bg-blue-100 text-blue-700 font-bold shadow-xs"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div
                                className={`absolute right-0 ${
                                  isNearBottom
                                    ? "bottom-full mb-1.5"
                                    : "top-full mt-1.5"
                                } w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-50 text-xs text-left divide-y divide-gray-100`}
                              >
                                <div className="py-1">
                                  <Link
                                    to={`/client/projects/${proj.id}`}
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                                  >
                                    <Eye size={14} className="text-gray-400" />
                                    <span>View Details</span>
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEditProject(proj);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors cursor-pointer font-medium"
                                  >
                                    <Edit2 size={14} className="text-gray-400" />
                                    <span>Edit Project</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      setOpenMenuId(null);
                                      onToggleStatus(e, proj.clientId, proj.id, proj.status);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors cursor-pointer font-medium"
                                  >
                                    <Clock size={14} className="text-gray-400" />
                                    <span>
                                      {proj.status === "Active" ? "Set Inactive" : "Set Active"}
                                    </span>
                                  </button>
                                </div>
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onDeleteProject(proj);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer font-semibold"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete Project</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100">
            {projects.map((proj) => (
              <div key={proj.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {proj.id}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 mt-1">
                      {proj.projectName}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {proj.projectType} • {proj.duration || "24 Months"}
                    </p>
                  </div>
                  <StatusBadge status={proj.status} size="sm" />
                </div>

                <div className="bg-gray-50/80 rounded-lg p-2.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Client:</span>
                    <span className="font-bold text-gray-800 truncate max-w-[180px]">
                      {proj.clientName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="font-semibold text-gray-800">
                      {proj.location ? `${proj.location}, ` : ""}
                      {proj.country}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Manpower:</span>
                    <span className="font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded text-[11px]">
                      {proj.totalManpower} Persons ({proj.manpowerRequirements?.length || 0} Trades)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) =>
                        onToggleStatus(e, proj.clientId, proj.id, proj.status)
                      }
                      className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {proj.status === "Active" ? "Set Inactive" : "Set Active"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditProject(proj)}
                      className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
                      title="Edit Project"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj)}
                      className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <Link
                    to={`/client/projects/${proj.id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                  >
                    <span>View</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
