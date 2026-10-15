import React from "react";
import { Building2 } from "lucide-react";

export function ProjectInfoCard({ project, client, totalRequired }) {
  if (!project) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
      <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
        Project Information
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-400 block text-[11px]">Client Company</span>
          <span className="font-semibold text-gray-900 flex items-center gap-1 mt-0.5">
            <Building2 size={13} className="text-blue-600 shrink-0" />
            <span>{client?.companyName || project.clientName || "—"}</span>
          </span>
        </div>

        <div>
          <span className="text-gray-400 block text-[11px]">Project Name</span>
          <span className="font-semibold text-gray-900">{project.projectName}</span>
        </div>

        <div>
          <span className="text-gray-400 block text-[11px]">Project Type</span>
          <span className="font-semibold text-gray-900">{project.projectType || "—"}</span>
        </div>

        <div>
          <span className="text-gray-400 block text-[11px]">Country</span>
          <span className="font-semibold text-gray-900">{project.country}</span>
        </div>

        <div>
          <span className="text-gray-400 block text-[11px]">Location / Site</span>
          <span className="font-semibold text-gray-900">{project.location || "—"}</span>
        </div>

        <div>
          <span className="text-gray-400 block text-[11px]">Start Date</span>
          <span className="font-semibold text-gray-900">{project.startDate || "—"}</span>
        </div>

        <div>
          <span className="text-gray-400 block text-[11px]">Expected Duration</span>
          <span className="font-semibold text-gray-900">{project.duration || "—"}</span>
        </div>

        <div>
          <span className="text-gray-400 block text-[11px]">Required Headcount</span>
          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
            {totalRequired} Persons
          </span>
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <span className="text-gray-400 block text-[11px]">Description</span>
          <span className="text-gray-700 leading-relaxed">
            {project.description || "No description provided."}
          </span>
        </div>
      </div>
    </div>
  );
}
