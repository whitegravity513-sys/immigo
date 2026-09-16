import React from "react";
import { PlusCircle, CheckCircle, AlertCircle, Calendar, IndianRupee , Tag, FileText, Percent, ArrowRight } from "lucide-react";
import { useExpenseForm } from "../../../hooks/useExpenseForm";

export default function ExpenseForm({ onSuccess }) {
  const {
    categories,
    loading,
    submitting,
    errorMsg,
    successMsg,
    form,
    handleChange,
    handleSubmit
  } = useExpenseForm(onSuccess);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-green-600" />
            <span>Record New Expense</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Log vendor invoices, company purchases, and tax breakdowns (GST/CGST/SGST).
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 text-green-600" />
            <span className="font-bold">{successMsg}</span>
          </div>
          {onSuccess && (
            <button
              onClick={onSuccess}
              className="text-xs font-bold text-green-700 hover:text-green-900 underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Reports</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 border-t-4 border-t-green-600">
        <form onSubmit={handleSubmit} className="space-y-6">
     
        

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-green-600" />
                <span>Date *</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag size={14} className="text-green-600" />
                <span>Category *</span>
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
              >
                {categories.length === 0 ? (
                  <option value="General">General</option>
                ) : (
                  categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                )}
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Expense Name / Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText size={14} className="text-green-600" />
                <span>Expense / Vendor Name *</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., AWS Hosting, Office Stationary Depot, Flight Ticket"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                <IndianRupee  size={14} className="text-green-600" />
                <span>Amount (₹) *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-bold text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* HSN / SAC Code */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                <span>HSN / SAC Code</span>
              </label>
              <input
                type="text"
                name="hsnSac"
                value={form.hsnSac}
                onChange={handleChange}
                placeholder="e.g., 998311 / 8471"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Tax Breakdown Box */}
          <div className="p-4 bg-green-50/60 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-green-900 font-bold text-xs uppercase">
                <Percent size={14} className="text-green-700" />
                <span>GST / Tax Details (Text Fields - Exact Record)</span>
              </div>
              
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Total GST (Text / Amount)</label>
                <input
                  type="text"
                  name="gst"
                  value={form.gst}
                  onChange={handleChange}
                  placeholder="e.g. 18% or ₹900"
                  className="w-full px-3 py-1.5 border border-green-300 rounded bg-white text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">CGST (Text / Amount)</label>
                <input
                  type="text"
                  name="cgst"
                  value={form.cgst}
                  onChange={handleChange}
                  placeholder="e.g. 9% or ₹450"
                  className="w-full px-3 py-1.5 border border-green-300 rounded bg-white text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">SGST (Text / Amount)</label>
                <input
                  type="text"
                  name="sgst"
                  value={form.sgst}
                  onChange={handleChange}
                  placeholder="e.g. 9% or ₹450"
                  className="w-full px-3 py-1.5 border border-green-300 rounded bg-white text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">IGST (Text / Amount)</label>
                <input
                  type="text"
                  name="igst"
                  value={form.igst}
                  onChange={handleChange}
                  placeholder="e.g. 18% or ₹900"
                  className="w-full px-3 py-1.5 border border-green-300 rounded bg-white text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Add invoice numbers, remarks, or payment mode details..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer text-sm ${
                submitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={18} />
                  <span>Submit & Record Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
