import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe,
  User,
  FileText,
  Upload,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  LogOut,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  Unlock,
  ChevronRight,
  ShieldCheck,
  Award,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import AppFooter from "../../components/common/AppFooter.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import apiClient from "../../services/apiClient.js";

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [candidate, setCandidate] = useState(null);
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    countryPreference: "",
    education: [],
    skills: "",
    trade: "",
    experienceYears: 0,
    currentOccupation: "",
    preferredJobRole: "",
    languages: "",
    passportNumber: "",
    passportExpiry: "",
    passportIssueCountry: "",
  });

  const [uploadCategory, setUploadCategory] = useState("resume");
  const [docFile, setDocFile] = useState(null);
  const [docFileName, setDocFileName] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchCandidateData = async () => {
    setLoading(true);
    try {
      const [candRes, projRes, appRes] = await Promise.all([
        apiClient.get("/candidate/me"),
        apiClient.get("/candidate/projects"),
        apiClient.get("/candidate/my-applications"),
      ]);

      if (candRes.data?.candidate) {
        const c = candRes.data.candidate;
        setCandidate(c);
        const p = c.profile || {};
        setProfileForm({
          fullName: c.fullName || "",
          phone: c.phone || "",
          dob: p.dob || "",
          gender: p.gender || "",
          address: p.address || "",
          city: p.city || "",
          state: p.state || "",
          pincode: p.pincode || "",
          countryPreference: Array.isArray(p.countryPreference) ? p.countryPreference.join(", ") : p.countryPreference || "",
          education: Array.isArray(p.education) ? p.education : [],
          skills: Array.isArray(p.skills) ? p.skills.join(", ") : p.skills || "",
          trade: p.trade || "",
          experienceYears: p.experienceYears || 0,
          currentOccupation: p.currentOccupation || "",
          preferredJobRole: p.preferredJobRole || "",
          languages: Array.isArray(p.languages) ? p.languages.join(", ") : p.languages || "",
          passportNumber: p.passportNumber || "",
          passportExpiry: p.passportExpiry || "",
          passportIssueCountry: p.passportIssueCountry || "",
        });
      }

      if (projRes.data?.projects) {
        setProjects(projRes.data.projects);
      }
      if (appRes.data?.applications) {
        setApplications(appRes.data.applications);
      }
    } catch (err) {
      console.error("Error loading candidate dashboard:", err);
      if (err.response?.status === 404 || err.response?.status === 401) {
        logout();
        navigate("/candidate/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidateData();
  }, []);

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSaveLoading(true);
    try {
      const payload = {
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        profile: {
          dob: profileForm.dob,
          gender: profileForm.gender,
          address: profileForm.address,
          city: profileForm.city,
          state: profileForm.state,
          pincode: profileForm.pincode,
          countryPreference: profileForm.countryPreference
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          education: profileForm.education,
          skills: profileForm.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          trade: profileForm.trade,
          experienceYears: Number(profileForm.experienceYears) || 0,
          currentOccupation: profileForm.currentOccupation,
          preferredJobRole: profileForm.preferredJobRole,
          languages: profileForm.languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          passportNumber: profileForm.passportNumber,
          passportExpiry: profileForm.passportExpiry,
          passportIssueCountry: profileForm.passportIssueCountry,
        },
      };

      const res = await apiClient.put("/candidate/profile", payload);
      if (res.data?.success) {
        setCandidate(res.data.candidate);
        setNotification({
          type: "success",
          message: "Profile updated successfully! Progress saved.",
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSaveLoading(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      setDocFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocFile(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile) {
      alert("Please select a document file to upload.");
      return;
    }

    setUploadingDoc(true);
    try {
      const categoryTitles = {
        resume: "Resume / CV",
        identity_proof: "National Identity Proof",
        passport: "Passport Copy",
        pan: "PAN Card",
        education_cert: "Educational Degree / Diploma",
        experience_cert: "Work Experience Certificate",
      };

      const res = await apiClient.post("/candidate/upload-document", {
        docType: uploadCategory,
        name: categoryTitles[uploadCategory] || uploadCategory.toUpperCase(),
        fileData: docFile,
        fileName: docFileName,
        fileSize: 1024,
      });

      if (res.data?.success) {
        setNotification({
          type: "success",
          message: "Document uploaded successfully and queued for admin verification.",
        });
        setDocFile(null);
        setDocFileName("");
        fetchCandidateData();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to upload document.",
      });
    } finally {
      setUploadingDoc(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const hasUploadedDocs = Array.isArray(candidate?.documents) && candidate.documents.length > 0;
  const isProfileComplete = Boolean(
    candidate?.profile?.profileCompleted || (candidate?.profile?.profileCompletionPercent || 0) >= 80
  );
  const canApply = hasUploadedDocs && isProfileComplete;

  const handleApplyProject = async (proj) => {
    if (!isProfileComplete) {
      alert("Please complete your profile details (minimum 80%) before applying for projects.");
      setActiveTab("profile");
      return;
    }

    if (!hasUploadedDocs) {
      alert("Please upload at least one required document (e.g. Resume / Passport) before applying for projects.");
      setActiveTab("documents");
      return;
    }

    try {
      const res = await apiClient.post("/candidate/apply", {
        projectId: proj.id || proj.projectId,
        projectName: proj.projectName,
        clientName: proj.clientName,
        destinationCountry: proj.destinationCountry,
        position: proj.position,
        salary: proj.salary,
      });

      if (res.data?.success) {
        setNotification({
          type: "success",
          message: `Successfully applied for "${proj.projectName}"! Track progress under My Applications.`,
        });
        fetchCandidateData();
        setActiveTab("applications");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Application submission failed.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/candidate/login");
  };

  const completionPercent = candidate?.profile?.profileCompletionPercent || 20;

  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "profile", label: "Complete Profile", icon: User },
    { id: "documents", label: "Upload Documents", icon: Upload },
    { id: "jobs", label: "Available Jobs", icon: Briefcase, badge: projects.length },
    { id: "applications", label: "My Applications", icon: Calendar, badge: applications.length },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Candidate Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#F3F7FC] border-r border-blue-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header: Identical h-16 and gradient matching main header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-blue-800/80 shrink-0 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900/70 border border-blue-700/50 text-cyan-400 flex items-center justify-center font-bold shadow-xs">
              <User size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-white text-base tracking-tight">immi</span>
                <span className="font-extrabold text-cyan-400 text-base tracking-tight">Go</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-blue-200/80 tracking-wider mt-0.5">
                Candidate Portal
              </span>
            </div>
          </div>

          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-blue-200 hover:text-white rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Candidate Profile Widget */}
        <div className="p-3 mx-3 mt-3 bg-blue-100/70 rounded-xl border border-blue-200 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {(candidate?.fullName || user?.name || "C").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                {candidate?.fullName || user?.name || "Candidate"}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-medium text-slate-600 truncate">
                  {candidate?.email || user?.email}
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-md font-extrabold"
                    : "text-slate-700 hover:bg-blue-100/70 hover:text-blue-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      active
                        ? "bg-white text-blue-700"
                        : "bg-blue-200 text-blue-900"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Widget: Matching h-[48px] with dashboard footer */}
        <div className="h-[48px] min-h-[48px] px-4 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-t border-blue-800/80 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Profile: {completionPercent}%</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 hover:text-white transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full overflow-hidden">
        {/* Top Navbar: Identical h-16, gradient, and border matching sidebar header */}
        <header className="h-16 px-4 sm:px-6 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 border-b border-blue-800/80 text-white flex items-center justify-between shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              {navItems.find((n) => n.id === activeTab)?.label || "Candidate Portal"}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 border border-white/15 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Status: {candidate?.accountStatus || "Active"}</span>
            </div>

            <div className="flex items-center gap-2.5 pl-3 border-l border-blue-800/80">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {(candidate?.fullName || user?.name || "C").charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-tight">
                  {candidate?.fullName || user?.name || "Candidate"}
                </span>
                <span className="text-[10px] text-blue-200 font-medium">
                  {candidate?.email || user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-white/10 hover:bg-rose-600 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {notification && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between shadow-xs transition-all text-xs ${
                notification.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notification.type === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                )}
                <span className="font-semibold">{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
              >
                <XCircle size={14} />
              </button>
            </div>
          )}

          {/* Compact Welcome Banner - Light Blue Slate Theme */}
          <div className="bg-gradient-to-r from-sky-50 via-blue-50/80 to-indigo-50/60 border border-sky-200/90 rounded-2xl p-4 sm:p-5 text-slate-900 shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Account Status: {candidate?.accountStatus || "Approved"}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#0f2744] tracking-tight">
                Welcome back, {candidate?.fullName}!
              </h1>
              <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                <Mail size={12} className="text-blue-600" />
                <span>{candidate?.email || user?.email}</span>
              </p>
            </div>

            <div className="bg-white/95 rounded-xl p-3 border border-sky-200 shadow-2xs flex items-center gap-3 z-10 self-start md:self-auto">
              <div className="w-11 h-11 rounded-full border-3 border-blue-600 flex items-center justify-center font-bold text-xs text-blue-700 bg-blue-50/70">
                {completionPercent}%
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Profile Completion</span>
                <span className="text-[11px] text-slate-500 block font-medium">
                  {canApply ? "Ready to Apply" : "Incomplete & Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Unlock Banner */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-[#0f2744]">
                  {canApply
                    ? "Your profile and documents are ready! You can now apply for open international projects."
                    : "Complete your profile (80%) and upload required documents to unlock application access."}
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Application access:{" "}
                  <strong className={canApply ? "text-emerald-700" : "text-amber-700"}>
                    {canApply ? "Unlocked (Eligible to Apply)" : "Locked (Complete Profile & Upload Docs)"}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isProfileComplete && (
                <button
                  onClick={() => setActiveTab("profile")}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Complete Profile
                </button>
              )}
              {!hasUploadedDocs && (
                <button
                  onClick={() => setActiveTab("documents")}
                  className="px-3 py-1.5 text-xs font-bold text-[#0f2744] bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Upload Documents
                </button>
              )}
            </div>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold">Account Approval</div>
                  <div className="text-base font-bold text-slate-900">Active & Approved</div>
                  <p className="text-[10px] text-slate-400">
                    Approved on{" "}
                    {candidate?.approvalDate
                      ? new Date(candidate.approvalDate).toLocaleDateString()
                      : "Registration"}
                  </p>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold">Document Status</div>
                  <div className="text-base font-bold text-slate-900">
                    {hasUploadedDocs ? `${candidate?.documents?.length} Uploaded` : "Not Submitted"}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {hasUploadedDocs ? "Ready for verification" : "Upload Resume / Passport"}
                  </p>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    {canApply ? <Unlock size={16} /> : <Lock size={16} />}
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold">Job Opportunities Access</div>
                  <div className="text-base font-bold text-slate-900">
                    {canApply ? "Unlocked" : "Locked"}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {canApply ? "You can apply to available projects" : "Complete profile & upload docs to unlock"}
                  </p>
                </div>
              </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">My Job Applications</h3>
                <button
                  onClick={() => setActiveTab("jobs")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Explore More Jobs &rarr;
                </button>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {applications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No active job applications. Explore available projects below to apply!
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.applicationId} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{app.projectName}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5 font-medium">
                          {app.position} &bull; {app.destinationCountry} &bull; Applied on{" "}
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {app.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-8">
            <div>
              <h2 className="text-lg font-black text-[#0f2744]">Personal Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Basic candidate details and identity coordinates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={profileForm.dob}
                  onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Permanent Residential Address</label>
                <input
                  type="text"
                  placeholder="Street / House No / Area"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Postal / Zip Code</label>
                <input
                  type="text"
                  value={profileForm.pincode}
                  onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-lg font-black text-[#0f2744]">Professional & Trade Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Work experience, trade specialization, and overseas deployment preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Trade / Domain Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Electrician, Welder, Nurse, Cook"
                  value={profileForm.trade}
                  onChange={(e) => setProfileForm({ ...profileForm, trade: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Job Role</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Technician, Line Cook"
                  value={profileForm.preferredJobRole}
                  onChange={(e) => setProfileForm({ ...profileForm, preferredJobRole: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={profileForm.experienceYears}
                  onChange={(e) => setProfileForm({ ...profileForm, experienceYears: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Key Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. MIG Welding, Blueprint Reading, Safety Compliance"
                  value={profileForm.skills}
                  onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Deployment Countries</label>
                <input
                  type="text"
                  placeholder="e.g. UAE, Saudi Arabia, Qatar, Malaysia"
                  value={profileForm.countryPreference}
                  onChange={(e) => setProfileForm({ ...profileForm, countryPreference: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Passport Number (If held)</label>
                <input
                  type="text"
                  placeholder="e.g. Z1234567"
                  value={profileForm.passportNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, passportNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Passport Expiry Date</label>
                <input
                  type="date"
                  value={profileForm.passportExpiry}
                  onChange={(e) => setProfileForm({ ...profileForm, passportExpiry: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Languages Spoken</label>
                <input
                  type="text"
                  placeholder="e.g. English, Hindi, Arabic"
                  value={profileForm.languages}
                  onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saveLoading}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saveLoading ? "Saving Changes..." : "Save Profile & Continue"}</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#0f2744]">Upload Compliance Documents</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload your Resume and National Identity Proof at minimum to unlock job applications. You can also upload your Passport, Certificates, and PAN.
                </p>
              </div>

              <form onSubmit={handleUploadDocument} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Document Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="resume">Resume / CV (PDF)</option>
                      <option value="identity_proof">Identity Proof (Aadhaar / National ID)</option>
                      <option value="passport">Passport Copy</option>
                      <option value="pan">PAN Card</option>
                      <option value="education_cert">Education Certificate / Degree</option>
                      <option value="experience_cert">Work Experience Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Select File (PDF or Image, max 10MB)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs cursor-pointer"
                    />
                  </div>
                </div>

                {docFileName && (
                  <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Selected: {docFileName}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploadingDoc || !docFile}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={14} />
                    <span>{uploadingDoc ? "Uploading..." : "Upload Document"}</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Your Submitted Documents</h3>

                {(candidate?.documents || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No documents uploaded yet. Upload your resume and identity proof to get verified.
                  </div>
                ) : (
                  (candidate?.documents || []).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{doc.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.status === "Verified"
                                ? "bg-emerald-100 text-emerald-800"
                                : doc.status === "Re-upload Required"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>

                        {doc.status === "Re-upload Required" && doc.rejectionReason && (
                          <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] font-medium flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 text-rose-600 mt-0.5" />
                            <div>
                              <strong>Reason for replacement request:</strong> {doc.rejectionReason}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.fileUrl && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink size={13} />
                            <span>Preview</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#0f2744]">Available Job Opportunities</h2>
                <p className="text-[11px] text-slate-500">
                  Active overseas projects posted by Admin seeking candidates.
                </p>
              </div>
              <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800">
                {projects.length} Active Openings
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Briefcase size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Projects Published Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no active projects posted by Admin right now. As soon as Admin publishes projects, they will appear here.
                </p>
                <div className="pt-1">
                  <button
                    onClick={fetchCandidateData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Refresh Projects</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => {
                  const isApplied = applications.some(
                    (a) => a.projectId === String(proj.id || proj.projectId)
                  );

                  return (
                    <div
                      key={proj.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all text-xs"
                    >
                      <div className="h-20 bg-gradient-to-tr from-[#0f2744] to-[#163660] p-3 flex flex-col justify-between text-white">
                        <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                          {proj.destinationCountry || proj.country || "Overseas"}
                        </span>
                        <h3 className="text-sm font-bold text-white line-clamp-1">
                          {proj.projectName}
                        </h3>
                      </div>

                      <div className="p-3.5 space-y-1.5 flex-1">
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Position:</span>
                          <span className="font-semibold text-slate-800 truncate ml-2">{proj.position}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Employer:</span>
                          <span className="font-semibold text-slate-800 truncate ml-2">{proj.clientName}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400">Vacancies:</span>
                          <span className="font-bold text-blue-700">{proj.vacancies}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                          <span className="text-slate-400">Salary:</span>
                          <span className="font-bold text-emerald-700">{proj.salary}</span>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded-lg text-[10px] text-slate-500 font-medium">
                          {proj.eligibility || "Passport & Document Verification Required"}
                        </div>
                      </div>

                      <div className="p-3 pt-0">
                        {isApplied ? (
                          <div className="w-full py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                            &check; Already Applied
                          </div>
                        ) : canApply ? (
                          <button
                            onClick={() => handleApplyProject(proj)}
                            className="w-full py-2 text-xs font-bold text-white bg-[#0f2744] hover:bg-[#163660] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>Apply Now</span>
                            <ChevronRight size={13} />
                          </button>
                        ) : !isProfileComplete ? (
                          <button
                            onClick={() => setActiveTab("profile")}
                            className="w-full py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Lock size={12} className="text-amber-700" />
                            <span>Complete Profile to Apply</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab("documents")}
                            className="w-full py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Upload size={12} className="text-blue-700" />
                            <span>Upload Docs to Apply</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "applications" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h2 className="text-lg font-black text-[#0f2744]">My Project Applications</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your active recruitment reviews, scheduled interviews, and final selection statuses.
              </p>
            </div>

            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
                  You haven't submitted any project applications yet.
                </div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.applicationId}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider block">
                          Application ID: {app.applicationId}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                          {app.projectName}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {app.position} &bull; {app.destinationCountry}
                        </p>
                      </div>

                      <span
                        className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold ${
                          app.status === "Selected"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : app.status === "Interview Scheduled"
                            ? "bg-sky-100 text-sky-800 border border-sky-200"
                            : app.status === "Shortlisted"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : app.status === "Rejected"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    {app.interview?.scheduledDate && (
                      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-sky-950">
                          <Calendar size={16} className="text-sky-600" />
                          <span>Interview Scheduled</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                          <div>
                            <strong>Date:</strong> {app.interview.scheduledDate}
                          </div>
                          <div>
                            <strong>Time:</strong> {app.interview.scheduledTime}
                          </div>
                          <div>
                            <strong>Mode:</strong> {app.interview.mode}
                          </div>
                          <div>
                            <strong>Venue / Link:</strong>{" "}
                            {app.interview.locationOrLink ? (
                              <a
                                href={app.interview.locationOrLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline font-semibold"
                              >
                                {app.interview.locationOrLink}
                              </a>
                            ) : (
                              "Shared by recruiter"
                            )}
                          </div>
                        </div>
                        {app.interview.remarks && (
                          <div className="text-slate-600 pt-1 border-t border-sky-100">
                            <strong>Note:</strong> {app.interview.remarks}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <AppFooter role="candidate" />
      </div>
    </div>
  );
}
