import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Download,
  Upload,
  Search,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Building2,
  User,
  ExternalLink,
  Plus,
  Eye,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import DocumentViewerFullPage from "../../components/vendor/DocumentViewerFullPage.jsx";

export default function Documents() {
  const [vendor, setVendor] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("company"); // "company" or "candidates"
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Statutory License");
  const [companyDocs, setCompanyDocs] = useState([]);
  const [previewingDoc, setPreviewingDoc] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);
      setCompanyDocs(curVendor?.documents || []);

      const candRes = await crmVendorService.getCandidates(curVendor?.id);
      setCandidates(candRes || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCompanyDoc = async (e) => {
    e.preventDefault();
    if (!newDocName) return;

    const doc = {
      name: newDocName,
      fileName: `${newDocName.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      size: "1.2 MB",
      type: newDocType,
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "Submitted",
    };

    const updated = [doc, ...companyDocs];
    setCompanyDocs(updated);
    try {
      await crmVendorService.updateVendorProfile(vendor?.id, { documents: updated });
    } catch (err) {
      console.error("Doc update err:", err);
    }
    setShowUploadModal(false);
    setNewDocName("");
  };

  const handleDownload = (doc) => {
    if (doc?.fileUrl && doc.fileUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.name || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const content = `OFFICIAL STATUTORY DOCUMENT\n==========================\nDocument: ${doc?.name || doc?.type}\nFile Name: ${doc?.fileName || "document.pdf"}\nAgency: ${vendor?.companyName || "Vendor"}\nUploaded: ${doc?.uploadedAt || new Date().toISOString().split("T")[0]}\nStatus: ${doc?.status || "Uploaded"}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc?.fileName || `${doc?.name || "document"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Flatten candidate documents
  const candidateDocs = [];
  candidates.forEach((cand) => {
    if (cand.documents && cand.documents.length > 0) {
      cand.documents.forEach((d) => {
        candidateDocs.push({
          ...d,
          candidateId: cand.id,
          candidateName: cand.fullName,
          position: cand.currentPosition,
        });
      });
    } else {
      // Add default resume
      candidateDocs.push({
        name: "Standard Curriculum Vitae (CV)",
        fileName: `${cand.fullName.toLowerCase().replace(/\s+/g, "_")}_resume.pdf`,
        type: "Resume",
        size: "950 KB",
        candidateId: cand.id,
        candidateName: cand.fullName,
        position: cand.currentPosition,
      });
    }
  });

  const filteredCandidateDocs = candidateDocs.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.candidateName?.toLowerCase().includes(q) ||
      d.name?.toLowerCase().includes(q) ||
      d.fileName?.toLowerCase().includes(q) ||
      d.position?.toLowerCase().includes(q)
    );
  });

  if (previewingDoc) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <DocumentViewerFullPage
          doc={previewingDoc}
          vendor={vendor}
          onBack={() => setPreviewingDoc(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Document Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Compliance & Candidate Files
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Access statutory vendor licenses, trade attestations, and submitted candidate dossiers.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Company Document</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("company")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "company"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Licenses & Compliance ({companyDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("candidates")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "candidates"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Candidate Resumes & Dossiers ({candidateDocs.length})</span>
        </button>
      </div>

      {activeTab === "company" ? (
        /* Company Documents View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companyDocs.map((doc, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Verified
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{doc.fileName}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span>{doc.type || "Statutory Document"}</span>
                  <span>•</span>
                  <span>{doc.size || "1.5 MB"}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Status: {doc.status || "Verified"}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewingDoc(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Candidate Documents View */
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, document or trade..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Candidate</th>
                    <th className="py-3.5 px-4">Document Title</th>
                    <th className="py-3.5 px-4">File Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">File Size</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidateDocs.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 sm:px-6">
                        <Link
                          to={`/vendor/candidates/${doc.candidateId}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition block truncate max-w-[170px]"
                        >
                          {doc.candidateName}
                        </Link>
                        <span className="text-[11px] text-slate-400">{doc.position}</span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">{doc.name}</td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {doc.fileName}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {doc.type || "PDF"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-xs">{doc.size || "1 MB"}</td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewingDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Company Document</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add updated trade licenses, commercial registrations, or tax compliance filings.
            </p>

            <form onSubmit={handleUploadCompanyDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Overseas Recruitment License"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document Classification
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Statutory License">Statutory License / MEA Certificate</option>
                  <option value="Commercial Registration">Commercial Registration (CR)</option>
                  <option value="Tax Certificate">Tax / GST Certificate</option>
                  <option value="Bank Reference">Bank Reference Letter</option>
                </select>
              </div>

              <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 text-center bg-slate-50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-semibold text-indigo-600">Choose file to upload</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">PDF, DOCX, or PNG up to 10MB</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm"
                >
                  Upload & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
