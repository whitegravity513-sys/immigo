import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";

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
  const [fileError, setFileError] = useState("");

  if (!show) return null;

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    setFileError("");
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setFileError("Please upload a file smaller than 4 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setSubmitForm((prev) => ({
        ...prev,
        resumeUrl: dataUrl,
        resumeFileName: file.name,
        documents: [
          ...(Array.isArray(prev.documents)
            ? prev.documents.filter((d) => d.docType !== "Resume / CV")
            : []),
          {
            name: file.name,
            fileName: file.name,
            docType: "Resume / CV",
            mimeType: file.type || "",
            fileUrl: dataUrl,
          },
        ],
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearResume = () => {
    setFileError("");
    setSubmitForm((prev) => ({
      ...prev,
      resumeUrl: "",
      resumeFileName: "",
      documents: Array.isArray(prev.documents)
        ? prev.documents.filter((d) => d.docType !== "Resume / CV")
        : [],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Submit New Candidate</h3>
            <p className="text-xs text-slate-500">
              {hideProjectNames ? "Add candidate to assigned recruitment pipeline" : "Add candidate to assigned project pipeline"}
            </p>
          </div>
          <button
            type="button"
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
              <label className="block text-slate-700 font-bold mb-1">Email Address (Optional)</label>
              <input
                type="email"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Passport Number</label>
              <input
                type="text"
                value={submitForm.passportNumber || ""}
                onChange={(e) => setSubmitForm({ ...submitForm, passportNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. Z1234567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Experience</label>
              <input
                type="text"
                value={submitForm.experience || ""}
                onChange={(e) => setSubmitForm({ ...submitForm, experience: e.target.value })}
                placeholder="e.g. 4 Years"
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

          <div>
            <label className="block text-slate-700 font-bold mb-1">Resume / CV (Optional)</label>
            {submitForm.resumeFileName ? (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className="text-blue-600 shrink-0" />
                  <span className="truncate font-semibold">{submitForm.resumeFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={clearResume}
                  className="text-blue-700 hover:text-rose-600 p-1 cursor-pointer"
                  title="Remove attached file"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-600 cursor-pointer transition">
                <Upload size={14} className="text-indigo-600" />
                <span>Attach PDF, DOC, DOCX, or Image (max 4 MB)</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={handleResumeChange}
                  className="hidden"
                />
              </label>
            )}
            {fileError && <p className="text-[11px] text-rose-600 font-semibold mt-1">{fileError}</p>}
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Profile Notes (Optional)</label>
            <input
              type="text"
              value={submitForm.notes || ""}
              onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
              placeholder="Any screening notes or background details..."
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

