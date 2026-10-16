import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  MapPin,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Clock,
} from "lucide-react";
import StatusBadge from "../../ui/StatusBadge.jsx";
import DeleteConfirmModal from "../../../../components/common/DeleteConfirmModal.jsx";
import crmClientService, {
  calculateProjectManpower,
} from "../../../../services/crmClientService.js";

export function ClientProjectsTab({ client, handleToggleProjectStatus }) {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteTargetProject, setDeleteTargetProject] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!client) return null;

  const handleDelete = async () => {
    if (!deleteTargetProject) return;
    setIsDeleting(true);
    try {
      await crmClientService.deleteProject(client.id, deleteTargetProject.id);
      setDeleteTargetProject(null);
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Deployment Projects</h3>
          <p className="text-xs text-gray-500">
            Active foreign project sites and manpower demand agreements.
          </p>
        </div>
        <Link
          to={`/client/clients/${client.id}/projects/new`}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>Create Project / Requirement</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {(client.projects || []).length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 space-y-3">
            <p>No projects registered for this client yet.</p>
            <Link
              to={`/client/clients/${client.id}/projects/new`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus size={14} />
              <span>Create First Project / Requirement</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[300px] pb-16">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2 px-3 text-[10px] sm:px-6">Project Name</th>
                  <th className="py-2 px-3 text-[10px]">Location / Country</th>
                  <th className="py-2 px-3 text-[10px]">Type</th>
                  <th className="py-2 px-3 text-[10px] text-center">Required Manpower</th>
                  <th className="py-2 px-3 text-[10px]">Start Date</th>
                  <th className="py-2 px-3 text-[10px]">Status</th>
                  <th className="py-2 px-3 text-[10px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(client.projects || []).map((project, idx) => {
                  const reqCount = calculateProjectManpower(project);
                  const isNearBottom =
                    (client.projects || []).length > 4 &&
                    idx >= (client.projects || []).length - 2;
                  const isMenuOpen = openMenuId === project.id;

                  return (
                    <tr key={project.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-1.5 px-3 sm:px-6">
                        <Link
                          to={`/client/clients/${client.id}/projects/${project.id}`}
                          className="font-bold text-gray-900 hover:text-blue-600 text-xs block"
                        >
                          {project.projectName}
                        </Link>
                        <span className="text-[11px] text-gray-400">
                          Duration: {project.duration || "24 Months"}
                        </span>
                      </td>
                      <td className="py-1.5 px-3">
                        <span className="flex items-center gap-1 text-gray-700 font-medium">
                          <MapPin size={12} className="text-gray-400" />
                          {project.location || project.country}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-gray-600 font-medium">
                        {project.projectType || "General"}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                          {reqCount} Persons
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-gray-600">
                        {project.startDate || "—"}
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={project.status} size="sm" />
                          <button
                            type="button"
                            onClick={() => handleToggleProjectStatus(project.id)}
                            className="px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 rounded transition-colors cursor-pointer"
                            title={`Switch status to ${
                              project.status === "Active" ? "Inactive" : "Active"
                            }`}
                          >
                            {project.status === "Active" ? "Set Inactive" : "Set Active"}
                          </button>
                        </div>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <div className="relative inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(isMenuOpen ? null : project.id)
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
                                    to={`/client/clients/${client.id}/projects/${project.id}`}
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                                  >
                                    <Eye size={14} className="text-gray-400" />
                                    <span>View Details</span>
                                  </Link>
                                  <Link
                                    to={`/client/clients/${client.id}/projects/${project.id}/edit`}
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                                  >
                                    <Edit2 size={14} className="text-gray-400" />
                                    <span>Edit Project</span>
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleToggleProjectStatus(project.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors cursor-pointer font-medium"
                                  >
                                    <Clock size={14} className="text-gray-400" />
                                    <span>
                                      {project.status === "Active"
                                        ? "Set Inactive"
                                        : "Set Active"}
                                    </span>
                                  </button>
                                </div>
                                <div className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDeleteTargetProject(project);
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
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteTargetProject !== null}
        onClose={() => setDeleteTargetProject(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTargetProject?.projectName}"? All trade requirements under this project will be removed.`}
        itemName={deleteTargetProject?.projectName}
        loading={isDeleting}
        confirmText="Delete Project"
      />
    </div>
  );
}

export default ClientProjectsTab;
