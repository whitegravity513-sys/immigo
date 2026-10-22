import React from "react";
import { Upload, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";

export default function CandidateDocumentsTab({
  candidate,
  uploadCategory,
  setUploadCategory,
  handleFileChange,
  handleUploadDocument,
  docFileName,
  uploadingDoc,
  docFile,
}) {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
        <div>
          <h2 className="text-xs sm:text-sm font-semibold text-[#0f2744]">
            Upload Compliance Documents
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Upload Resume and National Identity Proof at minimum to unlock job applications. You can also upload Passport and Certificates.
          </p>
        </div>

        <form
          onSubmit={handleUploadDocument}
          className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
                Document Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none cursor-pointer"
              >
                <option value="resume">Resume / CV (PDF)</option>
                <option value="identity_proof">Identity Proof (Aadhaar / National ID)</option>
                <option value="passport">Passport Copy</option>
                <option value="pan">PAN Card</option>
                <option value="education_cert">Education Certificate / Degree</option>
                <option value="experience_cert">Work Experience Certificate</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-600 text-[11px] mb-0.5">
                Select File (PDF or Image, max 10MB)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs cursor-pointer"
              />
            </div>
          </div>

          {docFileName && (
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Selected: {docFileName}</span>
            </div>
          )}

          <div className="flex justify-end pt-0.5">
            <button
              type="submit"
              disabled={uploadingDoc || !docFile}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0f2744] hover:bg-[#163660] rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload size={12} />
              <span>{uploadingDoc ? "Uploading..." : "Upload Document"}</span>
            </button>
          </div>
        </form>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-900">
            Your Submitted Documents
          </h3>

          {(candidate?.documents || []).length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No documents uploaded yet. Upload your resume and identity proof to get verified.
            </div>
          ) : (
            (candidate?.documents || []).map((doc) => (
              <div
                key={doc.id}
                className="p-2 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 text-xs">
                      {doc.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                        doc.status === "Verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : doc.status === "Re-upload Required"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>

                  {doc.status === "Re-upload Required" && doc.rejectionReason && (
                    <div className="mt-1 p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-900 text-[10px] font-medium flex items-start gap-1.5">
                      <AlertCircle size={12} className="shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <strong>Reason:</strong> {doc.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink size={11} />
                      <span>Preview</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
