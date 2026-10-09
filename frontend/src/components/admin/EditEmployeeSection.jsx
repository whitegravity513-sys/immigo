import React, { useState } from "react";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Save,
  DollarSign,
  FileText,
  AlertCircle,
} from "lucide-react";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";

export default function EditEmployeeSection({
  editingEmployee,
  editForm,
  setEditForm,
  onSubmit,
  loading = false,
  onCancel = () => {},
  errorMsg = "",
}) {
  const [showPrevPassword, setShowPrevPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [copiedPrev, setCopiedPrev] = useState(false);
  const [copiedNew, setCopiedNew] = useState(false);

  if (!editingEmployee && !editForm?.name) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <User size={24} />
        </div>
        <h2 className="text-base font-bold text-slate-800">No Employee Selected</h2>
        <p className="text-xs text-slate-500">
          Please select an employee from the Employees Directory to edit their details.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Return to Directory</span>
        </button>
      </div>
    );
  }

  const prevPassValue =
    editForm.previousPassword ||
    editingEmployee?.rawPassword ||
    editingEmployee?.plainPassword ||
    (editingEmployee?.password && !editingEmployee.password.startsWith("$2")
      ? editingEmployee.password
      : "");

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "prev") {
      setCopiedPrev(true);
      setTimeout(() => setCopiedPrev(false), 2000);
    } else {
      setCopiedNew(true);
      setTimeout(() => setCopiedNew(false), 2000);
    }
  };

  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pass = "Immi@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditForm((prev) => ({ ...prev, password: pass }));
    setShowNewPassword(true);
  };

  return (
    <div className="space-y-5 text-slate-800 max-w-5xl mx-auto pb-10">
      {/* Top Navigation & Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Return to Employees Directory"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
              <span>Edit Employee Details</span>
              {editingEmployee?.employeeId && (
                <EmployeeIdBadge id={editingEmployee.employeeId} size="sm" />
              )}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate">
              Update personal info, compensation, leaves and system login credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              editForm.status === "active"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {editForm.status === "active" ? "Active Staff" : "Inactive"}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Section 1: Basic & Personal Info */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Personal & Contact Information</h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Primary identity and personal contact channels
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Company Email (Login Username) *</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="e.g. rahul@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Personal Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={editForm.personalEmail || ""}
                  onChange={(e) => setEditForm({ ...editForm, personalEmail: e.target.value })}
                  placeholder="e.g. rahul.personal@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">Residential Address</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="e.g. Flat 302, Green Park Avenue, Mumbai, Maharashtra"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Role, Department & Joining Dates */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Briefcase size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Employment & Role Details</h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Designation, department, salary & service timeline
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Designation / Role *</label>
              <input
                type="text"
                required
                value={editForm.designation || ""}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Department</label>
              <input
                type="text"
                value={editForm.department || ""}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                placeholder="e.g. Technology, Sales, HR"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Employment Status</label>
              <select
                value={editForm.status || "active"}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive / Deactivated</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Joining Date *</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={editForm.joiningDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Date of Birth (DOB)</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={editForm.dob || ""}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Date of Leaving (Optional)</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={editForm.leavingDate || ""}
                  onChange={(e) => setEditForm({ ...editForm, leavingDate: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Monthly Salary (₹)</label>
              <input
                type="number"
                min="0"
                value={editForm.monthlySalary || ""}
                onChange={(e) => setEditForm({ ...editForm, monthlySalary: Number(e.target.value) })}
                placeholder="e.g. 45000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Leave Balance (Days)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={editForm.leaveBalance ?? 18}
                onChange={(e) => setEditForm({ ...editForm, leaveBalance: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Next Month Leaves</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={editForm.nextMonthLeaves || 0}
                onChange={(e) => setEditForm({ ...editForm, nextMonthLeaves: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Password & Credentials Management (User Key Requirement) */}
        <div className="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-2xl border-2 border-blue-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-blue-100">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Lock size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Login Credentials & Password Management</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                View current/previous password and configure new access password
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Previous / Current Password */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Previous / Current Password</span>
                </label>
                {prevPassValue ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Saved in System
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Encrypted Hash
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPrevPassword ? "text" : "password"}
                  readOnly
                  value={prevPassValue || "••••••••••••"}
                  className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 select-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPrevPassword(!showPrevPassword)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/80 transition-colors cursor-pointer"
                    title={showPrevPassword ? "Hide password" : "Show password"}
                  >
                    {showPrevPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {prevPassValue && (
                    <button
                      type="button"
                      onClick={() => handleCopy(prevPassValue, "prev")}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Copy password to clipboard"
                    >
                      {copiedPrev ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                {prevPassValue
                  ? "This is the active password currently assigned to this employee."
                  : "Original password was created before plain-store enabled. Enter a new password below to reset and view."}
              </p>
            </div>

            {/* New Password Input */}
            <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Set New Password</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  title="Generate a random secure password"
                >
                  <Sparkles size={11} />
                  <span>Generate New</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={editForm.password || ""}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Enter new password (leave blank to keep current)"
                  className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/80 transition-colors cursor-pointer"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {editForm.password && (
                    <button
                      type="button"
                      onClick={() => handleCopy(editForm.password, "new")}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Copy new password"
                    >
                      {copiedNew ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                {editForm.password
                  ? "New password will overwrite the existing credentials upon saving."
                  : "Keep this blank if you do not want to alter the current password."}
              </p>
            </div>
          </div>
        </div>

        {/* Submit & Cancel Action Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Review all details before saving. All changes will be updated live across the database.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Save size={14} />
              <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
