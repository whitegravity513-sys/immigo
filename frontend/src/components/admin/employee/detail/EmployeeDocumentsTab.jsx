import React, { useState } from "react";
import {
  FolderLock,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  Trash2,
  UploadCloud,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "../../../../services/apiClient.js";

export function EmployeeDocumentsTab({
  emp,
  formatFileUrl,
  selectedEmployeeId,
  detailFromDate,
  detailToDate,
  fetchEmployeeHistoryById,
}) {
  const [adminDocModalOpen, setAdminDocModalOpen] = useState(false);
  const [adminDocForm, setAdminDocForm] = useState({
    name: "",
    type: "Other",
    url: "",
  });
  const [adminDocLabel, setAdminDocLabel] = useState("");
  const [adminDocUploading, setAdminDocUploading] = useState(false);

  const [previewDocModal, setPreviewDocModal] = useState(null);
  const [rejectDocModal, setRejectDocModal] = useState(null);
  const [reviewingDoc, setReviewingDoc] = useState(false);

  const handleAdminFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAdminDocForm((prev) => ({
        ...prev,
        url: reader.result,
        name: prev.name || file.name,
      }));
      setAdminDocLabel(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleAdminSubmitDoc = async (e) => {
    e.preventDefault();
    if (!adminDocForm.name || !adminDocForm.url) {
      alert("Please select a file and provide a document name.");
      return;
    }
    try {
      setAdminDocUploading(true);
      await apiClient.post(`/admin/employee/${emp._id}/documents`, adminDocForm);
      setAdminDocModalOpen(false);
      setAdminDocForm({ name: "", type: "Other", url: "" });
      setAdminDocLabel("");
      if (fetchEmployeeHistoryById && selectedEmployeeId) {
        fetchEmployeeHistoryById(selectedEmployeeId, detailFromDate, detailToDate);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to upload document");
    } finally {
      setAdminDocUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to remove this employee document?"))
      return;
    try {
      await apiClient.delete(`/admin/employee/${emp._id}/documents/${docId}`);
      if (fetchEmployeeHistoryById && selectedEmployeeId) {
        fetchEmployeeHistoryById(selectedEmployeeId, detailFromDate, detailToDate);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete document");
    }
  };

  const handleReviewDoc = async (docId, status, verificationNote = "") => {
    try {
      setReviewingDoc(true);
      await apiClient.put(
        `/admin/employee/${emp._id}/documents/${docId}/review`,
        {
          status,
          verificationNote,
        }
      );
      setRejectDocModal(null);
      if (fetchEmployeeHistoryById && selectedEmployeeId) {
        fetchEmployeeHistoryById(selectedEmployeeId, detailFromDate, detailToDate);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update document review status");
    } finally {
      setReviewingDoc(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FolderLock size={18} className="text-blue-600" />
            Employee Document Vault & Verification
          </h4>
          <p className="text-xs text-slate-500">
            Official onboarding contracts, compliance IDs, educational certificates & salary letters
          </p>
        </div>
        <button
          onClick={() => setAdminDocModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition"
        >
          <Plus size={15} /> Upload Official Document
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto sm:table-fixed">
            <thead>
              <tr>
                {[
                  "Document Name",
                  "Category / Type",
                  "Uploaded At",
                  "Verification",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emp.documents && emp.documents.length > 0 ? (
                emp.documents.map((doc) => (
                  <tr
                    key={doc._id}
                    className="hover:bg-slate-50/40 transition border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-800 block">
                            {doc.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ID: {doc._id?.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.type || "Other"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-xs text-slate-600 whitespace-nowrap">
                      {doc.uploadedAt
                        ? new Date(doc.uploadedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                            doc.status === "Verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : doc.status === "Rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {doc.status === "Verified" ? (
                            <CheckCircle size={12} />
                          ) : doc.status === "Rejected" ? (
                            <XCircle size={12} />
                          ) : (
                            <Clock size={12} />
                          )}
                          {doc.status || "Submitted"}
                        </span>
                        {doc.verificationNote && (
                          <div
                            className="text-[10px] text-slate-500 font-medium max-w-[180px] truncate"
                            title={doc.verificationNote}
                          >
                            Note: {doc.verificationNote}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal(doc)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Eye size={13} /> View
                        </button>
                        {doc.status !== "Verified" && (
                          <button
                            type="button"
                            onClick={() => handleReviewDoc(doc._id, "Verified")}
                            disabled={reviewingDoc}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs disabled:opacity-50"
                            title="Verify & Approve Document"
                          >
                            <Check size={12} /> Approve
                          </button>
                        )}
                        {doc.status !== "Rejected" && (
                          <button
                            type="button"
                            onClick={() =>
                              setRejectDocModal({
                                docId: doc._id,
                                docName: doc.name,
                                note: "",
                              })
                            }
                            disabled={reviewingDoc}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                            title="Reject Document"
                          >
                            <X size={12} /> Reject
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <div className="text-center py-12 text-slate-400">
                      <FolderLock size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">
                        No documents uploaded yet for this employee
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Upload appointment letters, contracts, or compliance IDs
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adminDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud size={18} className="text-blue-600" />
                Upload Employee Document
              </h3>
              <button
                onClick={() => setAdminDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminSubmitDoc} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Document Category
                </label>
                <select
                  value={adminDocForm.type}
                  onChange={(e) =>
                    setAdminDocForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="Resume/CV">Resume / CV</option>
                  <option value="Aadhaar / National ID">Aadhaar / National ID</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Appointment Letter">Appointment Letter</option>
                  <option value="Salary Slip">Salary Slip</option>
                  <option value="Experience / Relieving Letter">
                    Experience / Relieving Letter
                  </option>
                  <option value="Degree / Marksheet">Degree / Marksheet</option>
                  <option value="Bank Account Proof / Cancelled Cheque">
                    Bank Proof / Cancelled Cheque
                  </option>
                  <option value="Address Proof">Address Proof</option>
                  <option value="NDA / Non-Disclosure Agreement">
                    NDA / Agreement
                  </option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Document Title / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Appointment Letter signed"
                  value={adminDocForm.name}
                  onChange={(e) =>
                    setAdminDocForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Select File (PDF, Image, Doc)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleAdminFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {adminDocLabel && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    Selected: {adminDocLabel}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdminDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminDocUploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud size={14} />{" "}
                  {adminDocUploading ? "Uploading..." : "Save to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {previewDocModal.name}
                </h3>
                <span className="text-xs text-blue-600 font-bold">
                  {previewDocModal.type}
                </span>
              </div>
              <button
                onClick={() => setPreviewDocModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-slate-50 rounded-xl">
              {previewDocModal.url?.startsWith("data:image/") ||
              /\.(png|jpe?g|webp|svg)$/i.test(previewDocModal.url || "") ? (
                <img
                  src={formatFileUrl(previewDocModal.url)}
                  alt={previewDocModal.name}
                  className="max-h-[60vh] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center py-10 space-y-3">
                  <FileText size={48} className="mx-auto text-blue-500" />
                  <p className="text-sm font-semibold text-slate-700">
                    Document ready for review
                  </p>
                  <a
                    href={formatFileUrl(previewDocModal.url)}
                    target="_blank"
                    rel="noreferrer"
                    download={previewDocModal.name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                  >
                    <ExternalLink size={14} /> Download / Open Document
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewDocModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <XCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Reject Compliance Document
                  </h3>
                  <p className="text-xs text-slate-500">{rejectDocModal.docName}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectDocModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Blurred photocopy, missing signature, expired document, or mismatched name..."
                value={rejectDocModal.note}
                onChange={(e) =>
                  setRejectDocModal((prev) => ({ ...prev, note: e.target.value }))
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-rose-500 focus:bg-white resize-none"
              />
              <p className="text-[11px] text-slate-400">
                The employee will receive an instant notification with this reason and an option to re-upload.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectDocModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewingDoc}
                onClick={() =>
                  handleReviewDoc(
                    rejectDocModal.docId,
                    "Rejected",
                    rejectDocModal.note ||
                      "Document rejected by HR, please re-upload a clear copy."
                  )
                }
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {reviewingDoc ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDocumentsTab;
