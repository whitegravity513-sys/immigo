import React, { useState, useRef } from "react";
import {
  ArrowLeft,
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
  UserPlus,
} from "lucide-react";

export const RegisterEmployeeSection = ({
  employeeForm,
  setEmployeeForm,
  onSubmit,
  loading,
  errorMsg = "",
  onCancel,
}) => {
  const [docCategory, setDocCategory] = useState("Aadhaar Card");
  const [docTitle, setDocTitle] = useState("");
  const [docFileLabel, setDocFileLabel] = useState("");
  const [docStagingLoading, setDocStagingLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

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

  const computeImmiId = (joiningDate, dob) => {
    const formatPart = (dStr) => {
      if (!dStr) return null;
      const str = String(dStr).split("T")[0];
      const parts = str.split("-");
      if (parts.length === 3) {
        const yr = parts[0].slice(-2);
        const day = parts[2].padStart(2, "0");
        return `${day}${yr}`;
      }
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return null;
      const day = String(d.getDate()).padStart(2, "0");
      const yr = String(d.getFullYear()).slice(-2);
      return `${day}${yr}`;
    };

    const joinPart = formatPart(joiningDate) || formatPart(new Date().toISOString().split("T")[0]) || "DDYY";
    const dobPart = formatPart(dob);
    if (!dobPart) {
      return `IMMI-${joinPart}-DDYY(DOB)`;
    }
    return `IMMI-${joinPart}-${dobPart}`;
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("Profile photo size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEmployeeForm((prev) => ({
        ...prev,
        profileImage: reader.result,
      }));
      setLocalError("");
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
      setLocalError("Document size must be less than 15MB.");
      return;
    }
    setDocStagingLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const newDoc = {
        name: docTitle.trim() || docCategory,
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
      setLocalError("");
    };
    reader.onerror = () => {
      setLocalError("Failed to read document file.");
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

  const generatedId = computeImmiId(employeeForm.joiningDate, employeeForm.dob);

  return (
    <div className="w-full space-y-6 text-left">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Back to Employees"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Register New Employee
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                Workforce Onboarding
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Fill in official identity, compensation, statutory compliance & credentials
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            System Employee ID
          </span>
          <span className="text-base sm:text-lg font-black text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-xl tracking-wide mt-0.5 font-mono shadow-xs">
            {generatedId}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
            Format: IMMI-ddYY(Joining)-DDYY(DOB)
          </span>
        </div>
      </div>

      {(localError || errorMsg) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-bold shadow-xs">
          <AlertCircle size={18} className="shrink-0" />
          <span>{localError || errorMsg}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Section 1: Photo & ID Summary */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
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
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload size={13} />
                    {employeeForm.profileImage ? "Change Photo" : "Upload Profile Photo"}
                  </button>
                  {employeeForm.profileImage && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Recommended: Square JPG/PNG, max 5MB. Displayed on employee badge & profile reports.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500">Live Employee Code</span>
              <div className="text-sm font-mono font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-xl mt-1">
                {generatedId}
              </div>
            </div>
          </div>

          {/* Core Identity & Portal Credentials */}
          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <User size={15} className="text-blue-600" />
              1. Core Identity & Portal Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar"
                  value={employeeForm.name || ""}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Company Work Email *</label>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                />
                <span className="text-[10px] text-slate-400">Official email for portal login</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Personal Email</label>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                />
                <span className="text-[10px] text-slate-400">Personal ID for records</span>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Contact Phone *</label>
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
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition font-medium ${
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
                  onChange={(e) => {
                    const newDoj = e.target.value;
                    const newId = computeImmiId(newDoj, employeeForm.dob);
                    setEmployeeForm({
                      ...employeeForm,
                      joiningDate: newDoj,
                      employeeId: newId,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                />
                <span className="text-[10px] text-slate-400">Day & Year forms ID prefix (e.g. 0926)</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Date of Birth (DOB) *</label>
                  {employeeForm.dob && (
                    <span className="text-[10px] font-bold text-emerald-600">Selected ✓</span>
                  )}
                </div>
                <input
                  type="date"
                  required
                  value={employeeForm.dob || ""}
                  onChange={(e) => {
                    const newDob = e.target.value;
                    const newId = computeImmiId(employeeForm.joiningDate, newDob);
                    setEmployeeForm({
                      ...employeeForm,
                      dob: newDob,
                      employeeId: newId,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium"
                />
                <span className="text-[10px] text-slate-400">Day & Year forms ID suffix (e.g. 1598)</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Employee Status *</label>
                <select
                  value={employeeForm.status || "active"}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, status: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-semibold cursor-pointer"
                >
                  <option value="active">🟢 Active</option>
                  <option value="inactive">🔴 Inactive</option>
                </select>
                <span className="text-[10px] text-slate-400">Account status</span>
              </div>
            </div>
          </div>

          {/* Section 2: Role & Address */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Briefcase size={15} className="text-blue-600" />
              2. Corporate Role & Residential Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Department</label>
                <select
                  value={employeeForm.department || departments[0]}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, department: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition font-medium cursor-pointer"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Career History & Compensation */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Award size={15} className="text-blue-600" />
              3. Career History & Compensation Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/70 border border-slate-200/80 p-4 sm:p-5 rounded-2xl">
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
                  placeholder="e.g. ₹ 4.5 LPA"
                  value={employeeForm.previousPackage || ""}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, previousPackage: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Current Package (CTC)</label>
                <input
                  type="text"
                  placeholder="e.g. ₹ 6.0 LPA"
                  value={employeeForm.currentPackage || ""}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, currentPackage: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Monthly Net Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={employeeForm.monthlySalary || ""}
                    onChange={(e) =>
                      setEmployeeForm({ ...employeeForm, monthlySalary: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400">Used for automatic salary slip generation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Document Repository */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <FileText size={15} className="text-blue-600" />
              4. Compliance & Statutory Document Repository
            </h4>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Document Type</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {docCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Custom Title / Remark</label>
                  <input
                    type="text"
                    placeholder={`e.g. Signed ${docCategory}`}
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Upload File (PDF/Image)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    className="hidden"
                    onChange={handleStageDocument}
                  />
                  <button
                    type="button"
                    disabled={docStagingLoading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-dashed border-slate-300 hover:border-blue-500 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Upload size={14} className="text-blue-600" />
                    <span>{docStagingLoading ? "Reading file..." : "Choose & Attach"}</span>
                  </button>
                </div>
              </div>

              {employeeForm.documents && employeeForm.documents.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Attached Documents ({employeeForm.documents.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {employeeForm.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText size={15} className="text-blue-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-bold truncate block">{doc.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{doc.type}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedDoc(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                          title="Remove document"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Cancel & Return
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <UserPlus size={15} />
            )}
            <span>Register & Onboard Employee</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterEmployeeSection;
