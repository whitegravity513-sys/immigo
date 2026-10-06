import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  User,
  Paperclip,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService";

export default function AdminDocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category & Status Filters
  const [activeTab, setActiveTab] = useState("All"); // All, Vendor Statutory, Candidate Verification
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const data = await crmVendorService.getAllDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error("Failed to load admin documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (docId) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "Verified" } : d))
    );
  };

  const handleReject = (docId) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "Rejected" } : d))
    );
  };

  const typeOptions = [
    "All",
    "License",
    "Registration",
    "Tax",
    "Resume",
    "Passport",
    "Identity Proof",
    "Education",
    "Experience",
    "Medical",
    "Visa",
    "Agreement",
  ];

  const filteredDocs = documents.filter((d) => {
    if (activeTab === "Vendor Statutory" && d.entityType !== "Vendor Agency") return false;
    if (activeTab === "Candidate Verification" && d.entityType !== "Candidate Person") return false;

    if (typeFilter !== "All" && d.type !== typeFilter) return false;
    if (statusFilter !== "All" && d.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.title?.toLowerCase().includes(q) ||
        d.fileName?.toLowerCase().includes(q) ||
        d.ownerName?.toLowerCase().includes(q) ||
        d.vendorName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const vendorDocsCount = documents.filter((d) => d.entityType === "Vendor Agency").length;
  const candDocsCount = documents.filter((d) => d.entityType === "Candidate Person").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Central Document Verification Repository</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Central repository of vendor statutory credentials (RA Licenses, Registrations) and candidate verified documents (Resumes, Passports, Aadhaar Cards).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
            Total Repository Files: {documents.length}
          </span>
        </div>
      </div>

      {/* Category Tabs & Multi-Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("All")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "All"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>All Repository Files</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "All" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("Vendor Statutory")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "Vendor Statutory"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/70"
            }`}
          >
            <Building2 size={14} />
            <span>Vendor Statutory Credentials</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "Vendor Statutory" ? "bg-white/20 text-white" : "bg-blue-200 text-blue-900"}`}>
              {vendorDocsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("Candidate Verification")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "Candidate Verification"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/70"
            }`}
          >
            <User size={14} />
            <span>Candidate Verification Vault</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "Candidate Verification" ? "bg-white/20 text-white" : "bg-indigo-200 text-indigo-900"}`}>
              {candDocsCount}
            </span>
          </button>
        </div>

        {/* Multi-Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search document title, file name, candidate name, or agency..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Document Types</option>
              {typeOptions.filter((t) => t !== "All").map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
            >
              <option value="All">All Verification Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-semibold text-slate-500">Loading document vault...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1">No documents matched your active category or filter selection.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5">Document Title</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Owner / Subject</th>
                  <th className="py-3.5 px-4">Vendor Partner</th>
                  <th className="py-3.5 px-4">File Name</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-4 sm:px-5 font-extrabold text-slate-900">
                      {doc.title}
                      <span className="block font-mono text-[10px] text-slate-400 font-normal">{doc.type || "Document"}</span>
                    </td>

                    <td className="py-4 px-4">
                      {doc.entityType === "Vendor Agency" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          Vendor Agency
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          Candidate Person
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-extrabold text-slate-900 block">{doc.ownerName}</span>
                    </td>

                    <td className="py-4 px-4 text-slate-700 font-semibold">{doc.vendorName}</td>

                    <td className="py-4 px-4 font-mono text-xs text-slate-500">{doc.fileName}</td>

                    <td className="py-4 px-4">
                      {doc.status === "Verified" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Verified
                        </span>
                      ) : doc.status === "Rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Pending Review
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => alert(`Previewing file: ${doc.fileName}`)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                          title="Preview Document"
                        >
                          <Eye size={13} />
                          <span>Preview</span>
                        </button>

                        <button
                          onClick={() => alert(`Downloading ${doc.fileName}...`)}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer"
                          title="Download Document"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>

                        {doc.status !== "Verified" && (
                          <button
                            onClick={() => handleVerify(doc.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                          >
                            Verify
                          </button>
                        )}
                        {doc.status !== "Rejected" && (
                          <button
                            onClick={() => handleReject(doc.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
