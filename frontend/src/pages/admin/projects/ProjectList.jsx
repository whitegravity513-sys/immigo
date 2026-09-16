import React from "react";
import {
  Search, Folder, ArrowRight, User, IndianRupee, Briefcase,
  AlertCircle, CheckCircle, Trash2, Calendar, Phone, Mail
} from "lucide-react";
import { useProjectList } from "../../../hooks/useProjectList";

export default function ProjectList({ onSelectProject }) {
  const {
    projects,
    searchQuery,
    loading,
    errorMsg,
    successMsg,
    handleSearchChange,
    handleDelete,
    activeProjectsCount,
    inactiveProjectsCount
  } = useProjectList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
            <Folder className="text-green-600" size={24} />
            Projects Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search projects by name, sales person, or client. Click on any project to view complete details, edit, generate invoice or track part payments.
          </p>
          {!loading && (
            <div className="flex gap-4 mt-3">
              <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                Total Projects: <span className="text-slate-900">{projects.length}</span>
              </div>
              <div className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                Active: <span>{activeProjectsCount}</span>
              </div>
              <div className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                Inactive / Completed: <span>{inactiveProjectsCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium">
          <CheckCircle size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search projects by Project Name, Project ID (e.g. PRJ-1001), Client, or Sales Person..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Projects Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="px-4 py-4">Project ID</th>
                <th className="px-4 py-4">Project Name</th>
                <th className="px-4 py-4">Client</th>
                <th className="px-4 py-4">Project Type</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Sales / Lead</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                    No projects found matching your search.
                  </td>
                </tr>
              ) : (
                projects.map((proj) => (
                  <tr
                    key={proj._id}
                    onClick={() => onSelectProject && onSelectProject(proj)}
                    className="hover:bg-green-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4 font-mono font-bold text-green-700 text-xs whitespace-nowrap">
                      {proj.projectId}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800 group-hover:text-green-700 transition-colors">
                        {proj.projectName}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800">
                        {proj.client?.name || proj.clientName || "-"}
                      </div>
                      {(proj.client?.companyName || proj.client?.company || proj.companyName) && (
                        <div className="text-[11px] font-bold text-slate-600 mt-0.5 flex items-center gap-1">
                          <Briefcase size={12} className="text-slate-400" />
                          {proj.client?.companyName || proj.client?.company || proj.companyName}
                        </div>
                      )}
                      {(proj.client?.mobile || proj.client?.phone || proj.client?.email) && (
                        <div className="text-[10px] text-slate-500 mt-1.5 flex flex-col gap-0.5">
                           {(proj.client?.mobile || proj.client?.phone) && (
                             <span className="flex items-center gap-1">
                               <Phone size={10} className="text-green-600" /> {proj.client?.mobile || proj.client?.phone}
                             </span>
                           )}
                           {proj.client?.email && (
                             <span className="flex items-center gap-1">
                               <Mail size={10} className="text-slate-400" /> {proj.client?.email}
                             </span>
                           )}
                        </div>
                      )}
                      {(proj.client?.gstPan) && (
                         <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                           GST/PAN: {proj.client.gstPan}
                         </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-700 whitespace-nowrap">
                      {proj.projectType || "-"}
                      {proj.industryName && <div className="text-[10px] font-medium text-slate-500 mt-0.5">{proj.industryName}</div>}
                    </td>
                    <td className="px-4 py-4">
                      {proj.status ? (
                        <span className={`inline-block px-2.5 py-1.5 text-[10px] font-bold uppercase rounded-md border whitespace-nowrap ${
                          proj.status === "Completed" || proj.status === "Inactive"
                            ? "bg-slate-100 text-slate-600 border-slate-300"
                            : proj.status === "Cancelled"
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : proj.status === "On Hold"
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                        }`}>
                          {proj.status}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-slate-800">
                          {proj.salesPerson || "-"}
                        </span>
                      </div>
                      {proj.leadSource && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Lead: {proj.leadSource}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-black text-slate-800 whitespace-nowrap">
                      ₹{(proj.budget || proj.totalAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs font-bold text-green-600 group-hover:underline flex items-center gap-1">
                          Open Details <ArrowRight size={14} />
                        </span>
                        <button
                          onClick={(e) => handleDelete(e, proj._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
