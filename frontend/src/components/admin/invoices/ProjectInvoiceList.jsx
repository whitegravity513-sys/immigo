import React from "react";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";

export default function ProjectInvoiceList({
  searchQuery,
  setSearchQuery,
  setActiveTab,
  filteredInvoices,
  project,
  clientNameVal,
  companyNameVal,
  setSelectedInvoice,
  handleEditInvoice,
  handleDeleteInvoice
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by Invoice ID, Project or Client..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-green-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setActiveTab("create")}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} /> Generate Invoice
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">Invoice ID</th>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Client / Company</th>
              <th className="px-6 py-4">Invoice Date</th>
              <th className="px-6 py-4">Total Amount</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <tr
                  key={inv._id}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <td className="px-6 py-4 font-mono font-bold text-green-700">
                    {inv.invoiceNo}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {inv.projectName || project?.projectName || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">
                      {inv.clientName || clientNameVal || "—"}
                    </div>
                    {(inv.companyName || companyNameVal) && (
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        Company: {inv.companyName || companyNameVal}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {inv.date}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900 text-base">
                    ₹{(inv.totalAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-green-50 hover:text-green-700 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => handleEditInvoice(inv)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Edit Invoice"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv._id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer inline-flex items-center"
                        title="Delete Invoice"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                  No invoices found for this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
