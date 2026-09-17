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

export default function EmployeeProfileDocsTab({ user, token }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Contact info edit state
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    phone: "",
    address: "",
    emergencyContact: { name: "", phone: "", relation: "" },
  });
  const [contactSaving, setContactSaving] = useState(false);

  // Document Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    name: "",
    type: "Resume / CV",
    url: "",
  });
  const [docFileLabel, setDocFileLabel] = useState("");
  const [docUploading, setDocUploading] = useState(false);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/employee/profile");
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
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load employee profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Avatar Image Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError("Profile image must be under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await apiClient.put("/employee/profile/photo", {
          profileImage: reader.result,
        });
        setProfile((prev) => ({ ...prev, profileImage: res.data.profileImage }));
        showSuccess("Profile photo updated successfully!");
      } catch (err) {
        showError(err.response?.data?.message || "Failed to update profile photo.");
      }
    };
    reader.readAsDataURL(file);
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
  const handleDocFilePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showError("File size must be under 15 MB.");
      return;
    }
    setDocFileLabel(file.name);
    if (!docForm.name) {
      setDocForm((prev) => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, "") }));
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocForm((prev) => ({ ...prev, url: reader.result }));
    };
    reader.readAsDataURL(file);
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
      showError(err.response?.data?.message || "Failed to upload document.");
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

  const openUploadForType = (typeItem) => {
    setDocForm({
      name: typeItem.type,
      type: typeItem.type,
      url: "",
    });
    setDocFileLabel("");
    setUploadModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-slate-500 text-sm font-semibold mt-3">Loading employee profile & document vault…</span>
      </div>
    );
  }

  const uploadedDocs = profile?.documents || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Notifications */}
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
                  <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
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
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Leave Balance</span>
              <span className="text-lg font-black text-blue-900">{profile?.leaveBalance ?? 18} Days</span>
            </div>
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
                        placeholder="Relation (e.g. Spouse, Father)"
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

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={contactSaving}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {contactSaving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingContact(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Direct Phone</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" />
                    {profile?.phone || <span className="text-slate-400 italic">Not updated</span>}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Address</span>
                  <span className="font-medium text-slate-700 flex items-start gap-1.5 leading-relaxed">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    {profile?.address || <span className="text-slate-400 italic">Not updated</span>}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
                    <HeartHandshake size={12} className="text-rose-500" /> Emergency Contact
                  </span>
                  {profile?.emergencyContact?.name ? (
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-0.5 font-medium">
                      <div className="font-bold text-slate-800">
                        {profile.emergencyContact.name}{" "}
                        {profile.emergencyContact.relation && (
                          <span className="text-slate-500 font-normal">({profile.emergencyContact.relation})</span>
                        )}
                      </div>
                      <div className="text-slate-600 font-semibold">{profile.emergencyContact.phone}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No emergency contact added</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Corporate Documents Checklist & Vault Header */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <FileCheck size={18} className="text-blue-600" /> Corporate Compliance & Onboarding Checklist
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Upload all required documents for corporate record verification
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDocForm({ name: "", type: "Other", url: "" });
                  setDocFileLabel("");
                  setUploadModalOpen(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shadow-blue-500/20"
              >
                <Plus size={14} /> Upload Any Document
              </button>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REQUIRED_DOC_TYPES.map((item) => {
                const existingDoc = uploadedDocs.find((d) => d.type === item.type);
                const isUploaded = Boolean(existingDoc);

                return (
                  <div
                    key={item.type}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isUploaded
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
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
                            className="p-1.5 hover:bg-emerald-100/70 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="View Document"
                          >
                            <Eye size={15} />
                          </button>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black">
                            Uploaded
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
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                        doc.status === "Verified"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : doc.status === "Rejected"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {doc.status || "Submitted"}
                    </span>
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
              {previewDoc.url?.startsWith("data:application/pdf") || previewDoc.url?.endsWith(".pdf") ? (
                <iframe src={previewDoc.url} title={previewDoc.name} className="w-full h-[500px] rounded-xl border" />
              ) : (
                <img
                  src={previewDoc.url}
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
                href={previewDoc.url}
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
