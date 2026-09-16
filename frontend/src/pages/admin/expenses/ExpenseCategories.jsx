import React from "react";
import { Plus, Trash2, Edit2, Check, X, Tag, Info, AlertCircle, CheckCircle } from "lucide-react";
import { useExpenseCategories } from "../../../hooks/useExpenseCategories";

export default function ExpenseCategories() {
  const {
    categories,
    loading,
    errorMsg,
    successMsg,
    form,
    setForm,
    editingId,
    editForm,
    setEditForm,
    handleCreate,
    startEdit,
    cancelEdit,
    handleUpdate,
    handleDelete
  } = useExpenseCategories();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-green-600" />
            <span>Expense Categories</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage categories used for grouping expenses in forms and reports.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add New Category Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-t-4 border-t-green-600">
        <h2 className="text-base font-bold text-slate-800 mb-4">Add New Category</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name *</label>
              <input
                type="text"
                placeholder="e.g., Office Supplies, Travel, Rent, Hosting"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold"
              />
            </div>
            <div className="md:col-span-1">
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Category</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Description / Notes</label>
            <textarea
              rows={3}
              placeholder="e.g., Monthly office hardware & stationary costs. Provide details or notes regarding this expense category..."
              value={form.typeDetail}
              onChange={(e) => setForm({ ...form, typeDetail: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 leading-relaxed resize-y"
            />
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Existing Categories ({categories.length})</h3>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Info size={28} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium">No categories created yet.</p>
            <p className="text-xs text-slate-400 mt-1">Use the form above to add your first category.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                {editingId === cat._id ? (
                  <div className="flex-1 space-y-2.5">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white font-semibold"
                      placeholder="Category Name"
                    />
                    <textarea
                      rows={3}
                      value={editForm.typeDetail}
                      onChange={(e) => setEditForm({ ...editForm, typeDetail: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white resize-y"
                      placeholder="Description / Notes"
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      {cat.name}
                    </span>
                    <div>
                      <p className="text-sm text-slate-600 font-medium">
                        {cat.typeDetail || <span className="text-slate-400 italic">No description</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Added: {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString("en-IN") : "N/A"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {editingId === cat._id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(cat._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={14} /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <X size={14} /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
