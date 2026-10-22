import React from "react";
import { Users } from "lucide-react";
import ManpowerTable from "../../manpower/ManpowerTable.jsx";

export function ProjectManpowerSection({
  project,
  totalRequired,
  handleManpowerChange,
}) {
  if (!project) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <span>Manpower Requirement & Headcount</span>
          </h2>
          <p className="text-xs text-gray-500">
            Total workforce requirement and allocation details for this project.
          </p>
        </div>
        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
          {totalRequired} Total Headcount
        </span>
      </div>

      {}
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/40 rounded-xl border border-blue-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
              Required Workforce Size
            </span>
            <span className="text-2xl font-bold text-blue-800 leading-none">
              {totalRequired} Persons
            </span>
            {project.workforceNotes && (
              <p className="text-xs text-blue-950 font-medium mt-1">
                Category: {project.workforceNotes}
              </p>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right sm:border-l sm:border-blue-200 sm:pl-6 text-xs text-gray-600 space-y-1">
          <div>
            <span className="text-gray-400">Project Duration: </span>
            <strong className="text-gray-900">{project.duration || "24 Months"}</strong>
          </div>
          <div>
            <span className="text-gray-400">Deployment Country: </span>
            <strong className="text-gray-900">{project.country}</strong>
          </div>
        </div>
      </div>

      {}
      {Array.isArray(project.manpowerRequirements) &&
        project.manpowerRequirements.length > 1 && (
          <ManpowerTable
            positions={project.manpowerRequirements}
            onChange={handleManpowerChange}
            currencyDefault={
              project.country === "Saudi Arabia"
                ? "SAR"
                : project.country === "Qatar"
                ? "QAR"
                : project.country === "Oman"
                ? "OMR"
                : project.country === "Kuwait"
                ? "KWD"
                : project.country === "Bahrain"
                ? "BHD"
                : project.country === "Germany"
                ? "EUR"
                : project.country === "United Kingdom"
                ? "GBP"
                : "AED"
            }
          />
        )}
    </div>
  );
}
