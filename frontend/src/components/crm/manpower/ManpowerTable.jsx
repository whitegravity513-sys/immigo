import React, { useState } from "react";
import { Plus, Trash2, Edit2, Users, AlertCircle } from "lucide-react";
import AddPositionModal from "./AddPositionModal.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";

export function ManpowerTable({
  positions = [],
  onChange = () => {},
  readOnly = false,
  currencyDefault = "AED",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);

  // Compute total manpower dynamically
  const totalRequiredManpower = positions.reduce((acc, pos) => {
    return acc + (Number(pos.quantity) || 0);
  }, 0);

  const handleOpenAdd = () => {
    setEditingPosition(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pos, index) => {
    setEditingPosition({ ...pos, index });
    setIsModalOpen(true);
  };

  const handleSavePosition = (posData) => {
    if (editingPosition !== null && editingPosition.index !== undefined) {
      // Update existing item
      const updated = [...positions];
      updated[editingPosition.index] = {
        ...posData,
        id: editingPosition.id || posData.id,
      };
      onChange(updated);
    } else {
      // Add new item
      const newItem = {
        ...posData,
        id: posData.id || `pos-${Date.now()}`,
      };
      onChange([...positions, newItem]);
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
      {!readOnly && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Positions Listed:
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              {positions.length} Trades
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Position</span>
          </button>
        </div>
      )}

      {/* Dynamic Table / Cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {positions.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/50">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center mx-auto mb-3">
              <Users size={22} />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No Positions Defined Yet</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Add at least one trade position with headcount requirement to complete the manpower plan.
            </p>
            {!readOnly && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Add First Position</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Cards View (Visible on small screens) */}
            <div className="sm:hidden divide-y divide-gray-100">
              {positions.map((pos, idx) => (
                <div key={pos.id || idx} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <h4 className="text-xs font-bold text-gray-900">{pos.position}</h4>
                      </div>
                      {pos.gender && pos.gender !== "Any" && (
                        <span className="text-[10px] text-gray-400 font-normal ml-4">
                          Prefers: {pos.gender}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-100">
                      {pos.quantity} Qty
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Experience</span>
                      <span className="font-semibold text-gray-800">{pos.experience || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Salary</span>
                      <span className="font-semibold text-gray-800">
                        {pos.salary ? `${pos.currency || currencyDefault} ${Number(pos.salary).toLocaleString()}` : "Negotiable"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Qualification</span>
                      <span className="font-semibold text-gray-800 truncate block">{pos.qualification || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Age Range</span>
                      <span className="font-semibold text-gray-800">
                        {pos.minAge && pos.maxAge ? `${pos.minAge}-${pos.maxAge} Yrs` : "—"}
                      </span>
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(pos, idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteIndex(idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Qualification</th>
                    <th className="py-3 px-4 text-center">Age Range</th>
                    <th className="py-3 px-4 text-right">Salary</th>
                    <th className="py-3 px-4">Currency</th>
                    {!readOnly && <th className="py-3 px-4 text-center">Actions</th>}
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
                        {pos.gender && pos.gender !== "Any" && (
                          <span className="inline-block mt-0.5 text-[10px] text-gray-400 font-normal">
                            Prefers: {pos.gender}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-7 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                          {pos.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {pos.experience || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-medium max-w-[180px] truncate" title={pos.qualification}>
                        {pos.qualification || "—"}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">
                        {pos.minAge && pos.maxAge ? `${pos.minAge} - ${pos.maxAge} Yrs` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {pos.salary ? Number(pos.salary).toLocaleString() : "Negotiable"}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-600">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] font-mono text-gray-700">
                          {pos.currency || currencyDefault}
                        </span>
                      </td>
                      {!readOnly && (
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(pos, idx)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="Edit Position"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteIndex(idx)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title="Remove Position"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
              {totalRequiredManpower.toLocaleString()} Persons
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit Position Modal */}
      <AddPositionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPosition(null);
        }}
        onSave={handleSavePosition}
        initialData={editingPosition}
        currencyDefault={currencyDefault}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Position"
        message={`Are you sure you want to remove "${positions[deleteIndex]?.position}" from this manpower requirement? This will recalculate the total requirement.`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}

export default ManpowerTable;
