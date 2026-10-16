import React from "react";
import { Gift, CheckCircle, FileText } from "lucide-react";

export function ProjectFacilitiesSection({ project }) {
  if (!project) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Gift size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">
            Employee Benefits & Facilities
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {(project.benefits || []).map((benefit) => (
            <span
              key={benefit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
            >
              <CheckCircle size={13} className="text-emerald-600" />
              <span>{benefit}</span>
            </span>
          ))}
        </div>

        {project.otherBenefits && (
          <div className="pt-3 border-t border-gray-100 text-xs">
            <span className="text-gray-400 block text-[11px] font-semibold uppercase tracking-wider">
              Other Benefits / Allowances:
            </span>
            <p className="text-gray-700 mt-1">{project.otherBenefits}</p>
          </div>
        )}
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <FileText size={16} className="text-blue-600" />
          <h3 className="text-sm font-bold text-gray-900">
            Additional Requirements & Guidelines
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          {project.additionalRequirements?.requiredDocuments && (
            <div>
              <span className="text-gray-400 block text-[11px]">Required Documents:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {project.additionalRequirements.requiredDocuments}
              </p>
            </div>
          )}

          {project.additionalRequirements?.specialSkills && (
            <div>
              <span className="text-gray-400 block text-[11px]">Special Skills:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {project.additionalRequirements.specialSkills}
              </p>
            </div>
          )}

          {project.additionalRequirements?.languageRequirements && (
            <div>
              <span className="text-gray-400 block text-[11px]">Language Requirements:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {project.additionalRequirements.languageRequirements}
              </p>
            </div>
          )}

          {project.additionalRequirements?.medicalRequirements && (
            <div>
              <span className="text-gray-400 block text-[11px]">Medical Requirements:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {project.additionalRequirements.medicalRequirements}
              </p>
            </div>
          )}

          {project.additionalRequirements?.otherInstructions && (
            <div>
              <span className="text-gray-400 block text-[11px]">Other Instructions:</span>
              <p className="text-gray-800 font-medium mt-0.5">
                {project.additionalRequirements.otherInstructions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
