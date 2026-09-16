import React from "react";
import {
  IndianRupee, Plus, Edit, Trash2, ArrowLeft, Save,
  CheckCircle, AlertCircle, FileText, Calendar, Tag
} from "lucide-react";
import { useProjectPayments } from "../../../hooks/useProjectPayments";

const getModeBadgeClass = (mode = "") => {
  const m = mode.toLowerCase();
  if (m.includes("upi")) return "bg-purple-100 text-purple-800 border-purple-200";
  if (m.includes("cash")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (m.includes("cheque")) return "bg-amber-100 text-amber-800 border-amber-200";
  if (m.includes("card")) return "bg-indigo-100 text-indigo-800 border-indigo-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
};

export default function ProjectPayments({ project, onBack }) {
  const {
    currentProject,
    payments,
    loading,
    errorMsg,
    successMsg,
    showExtendModal,
    setShowExtendModal,
    extendInputAmount,
    setExtendInputAmount,
    extendRemark,
    setExtendRemark,
    formData,
    editingPayment,
    setEditingPayment,
    initialValue,
    extendedValue,
    totalProjectAmount,
    totalPaid,
    totalTDS,
    remainingBalance,
    handleSaveExtendedBudget,
    handleFormChange,
    handleSubmitNewPayment,
    handleUpdatePayment,
    handleDeletePayment
  } = useProjectPayments(project);

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft size={16} /> Back to Project Detail
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <IndianRupee className="text-green-600" size={22} />
              Part Payment Tracker & Account Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record and edit partial milestones & receipts against this project.
            </p>
          </div>
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

      {/* TOP COMPREHENSIVE FINANCIAL SUMMARY & EXTEND CONTROL */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 border border-emerald-400/40">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-5">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
              Project Financial Overview & Ledger
            </span>
            <h3 className="text-2xl font-black text-white mt-1">{currentProject?.projectName}</h3>
            <p className="text-xs font-mono text-emerald-100">ID: {currentProject?.projectId}</p>
          </div>
          <button
            onClick={() => setShowExtendModal(true)}
            className="px-5 py-3 bg-emerald-300 hover:bg-emerald-200 text-green-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg border border-emerald-200 cursor-pointer"
          >
            <Plus size={16} /> + Extend Project Price / Scope
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="text-[11px] text-emerald-100 font-bold uppercase">1. Initial Price (Phele)</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
              ₹{initialValue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-200/90 mt-1">Original project value</div>
          </div>

          <div className="bg-emerald-400/25 border-2 border-emerald-300/60 rounded-2xl p-4 shadow-md">
            <div className="text-[11px] text-emerald-100 font-black uppercase tracking-wide">2. Extended Amount (+)</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-100 mt-1.5">
              +₹{extendedValue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-100 font-semibold mt-1">Added / extended later</div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="text-[11px] text-emerald-100 font-bold uppercase">3. Total Project Value</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
              ₹{totalProjectAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-200/90 mt-1">Initial + Extended</div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="text-[11px] text-emerald-100 font-bold uppercase">4. Paid Amount (Received)</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
              ₹{totalPaid.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-200/90 mt-1">
              Net received in bank
              {totalTDS > 0 && (
                <span className="block text-amber-200 font-bold">+ TDS: ₹{totalTDS.toLocaleString("en-IN")}</span>
              )}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white/10 border border-white/20 rounded-2xl p-4">
            <div className="text-[11px] text-amber-200 font-bold uppercase">5. Pending Balance</div>
            <div className="text-xl sm:text-2xl font-black text-amber-200 mt-1.5">
              ₹{remainingBalance.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-200/90 mt-1">
              Total − (Paid + TDS)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ADD PAYMENT FORM */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Add New Part Payment
            </h3>
          </div>
          <form onSubmit={handleSubmitNewPayment} className="p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Net Amount Received (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="e.g. 50000"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-green-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Mode of Payment
                </label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-semibold cursor-pointer"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  TDS Deducted (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  name="tdsDeducted"
                  value={formData.tdsDeducted}
                  onChange={handleFormChange}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-bold text-amber-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  IGST
                </label>
                <input
                  type="text"
                  name="igst"
                  value={formData.igst}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  CGST
                </label>
                <input
                  type="text"
                  name="cgst"
                  value={formData.cgst}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  SGST
                </label>
                <input
                  type="text"
                  name="sgst"
                  value={formData.sgst}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Payment Description / Milestone Note
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="e.g. 1st Installment advance via NEFT"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={16} /> {loading ? "Saving..." : "Add Part Payment"}
            </button>
          </form>
        </div>

        {/* PAYMENTS LIST TABLE */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Payment Ledger & History ({payments.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3.5">Payment ID</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Net Amount</th>
                  <th className="px-6 py-3.5">Mode of Payment</th>
                  <th className="px-6 py-3.5">TDS / Taxes</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No part payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p, index) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-green-700 text-xs">
                        {p.paymentId || `PAY-${String(payments.length - index).padStart(3, '0')}`}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        {p.date || (p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "-")}
                      </td>
                      <td className="px-6 py-3.5 font-black text-slate-800">
                        ₹{(p.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs ${getModeBadgeClass(p.paymentMode || "Bank Transfer")}`}>
                          {p.paymentMode || "Bank Transfer"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
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
                      <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                        {p.note || p.description || "-"}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingPayment({ ...p, originalAmount: p.amount, extendAmount: "" })}
                            className="p-1.5 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit / Extend Payment"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(p._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Payment"
                          >
                            <Trash2 size={15} />
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
              <h3 className="text-base font-black text-slate-800">
                Extend / Edit Part Payment ({editingPayment.paymentId})
              </h3>
              <button
                className="text-slate-500 text-xl cursor-pointer p-1"
                onClick={() => setEditingPayment(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const finalAmount = Number(editingPayment.originalAmount || 0) + Number(editingPayment.extendAmount || 0);
              editingPayment.amount = finalAmount;
              handleUpdatePayment(e);
            }} className="p-6 space-y-4">
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Previous Amount (₹)
                  </label>
                  <input
                    type="number"
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 font-bold"
                    value={editingPayment.originalAmount}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-green-700 uppercase tracking-wider">
                    Extend Amount (+₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full bg-green-50/50 border border-green-300 rounded-xl px-4 py-2.5 text-sm text-green-800 font-bold focus:outline-none focus:border-green-600"
                    value={editingPayment.extendAmount}
                    onChange={(e) => setEditingPayment({ ...editingPayment, extendAmount: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase">New Total Amount:</span>
                <span className="text-lg font-black text-slate-900">
                  ₹{(Number(editingPayment.originalAmount || 0) + Number(editingPayment.extendAmount || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    TDS Deducted (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-green-500 font-bold text-amber-700"
                    value={editingPayment.tdsDeducted || ""}
                    onChange={(e) => setEditingPayment({ ...editingPayment, tdsDeducted: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">IGST</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                    value={editingPayment.igst || ""}
                    onChange={(e) => setEditingPayment({ ...editingPayment, igst: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">CGST</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500"
                    value={editingPayment.cgst || ""}
                    onChange={(e) => setEditingPayment({ ...editingPayment, cgst: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">SGST</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-green-500"
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
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl cursor-pointer text-sm shadow-md"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer text-sm"
                  onClick={() => setEditingPayment(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTEND PROJECT BUDGET / SCOPE MODAL (SAME AS PROJECT DETAIL) */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-700 text-white">
              <h3 className="text-base font-black flex items-center gap-2">
                + Extend Project Price / Scope
              </h3>
              <button
                className="text-white/80 hover:text-white text-xl font-bold cursor-pointer"
                onClick={() => setShowExtendModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveExtendedBudget} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Initial Project Price:</span>
                  <span className="font-black text-slate-800">₹{initialValue.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Already Extended:</span>
                  <span className="font-black text-green-600">+₹{extendedValue.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Add Extended Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-green-500"
                    value={extendInputAmount}
                    onChange={(e) => setExtendInputAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Extension Remark / Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scope increased for additional features"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-green-500"
                  value={extendRemark}
                  onChange={(e) => setExtendRemark(e.target.value)}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-bold text-green-800 uppercase">New Total Amount:</span>
                <span className="text-lg font-black text-green-700">
                  ₹{(initialValue + extendedValue + (Number(extendInputAmount) || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl cursor-pointer text-sm transition-all shadow-md"
                >
                  {loading ? "Saving..." : "Save Extended Amount"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExtendModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer text-sm"
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
