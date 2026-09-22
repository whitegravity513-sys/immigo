import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient.js";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Shield,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Camera,
  HeartHandshake,
  ExternalLink,
  Plus,
  Save,
  Check,
  X,
  FileCheck,
} from "lucide-react";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";

const REQUIRED_DOC_TYPES = [
  { type: "Resume / CV", desc: "Updated Curriculum Vitae / Resume", required: true },
  { type: "Aadhaar / National ID", desc: "Government Issued National ID Card", required: true },
  { type: "PAN Card", desc: "Permanent Account Number / Tax ID", required: true },
  { type: "Offer Letter", desc: "Signed Company Offer Letter", required: true },
  { type: "Appointment Letter", desc: "Official Employment Appointment Letter", required: false },
  { type: "Educational Certificates", desc: "Highest Degree / Diploma / Marksheets", required: true },
  { type: "Relieving / Experience Letter", desc: "Previous Employer Relieving / Experience Certificate", required: false },
  { type: "Bank Proof / Cancelled Cheque", desc: "Bank Account Passbook / Cancelled Cheque for Payroll", required: true },
  { type: "Address Proof", desc: "Utility Bill / Passport / Driving License", required: false },
  { type: "NDA / Agreement", desc: "Signed Non-Disclosure / Employee Agreement", required: false },
  { type: "Other", desc: "Any other supporting certifications or documents", required: false },
];

export const formatFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = (apiClient.defaults.baseURL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const compressImage = (file, maxDimension = 1200, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  });
};

export default function EmployeeProfileDocsTab({ user, token, onProfileUpdate }) {
  const [profile, setProfile] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      return stored ? { ...(user || {}), ...stored } : user;
    } catch {
      return user || null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Contact info edit state
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState(() => ({
    phone: user?.phone || "",
    address: user?.address || "",
    emergencyContact: {
      name: user?.emergencyContact?.name || "",
      phone: user?.emergencyContact?.phone || "",
      relation: user?.emergencyContact?.relation || "",
    },
  }));
  const [contactSaving, setContactSaving] = useState(false);

  // Document Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    name: "",
    type: "Resume / CV",
    url: "",
  });
  const [docUploading, setDocUploading] = useState(false);
  const [docFileLabel, setDocFileLabel] = useState("");

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  // Fetch full employee profile silently
  const fetchProfile = async () => {
    try {
      const res = await apiClient.get("/employee/profile");
      if (res.data) {
        setProfile(res.data);
        setContactForm({
          phone: res.data.phone || "",
          address: res.data.address || "",
          emergencyContact: {
            name: res.data.emergencyContact?.name || "",
            phone: res.data.emergencyContact?.phone || "",
            relation: res.data.emergencyContact?.relation || "",
          },
        });
        // Sync image if different
        if (res.data.profileImage && typeof onProfileUpdate === "function") {
          onProfileUpdate(res.data.profileImage);
        }
      }
    } catch (err) {
      // Non-blocking fallback to current user
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Avatar Image Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showError("Profile image must be under 15 MB.");
      return;
    }

    try {
      showSuccess("Uploading profile photo...");
      const compressedDataUrl = await compressImage(file, 1000, 0.85);
      const res = await apiClient.put("/employee/profile/photo", {
        profileImage: compressedDataUrl,
      });
      const newImg = res.data.profileImage;
      setProfile((prev) => ({ ...prev, profileImage: newImg }));
      if (typeof onProfileUpdate === "function") {
        onProfileUpdate(newImg);
      }
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, profileImage: newImg }));
        window.dispatchEvent(new Event("user-updated"));
      } catch (storageErr) {
        console.error("Failed to update user in localStorage", storageErr);
      }
      showSuccess("Profile photo updated successfully!");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update profile photo.");
    }
  };

  // Handle Save Contact Details
  const handleSaveContact = async (e) => {
    e.preventDefault();
    setContactSaving(true);
    try {
      const res = await apiClient.put("/employee/profile", contactForm);
      setProfile(res.data.employee);
      setEditingContact(false);
      showSuccess("Contact information updated successfully!");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update contact details.");
    } finally {
      setContactSaving(false);
    }
  };

  // Handle Document File Pick
  const handleDocFilePick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      showError("File size must be under 20 MB.");
      return;
    }
    setDocFileLabel(file.name);
    if (!docForm.name) {
      setDocForm((prev) => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, "") }));
    }

    // Compress image or read file
    const dataUrl = await compressImage(file, 1600, 0.85);
    setDocForm((prev) => ({ ...prev, url: dataUrl }));
  };

  // Handle Submit Document
  const handleSubmitDocument = async (e) => {
    e.preventDefault();
    if (!docForm.name.trim() || !docForm.url) {
      showError("Please provide document title and select a file.");
      return;
    }

    setDocUploading(true);
    try {
      const res = await apiClient.post("/employee/documents", docForm);
      setProfile(res.data.employee);
      setUploadModalOpen(false);
      setDocForm({ name: "", type: "Resume / CV", url: "" });
      setDocFileLabel("");
      showSuccess("Document uploaded to vault successfully!");
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      console.error("Error message:", err.message);
      console.error("Error code:", err.code);
      console.error("Response:", err.response?.data);
      console.error("Status:", err.response?.status);

      showError(
        err.response?.data?.message ||
        err.message ||
        "Failed to upload document."
      );
    } finally {
      setDocUploading(false);
    }
  };

  // Handle Delete Document
  const handleDeleteDocument = async (docId, docName) => {
    if (!window.confirm(`Are you sure you want to remove "${docName}" from your vault?`)) {
      return;
    }
    try {
      const res = await apiClient.delete(`/employee/documents/${docId}`);
      setProfile(res.data.employee);
      showSuccess("Document removed successfully.");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete document.");
    }
  };

  const openUploadForType = (typeItem, existingDoc = null) => {
    setDocForm({
      name: existingDoc?.name || typeItem.type,
      type: typeItem.type,
      url: "",
    });
    setDocFileLabel("");
    setUploadModalOpen(true);
  };

  const uploadedDocs = profile?.documents || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-800">
      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            {/* Avatar with Camera Overlay */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-3xl flex items-center justify-center shadow-md border-2 border-white">
                {profile?.profileImage ? (
                  <img src={formatFileUrl(profile.profileImage)} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0)?.toUpperCase() || "E"
                )}
              </div>
              <label
                className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white cursor-pointer text-[10px] font-bold"
                title="Change profile photo"
              >
                <Camera size={18} className="mb-1" />
                <span>Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* Basic Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                  {profile?.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {profile?.status || "active"}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-sm text-slate-500 font-semibold">
                <EmployeeIdBadge id={profile?.employeeId} />
                <span>•</span>
                <span className="text-blue-700 font-bold">{profile?.designation || "Employee"}</span>
                <span>•</span>
                <span className="text-slate-600 font-medium">{profile?.department || "General"}</span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                <Mail size={13} className="text-slate-400" />
                <span>{profile?.email}</span>
              </p>
            </div>
          </div>

          {/* Key Metric Chips */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Joined</span>
              <span className="text-xs font-bold text-slate-800">
                {profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString("en-IN") : "—"}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vault Documents</span>
              <span className="text-lg font-black text-slate-800">{uploadedDocs.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Contact & Emergency Details + Quick Document Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information Card */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Phone size={16} className="text-blue-600" /> Contact Details
              </h3>
              {!editingContact && (
                <button
                  type="button"
                  onClick={() => setEditingContact(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            {editingContact ? (
              <form onSubmit={handleSaveContact} className="space-y-3 text-left">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Residential Address</label>
                  <textarea
                    placeholder="Street, City, State, Pincode"
                    rows={2}
                    value={contactForm.address}
                    onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2 flex items-center gap-1">
                    <HeartHandshake size={13} className="text-rose-500" /> Emergency Contact
                  </span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Contact Person Name"
                      value={contactForm.emergencyContact.name}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          emergencyContact: { ...contactForm.emergencyContact, name: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Emergency Phone"
                        value={contactForm.emergencyContact.phone}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            emergencyContact: { ...contactForm.emergencyContact, phone: e.target.value },
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Relation (e.g. Spouse)"
                        value={contactForm.emergencyContact.relation}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            emergencyContact: { ...contactForm.emergencyContact, relation: e.target.value },
                          })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingContact(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contactSaving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Save size={13} /> {contactSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5 text-left text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone</span>
                  <span className="font-semibold text-slate-700">{profile?.phone || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
                  <span className="font-medium text-slate-600 block">{profile?.address || "Not provided"}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Emergency Contact
                  </span>
                  {profile?.emergencyContact?.name || profile?.emergencyContact?.phone ? (
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-0.5">
                      <div className="font-bold text-slate-800 text-xs">
                        {profile.emergencyContact.name}{" "}
                        {profile.emergencyContact.relation && `(${profile.emergencyContact.relation})`}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold">{profile.emergencyContact.phone}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No emergency contact set</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document Checklist Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck size={17} className="text-blue-600" /> Compliance Document Checklist
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Mandatory documentation for legal payroll and identity verification
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDocForm({ name: "", type: "Other", url: "" });
                  setDocFileLabel("");
                  setUploadModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Plus size={14} /> Upload Custom
              </button>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REQUIRED_DOC_TYPES.map((item) => {
                const existingDoc = uploadedDocs.find((d) => d.type === item.type);
                const isUploaded = Boolean(existingDoc);
                const isRejected = existingDoc?.status === "Rejected";
                const isVerified = existingDoc?.status === "Verified";

                return (
                  <div
                    key={item.type}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                      isRejected
                        ? "bg-rose-50/50 border-rose-200"
                        : isVerified
                        ? "bg-emerald-50/40 border-emerald-200"
                        : isUploaded
                        ? "bg-amber-50/30 border-amber-200"
                        : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 truncate">{item.type}</span>
                          {item.required && !isUploaded && (
                            <span className="text-[9px] font-black text-rose-500 uppercase">Required</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">{item.desc}</span>
                      </div>

                      <div className="shrink-0">
                        {isUploaded ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(existingDoc)}
                              className="p-1.5 hover:bg-slate-200/60 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="View Document"
                            >
                              <Eye size={14} />
                            </button>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                isVerified
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isRejected
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {existingDoc.status || "Submitted"}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openUploadForType(item)}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[11px] rounded-lg cursor-pointer transition-all shadow-2xs flex items-center gap-1"
                          >
                            <UploadCloud size={13} /> Add
                          </button>
                        )}
                      </div>
                    </div>

                    {/* If rejected, show reason and instant Re-upload button */}
                    {isRejected && (
                      <div className="pt-2 border-t border-rose-200/70 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-rose-700 font-medium truncate" title={existingDoc.verificationNote}>
                          Reason: {existingDoc.verificationNote || "Document rejected by HR"}
                        </span>
                        <button
                          type="button"
                          onClick={() => openUploadForType(item, existingDoc)}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-bold cursor-pointer transition shrink-0 shadow-2xs"
                        >
                          Re-upload
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Document Vault Table: All Uploaded Documents */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-indigo-600" /> Uploaded Document Vault ({uploadedDocs.length})
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Securely stored electronic records and verification receipts
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  Document Title
                </th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Category</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Uploaded By</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Uploaded Date</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {uploadedDocs.map((doc) => (
                <tr key={doc._id || doc.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={16} className="text-blue-600 shrink-0" />
                    <span className="truncate max-w-[220px]">{doc.name}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">{doc.uploadedBy || "Employee"}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${doc.status === "Verified"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : doc.status === "Rejected"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                      >
                        {doc.status || "Submitted"}
                      </span>
                      {doc.verificationNote && (
                        <p className="text-[10px] text-rose-600 font-medium max-w-[180px] truncate" title={doc.verificationNote}>
                          Note: {doc.verificationNote}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye size={13} /> View
                      </button>
                      {doc.status === "Rejected" && (
                        <button
                          type="button"
                          onClick={() => openUploadForType({ type: doc.type }, doc)}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Upload new corrected copy"
                        >
                          <UploadCloud size={13} /> Re-upload
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc._id || doc.id, doc.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {uploadedDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold text-sm">
                    No documents uploaded yet. Use the checklist above or the upload button to add your documents.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {uploadModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setUploadModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <UploadCloud size={18} className="text-blue-600" /> Upload Document to Vault
              </h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitDocument} className="p-6 space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Document Category *</label>
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {REQUIRED_DOC_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Degree Certificate / PAN Card Copy"
                  value={docForm.name}
                  onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Attach File (PDF or Image) *
                </label>
                <div className="border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-6 transition-all text-center">
                  <label className="flex flex-col items-center gap-2 cursor-pointer text-slate-600">
                    <UploadCloud size={28} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">
                      {docFileLabel ? "Selected: " + docFileLabel : "Click to select PDF, PNG, or JPG (Max 15MB)"}
                    </span>
                    <input
                      type="file"
                      required={!docForm.url}
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={handleDocFilePick}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={docUploading || !docForm.url}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {docUploading ? "Uploading Document…" : "Upload to Vault"}
                </button>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW DOCUMENT MODAL */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="text-base font-black text-slate-800 truncate">{previewDoc.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                  {previewDoc.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 p-4 bg-slate-100 overflow-y-auto flex items-center justify-center min-h-[400px]">
              {previewDoc.url?.startsWith("data:application/pdf") || previewDoc.url?.toLowerCase().endsWith(".pdf") ? (
                <iframe src={formatFileUrl(previewDoc.url)} title={previewDoc.name} className="w-full h-[500px] rounded-xl border" />
              ) : (
                <img
                  src={formatFileUrl(previewDoc.url)}
                  alt={previewDoc.name}
                  className="max-h-[500px] max-w-full rounded-xl object-contain shadow-sm"
                />
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                Uploaded by {previewDoc.uploadedBy || "Employee"} on{" "}
                {previewDoc.uploadedAt ? new Date(previewDoc.uploadedAt).toLocaleDateString("en-IN") : "—"}
              </span>
              <a
                href={formatFileUrl(previewDoc.url)}
                download={previewDoc.name}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ExternalLink size={13} /> Download / Open
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
