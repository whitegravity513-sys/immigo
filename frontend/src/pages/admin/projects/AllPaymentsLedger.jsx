import React from "react";
import {
  IndianRupee, Search, Filter, Calendar, Edit, Trash2, ArrowUpRight,
  CheckCircle, AlertCircle, RefreshCw, Briefcase, User, FileText,
  Tag, Download, Eye
} from "lucide-react";
import { useAllPaymentsLedger } from "../../../hooks/useAllPaymentsLedger";

const getModeBadgeClass = (mode = "") => {
  const m = mode.toLowerCase();
  if (m.includes("upi")) return "bg-purple-100 text-purple-800 border-purple-200";
  if (m.includes("cash")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (m.includes("cheque")) return "bg-amber-100 text-amber-800 border-amber-200";
  if (m.includes("card")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
};

export default function AllPaymentsLedger({ onSelectProject }) {
  const {
    loading,
    errorMsg,
    successMsg,
    searchQuery,
    setSearchQuery,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    editingPayment,
    setEditingPayment,
    editLoading,
    filteredPayments,
    totalReceived,
    totalTransactions,
    uniqueProjectsCount,
    fetchAllPayments,
    handleUpdatePayment,
    handleDeletePayment
  } = useAllPaymentsLedger();

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-green-600 from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-black-500/10 border border-black-500/30 rounded-full text-black-400 text-xs font-extrabold uppercase tracking-wider">
            <IndianRupee size={13} /> Global Payment Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            All Projects Payment Ledger
          </h1>
          <p className="text-sm text-slate-100 max-w-2xl">
            Complete sequential payment history across all projects. Most recent receipts are displayed at the top.
          </p>
        </div>
        <button
          onClick={fetchAllPayments}
          disabled={loading}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh Ledger
        </button>
      </div>

      {/* Notifications */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden group hover:border-green-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Received</span>
            <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-3">
            ₹{totalReceived.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-slate-500 mt-1">Sum of filtered payment transactions</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions Count</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-3">
            {totalTransactions}
          </div>
          <p className="text-xs text-slate-500 mt-1">Total receipts in ledger</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Projects</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Briefcase size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-3">
            {uniqueProjectsCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Projects with payment records</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Payment ID (e.g. 0001, PAY-0002), Project, Client or Description..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-slate-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-slate-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>
          {(searchQuery || fromDate || toDate) && (
            <button
              onClick={() => { setSearchQuery(""); setFromDate(""); setToDate(""); }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Payments Ledger ({filteredPayments.length})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[11px] font-black">
              Recent First
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <span className="text-xs font-bold">Loading payment records...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <IndianRupee size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600">No payment records found</p>
            <p className="text-xs mt-1 text-slate-400">
              {searchQuery || fromDate || toDate
                ? "Try adjusting your search or date filters."
                : "No part payments have been recorded across projects yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3.5">Payment ID</th>
                  <th className="px-6 py-3.5">Date Received</th>
                  <th className="px-6 py-3.5">Project & Client</th>
                  <th className="px-6 py-3.5">Amount (₹)</th>
                  <th className="px-6 py-3.5">Mode of Payment</th>
                  <th className="px-6 py-3.5">TDS / Taxes</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPayments.map((p, index) => {
                  const proj = p.project || {};
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Payment ID Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700 font-mono font-black text-xs">
                          {p.paymentId || `PAY-${String(filteredPayments.length - index).padStart(3, '0')}`}
                        </span>
                      </td>

                      {/* Payment Date */}
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-700 text-xs">
                        {p.date || (p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "-")}
                      </td>

                      {/* Project & Client info */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div
                            onClick={() => proj._id && onSelectProject && onSelectProject(proj)}
                            className="font-bold text-slate-800 hover:text-green-600 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>{proj.projectName || "Unknown Project"}</span>
                            {proj._id && <ArrowUpRight size={14} className="text-slate-400" />}
                          </div>
                          {proj.projectType && (
                            <div className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 inline-block">
                              {proj.projectType}
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5 text-xs mt-1">
                            {(proj.clientName || proj.client?.name) && (
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                <User size={11} /> {proj.client?.name || proj.clientName}
                              </span>
                            )}
                            {(proj.client?.companyName || proj.companyName) && (
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <Briefcase size={10} className="text-slate-400" />
                                {proj.client?.companyName || proj.companyName}
                              </span>
                            )}
                            {(proj.client?.mobile || proj.client?.phone) && (
                              <span className="inline-flex items-center gap-1 text-green-700 text-[10px]">
                                📞 {proj.client?.mobile || proj.client?.phone}
                              </span>
                            )}
                            {proj.client?.email && (
                              <span className="inline-flex items-center gap-1 text-slate-500 text-[10px]">
                                ✉️ {proj.client.email}
                              </span>
                            )}
                            {proj.client?.gstPan && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                GST/PAN: {proj.client.gstPan}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900 text-base">
                        ₹{(p.amount || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Mode of Payment */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs ${getModeBadgeClass(p.paymentMode || "Bank Transfer")}`}>
                          {p.paymentMode || "Bank Transfer"}
                        </span>
                      </td>

                      {/* TDS and Taxes */}
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {Number(p.tdsDeducted) > 0 ? (
                          <div className="text-amber-700 font-semibold">TDS: ₹{Number(p.tdsDeducted).toLocaleString("en-IN")}</div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {(p.igst || p.cgst || p.sgst) && (
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {p.igst && <div>IGST: {p.igst}</div>}
                            {p.cgst && <div>CGST: {p.cgst}</div>}
                            {p.sgst && <div>SGST: {p.sgst}</div>}
                          </div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                        {p.note || p.description || "-"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {proj._id && onSelectProject && (
                            <button
                              onClick={() => onSelectProject(proj)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Open Project Details"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingPayment(p)}
                            className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Payment"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(p._id, p.paymentId)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Payment"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT PAYMENT MODAL */}
      {editingPayment && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingPayment(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Edit Payment ({editingPayment.paymentId})
                </h3>
                <p className="text-xs text-slate-500">
                  Project: {editingPayment.project?.projectName || "N/A"}
                </p>
              </div>
              <button
                className="text-slate-500 text-xl cursor-pointer p-1"
                onClick={() => setEditingPayment(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Payment Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                  value={editingPayment.date || (editingPayment.paymentDate ? new Date(editingPayment.paymentDate).toISOString().split("T")[0] : "")}
                  onChange={(e) => setEditingPayment({ ...editingPayment, date: e.target.value, paymentDate: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-bold"
                    value={editingPayment.amount || ""}
                    onChange={(e) => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Mode of Payment
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-semibold"
                    value={editingPayment.paymentMode || "Bank Transfer"}
                    onChange={(e) => setEditingPayment({ ...editingPayment, paymentMode: e.target.value })}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit/Debit Card">Credit/Debit Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  TDS Deducted (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-amber-700 font-bold focus:outline-none focus:border-green-500"
                  value={editingPayment.tdsDeducted || ""}
                  onChange={(e) => setEditingPayment({ ...editingPayment, tdsDeducted: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">IGST</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                    value={editingPayment.igst || ""}
                    onChange={(e) => setEditingPayment({ ...editingPayment, igst: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">CGST</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                    value={editingPayment.cgst || ""}
                    onChange={(e) => setEditingPayment({ ...editingPayment, cgst: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">SGST</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                    value={editingPayment.sgst || ""}
                    onChange={(e) => setEditingPayment({ ...editingPayment, sgst: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Payment Description
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                  value={editingPayment.description || editingPayment.note || ""}
                  onChange={(e) => setEditingPayment({ ...editingPayment, description: e.target.value, note: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl cursor-pointer text-sm transition-all"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer text-sm transition-all"
                  onClick={() => setEditingPayment(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
