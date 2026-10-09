import React, { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";

const QUALIFICATION_OPTIONS = [
  "Any",
  "8th Pass",
  "10th Pass (Matric)",
  "12th Pass (Intermediate)",
  "ITI / Trade Certificate",
  "Diploma",
  "Graduate (B.A / B.Sc / B.Com)",
  "B.Tech / B.E",
  "M.Tech / M.E",
  "MBA / PGDM",
  "Other",
];

export function ManpowerTable({
  positions = [],
  onChange = () => { },
  onPendingChange,
  readOnly = false,
  currencyDefault = "AED",
}) {
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [inlineForm, setInlineForm] = useState({
    position: "",
    quantity: "",
    minAge: "",
    maxAge: "",
    qualification: "",
    otherQualification: "",
    experienceYears: "",
    lastCompany: "",
  });

  // Compute total manpower dynamically
  const totalRequiredManpower = positions.reduce((acc, pos) => {
    return acc + (Number(pos.quantity) || 0);
  }, 0);

  const handleInlineChange = (e) => {
    const { name, value } = e.target;
    setInlineForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (onPendingChange) {
        onPendingChange(updated);
      }
      return updated;
    });
  };

  const handleAddInline = () => {
    const posName = inlineForm.position?.trim() || "Trade Position";
    const qty = Number(inlineForm.quantity) || 1;

    const newItem = {
      id: `pos-${Date.now()}`,
      position: posName,
      quantity: qty,
      minAge: inlineForm.minAge || "",
      maxAge: inlineForm.maxAge || "",
      qualification: inlineForm.qualification === "Other"
        ? inlineForm.otherQualification.trim() || "Other"
        : inlineForm.qualification || "",
      experienceYears: inlineForm.experienceYears || "",
      lastCompany: inlineForm.lastCompany || "",
    };

    const nextPositions = [...positions, newItem];
    onChange(nextPositions);

    // Reset inline form
    const reset = {
      position: "",
      quantity: "",
      minAge: "",
      maxAge: "",
      qualification: "",
      otherQualification: "",
      experienceYears: "",
      lastCompany: "",
    };
    setInlineForm(reset);
    if (onPendingChange) {
      onPendingChange(reset);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteIndex !== null) {
      const updated = positions.filter((_, idx) => idx !== deleteIndex);
      onChange(updated);
      setDeleteIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Positions Listed:
        </span>
        <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
          {positions.length} Trades
        </span>
      </div>

      {!readOnly && (
        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 shadow-sm">
          {/* Row 1: Position + Quantity */}
          <div className="flex flex-col sm:flex-row items-end gap-3 mb-3">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Position Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="position"
                value={inlineForm.position}
                onChange={handleInlineChange}
                placeholder="e.g. Electrician, Mason, Welder"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="w-full sm:w-28">
              <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Quantity <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={inlineForm.quantity}
                onChange={handleInlineChange}
                placeholder="Qty"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Age Range + Qualification */}
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="w-full sm:w-28">
              <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Min Age</label>
              <input
                type="number"
                name="minAge"
                min="18"
                max="65"
                value={inlineForm.minAge}
                onChange={handleInlineChange}
                placeholder="e.g. 22"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="w-full sm:w-28">
              <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Max Age</label>
              <input
                type="number"
                name="maxAge"
                min="18"
                max="65"
                value={inlineForm.maxAge}
                onChange={handleInlineChange}
                placeholder="e.g. 45"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Min. Qualification</label>
              <select
                name="qualification"
                value={inlineForm.qualification}
                onChange={handleInlineChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">-- Select Qualification --</option>
                {QUALIFICATION_OPTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {inlineForm.qualification === "Other" && (
                <textarea
                  name="otherQualification"
                  value={inlineForm.otherQualification}
                  onChange={handleInlineChange}
                  placeholder="Describe qualification requirement..."
                  rows={2}
                  className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              )}
            </div>
            <button
              type="button"
              onClick={handleAddInline}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 h-[38px]"
            >
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>

          {/* Row 3: Experience + Last Company */}
          <div className="flex flex-col sm:flex-row items-end gap-3 mt-3">
            <div className="w-full sm:w-40">
              <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Min. Experience (Yrs)</label>
              <input
                type="number"
                name="experienceYears"
                min="0"
                max="40"
                value={inlineForm.experienceYears}
                onChange={handleInlineChange}
                placeholder="e.g. 3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1 w-full flex items-center justify-end">
              <button
                type="button"
                onClick={handleAddInline}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer h-[38px]"
              >
                <Plus size={16} />
                <span>+ Add Position to Plan {Number(inlineForm.quantity) > 0 ? `(${inlineForm.quantity} Persons)` : ""}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Table / Cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {positions.length === 0 ? (
          <div className="p-6 text-center bg-gray-50/50">
            {Number(inlineForm.quantity) > 0 ? (
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Drafted Position: {inlineForm.position || "Trade Position"} ({inlineForm.quantity} Persons)
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click the button below to add it to the list, or save the project directly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddInline}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Confirm & Add Position ({inlineForm.quantity} Persons)</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center mx-auto mb-3">
                  <Users size={22} />
                </div>
                <h4 className="text-sm font-bold text-gray-800">No Positions Defined Yet</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Add at least one trade position above to complete the manpower plan.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-center">Age Range</th>
                  <th className="py-3 px-4">Min. Qualification</th>
                  <th className="py-3 px-4 text-center">Exp. (Yrs)</th>

                  {!readOnly && <th className="py-3 px-4 text-center">Remove</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {positions.map((pos, idx) => (
                  <tr
                    key={pos.id || idx}
                    className="hover:bg-blue-50/40 transition-colors duration-100"
                  >
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span>{pos.position}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-7 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                        {pos.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 font-medium">
                      {pos.minAge || pos.maxAge
                        ? `${pos.minAge || "—"} – ${pos.maxAge || "—"} yrs`
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {pos.qualification || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600 font-medium">
                      {pos.experienceYears ? `${pos.experienceYears} yr${Number(pos.experienceYears) !== 1 ? 's' : ''}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium max-w-[140px] truncate">
                      {pos.lastCompany || <span className="text-gray-300">—</span>}
                    </td>

                    {!readOnly && (
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setDeleteIndex(idx)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Remove Position"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Automatic Total Bar at Bottom */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users size={16} className="text-blue-600 shrink-0" />
            <span>Headcount auto-aggregates across all listed trade requirements</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Total Required Manpower:
            </span>
            <span className="text-base font-extrabold text-blue-700 bg-blue-100/70 border border-blue-200 px-3.5 py-1 rounded-lg shadow-2xs">
              {(totalRequiredManpower > 0 ? totalRequiredManpower : Number(inlineForm.quantity) || 0).toLocaleString()} Persons
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Position"
        message={`Are you sure you want to remove this position?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}

export default ManpowerTable;
