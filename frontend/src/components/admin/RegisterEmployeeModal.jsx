import React, { useState, useRef } from "react";
import {
  X,
  Camera,
  Upload,
  FileText,
  Trash2,
  Building,
  Award,
  Briefcase,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

export const RegisterEmployeeModal = ({
  isOpen,
  onClose,
  employeeForm,
  setEmployeeForm,
  onSubmit,
  loading,
  errorMsg = "",
}) => {
  const [docCategory, setDocCategory] = useState("Aadhaar Card");
  const [docTitle, setDocTitle] = useState("");
  const [docFileLabel, setDocFileLabel] = useState("");
  const [docStagingLoading, setDocStagingLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  if (!isOpen) return null;

  const docCategories = [
    "Aadhaar Card",
    "PAN Card",
    "Resume / CV",
    "Offer Letter",
    "Appointment Letter",
    "Salary Slip",
    "Degree / Marksheet",
    "Experience Letter",
    "Passport / Visa",
    "Other",
  ];

  const departments = [
    "Engineering & Tech",
    "Operations",
    "Sales & Marketing",
    "Human Resources",
    "Finance & Accounts",
    "Immigration & Legal",
    "Client Services",
    "General / Administration",
  ];

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setModalError("Profile photo size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEmployeeForm((prev) => ({
        ...prev,
        profileImage: reader.result,
      }));
      setModalError("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setEmployeeForm((prev) => ({
      ...prev,
      profileImage: "",
    }));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleStageDocument = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setModalError("Document size must be less than 15MB.");
      return;
    }
    setDocStagingLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const newDoc = {
        name: docTitle.trim() || file.name,
        type: docCategory,
        url: reader.result,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      };
      setEmployeeForm((prev) => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc],
      }));
      setDocTitle("");
      setDocFileLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setDocStagingLoading(false);
      setModalError("");
    };
    reader.onerror = () => {
      setModalError("Failed to read document file.");
      setDocStagingLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStagedDoc = (index) => {
    setEmployeeForm((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <User size={20} className="text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">
                Register New Employee
              </h3>
              <p className="text-[11px] text-blue-200 font-medium">
                Complete Corporate Profile, Experience, Documents & Credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {(modalError || errorMsg) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold shadow-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{modalError || errorMsg}</span>
            </div>
          )}

          <form id="registerEmployeeForm" onSubmit={onSubmit} className="space-y-6 text-left">
            {/* 1. TOP CARD: Profile Photo & Employee Badge */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {employeeForm.profileImage ? (
                    <img
                      src={employeeForm.profileImage}
                      alt="Profile Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col items-center justify-center shadow-inner border border-blue-400">
                      <Camera size={26} className="opacity-80" />
                      <span className="text-[10px] font-bold mt-1">Photo</span>
                    </div>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload size={13} />
                      {employeeForm.profileImage ? "Change Photo" : "Upload Profile Photo"}
                    </button>
                    {employeeForm.profileImage && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Recommended: Square JPG or PNG, max 5MB. Visible on corporate badge & reports.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Generated System Code
                </span>
                <span className="text-base font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl tracking-wide mt-0.5">
                  {employeeForm.employeeId || "AUTOGEN-ID"}
                </span>
              </div>
            </div>

            {/* 2. SECTION: Basic Identity & Credentials */}
            <div>
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <User size={14} className="text-blue-600" />
                1. Core Identity & Portal Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Kumar"
                    value={employeeForm.name || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, name: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Company Email (Official / Work) *</label>
                    {employeeForm.email && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(employeeForm.email.trim()) && (
                      <span className="text-[10px] font-bold text-emerald-600">Valid ✓</span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@company.com"
                    value={employeeForm.email || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, email: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <span className="text-[10px] text-slate-400">Official company email provided for login</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Personal Email Address</label>
                    {employeeForm.personalEmail && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(employeeForm.personalEmail.trim()) && (
                      <span className="text-[10px] font-bold text-emerald-600">Valid ✓</span>
                    )}
                  </div>
                  <input
                    type="email"
                    placeholder="e.g. rahul.personal@gmail.com"
                    value={employeeForm.personalEmail || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, personalEmail: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  <span className="text-[10px] text-slate-400">Personal Gmail/Outlook ID for records</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Portal Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={employeeForm.password || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, password: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Contact Phone Number *</label>
                    <span className={`text-[10px] font-bold ${
                      (employeeForm.phone?.replace(/\D/g, "")?.length || 0) === 10
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}>
                      {(employeeForm.phone?.replace(/\D/g, "")?.length || 0) === 10
                        ? "10 Digits ✓"
                        : `${employeeForm.phone?.replace(/\D/g, "")?.length || 0}/10 digits`}
                    </span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit number (e.g. 9876543210)"
                    value={employeeForm.phone?.replace(/\D/g, "").slice(0, 10) || ""}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setEmployeeForm({ ...employeeForm, phone: digitsOnly });
                    }}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition ${
                      (employeeForm.phone?.replace(/\D/g, "")?.length || 0) === 10
                        ? "border-emerald-300 focus:border-emerald-500"
                        : "border-slate-200 focus:border-blue-500"
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date of Joining (DOJ) *</label>
                  <input
                    type="date"
                    required
                    value={employeeForm.joiningDate || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, joiningDate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Employee Status *</label>
                  <select
                    value={employeeForm.status || "active"}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, status: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-semibold cursor-pointer"
                  >
                    <option value="active">🟢 Active</option>
                    <option value="inactive">🔴 Inactive</option>
                  </select>
                  <span className="text-[10px] text-slate-400">Choose Active or Inactive status</span>
                </div>
              </div>
            </div>

            {/* 3. SECTION: Role, Department & Residence */}
            <div>
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Briefcase size={14} className="text-blue-600" />
                2. Corporate Role & Residential Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={employeeForm.role || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, role: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Department</label>
                  <select
                    value={employeeForm.department || departments[0]}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, department: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-600">
                    Residential Address (Full Home Address)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Flat/House No., Street, City, State, PIN Code"
                    value={employeeForm.address || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, address: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. SECTION: Previous Experience & Compensation */}
            <div>
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award size={14} className="text-blue-600" />
                3. Career History & Compensation Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 bg-slate-50/70 border border-slate-200/80 p-4 rounded-2xl">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Previous Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Infosys, TCS, Freelance"
                    value={employeeForm.previousCompany || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, previousCompany: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Total Experience</label>
                  <input
                    type="text"
                    placeholder="e.g. 3.5 Years / Fresher"
                    value={employeeForm.experience || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, experience: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Previous Package (CTC)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹4.5 LPA / ₹35K pm"
                    value={employeeForm.previousPackage || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, previousPackage: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Current Package (Offered CTC)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹6.0 LPA / ₹50K pm"
                    value={employeeForm.currentPackage || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, currentPackage: e.target.value })
                    }
                    className="w-full bg-white border border-blue-300 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* 5. SECTION: Multiple Documents Upload (Vault Staging) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-600" />
                  4. Employee Documents Vault (Attach Multiple)
                </h4>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                  {employeeForm.documents?.length || 0} document(s) attached
                </span>
              </div>

              {/* Document Add Row */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Document Category</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      {docCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Custom Document Title</label>
                    <input
                      type="text"
                      placeholder={`e.g. Official ${docCategory}`}
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Select File (PDF / Images)</label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleStageDocument}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        disabled={docStagingLoading}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  Tip: Select Aadhaar, PAN, Resume, Offer Letter, or Degrees. Each document is stored in the employee's permanent compliance vault.
                </p>

                {/* Staged Documents List */}
                {employeeForm.documents && employeeForm.documents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                    {employeeForm.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                            <FileText size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate" title={doc.name}>
                              {doc.name}
                            </div>
                            <div className="text-[10px] font-semibold text-blue-600">
                              {doc.type} • {doc.fileName || "File"}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedDoc(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold cursor-pointer text-xs transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="registerEmployeeForm"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer text-xs shadow-sm shadow-blue-500/20 transition flex items-center gap-2"
            disabled={loading}
          >
            <CheckCircle2 size={15} />
            {loading ? "Registering Employee..." : "Register Employee (Save Complete Profile)"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterEmployeeModal;
