import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Calendar,
  Download,
  Eye,
  FileCheck,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Sparkles,
} from "lucide-react";
import AddDocumentModal from "./AddDocumentModal.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import InputField from "../ui/InputField.jsx";
import SelectField from "../ui/SelectField.jsx";
import { useCrmToast } from "../layout/CrmLayout.jsx";

const DOCUMENT_CATEGORIES = [
  "Trade License",
  "Commercial Registration (CR)",
  "Demand Letter (DL)",
  "Power of Attorney (POA)",
  "Tax / VAT Certificate",
  "Embassy Quota Approval",
  "Service Level Agreement (SLA)",
  "Chamber of Commerce Attestation",
  "Insurance Policy",
  "Other Compliance Document",
];

const PRESET_CHIPS = [
  { label: "Commercial Registration (CR)", type: "Commercial Registration (CR)" },
  { label: "Trade License", type: "Trade License" },
  { label: "Demand Letter (DL)", type: "Demand Letter (DL)" },
  { label: "Power of Attorney (POA)", type: "Power of Attorney (POA)" },
  { label: "Tax / VAT Certificate", type: "Tax / VAT Certificate" },
  { label: "Embassy Quota Approval", type: "Embassy Quota Approval" },
  { label: "Chamber Attestation", type: "Chamber of Commerce Attestation" },
];

export function DocumentsList({
  documents = [],
  onChange = () => {},
  readOnly = false,
  onDownload = null,
}) {
  const { showToast } = useCrmToast?.() || { showToast: () => {} };
  const fileInputRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Quick inline upload draft state
  const [inlineDoc, setInlineDoc] = useState({
    name: "",
    type: "Commercial Registration (CR)",
    expiryDate: "",
    notes: "",
    fileName: "",
    fileSize: "",
    fileObj: null,
  });
  const [inlineError, setInlineError] = useState("");

  const handleSelectFiles = (files) => {
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      const file = files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const cleanName = file.name.replace(/\.[^/.]+$/, "");

      setInlineDoc((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: `${sizeMB} MB`,
        name: prev.name.trim() ? prev.name : cleanName,
        fileObj: file,
      }));
      setInlineError("");
    } else {
      // Multiple files dropped / picked: batch add with smart names
      const newItems = Array.from(files).map((f, idx) => {
        const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
        const cleanName = f.name.replace(/\.[^/.]+$/, "");
        return {
          id: `doc-${Date.now()}-${idx}`,
          name: cleanName,
          type: "Other Compliance Document",
          fileName: f.name,
          fileSize: `${sizeMB} MB`,
          expiryDate: "",
          notes: "",
          uploadedAt: new Date().toISOString(),
        };
      });

      onChange([...documents, ...newItems]);
      showToast(`${files.length} documents uploaded successfully.`, "success");
    }
  };

  const handleFileChange = (e) => {
    handleSelectFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleSelectFiles(e.dataTransfer.files);
    }
  };

  const handleApplyPreset = (chip) => {
    setInlineDoc((prev) => ({
      ...prev,
      name: chip.label,
      type: chip.type,
    }));
    setInlineError("");
  };

  const handleAddInlineDocument = (e) => {
    e?.preventDefault();
    if (!inlineDoc.name.trim()) {
      setInlineError("Please enter a custom Document Name / Title");
      return;
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: inlineDoc.name.trim(),
      type: inlineDoc.type || "Other Compliance Document",
      fileName: inlineDoc.fileName || `${inlineDoc.name.trim().toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: inlineDoc.fileSize || "1.2 MB",
      expiryDate: inlineDoc.expiryDate || "",
      notes: inlineDoc.notes || "",
      uploadedAt: new Date().toISOString(),
    };

    onChange([...documents, newDoc]);
    showToast(`Document "${newDoc.name}" attached successfully.`, "success");

    // Reset inline form
    setInlineDoc({
      name: "",
      type: "Commercial Registration (CR)",
      expiryDate: "",
      notes: "",
      fileName: "",
      fileSize: "",
      fileObj: null,
    });
    setInlineError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddModalDocument = (newDoc) => {
    onChange([...documents, newDoc]);
    showToast(`Document "${newDoc.name}" added successfully.`, "success");
  };

  const handleConfirmDelete = () => {
    if (deleteIndex !== null) {
      const removed = documents[deleteIndex];
      const updated = documents.filter((_, idx) => idx !== deleteIndex);
      onChange(updated);
      setDeleteIndex(null);
      showToast(`Removed "${removed?.name}".`, "info");
    }
  };

  const handleTriggerDownload = (doc) => {
    if (onDownload) {
      onDownload(doc);
    } else {
      showToast(`Downloading "${doc.name}" (${doc.fileName})...`, "info");
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top summary header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
            <FileText size={16} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              Attached Client Documents
            </h4>
            <p className="text-[11px] text-gray-500">
              Upload compliance documents with custom names for client records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            {documents.length} {documents.length === 1 ? "File" : "Files"} Attached
          </span>
        </div>
      </div>

      {/* INLINE DOCUMENT UPLOAD SECTION (Visible in Edit / Add Client) */}
      {!readOnly && (
        <div className="bg-gradient-to-b from-blue-50/40 to-white rounded-xl border border-blue-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <UploadCloud size={16} className="text-blue-600" />
              <span>Direct Document Upload</span>
            </span>
            <span className="text-[11px] text-blue-600 font-medium">
              Give each document a custom name & attach file
            </span>
          </div>

          {/* Drag & Drop File Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-150 ${
              isDragging
                ? "border-blue-600 bg-blue-50/80 scale-[1.005]"
                : inlineDoc.fileName
                ? "border-emerald-400 bg-emerald-50/30"
                : "border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center pointer-events-none space-y-2">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  inlineDoc.fileName
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {inlineDoc.fileName ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <UploadCloud size={22} />
                )}
              </div>

              {inlineDoc.fileName ? (
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 break-all max-w-md mx-auto">
                    {inlineDoc.fileName}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    {inlineDoc.fileSize} • File selected. Fill custom name below & click "Attach Document".
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-800">
                    Click to browse files or drag & drop here
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Attach Trade License, Demand Letter, Power of Attorney, CR, or SLA (PDF, DOCX, JPG, PNG)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Details input grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            <div className="sm:col-span-2 lg:col-span-1">
              <InputField
                label="Custom Document Name / Title"
                name="docName"
                value={inlineDoc.name}
                onChange={(e) => {
                  setInlineDoc((prev) => ({ ...prev, name: e.target.value }));
                  if (inlineError) setInlineError("");
                }}
                placeholder="e.g. Dubai Trade License 2026, Demand Letter 105 Masons..."
                required
                error={inlineError}
                helperText="This exact name will be displayed in the document records"
              />
            </div>

            <div>
              <SelectField
                label="Document Category"
                name="docType"
                value={inlineDoc.type}
                onChange={(e) =>
                  setInlineDoc((prev) => ({ ...prev, type: e.target.value }))
                }
                options={DOCUMENT_CATEGORIES}
              />
            </div>

            <div>
              <InputField
                label="Expiry Date (Optional)"
                name="docExpiry"
                type="date"
                value={inlineDoc.expiryDate}
                onChange={(e) =>
                  setInlineDoc((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Action button row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-gray-500">
              {inlineDoc.fileName ? (
                <span className="flex items-center gap-1.5 font-medium text-emerald-800">
                  <Paperclip size={13} />
                  <span className="truncate max-w-[260px]">{inlineDoc.fileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setInlineDoc((prev) => ({
                        ...prev,
                        fileName: "",
                        fileSize: "",
                        fileObj: null,
                      }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-red-500 hover:text-red-700 ml-1 text-[10px] underline cursor-pointer"
                  >
                    Clear
                  </button>
                </span>
              ) : (
                <span className="text-gray-400">
                  Tip: You can attach a file or fill document details directly.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddInlineDocument}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Plus size={16} />
              <span>Attach Document</span>
            </button>
          </div>
        </div>
      )}

      {/* LIST OF UPLOADED DOCUMENTS */}
      {documents.length === 0 ? (
        <div className="p-8 text-center bg-gray-50/60 rounded-xl border border-dashed border-gray-300">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-2.5">
            <FileText size={22} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">No Documents Attached Yet</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Attach commercial registration, demand letters, or powers of attorney using the upload box above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {documents.map((doc, idx) => (
            <div
              key={doc.id || idx}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs hover:border-blue-300 transition-all duration-150 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug break-words">
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100">
                        {doc.type || "Document"}
                      </span>
                      {doc.fileSize && (
                        <span className="text-[10px] sm:text-[11px] text-gray-400">
                          {doc.fileSize}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setDeleteIndex(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove document"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Attachment details & Expiry */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                  <span className="text-gray-400 font-mono text-[10px] truncate max-w-[180px]">
                    {doc.fileName || "attachment.pdf"}
                  </span>
                  {doc.expiryDate && (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200 shrink-0">
                      <Clock size={10} />
                      Exp: {doc.expiryDate}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={() => handleTriggerDownload(doc)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors cursor-pointer"
                    title="Download document file"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {doc.notes && (
                <p className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg italic break-words">
                  Note: {doc.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      <AddDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddModalDocument}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Document"
        message={`Are you sure you want to remove "${documents[deleteIndex]?.name}"? This file reference will be deleted from client records.`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}

export default DocumentsList;
