import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Save,
  Camera,
  Trash2,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Check,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  Globe,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

const ALL_COUNTRIES = [
  "UAE", "Saudi Arabia", "Qatar", "Oman", "Kuwait", "Bahrain",
  "Jordan", "Lebanon", "Egypt", "Malaysia", "Singapore", "Germany",
  "Australia", "Canada", "United Kingdom", "USA", "Japan",
];

export default function EditCandidate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "Male",
    nationality: "Indian",
    contactNumber: "",
    email: "",
    address: "",

    currentPosition: "",
    experienceYears: "",
    qualification: "",
    previousCompany: "",
    preferredCountry: "",

    passportNumber: "",
    passportIssueDate: "",
    passportExpiryDate: "",

    skills: "",
    tags: "",
  });

  const [documents, setDocuments] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    loadCandidateData();
  }, [id]);

  const loadCandidateData = async () => {
    try {
      setLoading(true);
      setError("");
      const cand = await crmVendorService.getCandidateById(id);
      if (!cand) {
        setError("Candidate profile not found.");
        return;
      }

      setPhoto(cand.photo || "");
      setDocuments(cand.documents || []);

      setFormData({
        fullName: cand.fullName || "",
        dob: cand.dob || "",
        gender: cand.gender || "Male",
        nationality: cand.nationality || "Indian",
        contactNumber: cand.contactNumber || cand.phone || "",
        email: cand.email || "",
        address: cand.address || "",

        currentPosition: cand.currentPosition || "",
        experienceYears: cand.experienceYears || "",
        qualification: cand.qualification || "",
        previousCompany: cand.previousCompany || "",
        preferredCountry: cand.preferredCountry || cand.preferredCountries || "",

        passportNumber: cand.passportNumber || "",
        passportIssueDate: cand.passportIssueDate || "",
        passportExpiryDate: cand.passportExpiryDate || "",

        skills: Array.isArray(cand.skills) ? cand.skills.join(", ") : cand.skills || "",
        tags: Array.isArray(cand.tags) ? cand.tags.join(", ") : cand.tags || "",
      });
    } catch (err) {
      console.error("Failed to load candidate:", err);
      setError("Failed to load candidate details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) setError("");
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Photo file size must be 2 MB or less.");
      return;
    }
    setPhotoError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentAdd = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Only PDF documents are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Document must be under 2 MB.");
      return;
    }

    const docName = prompt("Enter document title (e.g. Passport Copy, Trade Certificate, Medical Fit):", file.name.replace(/\.[^/.]+$/, ""));
    if (!docName) return;

    const newDoc = {
      name: docName.trim(),
      fileName: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: "Attachment",
      uploadedAt: new Date().toISOString().split("T")[0],
    };

    setDocuments((prev) => [...prev, newDoc]);
  };

  const handleRemoveDoc = (index) => {
    if (window.confirm("Are you sure you want to remove this document?")) {
      setDocuments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = "Full Name is required.";
    if (!formData.currentPosition.trim()) errs.currentPosition = "Trade / Position Role is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) {
      setError("Please fill out all required fields marked with *.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedPayload = {
        ...formData,
        photo: photo || "",
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        documents,
      };

      await crmVendorService.updateCandidate(id, updatedPayload);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/vendor/candidates/${id}`);
      }, 1200);
    } catch (err) {
      console.error("Failed to update candidate:", err);
      setError(err.message || "Failed to save candidate changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/vendor/candidates/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-1.5 transition"
          >
            <ArrowLeft size={14} /> Back to Candidate Profile
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Edit Candidate Profile
            </h1>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Update personal info, trade skills, passport credentials, or documents.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to={`/vendor/candidates/${id}`}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-60 cursor-pointer"
          >
            <Save size={15} />
            <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Candidate profile updated successfully! Redirecting...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Camera size={16} className="text-blue-600" />
            <span>Candidate Profile Photo</span>
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-1">
            <div className="relative w-24 h-24 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {photo ? (
                <img src={photo} alt="Candidate Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                  <User size={28} className="text-slate-400" />
                  <span className="text-[10px] mt-1 font-semibold">No Photo</span>
                </div>
              )}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition">
                  <Camera size={14} className="text-blue-600" />
                  <span>{photo ? "Change Photo" : "Upload Candidate Photo"}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto("")}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Supported formats: JPG, PNG, WEBP (Max 2 MB). If left empty, initials will be displayed.
              </p>
              {photoError && (
                <p className="text-rose-600 text-[10px] flex items-center gap-1">
                  <AlertCircle size={10} />
                  {photoError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 1: PERSONAL INFORMATION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">1</span>
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name (As on Passport) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleFieldChange}
                placeholder="e.g. Rahul Kumar"
                className={`w-full px-3 py-2 border rounded-xl focus:border-blue-600 focus:outline-none bg-white ${
                  fieldErrors.fullName ? "border-rose-400 bg-rose-50/40" : "border-slate-300"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1">
                  <AlertCircle size={10} />
                  {fieldErrors.fullName}
                </p>
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile / Phone Number</label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleFieldChange}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFieldChange}
                placeholder="e.g. rahul@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Full Permanent / Present Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleFieldChange}
                placeholder="Village/City, District, State, PIN"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TRADE & EXPERIENCE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">2</span>
            <span>Trade, Skills & Experience</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Trade / Current Position Role <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="currentPosition"
                value={formData.currentPosition}
                onChange={handleFieldChange}
                placeholder="e.g. Electrician, 6G Welder, Mason"
                className={`w-full px-3 py-2 border rounded-xl focus:border-blue-600 focus:outline-none bg-white ${
                  fieldErrors.currentPosition ? "border-rose-400 bg-rose-50/40" : "border-slate-300"
                }`}
              />
              {fieldErrors.currentPosition && (
                <p className="text-rose-600 text-[10px] mt-0.5 flex items-center gap-1">
                  <AlertCircle size={10} />
                  {fieldErrors.currentPosition}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Experience (Years)</label>
              <input
                type="number"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleFieldChange}
                placeholder="e.g. 5"
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qualification / Education</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleFieldChange}
                placeholder="e.g. ITI, Diploma, 10th Pass"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last / Previous Working Company</label>
              <input
                type="text"
                name="previousCompany"
                value={formData.previousCompany}
                onChange={handleFieldChange}
                placeholder="e.g. L&T Construction, Gulf EPC"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preferred Destination Country</label>
              <input
                type="text"
                name="preferredCountry"
                value={formData.preferredCountry}
                onChange={handleFieldChange}
                placeholder="e.g. UAE, Saudi Arabia, Qatar"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Specific Trade Skills (Comma-separated)
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleFieldChange}
                placeholder="e.g. Pipe Welding, Conduit Wiring, Blueprint Reading, Safety Protocols"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: PASSPORT & VERIFICATION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">3</span>
            <span>Passport & Documentation Credentials</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Passport Number</label>
              <input
                type="text"
                name="passportNumber"
                value={formData.passportNumber}
                onChange={handleFieldChange}
                placeholder="e.g. Z1234567"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white uppercase font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Passport Issue Date</label>
              <input
                type="date"
                name="passportIssueDate"
                value={formData.passportIssueDate}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Passport Expiry Date</label>
              <input
                type="date"
                name="passportExpiryDate"
                value={formData.passportExpiryDate}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: DOCUMENTS & ATTACHMENTS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">4</span>
              <span>Candidate Documents ({documents.length})</span>
            </h3>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold cursor-pointer transition">
              <UploadCloud size={14} />
              <span>+ Add PDF Document</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleDocumentAdd}
                className="hidden"
              />
            </label>
          </div>

          {documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={18} className="text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{doc.name || doc.fileName}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {doc.size || "PDF"} &bull; {doc.type || "Document"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
                    title="Remove Document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">
              No additional documents uploaded yet.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-200 flex-wrap gap-3">
          <Link
            to={`/vendor/candidates/${id}`}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition disabled:opacity-60 cursor-pointer"
          >
            <Save size={16} />
            <span>{saving ? "Saving Changes..." : "Save Candidate Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
