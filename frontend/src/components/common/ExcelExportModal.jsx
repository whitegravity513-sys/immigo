import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Filter,
  Search,
  Check,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function ExcelExportModal({
  isOpen,
  onClose,
  title = "Export Data to Excel",
  subtitle = "Choose the fields you want to include in the exported spreadsheet.",
  availableFields = [],
  data = [],
  filenamePrefix = "Export",
  sheetName = "Data Export",
  customExtractRow = null,
  additionalFiltersNode = null,
}) {
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [fieldSearch, setFieldSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Initialize selected fields with defaultSelected or all fields
  useEffect(() => {
    if (isOpen && availableFields.length > 0) {
      const defaultSelected = availableFields
        .filter((f) => f.defaultSelected !== false)
        .map((f) => f.key);
      setSelectedKeys(defaultSelected.length > 0 ? defaultSelected : availableFields.map((f) => f.key));
      setFieldSearch("");
    }
  }, [isOpen, availableFields]);

  const filteredFields = useMemo(() => {
    if (!fieldSearch.trim()) return availableFields;
    const q = fieldSearch.toLowerCase();
    return availableFields.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q) ||
        (f.category && f.category.toLowerCase().includes(q))
    );
  }, [availableFields, fieldSearch]);

  const isAllSelected = useMemo(() => {
    return (
      availableFields.length > 0 &&
      availableFields.every((f) => selectedKeys.includes(f.key))
    );
  }, [availableFields, selectedKeys]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(availableFields.map((f) => f.key));
    }
  };

  const toggleField = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExport = (format = "xlsx") => {
    if (selectedKeys.length === 0) return;
    if (!data || data.length === 0) {
      alert("No records available to export.");
      return;
    }

    setExporting(true);
    try {
      // Build selected field map
      const selectedFieldDefs = availableFields.filter((f) =>
        selectedKeys.includes(f.key)
      );

      const rows = data.map((item, index) => {
        if (typeof customExtractRow === "function") {
          return customExtractRow(item, selectedKeys, selectedFieldDefs, index);
        }

        const row = {};
        selectedFieldDefs.forEach((f) => {
          let val = item[f.key];
          if (typeof f.extractor === "function") {
            val = f.extractor(item);
          } else if (val === null || val === undefined || val === "") {
            val = "—";
          } else if (Array.isArray(val)) {
            val = val.join(", ");
          } else if (typeof val === "object") {
            val = JSON.stringify(val);
          }
          row[f.label] = val;
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column widths
      const colWidths = Object.keys(rows[0] || {}).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...rows.slice(0, 50).map((r) => String(r[key] || "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
      });
      worksheet["!cols"] = colWidths;

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${filenamePrefix}_${dateStr}.${format}`;

      if (format === "csv") {
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob(["\uFEFF" + csvOutput], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
        XLSX.writeFile(workbook, filename);
      }

      onClose();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export file. Please check console for details.");
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Optional Parent Filters (e.g. Status filter, Date range) */}
          {additionalFiltersNode && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Export Filters
              </span>
              {additionalFiltersNode}
            </div>
          )}

          {/* Field Selection Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Fields to Include
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {selectedKeys.length} of {availableFields.length} selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer hover:underline"
              >
                {isAllSelected ? (
                  <>
                    <Square size={13} />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare size={13} />
                    <span>Select All</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Field Search */}
          {availableFields.length > 8 && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                placeholder="Search fields by name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Grid of Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {filteredFields.map((field) => {
              const isSelected = selectedKeys.includes(field.key);
              return (
                <div
                  key={field.key}
                  onClick={() => toggleField(field.key)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-300 text-slate-900 shadow-2xs font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "border border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-[11px] sm:text-xs">
                      {field.label}
                    </span>
                    {field.category && (
                      <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider block">
                        {field.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFields.length === 0 && (
            <p className="text-center py-4 text-xs text-slate-400">
              No matching fields found.
            </p>
          )}

          {selectedKeys.length === 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-600" />
              <span>Please select at least 1 field to generate your export.</span>
            </div>
          )}

          {/* Export Records Notice */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>
              Total records to be exported:{" "}
              <strong className="text-slate-800">{data?.length || 0}</strong>
            </span>
            <span>UTF-8 Excel Compatible</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
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
              disabled={selectedKeys.length === 0 || exporting}
              onClick={() => handleExport("csv")}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={13} />
              <span>Download CSV (.csv)</span>
            </button>

            <button
              type="button"
              disabled={selectedKeys.length === 0 || exporting}
              onClick={() => handleExport("xlsx")}
              className="flex-1 sm:flex-initial px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={14} />
              <span>{exporting ? "Generating..." : "Download Excel (.xlsx)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
