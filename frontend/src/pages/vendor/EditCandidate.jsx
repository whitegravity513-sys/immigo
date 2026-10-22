import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Camera,
  Trash2,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  User,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
];

export default function EditCandidate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    passportNumber: "",
    passportIssueDate: "",
    passportExpiryDate: "",
    dob: "",
    gender: "Male",
    currentPosition: "",
    project: "",
    qualification: "",
    experienceYears: "",
    skills: "",
    state: "",
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
      const [cand, prjs] = await Promise.all([
        crmVendorService.getCandidateById(id),
        crmVendorService.getAvailableProjects(),
      ]);

      if (!cand) {
        setError("Candidate profile not found.");
        return;
      }

      setAvailableProjects(Array.isArray(prjs) ? prjs : []);
      setPhoto(cand.photo || "");
      setDocuments(cand.documents || []);

      setFormData({
        fullName: cand.fullName || "",
        passportNumber: cand.passportNumber || "",
        passportIssueDate: cand.passportIssueDate || cand.dateOfIssue || "",
        passportExpiryDate: cand.passportExpiryDate || cand.passportExpiry || "",
        dob: cand.dob || "",
        gender: cand.gender || "Male",
        currentPosition: cand.currentPosition || cand.trade || "",
        project: cand.project || cand.projectName || "",
        qualification: cand.qualification || "",
        experienceYears: cand.experienceYears ?? "",
        skills: Array.isArray(cand.skills) ? cand.skills.join(", ") : cand.skills || "",
        state: cand.state || "",
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
    const file = e.target.files?.[0];
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
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF documents are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Document must be under 5 MB.");
      return;
    }

    const newDoc = {
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: "Additional Document",
    };

    setDocuments((prev) => [...prev, newDoc]);
    e.target.value = "";
  };

  const handleRemoveDoc = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full Name is required.";
    if (!formData.passportNumber.trim()) errors.passportNumber = "Passport Number is required.";
    if (!formData.currentPosition.trim()) errors.currentPosition = "Trade is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!validate()) {
      setError("Please fill all mandatory fields.");
      return;
    }

    setSaving(true);
    try {
      const updatePayload = {
        fullName: formData.fullName.trim(),
        passportNumber: formData.passportNumber.trim().toUpperCase(),
        passportIssueDate: formData.passportIssueDate || "",
        dateOfIssue: formData.passportIssueDate || "",
        passportExpiryDate: formData.passportExpiryDate || "",
        passportExpiry: formData.passportExpiryDate || "",
        dob: formData.dob || "",
        gender: formData.gender || "Male",
        currentPosition: formData.currentPosition.trim(),
        trade: formData.currentPosition.trim(),
        project: formData.project || "Not Assigned",
        projectName: formData.project || "Not Assigned",
        qualification: formData.qualification.trim(),
        experienceYears: formData.experienceYears !== "" ? Number(formData.experienceYears) : 0,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        state: formData.state.trim(),
        photo: photo || "",
        documents,
      };

      await crmVendorService.updateCandidate(id, updatePayload);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/vendor/candidates/${id}`);
      }, 900);
    } catch (err) {
      console.error("Failed to update candidate:", err);
      setError(err.message || "Failed to save candidate changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading candidate details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-1.5 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Candidate Details</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Edit Candidate Profile
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update candidate fields. Changes reflect directly across project allocations.
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
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Candidate details saved successfully! Redirecting...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="relative w-20 h-20 rounded-xl bg-white border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {photo ? (
                <img
                  src={photo}
                  alt={formData.fullName}
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
                Supported formats: JPG, PNG, WEBP (Max 2 MB).
              </p>
              {photoError && (
                <p className="text-rose-600 text-[10px] flex items-center gap-1">
                  <AlertCircle size={10} />
                  {photoError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleFieldChange}
                placeholder="Candidate Full Name"
                className={`w-full px-3 py-2 border rounded-xl focus:border-blue-600 focus:outline-none bg-white ${
                  fieldErrors.fullName ? "border-rose-400 bg-rose-50/40" : "border-slate-300"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-rose-600 text-[10px] mt-0.5">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Passport No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="passportNumber"
                required
                value={formData.passportNumber}
                onChange={handleFieldChange}
                placeholder="e.g. A1234567"
                className={`w-full px-3 py-2 border rounded-xl uppercase font-mono focus:border-blue-600 focus:outline-none bg-white ${
                  fieldErrors.passportNumber ? "border-rose-400 bg-rose-50/40" : "border-slate-300"
                }`}
              />
              {fieldErrors.passportNumber && (
                <p className="text-rose-600 text-[10px] mt-0.5">{fieldErrors.passportNumber}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of issue</label>
              <input
                type="date"
                name="passportIssueDate"
                value={formData.passportIssueDate}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Expiry</label>
              <input
                type="date"
                name="passportExpiryDate"
                value={formData.passportExpiryDate}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">DOB</label>
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
              <label className="block font-semibold text-slate-700 mb-1">
                Trade <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="currentPosition"
                required
                value={formData.currentPosition}
                onChange={handleFieldChange}
                placeholder="e.g. Electrician, 6G Welder, Mason"
                className={`w-full px-3 py-2 border rounded-xl focus:border-blue-600 focus:outline-none bg-white ${
                  fieldErrors.currentPosition ? "border-rose-400 bg-rose-50/40" : "border-slate-300"
                }`}
              />
              {fieldErrors.currentPosition && (
                <p className="text-rose-600 text-[10px] mt-0.5">{fieldErrors.currentPosition}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project</label>
              <select
                name="project"
                value={formData.project}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              >
                <option value="">Not Assigned / General Pool</option>
                {availableProjects.map((p) => {
                  const pTitle = p.title || p.projectName || p.name;
                  return (
                    <option key={p.id || p._id} value={pTitle}>
                      {pTitle}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                min={0}
                max={50}
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleFieldChange}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Skill (Comma-separated technical skills)
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleFieldChange}
                placeholder="e.g. Pipe Welding, Conduit Wiring, Blueprint Reading"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Candidate Documents ({documents.length})
              </h3>
              <p className="text-xs text-slate-500">PDF documents (Max 5 MB each)</p>
            </div>
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
