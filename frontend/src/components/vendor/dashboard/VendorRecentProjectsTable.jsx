import React from "react";
import { Link } from "react-router-dom";
import { FolderKanban, ArrowRight, MapPin, Users, Eye, Send } from "lucide-react";

export default function VendorRecentProjectsTable({ allProjects }) {
  const recentProjects = allProjects.slice(0, 5);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban size={16} className="text-blue-600" />
            Recent Assigned Projects (Latest 5)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Active projects accepting candidate submissions.
          </p>
        </div>

        <Link
          to="/vendor/projects"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all shadow-2xs group cursor-pointer self-start sm:self-auto"
        >
          <span>See All Projects ({allProjects.length})</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200/80">
            <tr>
              <th className="py-2 px-3 text-[10px]">Project Name</th>
              <th className="py-2 px-3 text-[10px]">Client</th>
              <th className="py-2 px-3 text-[10px]">Country</th>
              <th className="py-2 px-3 text-[10px]">Trades / Roles</th>
              <th className="py-2 px-3 text-[10px]">Headcount Req.</th>
              <th className="py-2 px-3 text-[10px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentProjects.length > 0 ? (
              recentProjects.map((proj) => {
                const trades = proj.manpowerRequirements || [];
                return (
                  <tr key={proj.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-1 px-2.5 font-bold text-slate-900 truncate max-w-[200px]">
                      <Link
                        to={`/vendor/projects/${proj.id}`}
                        className="hover:text-blue-600 hover:underline text-left font-bold transition-colors block truncate"
                      >
                        {proj.projectName}
                      </Link>
                    </td>
                    <td className="py-1 px-2.5 text-slate-700 truncate max-w-[150px]">
                      {proj.clientName}
                    </td>
                    <td className="py-1 px-2.5 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-blue-500 shrink-0" />
                        <span>{proj.country}</span>
                      </div>
                    </td>
                    <td className="py-1 px-2.5">
                      {trades.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 max-w-[280px]">
                          {trades.slice(0, 2).map((t, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                            >
                              {t.position || t.positionTitle || "Role"}
                              {t.quantity ? ` (${t.quantity})` : ""}
                            </span>
                          ))}
                          {trades.length > 2 && (
                            <Link
                              to={`/vendor/projects/${proj.id}`}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors"
                            >
                              +{trades.length - 2} more
                            </Link>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">General / All Trades</span>
                      )}
                    </td>
                    <td className="py-1 px-2.5 text-slate-700 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} className="text-slate-400" />
                        <span>{proj.totalHeadcount || "N/A"}</span>
                      </span>
                    </td>
                    <td className="py-1 px-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/vendor/projects/${proj.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                          title="View Full Project Details"
                        >
                          <Eye size={12} className="text-slate-500" />
                          <span>View</span>
                        </Link>
                        <Link
                          to={`/vendor/submit-candidate?project=${proj.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition-colors"
                        >
                          <Send size={11} />
                          <span>Submit</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-6 text-center text-slate-500 italic text-xs">
                  No active projects assigned to you at the moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {allProjects.length > 5 && (
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing 5 of {allProjects.length} assigned projects
          </span>
          <Link
            to="/vendor/projects"
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800 transition"
          >
            <span>See All Projects ({allProjects.length})</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
