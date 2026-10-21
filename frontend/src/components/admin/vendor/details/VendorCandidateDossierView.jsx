import React, { useState } from "react";
import {
  ArrowLeft,
  UserCheck,
  Briefcase,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Paperclip,
  FileText,
  Clock,
  Download,
} from "lucide-react";

export default function VendorCandidateDossierView({
  selectedVendor,
  selectedCandidate,
  applications = [],
  availableProjects = [],
  onBackToVendor,
  onBackToAll,
  onUpdateAppStatus,
  onConfirmReassignProject,
  onAcceptCandDoc,
  onConfirmRejectCandDoc,
  onAcceptAllCandDocs,
}) {
  const [rejectCandDocModal, setRejectCandDocModal] = useState(null);
  const [candDocRemarks, setCandDocRemarks] = useState("");

  const [showAppRejectModal, setShowAppRejectModal] = useState(null);
  const [appRejectReason, setAppRejectReason] = useState("");

  const [showReassignProjModal, setShowReassignProjModal] = useState(null);
  const [reassignProjId, setReassignProjId] = useState("PRJ-101");
  const [reassignPosition, setReassignPosition] = useState("");

  const candDocs = selectedCandidate?.documents || [];
  const currentApp =
    applications.find((a) => a.candidateId === selectedCandidate?.id) ||
    selectedCandidate?.candApp;
  const appId = currentApp?.id;
  const appStatus = currentApp?.status || "Submitted";

  const handleConfirmRejectCandDocAction = async () => {
    if (!candDocRemarks.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    await onConfirmRejectCandDoc(rejectCandDocModal.docIdx, candDocRemarks);
    setRejectCandDocModal(null);
    setCandDocRemarks("");
  };

  const handleConfirmReassignProjectAction = async () => {
    await onConfirmReassignProject(showReassignProjModal.appId, reassignProjId, reassignPosition);
    setShowReassignProjModal(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onBackToVendor}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Vendor Profile ({selectedVendor.companyName})</span>
          </button>

          <button
            onClick={onBackToAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft size={16} className="text-blue-600" />
            <span>Back to All Vendors</span>
          </button>
        </div>

        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
          Candidate Dossier • {selectedCandidate.id}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${selectedCandidate.photo ? "bg-white" : "bg-blue-50 border border-blue-200 text-blue-600"} font-black text-xl flex items-center justify-center shadow-md overflow-hidden shrink-0`}>
              {selectedCandidate.photo ? (
                <img
                  src={selectedCandidate.photo}
                  alt={selectedCandidate.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                selectedCandidate.fullName?.substring(0, 2).toUpperCase() || "CN"
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selectedCandidate.fullName}
                </h1>
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  {selectedCandidate.id}
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                  {appStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-3 flex-wrap">
                <span>
                  Trade: <strong className="text-blue-700">{selectedCandidate.currentPosition || "Technician"}</strong>
                </span>
                <span>•</span>
                <span>
                  Experience: <strong className="text-slate-800">{selectedCandidate.experienceYears || "5"} Years</strong>
                </span>
                <span>•</span>
                <span>
                  Destination: <strong className="text-indigo-700">{selectedCandidate.preferredCountry || "UAE"}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Sourcing Partner</span>
            <span className="font-extrabold text-slate-900 text-sm block">{selectedVendor.companyName}</span>
            <span className="font-mono text-slate-500 text-[11px] block">{selectedVendor.id}</span>
          </div>
        </div>

        <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-blue-100 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Applied Project</span>
              <span className="font-bold text-blue-900 text-sm">{currentApp?.projectName || "Riyadh Metro Line 3"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Client Company</span>
              <span className="font-bold text-slate-800 text-sm">{currentApp?.clientName || "Saudi Oger Contracting"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Requirement Code</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{currentApp?.requirementCode || "REQ-0008"}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-700 text-xs">Application Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  appStatus === "Selected"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : appStatus === "Shortlisted"
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : appStatus === "Interview"
                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                    : appStatus === "Rejected"
                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {appStatus}
              </span>
            </div>

            {appId && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onUpdateAppStatus(appId, "Shortlisted")}
                  disabled={appStatus === "Shortlisted"}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <UserCheck size={14} />
                  <span>Shortlist</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateAppStatus(appId, "Interview")}
                  disabled={appStatus === "Interview"}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Briefcase size={14} />
                  <span>Interview</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateAppStatus(appId, "Selected")}
                  disabled={appStatus === "Selected"}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 size={14} />
                  <span>Select</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAppRejectModal({ appId, candName: selectedCandidate.fullName });
                    setAppRejectReason("");
                  }}
                  disabled={appStatus === "Rejected"}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <XCircle size={14} />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowReassignProjModal({
                      appId,
                      candName: selectedCandidate.fullName,
                      currentProjName: currentApp?.projectName,
                    });
                    setReassignProjId("PRJ-101");
                    setReassignPosition(selectedCandidate.currentPosition || "");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink size={14} />
                  <span>Edit / Change Project</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              Personal Information
            </h3>
            <div className="flex justify-between">
              <span className="text-slate-400">Date of Birth:</span>
              <span className="font-bold text-slate-900">{selectedCandidate.dob || "1994-06-15"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gender / Nationality:</span>
              <span className="font-bold text-slate-900">
                {selectedCandidate.gender || "Male"} • {selectedCandidate.nationality || "Indian"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mobile Phone:</span>
              <span className="font-bold text-slate-900">{selectedCandidate.phone || "+91 98765 00112"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email Address:</span>
              <span className="font-bold text-slate-900 truncate block">
                {selectedCandidate.email || "candidate@email.com"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Full Address:</span>
              <span className="font-semibold text-slate-800">{selectedCandidate.address || "H.No 44, Patel Nagar, India"}</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              Trade & Skill Information
            </h3>
            <div className="flex justify-between">
              <span className="text-slate-400">Trade Position:</span>
              <span className="font-extrabold text-blue-700 text-sm">
                {selectedCandidate.currentPosition || "Technician"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Experience:</span>
              <span className="font-bold text-slate-900">{selectedCandidate.experienceYears || "5"} Years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Qualification:</span>
              <span className="font-bold text-slate-900">{selectedCandidate.qualification || "Diploma in Technology"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Previous Employer:</span>
              <span className="font-semibold text-slate-800">{selectedCandidate.previousCompany || "L&T Construction"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Preferred Destination:</span>
              <span className="font-bold text-indigo-700">{selectedCandidate.preferredCountry || "UAE"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Paperclip size={18} className="text-blue-600" />
              <span>Candidate Verification Documents Vault</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Admin manual verification panel. Inspect candidate identity, resume, passport, and skill certificates.
            </p>
          </div>

          {candDocs.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAcceptAllCandDocs}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Verify & Accept All Docs</span>
              </button>
            </div>
          )}
        </div>

        {candDocs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
              <FileText size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Statutory Documents Uploaded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The sourcing vendor has not submitted any documents for this candidate yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {candDocs.map((doc, idx) => {
              const docStatus = doc.status || "Pending Review";
              const isVerified = docStatus === "Verified";
              const isRejected = docStatus === "Rejected";

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition space-y-3 ${
                    isVerified
                      ? "border-emerald-200 bg-emerald-50/30"
                      : isRejected
                      ? "border-rose-200 bg-rose-50/30"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                        <FileText size={18} />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block text-xs">{doc.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {doc.fileName} • {doc.size || "1.2 MB"}
                        </span>
                      </div>
                    </div>

                    {isVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : isRejected ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0 flex items-center gap-1">
                        <XCircle size={12} className="text-rose-600" />
                        <span>Rejected</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1">
                        <Clock size={12} className="text-amber-600" />
                        <span>Pending Review</span>
                      </span>
                    )}
                  </div>

                  {isRejected && doc.remarks && (
                    <div className="p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-900 font-semibold text-[11px]">
                      <strong>Rejection Remark:</strong> {doc.remarks}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                    <button
                      type="button"
                      onClick={() => alert(`Downloading candidate document: ${doc.fileName}`)}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {!isVerified && (
                        <button
                          type="button"
                          onClick={() => onAcceptCandDoc(idx)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          <span>Accept</span>
                        </button>
                      )}

                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectCandDocModal({ docIdx: idx, docName: doc.name });
                            setCandDocRemarks("");
                          }}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <XCircle size={12} />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejectCandDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Reject Document • {rejectCandDocModal.docName}
            </h3>
            <p className="text-xs text-slate-500">
              Specify why this candidate document is being rejected (e.g. image blurry, document expired, name mismatch).
            </p>

            <textarea
              rows={3}
              value={candDocRemarks}
              onChange={(e) => setCandDocRemarks(e.target.value)}
              placeholder="Enter rejection remark / reason..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectCandDocModal(null)}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectCandDocAction}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {showAppRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Reject Candidate Application • {showAppRejectModal.candName}
            </h3>
            <p className="text-xs text-slate-500">
              Please state the reason for rejecting this candidate application.
            </p>

            <textarea
              rows={3}
              value={appRejectReason}
              onChange={(e) => setAppRejectReason(e.target.value)}
              placeholder="e.g. Does not meet client specific GCC experience requirement..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAppRejectModal(null)}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateAppStatus(showAppRejectModal.appId, "Rejected", appRejectReason);
                  setShowAppRejectModal(null);
                }}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {showReassignProjModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Edit / Reassign Project • {showReassignProjModal.candName}
            </h3>
            <p className="text-xs text-slate-500">
              Currently applied to: <strong>{showReassignProjModal.currentProjName}</strong>. Select new target project below.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Client Project</label>
                <select
                  value={reassignProjId}
                  onChange={(e) => setReassignProjId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold"
                >
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.clientName} • {p.country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Trade Position</label>
                <input
                  type="text"
                  value={reassignPosition}
                  onChange={(e) => setReassignPosition(e.target.value)}
                  placeholder="e.g. Electrician, Welder, Mason"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReassignProjModal(null)}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassignProjectAction}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Project Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
