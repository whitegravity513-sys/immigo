import React from "react";
import {
  FolderPlus,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAddProject } from "../../../hooks/useAddProject";

export default function AddProject({ onSuccess }) {
  const {
    clients,
    formData,
    loading,
    successMsg,
    errorMsg,
    handleChange,
    handleSubmit
  } = useAddProject(onSuccess);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
            <FolderPlus className="text-green-600" size={24} />
            Add New Project Form
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Fill in comprehensive project details including sales person, lead
            source, and financial amount.
          </p>
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

      {/* Add Project Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Project Specification & Commercials
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Project Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                placeholder="e.g. E-Commerce Portal Development"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all font-semibold"
                required
              />
            </div>

            {/* Project Type Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Project Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all cursor-pointer font-semibold"
                required
              >
                <option value="">-- Select Project Type --</option>
                <option value="Web Development">Web Development</option>
                <option value="Full Stack Development">Full Stack Development</option>
                <option value="Mobile App Development">Mobile App Development</option>
                <option value="WordPress Development">WordPress Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="SEO">SEO</option>
                <option value="E-commerce Development">E-commerce Development</option>
                <option value="Custom Software Development">Custom Software Development</option>
              </select>
            </div>

            {/* Industry Name - Free Text Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Industry Name
              </label>
              <input
                type="text"
                name="industryName"
                value={formData.industryName}
                onChange={handleChange}
                placeholder="e.g. Healthcare, Finance, Real Estate..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
              />
            </div>

            {/* Client Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Link Existing Client (Optional)
              </label>
              <select
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
              >
                <option value="">-- Select Registered Client --</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ""} -{" "}
                    {c.mobile}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Client Name if not linked */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Or Client / Company Name (Manual Entry)
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="e.g. ABC Trading Corp"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
              />
            </div>

            {/* Sales Person */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Sales Person
              </label>
              <input
                type="text"
                name="salesPerson"
                value={formData.salesPerson}
                onChange={handleChange}
                placeholder="e.g. Aman Verma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
              />
            </div>

            {/* Lead Kisne Dilwayi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Lead (Lead Source / Referral)
              </label>
              <input
                type="text"
                name="leadSource"
                value={formData.leadSource}
                onChange={handleChange}
                placeholder="e.g. Rahul Referral / Google Ads / Partner Network"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
              />
            </div>

            {/* Project Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Project Amount / Total (₹){" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleChange}
                  placeholder="e.g. 150000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Remark */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Remark / Special Note
              </label>
              <input
                type="text"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                placeholder="e.g. Advance 50%, remaining on completion"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Project Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Project Description / Scope of Work
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Provide full project scope, deliverables, modules, timeline or technical requirements..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-green-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-600/25 transition-all cursor-pointer flex items-center gap-2.5"
            >
              <Save size={18} />
              {loading ? "Saving Project..." : "Save Project Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
