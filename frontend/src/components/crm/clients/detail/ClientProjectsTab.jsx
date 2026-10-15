import React from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin, ArrowRight } from "lucide-react";
import StatusBadge from "../../ui/StatusBadge.jsx";
import { calculateProjectManpower } from "../../../../services/crmClientService.js";

export function ClientProjectsTab({ client, handleToggleProjectStatus }) {
  if (!client) return null;

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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Project Name</th>
                  <th className="py-3.5 px-4">Location / Country</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4 text-center">Required Manpower</th>
                  <th className="py-3.5 px-4">Start Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(client.projects || []).map((project) => {
                  const reqCount = calculateProjectManpower(project);
                  return (
                    <tr key={project.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
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
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 text-gray-700 font-medium">
                          <MapPin size={12} className="text-gray-400" />
                          {project.location || project.country}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {project.projectType || "General"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                          {reqCount} Persons
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {project.startDate || "—"}
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/client/clients/${client.id}/projects/${project.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>View Project</span>
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientProjectsTab;
