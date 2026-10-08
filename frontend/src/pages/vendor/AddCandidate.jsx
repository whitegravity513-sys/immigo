import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Save,
  CheckCircle2,
  Paperclip,
  Trash2,
  UploadCloud,
  Sparkles,
  AlertCircle,
  X,
  FileText,
  ChevronDown,
  Search,
  Globe,
  Check,
  Camera,
  User,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

// Countries list for preferred countries multi-select
const ALL_COUNTRIES = [
  "UAE", "Saudi Arabia", "Qatar", "Oman", "Kuwait", "Bahrain",
  "Jordan", "Lebanon", "Egypt", "Malaysia", "Singapore", "Germany",
  "Australia", "Canada", "United Kingdom", "USA", "Japan",
];

// Validation helpers
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || "").trim());

const isValidPhone = (phone) => {
  const digits = (phone || "").replace(/[\s\-\(\)\+]/g, "");
  return /^\d{7,15}$/.test(digits);
};

export function AddCandidate() {
  const navigate = useNavigate();
  const vendor = crmVendorService.getCurrentVendor();

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "Male",
    nationality: "Indian",
    address: "",
    currentPosition: "",
    skills: "",
    experienceYears: "",
    qualification: "",
    previousCompany: "",
    preferredCountries: "",
    tags: "",
  });

  // Candidate Profile Photo
  const [candidatePhoto, setCandidatePhoto] = useState("");
  const [photoError, setPhotoError] = useState("");

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Photo must be 2 MB or less.");
      return;
    }
    setPhotoError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setCandidatePhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Mandatory document files
  const [resumeFile, setResumeFile] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resumeRef = useRef(null);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) setError("");
  };

  // PDF-only file handler
  const handleMandatoryFileChange = (setter, fieldKey, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFieldErrors((prev) => ({ ...prev, [fieldKey]: "Only PDF files are allowed." }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, [fieldKey]: "File must be under 2 MB." }));
      return;
    }
    setter(file);
    setFieldErrors((prev) => ({ ...prev, [fieldKey]: "" }));
  };

  const validate = () => {
    const errors = {};

    if (!formData.fullName.trim()) errors.fullName = "Candidate Full Name is required.";
    if (!formData.currentPosition.trim()) errors.currentPosition = "Trade / Position is required.";

    // Mandatory documents
    if (!resumeFile) errors.resume = "Resume (PDF) is required.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    if (!validate()) {
      setError("Please fill all required fields and upload mandatory documents.");
      return;
    }

    setLoading(true);
    try {
      // Build document list including mandatory docs
      const mandatoryDocs = [
        { name: "Resume / CV", fileName: resumeFile.name, size: `${(resumeFile.size / (1024 * 1024)).toFixed(2)} MB`, type: "Resume" },
      ];

      const candidateData = {
        ...formData,
        photo: candidatePhoto || "",
        preferredCountry: formData.preferredCountries,
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        documents: mandatoryDocs,
        vendorId: vendor?.id,
        vendorName: vendor?.companyName,
        vendorTag: vendor?.id,
      };

      const created = await crmVendorService.createCandidate(vendor?.id, candidateData);
      navigate(`/vendor/candidates/${created.id}`);
    } catch (err) {
      setError(err.message || "Failed to save candidate.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Candidates</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Add Candidate to Pool
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Register a new worker profile. Fields marked <span className="text-red-500">*</span> are mandatory. All documents must be PDF only.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Save size={15} />
              <span>{loading ? "Saving..." : "Save Candidate"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: PERSONAL INFORMATION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">1</span>
              <span>Personal Information</span>
            </h3>

            {/* Candidate Photo Upload */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="relative w-20 h-20 rounded-2xl bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {candidatePhoto ? (
                  <img
                    src={candidatePhoto}
                    alt="Candidate Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-center p-2">
                    <User size={24} className="text-slate-400" />
                    <span className="text-[9px] mt-1 font-semibold">No Photo</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition">
                    <Camera size={14} className="text-blue-600" />
                    <span>{candidatePhoto ? "Change Photo" : "Upload Candidate Photo"}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {candidatePhoto && (
                    <button
                      type="button"
                      onClick={() => setCandidatePhoto("")}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Optional. Supported formats: JPG, PNG, WEBP (Max 2 MB). If not uploaded, standard initials will be displayed.
                </p>
                {photoError && (
                  <p className="text-rose-600 text-[10px] flex items-center gap-1 font-semibold">
                    <AlertCircle size={10} />
                    {photoError}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name (As on Passport) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleFieldChange}
                  placeholder="e.g. Rahul Kumar"
                  className={`w-full px-3 py-2 border rounded-xl focus:border-blue-600 focus:outline-none bg-white ${fieldErrors.fullName ? "border-red-400 bg-red-50" : "border-slate-300"
                    }`}
                />
                {fieldErrors.fullName && (
                  <p className="text-red-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10} />{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleFieldChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleFieldChange}
                  placeholder="e.g. Indian"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
                />
              </div>



              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Permanent Residential Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFieldChange}
                  placeholder="Village, District, State, Pincode..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PROFESSIONAL INFORMATION */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">2</span>
              <span>Professional & Trade Qualifications</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Trade / Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="currentPosition"
                  value={formData.currentPosition}
                  onChange={handleFieldChange}
                  placeholder="e.g. Electrician, 6G Welder, Mason..."
                  className={`w-full px-3 py-2 border rounded-xl focus:border-blue-600 focus:outline-none bg-white ${fieldErrors.currentPosition ? "border-red-400 bg-red-50" : "border-slate-300"
                    }`}
                />
                {fieldErrors.currentPosition && (
                  <p className="text-red-600 text-[10px] mt-0.5 flex items-center gap-1"><AlertCircle size={10} />{fieldErrors.currentPosition}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleFieldChange}
                  placeholder="e.g. 5"
                  min={0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Highest Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleFieldChange}
                  placeholder="e.g. ITI Electrical / Diploma Civil"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Previous Employer / Company</label>
                <input
                  type="text"
                  name="previousCompany"
                  value={formData.previousCompany}
                  onChange={handleFieldChange}
                  placeholder="e.g. L&T Construction / Tata Projects"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
                />
              </div>



              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Skills & Technical Expertise (comma separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleFieldChange}
                  placeholder="e.g. Industrial Wiring, Conduit Bending, Panel Assembly"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Tags for Smart Search</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleFieldChange}
                  placeholder="Electrician, ITI, 5 Years Experience, UAE, Industrial"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PREFERRED COUNTRIES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">3</span>
              <Globe size={14} className="text-blue-600" />
              <span>Preferred Countries</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Preferred Gulf / Overseas Destination Countries
              </label>
              <input
                type="text"
                name="preferredCountries"
                value={formData.preferredCountries}
                onChange={handleFieldChange}
                placeholder="e.g. UAE, Saudi Arabia, Qatar"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* SECTION 4: MANDATORY DOCUMENTS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center">4</span>
              <span>Mandatory Documents</span>
              <span className="ml-auto text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">PDF only · Max 2 MB</span>
            </h3>

            <p className="text-xs text-slate-500">
              The candidate's Resume is <strong>mandatory</strong>. Only PDF files (Max 2MB) are accepted. Other documents can be uploaded later if the candidate is selected.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


              {/* Resume */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${resumeFile ? "bg-emerald-50 border-emerald-300" : fieldErrors.resume ? "bg-red-50 border-red-300" : "bg-slate-50 border-slate-200"
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Resume / CV <span className="text-red-500">*</span>
                    </p>
                    <p className="text-[10px] text-slate-500">Work experience profile</p>
                  </div>
                  {resumeFile ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={10} /> Uploaded
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-500">Required</span>
                  )}
                </div>

                {resumeFile ? (
                  <div className="flex items-center justify-between bg-white p-2 border border-emerald-200 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText size={12} className="text-emerald-600 shrink-0" />
                      <span className="truncate text-[11px] font-mono">{resumeFile.name}</span>
                    </div>
                    <button type="button" onClick={() => { setResumeFile(null); resumeRef.current && (resumeRef.current.value = ""); }} className="text-red-500 hover:text-red-700 text-[10px] font-bold ml-1 cursor-pointer">✕</button>
                  </div>
                ) : (
                  <label className="block w-full py-3 text-center bg-white border border-dashed border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-blue-600 cursor-pointer group">
                    <div className="flex flex-col items-center gap-1">
                      <UploadCloud size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                      <span>Upload Resume PDF</span>
                    </div>
                    <input
                      ref={resumeRef}
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleMandatoryFileChange(setResumeFile, "resume", e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                )}
                {fieldErrors.resume && (
                  <p className="text-red-600 text-[10px] flex items-center gap-1"><AlertCircle size={10} />{fieldErrors.resume}</p>
                )}
              </div>
            </div>
          </div>



          {/* Action Button Footer */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Once saved, you can submit this candidate directly to client projects and track progress.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Save size={15} />
              <span>{loading ? "Saving Candidate..." : "Save Candidate"}</span>
            </button>
          </div>
        </form>
      </div>
    );
}

export default AddCandidate;
