import React, { useState } from "react";
import { X, FileText, Upload, Plus, Check } from "lucide-react";
import InputField from "../ui/InputField.jsx";
import SelectField from "../ui/SelectField.jsx";
import TextareaField from "../ui/TextareaField.jsx";

const DOCUMENT_TYPES = [
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

export function AddDocumentModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "Trade License",
    fileName: "",
    fileSize: "1.2 MB",
    expiryDate: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: `${sizeMB} MB`,
        // If document custom name is empty, auto-suggest from file name without extension
        name: prev.name ? prev.name : file.name.replace(/\.[^/.]+$/, ""),
      }));
      if (errors.fileName) setErrors((prev) => ({ ...prev, fileName: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Please enter a document name/title";
    }
    if (!formData.fileName && !formData.name) {
      newErrors.fileName = "Please select or attach a file";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: `doc-${Date.now()}`,
      name: formData.name.trim(),
      type: formData.type,
      fileName: formData.fileName || `${formData.name.trim().toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: formData.fileSize || "1.5 MB",
      expiryDate: formData.expiryDate || "",
      notes: formData.notes || "",
      uploadedAt: new Date().toISOString(),
    });

    setFormData({
      name: "",
      type: "Trade License",
      fileName: "",
      fileSize: "",
      expiryDate: "",
      notes: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-200">
          <form onSubmit={handleSubmit}>
            {/* Modal Header */}
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Add Client Document
                  </h3>
                  <p className="text-xs text-gray-500">
                    Enter custom document name and attach legal file.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <InputField
                label="Document Name / Title"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Dubai Trade License 2026, Demand Letter 105 Masons..."
                required
                error={errors.name}
                helperText="This exact name will be displayed in the client document records"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Document Category"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={DOCUMENT_TYPES}
                />

                <InputField
                  label="Expiry Date (Optional)"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>

              {/* File Attachment Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 tracking-wide">
                  Attach Document File <span className="text-red-500">*</span>
                </label>

                <div className="relative border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-5 text-center transition-colors bg-gray-50/50">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <Upload size={18} />
                    </div>
                    {formData.fileName ? (
                      <div>
                        <p className="text-xs font-bold text-gray-900 truncate max-w-xs">
                          {formData.fileName}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {formData.fileSize} • Click to replace file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-gray-700">
                          Click to browse or drag file here
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          PDF, DOC, DOCX, PNG, JPG (Max 25MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {errors.fileName && (
                  <p className="text-xs text-red-600 font-medium">{errors.fileName}</p>
                )}
              </div>

              <TextareaField
                label="Notes / Instructions (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Attested by UAE Chamber of Commerce on 15 Aug 2026..."
                rows={2}
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>Save Document</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddDocumentModal;
