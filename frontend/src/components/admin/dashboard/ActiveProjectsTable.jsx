import { Link } from "react-router-dom";
import { FolderKanban, ArrowRight, MapPin } from "lucide-react";
import StatusBadge from "../../crm/ui/StatusBadge.jsx";

export default function ActiveProjectsTable({ projectsList }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col h-full">
      <div className="p-2.5 sm:p-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban size={17} className="text-indigo-600" />
            Active Projects Pipeline (Latest 5)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Live tracking of overseas manpower deployment demands</p>
        </div>
        <Link
          to="/client/projects"
          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <span>See All ({projectsList.length})</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto">
        {projectsList.length === 0 ? (
          <div className="p-8 text-center text-xs font-medium text-slate-500 flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
              <FolderKanban size={20} className="text-slate-300" />
            </div>
            No active projects.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-1.5 px-3">Project</th>
                <th className="py-1.5 px-3">Client</th>
                <th className="py-1.5 px-3 text-center">Positions</th>
                <th className="py-1.5 px-3">Status</th>
                <th className="py-1.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectsList.slice(0, 5).map((proj) => (
                <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-1.5 px-3">
                    <span className="font-bold text-slate-800 block group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">
                      {proj.projectName}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-slate-400" /> {proj.country}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 truncate max-w-[140px]">
                    {proj.clientName}
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                      {proj.requiredManpower} Reqs
                    </span>
                  </td>
                  <td className="py-1.5 px-3">
                    <StatusBadge status={proj.status} size="sm" />
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    <Link
                      to={`/client/clients/${proj.clientId}/projects/${proj.id}`}
                      className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors ml-auto shadow-2xs"
                      title="View Project"
                    >
                      <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {projectsList.length > 5 && (
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing 5 of {projectsList.length} active projects
          </span>
          <Link
            to="/client/projects"
            className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>See All Projects ({projectsList.length})</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}

