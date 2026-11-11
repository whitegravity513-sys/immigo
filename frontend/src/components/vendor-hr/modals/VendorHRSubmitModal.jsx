import React from "react";

export default function VendorHRSubmitModal({
  show,
  onClose,
  onSubmit,
  submitForm,
  setSubmitForm,
  projectsList = [],
  jobs = [],
  hideProjectNames = false,
  actionLoading = false,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Submit New Candidate</h3>
            <p className="text-xs text-slate-500">
              {hideProjectNames ? "Add candidate to assigned recruitment pipeline" : "Add candidate to assigned project pipeline"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={submitForm.fullName}
              onChange={(e) => setSubmitForm({ ...submitForm, fullName: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={submitForm.email}
                onChange={(e) => setSubmitForm({ ...submitForm, email: e.target.value })}
                placeholder="ramesh@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
              <input
                type="tel"
                value={submitForm.phone}
                onChange={(e) => setSubmitForm({ ...submitForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              {hideProjectNames ? "Target Requirement *" : "Target Project *"}
            </label>
            <select
              required
              value={submitForm.projectId}
              onChange={(e) => setSubmitForm({ ...submitForm, projectId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="">
                {hideProjectNames ? "Select an assigned requirement" : "Select an assigned project"}
              </option>
              {projectsList.map((p, idx) => (
                <option key={p.projectId} value={p.projectId}>
                  {hideProjectNames
                    ? `Assigned Opening #${idx + 1}${p.destinationCountry || p.country ? ` (${p.destinationCountry || p.country})` : ""} [${p.projectId}]`
                    : `${p.projectName} (${p.projectId})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Trade / Job Designation</label>
            <select
              value={submitForm.jobId}
              onChange={(e) => setSubmitForm({ ...submitForm, jobId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="">Select Trade</option>
              {jobs.map((j) => (
                <option key={j.jobId} value={j.jobId}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Trade Skills (comma separated)</label>
            <input
              type="text"
              value={submitForm.skills}
              onChange={(e) => setSubmitForm({ ...submitForm, skills: e.target.value })}
              placeholder="Wiring, Switchgear, Blueprint reading..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Submitting..." : "Submit Candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

