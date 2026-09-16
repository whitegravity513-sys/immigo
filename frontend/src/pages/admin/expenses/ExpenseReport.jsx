import React from "react";
import { Download, Filter, Calendar, IndianRupee , Tag, Trash2, Edit2, AlertCircle, Check, X, FileSpreadsheet, TrendingUp, TrendingDown, Layers } from "lucide-react";
import { useExpenseReport } from "../../../hooks/useExpenseReport";

export default function ExpenseReport() {
  const {
    MONTHS,
    month,
    setMonth,
    year,
    setYear,
    categoryFilter,
    setCategoryFilter,
    categories,
    expenses,
    loading,
    errorMsg,
    successMsg,
    editingId,
    editForm,
    setEditForm,
    handleDelete,
    startEdit,
    cancelEdit,
    handleUpdate,
    exportToExcel
  } = useExpenseReport();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-green-600" />
            <span>Monthly Expense Reports</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Filter transaction logs by month/year and export records to Excel (.xlsx).
          </p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={expenses.length === 0}
          className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer text-sm shrink-0 ${
            expenses.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <FileSpreadsheet size={18} />
          <span>Download Excel</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Bar Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 border-t-4 border-t-green-600">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300">
            <Calendar size={15} className="text-green-600" />
            <span className="text-xs font-bold uppercase text-slate-500">Period:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent text-slate-800 font-bold text-sm focus:outline-none cursor-pointer pr-1"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-slate-800 font-bold text-sm border-l border-slate-300 pl-2 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300">
            <Tag size={15} className="text-green-600" />
            <span className="text-xs font-bold uppercase text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-bold text-sm focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-slate-900">{expenses.length}</span> records
        </div>
      </div>


      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Monthly Transaction Log</h3>
          <span className="text-xs font-semibold text-slate-500">
            {MONTHS.find(m => m.value === month)?.label} {year}
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading expense records...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Calendar size={28} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium">No records found for the selected filter.</p>
            <p className="text-xs text-slate-400 mt-1">Try changing the month or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-600">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Name / Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-3">Total GST</th>
                  <th className="py-3 px-3">CGST</th>
                  <th className="py-3 px-3">SGST</th>
                  <th className="py-3 px-3">IGST</th>
                  <th className="py-3 px-4">HSN/SAC</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {expenses.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                    {editingId === item._id ? (
                      <td colSpan={12} className="p-4 bg-green-50/40 border-y border-green-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Date</label>
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Name</label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs"
                            >
                              {categories.map((c) => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                              ))}
                              <option value="General">General</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Amount</label>
                            <input
                              type="number"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">GST Text</label>
                            <input
                              type="text"
                              value={editForm.gst || ""}
                              onChange={(e) => setEditForm({ ...editForm, gst: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">CGST Text</label>
                            <input
                              type="text"
                              value={editForm.cgst || ""}
                              onChange={(e) => setEditForm({ ...editForm, cgst: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">SGST Text</label>
                            <input
                              type="text"
                              value={editForm.sgst || ""}
                              onChange={(e) => setEditForm({ ...editForm, sgst: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">IGST Text</label>
                            <input
                              type="text"
                              value={editForm.igst || ""}
                              onChange={(e) => setEditForm({ ...editForm, igst: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </div>
                          <div className="flex items-end gap-2 md:col-span-4 justify-end mt-2">
                            <button
                              onClick={handleUpdate}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={14} /> Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1 px-3 rounded text-xs flex items-center cursor-pointer"
                            >
                              <X size={14} /> Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800">{item.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">{item.name}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category || "General"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              item.type === "Expense"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : item.type === "Income"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {item.type || "Expense"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ₹{Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{item.gst || "-"}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{item.cgst || "-"}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{item.sgst || "-"}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{item.igst || "-"}</td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.hsnSac || "-"}</td>
                        <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate" title={item.description}>
                          {item.description || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
