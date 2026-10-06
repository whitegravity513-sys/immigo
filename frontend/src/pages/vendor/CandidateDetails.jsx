import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Briefcase,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Calendar,
  FileText,
  Download,
  Eye,
  Send,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Camera,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";

export function CandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  useEffect(() => {
    loadCandidate();
  }, [id]);

  const loadCandidate = async () => {
    setLoading(true);
    try {
      const data = await crmVendorService.getCandidateById(id);
      setCandidate(data);
    } catch (err) {
      console.error("Failed to load candidate:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Photo file size must be less than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      try {
        setUpdatingPhoto(true);
        const updated = await crmVendorService.updateCandidatePhoto(candidate.id, base64);
        setCandidate((prev) => ({ ...prev, photo: updated.photo }));
      } catch (err) {
        alert("Failed to update candidate photo.");
      } finally {
        setUpdatingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Selected":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Under Review":
      case "Shortlisted":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Submitted":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Rejected":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "Processing":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "Completed":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading candidate profile...</div>;
  }

  if (!candidate) {
    return (
      <div className="p-12 text-center space-y-3">
        <h4 className="text-sm font-bold text-slate-900">Candidate Not Found</h4>
        <Link to="/vendor/candidates" className="text-xs font-bold text-blue-600 underline">
          Back to Candidates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{candidate.fullName}</span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {candidate.id}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <Link
            to={`/vendor/submit-candidate?candidateId=${candidate.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Send size={14} />
            <span>Submit to Project</span>
          </Link>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative group shrink-0">
            <img
              src={
                candidate.photo ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
              }
              alt={candidate.fullName}
              className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
            <label className="absolute inset-0 rounded-2xl bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer backdrop-blur-xs">
              <Camera size={20} className="mb-0.5" />
              <span>{updatingPhoto ? "Uploading..." : "Change Photo"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={updatingPhoto}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-slate-900">{candidate.fullName}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {candidate.currentPosition}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Briefcase size={14} className="text-slate-400" />
                <span>{candidate.experienceYears} Years Experience</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <GraduationCap size={14} className="text-slate-400" />
                <span>{candidate.qualification || "Trade Certified"}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-500" />
                <span>Preferred: {candidate.preferredCountry || "Gulf"}</span>
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(candidate.tags || candidate.skills || []).map((t, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Resume View Buttons */}
          <div className="flex flex-col gap-2 shrink-0 self-stretch sm:self-auto border-t sm:border-t-0 sm:border-l sm:border-slate-100 sm:pl-6 pt-3 sm:pt-0">
            <button
              type="button"
              onClick={() => setResumeModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Eye size={14} />
              <span>View Resume</span>
            </button>
            <button
              type="button"
              onClick={() => {
                alert(`Downloading ${candidate.fullName}_Resume.pdf`);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Download size={14} />
              <span>Download CV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Personal & Professional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Personal Information
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Date of Birth:</span>
              <span className="font-semibold text-slate-800">{candidate.dob || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gender:</span>
              <span className="font-semibold text-slate-800">{candidate.gender || "Male"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Nationality:</span>
              <span className="font-semibold text-slate-800">{candidate.nationality || "Indian"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Phone:</span>
              <span className="font-semibold text-slate-800">{candidate.phone || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="font-semibold text-slate-800">{candidate.email || "—"}</span>
            </div>
            <div className="flex items-start justify-between pt-1">
              <span className="text-slate-400">Address:</span>
              <span className="font-medium text-slate-800 text-right max-w-[200px]">
                {candidate.address || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Professional Information
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Trade Position:</span>
              <span className="font-bold text-slate-900">{candidate.currentPosition}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Years of Experience:</span>
              <span className="font-semibold text-slate-800">{candidate.experienceYears} Years</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Qualification:</span>
              <span className="font-semibold text-slate-800">{candidate.qualification || "Trade Certified"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Previous Company:</span>
              <span className="font-semibold text-slate-800">{candidate.previousCompany || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Expected Monthly Salary:</span>
              <span className="font-bold text-emerald-700">
                {candidate.salaryCurrency || "AED"} {candidate.expectedSalary || "1800"}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-slate-400 block mb-1">Key Skills:</span>
              <div className="flex flex-wrap gap-1">
                {(candidate.skills || []).map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attached Documents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
          Attached Compliance Documents ({candidate.documents?.length || 0})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(candidate.documents || []).map((doc, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText size={16} className="text-blue-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-slate-900 block truncate">{doc.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {doc.fileName} • {doc.size}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResumeModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer"
                title="View document"
              >
                <Eye size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* INTERVIEW SCHEDULE & APPLICATION REMARKS CARD */}
      {(() => {
        const activeApp = candidate.applications?.find(
          (a) => a.interviewDetails || a.shortlistRemark || a.remarks?.length
        );

        if (!activeApp) return null;

        const int = activeApp.interviewDetails;

        return (
          <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-xs space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
                  Project Recruitment Status & Interview Schedule
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {activeApp.projectName} — {activeApp.position}
                </h3>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold">
                Status: {activeApp.status}
              </span>
            </div>

            {int && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-indigo-900 block uppercase tracking-wider text-[11px]">
                  Scheduled Client Interview Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-800 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Date:</span>
                    <span className="font-bold text-indigo-950">{int.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Time:</span>
                    <span className="font-bold text-indigo-950">{int.time}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Venue / Location:</span>
                    <span className="font-bold text-indigo-950">{int.location}</span>
                  </div>
                </div>
                {int.remark && (
                  <p className="text-indigo-900 bg-white p-2 rounded-lg border border-indigo-100 mt-1">
                    <strong>Instructions / Remark:</strong> {int.remark}
                  </p>
                )}
              </div>
            )}

            {activeApp.shortlistRemark && (
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-xs text-purple-900">
                <strong>Shortlist Remark:</strong> {activeApp.shortlistRemark}
              </div>
            )}
          </div>
        );
      })()}

      {/* CANDIDATE RECRUITMENT FEE & MILESTONE PAYMENTS (ONLY WHEN SELECTED / COMPLETED) */}
      {(() => {
        const selectedAppWithPlan = candidate.applications?.find(
          (a) => (a.status === "Selected" || a.status === "Completed") && a.paymentPlan
        );

        if (!selectedAppWithPlan) return null;

        const plan = selectedAppWithPlan.paymentPlan;
        const totalAmount = Number(plan.totalAmount || 40000);
        const milestones = plan.milestones || [];
        const paidAmount = milestones
          .filter((m) => m.status === "Paid")
          .reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
        const remainingAmount = Math.max(0, totalAmount - paidAmount);
        const progressPct = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">
                  Placement Financial Breakdown
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Recruitment Fee & Milestone Payments
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Project: {selectedAppWithPlan.projectName} ({selectedAppWithPlan.clientName})
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                  Progress: {progressPct}% Released
                </span>
              </div>
            </div>

            {/* Financial Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Placement Fee
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">
                  ₹{totalAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Agreed contract fee</span>
              </div>

              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Released (Paid)
                </span>
                <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                  ₹{paidAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Released to vendor account</span>
              </div>

              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Remaining Balance
                </span>
                <span className="text-xl font-black text-amber-600 mt-0.5 block">
                  ₹{remainingAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-700 font-medium">Pending upcoming stage completion</span>
              </div>
            </div>

            {/* Milestone Breakdown List */}
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Milestone Disbursement Schedule:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">{m.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : m.status === "Due"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Fee Amount: <strong className="text-slate-800 font-bold">₹{Number(m.amount).toLocaleString()}</strong></span>
                      <span>Due: {m.dueDate || "Stage trigger"}</span>
                    </div>

                    {m.paymentRef && (
                      <div className="text-[10px] font-mono text-slate-400 border-t border-slate-200/60 pt-1 mt-1">
                        Ref: {m.paymentRef} {m.paidDate ? `• Paid: ${m.paidDate}` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* CRUCIAL SECTION: PROJECT SUBMISSIONS / APPLICATION HISTORY */}
      {/* Demonstrates per-project independent status (Rahul Kumar: Project A Rejected, Project B Selected, Project C Under Review) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Project Application History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate status is evaluated per project. Rejected candidates are never deleted and can be submitted to new projects.
            </p>
          </div>

          <Link
            to={`/vendor/submit-candidate?candidateId=${candidate.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Send size={13} />
            <span>Submit to Another Project</span>
          </Link>
        </div>

        {candidate.applications?.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            This candidate has not been submitted to any projects yet.
          </div>
        ) : (
          <div className="space-y-3">
            {candidate.applications.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{app.projectName}</span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      • {app.position}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400" />
                      <span>{app.clientName}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-blue-500" />
                      <span>{app.country}</span>
                    </span>
                    <span>•</span>
                    <span>Submitted: {new Date(app.submittedAt).toLocaleDateString("en-GB")}</span>
                  </div>

                  {/* If Rejected, show reason and prompt */}
                  {app.status === "Rejected" && (
                    <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                      <strong>Rejection Reason:</strong> {app.rejectionReason}
                    </div>
                  )}

                  {/* If Selected, show processing milestone prompt */}
                  {app.status === "Selected" && (
                    <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center justify-between">
                      <span>Selection confirmed on {app.selectionDate ? new Date(app.selectionDate).toLocaleDateString("en-GB") : "Recently"}. Processing timeline active.</span>
                      <Link
                        to="/vendor/processing"
                        className="font-bold text-emerald-900 underline ml-2 shrink-0"
                      >
                        View Timeline →
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {app.status === "Rejected" && (
                    <Link
                      to={`/vendor/submit-candidate?candidateId=${candidate.id}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                    >
                      Reuse Candidate
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resume Preview Modal */}
      {resumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {candidate.fullName} — Verified Resume Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResumeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Resume Document Mock Sheet */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900 font-sans">{candidate.fullName}</h2>
                <p className="text-slate-500 font-sans text-xs">
                  {candidate.currentPosition} • {candidate.experienceYears} Years Exp • {candidate.qualification}
                </p>
                <p className="text-[11px] text-slate-400">
                  Phone: {candidate.phone} | Email: {candidate.email} | Nationality: {candidate.nationality}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase font-sans text-xs mb-1">
                  Technical Skills & Competencies
                </h4>
                <p className="leading-relaxed">
                  {(candidate.skills || []).join(" • ")}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase font-sans text-xs mb-1">
                  Professional Experience
                </h4>
                <p>Company: {candidate.previousCompany || "Construction EPC"}</p>
                <p>Role: {candidate.currentPosition}</p>
                <p>Tenure: {candidate.experienceYears} Years</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 uppercase font-sans text-xs mb-1">
                  Compliance & Verified Documents
                </h4>
                <p>✓ International Passport (Valid)</p>
                <p>✓ Trade Test Attestation Certificate</p>
                <p>✓ Police Clearance & GAMCA Fitness</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Verified by {candidate.vendorId}
              </span>
              <button
                type="button"
                onClick={() => setResumeModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateDetails;
