import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FolderKanban,
  Building2,
  MapPin,
  Users,
  Edit2,
  Trash2,
} from "lucide-react";
import StatusBadge from "../../ui/StatusBadge.jsx";

export function ProjectDetailHeader({
  project,
  client,
  clientId,
  totalRequired,
  handleToggleStatus,
  setDeleteModalOpen,
}) {
  if (!project) return null;

  return (
    <>
      {}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
        <Link
          to={`/client/clients/${client?.id || clientId || project.clientId}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Client Organization</span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link to="/client/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/client/projects" className="hover:text-blue-600 transition-colors">
            Projects
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold">{project.projectName}</span>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-bold text-xl flex items-center justify-center shrink-0">
              <FolderKanban size={28} />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {project.projectName}
                </h1>
                <StatusBadge status={project.status} />
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                  title={`Switch status to ${project.status === "Active" ? "Inactive" : "Active"}`}
                >
                  Mark as {project.status === "Active" ? "Inactive" : "Active"}
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium text-gray-700 bg-gray-100/80 px-2.5 py-1 rounded-md">
                  <Building2 size={13} className="text-blue-600" />
                  <span>Company:</span>
                  <strong className="text-gray-900 font-bold">
                    {client?.companyName || project.clientName || "Authorized Client"}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <MapPin size={13} className="text-blue-500" />
                  {project.location || project.country}, {project.country}
                </span>
                <span>•</span>
                <span>
                  Type: <strong className="text-gray-700">{project.projectType || "General"}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start md:self-auto flex-wrap">
            {}
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Users size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                  Total Required Headcount
                </span>
                <span className="text-xl font-bold text-blue-700 leading-tight">
                  {Number(totalRequired || 0).toLocaleString()} Persons
                </span>
              </div>
            </div>

            {}
            <div className="flex items-center gap-2">
              <Link
                to={`/client/clients/${client?.id || clientId || project.clientId}/projects/${project.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Edit2 size={14} />
                <span>Edit Project</span>
              </Link>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
