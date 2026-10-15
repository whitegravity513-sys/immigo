import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../../ui/StatusBadge.jsx";
import { calculateProjectManpower } from "../../../../services/crmClientService.js";

export function ClientManpowerTab({ client }) {
  if (!client) return null;

  return (
    <div className="space-y-6">
      {(client.projects || []).map((proj) => {
        const positions = proj.manpowerRequirements || [];
        const projTotal = calculateProjectManpower(proj);

        return (
          <div
            key={proj.id}
            className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden"
          >
            <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/clients/${client.id}/projects/${proj.id}`}
                    className="text-sm font-bold text-gray-900 hover:text-blue-600"
                  >
                    {proj.projectName}
                  </Link>
                  <StatusBadge status={proj.status} size="sm" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {proj.location} • {proj.country}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Project Headcount:
                </span>
                <span className="text-sm font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-lg">
                  {projTotal} Persons
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {positions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No trade requirements defined under this project yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3">Position</th>
                        <th className="py-2.5 px-3 text-center">Quantity</th>
                        <th className="py-2.5 px-3">Experience</th>
                        <th className="py-2.5 px-3">Qualification</th>
                        <th className="py-2.5 px-3 text-center">Age Range</th>
                        <th className="py-2.5 px-3 text-right">Salary</th>
                        <th className="py-2.5 px-3">Working Hours</th>
                        <th className="py-2.5 px-3">Overtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {positions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-blue-50/20">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            {pos.position}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                              {pos.quantity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 font-medium">
                            {pos.experience || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {pos.qualification || "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center text-gray-600">
                            {pos.minAge && pos.maxAge
                              ? `${pos.minAge}-${pos.maxAge} Yrs`
                              : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                            {pos.salary
                              ? `${pos.currency || "AED"} ${Number(pos.salary || 0).toLocaleString()}`
                              : "Negotiable"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 text-[11px]">
                            {pos.workingHours || "8 hrs/day"}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 text-[11px]">
                            {pos.overtime || "Available"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ClientManpowerTab;
