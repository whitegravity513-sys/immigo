import React, { useState } from "react";
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
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

export function AddCandidate() {
  const navigate = useNavigate();
  const vendor = crmVendorService.getCurrentVendor();

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "1995-05-10",
    gender: "Male",
    nationality: "Indian",
    phone: "",
    email: "",
    address: "",
    currentPosition: "Electrician",
    skills: "Industrial Wiring, Panel Assembly, Conduit Bending",
    experienceYears: "5",
    qualification: "ITI Electrical (2 Years)",
    previousCompany: "L&T Construction",
    expectedSalary: "1800",
    salaryCurrency: "AED",
    preferredCountry: "UAE",
    tags: "Electrician, ITI, 5 Years Experience, UAE",
    documents: [],
  });

  const [newDocName, setNewDocName] = useState("Resume / CV");
  const [newDocFile, setNewDocFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleAddDocument = () => {
    if (!newDocName.trim()) return;
    const fileName = newDocFile ? newDocFile.name : `${newDocName.toLowerCase().replace(/\s+/g, "_")}.pdf`;
    const size = newDocFile ? `${(newDocFile.size / (1024 * 1024)).toFixed(2)} MB` : "1.1 MB";

    const doc = {
      name: newDocName,
      fileName,
      size,
      type: newDocName,
    };

    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, doc],
    }));
    setNewDocName("Passport Copy");
    setNewDocFile(null);
  };

  const handleRemoveDoc = (index) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim()) {
      setError("Candidate Full Name is required.");
      return;
    }
    if (!formData.currentPosition.trim()) {
      setError("Trade / Position is required.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Candidate Phone number is required.");
      return;
    }

    setLoading(true);
    try {
      const created = await crmVendorService.createCandidate(vendor?.id, formData);
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
            Register a new worker profile with trade skills, certifications, and compliance documents.
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
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PERSONAL INFORMATION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
              1
            </span>
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
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="text"
                name="dob"
                value={formData.dob}
                onChange={handleFieldChange}
                placeholder="DD/MM/YYYY (e.g. 10/05/1995)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Gender
              </label>
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
                Nationality
              </label>
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
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleFieldChange}
                placeholder="+91 98765 43210"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFieldChange}
                placeholder="candidate@gmail.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Permanent Residential Address
              </label>
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

        {/* SECTION 2: PROFESSIONAL & TRADE INFORMATION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <span>Professional & Trade Qualifications</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Trade / Position <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="currentPosition"
                value={formData.currentPosition}
                onChange={handleFieldChange}
                placeholder="e.g. Electrician, 6G Welder, Mason..."
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleFieldChange}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Highest Educational Qualification
              </label>
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
              <label className="block font-semibold text-slate-700 mb-1">
                Previous Employer / Company
              </label>
              <input
                type="text"
                name="previousCompany"
                value={formData.previousCompany}
                onChange={handleFieldChange}
                placeholder="e.g. L&T Construction / Tata Projects"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Preferred Gulf / Destination Country
              </label>
              <select
                name="preferredCountry"
                value={formData.preferredCountry}
                onChange={handleFieldChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white cursor-pointer"
              >
                <option value="UAE">UAE</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Qatar">Qatar</option>
                <option value="Oman">Oman</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Bahrain">Bahrain</option>
                <option value="Germany">Germany</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Skills & Technical Expertise (Comma separated)
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
              <label className="block font-semibold text-slate-700 mb-1">
                Tags for Smart Search & Filtering (e.g. Electrician, ITI, 5 Years Experience, UAE)
              </label>
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

        {/* SECTION 3: DOCUMENTS & RESUME */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <span>Candidate Documents & Resume</span>
          </h3>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-end gap-3 text-xs">
            <div className="flex-1">
              <label className="block font-semibold text-slate-700 mb-1">
                Document Category
              </label>
              <select
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-white"
              >
                <option value="Resume / CV">Resume / CV</option>
                <option value="Passport Copy">Passport Copy</option>
                <option value="Trade Test Certificate">Trade Test Certificate</option>
                <option value="Education Certificate">Education Certificate</option>
                <option value="Experience Letter">Experience Letter</option>
                <option value="Medical Fitness Certificate">Medical Fitness Certificate</option>
                <option value="Other Certificate">Other Certificate</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block font-semibold text-slate-700 mb-1">
                Choose File (PDF, DOCX, JPG)
              </label>
              <input
                type="file"
                onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleAddDocument}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            >
              + Attach Document
            </button>
          </div>

          {formData.documents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {formData.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip size={14} className="text-blue-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-slate-900 block truncate">{doc.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {doc.fileName} ({doc.size})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
