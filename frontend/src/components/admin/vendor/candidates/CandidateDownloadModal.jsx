import React, { useState } from "react";
import { Download, X, FileSpreadsheet, CheckSquare, Square, Check, AlertCircle } from "lucide-react";

export const DEFAULT_CANDIDATE_FIELDS = [
  { key: "fullName", label: "Candidate Name", defaultSelected: true },
  { key: "passportNumber", label: "Passport Number", defaultSelected: true },
  { key: "passportIssueDate", label: "Date of Issue", defaultSelected: true },
  { key: "passportExpiryDate", label: "Date of Expiry", defaultSelected: true },
  { key: "dob", label: "Date of Birth", defaultSelected: true },
  { key: "gender", label: "Gender", defaultSelected: true },
  { key: "trade", label: "Trade / Position", defaultSelected: true },
  { key: "project", label: "Project", defaultSelected: true },
  { key: "qualification", label: "Qualification", defaultSelected: true },
  { key: "experienceYears", label: "Experience", defaultSelected: true },
  { key: "vendorName", label: "Vendor / Agency", defaultSelected: true },
  { key: "skills", label: "Skills", defaultSelected: true },
  { key: "state", label: "State", defaultSelected: true },
  { key: "status", label: "Current Status", defaultSelected: true },
  { key: "mobile", label: "Mobile Number", defaultSelected: false },
  { key: "email", label: "Email Address", defaultSelected: false },
];

export default function CandidateDownloadModal({ isOpen, onClose, onDownload }) {
  const [status, setStatus] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedFields, setSelectedFields] = useState(
    DEFAULT_CANDIDATE_FIELDS.filter((f) => f.defaultSelected).map((f) => f.key)
  );

  if (!isOpen) return null;

  const isAllSelected = selectedFields.length === DEFAULT_CANDIDATE_FIELDS.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFields([]);
    } else {
      setSelectedFields(DEFAULT_CANDIDATE_FIELDS.map((f) => f.key));
    }
  };

  const toggleField = (key) => {
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleTriggerDownload = (format) => {
    if (selectedFields.length === 0) return;
    onDownload({ status, dateFrom, dateTo }, format, selectedFields);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-2xs">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Download Candidate Data
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select columns and optional filters to export candidate roster
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Interview">Interview</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
                <option value="Processing">Processing</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Fields Selection Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Select Excel Fields
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedFields.length} of {DEFAULT_CANDIDATE_FIELDS.length} selected
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer hover:underline"
              >
                {isAllSelected ? (
                  <>
                    <Square size={12} />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare size={12} />
                    <span>Select All</span>
                  </>
                )}
              </button>
            </div>

            {/* Checkboxes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {DEFAULT_CANDIDATE_FIELDS.map((f) => {
                const isSelected = selectedFields.includes(f.key);
                return (
                  <div
                    key={f.key}
                    onClick={() => toggleField(f.key)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer select-none transition-all flex items-center gap-2 ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-300 text-slate-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className="truncate text-[11px]">{f.label}</span>
                  </div>
                );
              })}
            </div>

            {selectedFields.length === 0 && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0 text-amber-600" />
                <span>Please select at least 1 field to export.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={selectedFields.length === 0}
              onClick={() => handleTriggerDownload("csv")}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Download size={13} />
              <span>Download CSV (.csv)</span>
            </button>
            <button
              type="button"
              disabled={selectedFields.length === 0}
              onClick={() => handleTriggerDownload("xlsx")}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Download size={13} />
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
