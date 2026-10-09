import React from "react";
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";

export default function DocumentViewerFullPage({ doc, vendor, onBack }) {
  if (!doc) return null;

  const handleDownload = () => {
    if (doc.fileUrl && doc.fileUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.name || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Generate a downloadable text/PDF placeholder blob for simulated files
    const content = `OFFICIAL STATUTORY DOCUMENT\n==========================\nDocument: ${doc.name || doc.type}\nFile Name: ${doc.fileName || "document.pdf"}\nAgency: ${vendor?.companyName || "Vendor Agency"}\nRegistration ID: ${vendor?.registrationNumber || vendor?.vendorId || "VND-VERIFIED"}\nUploaded Date: ${doc.uploadedAt || new Date().toISOString().split("T")[0]}\nStatus: ${doc.status || "Verified"}\n\nThis file is digitally authenticated on the Vista Manpower & Immigration Management System.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName || `${doc.name || "document"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 pb-16 animate-fadeIn font-sans text-slate-800">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                {doc.type || "Statutory Document"}
              </span>
              <span className="text-xs font-mono text-slate-400">File: {doc.fileName || "document.pdf"}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={12} /> {doc.status || "Verified"}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
              {doc.name || "Vendor Compliance Document"}
            </h1>
            <p className="text-xs text-slate-500">
              Agency: <b>{vendor?.companyName || "Vendor"}</b> &bull; Uploaded: {doc.uploadedAt || "Recently"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handlePrint}
            type="button"
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            type="button"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={15} />
            <span>Download Document</span>
          </button>
        </div>
      </div>

      {/* Main Document Preview Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
        {doc.fileUrl && doc.fileUrl.startsWith("data:image") ? (
          <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <img src={doc.fileUrl} alt={doc.name} className="max-h-[70vh] object-contain rounded-lg" />
          </div>
        ) : doc.fileUrl && doc.fileUrl.startsWith("data:application/pdf") ? (
          <iframe src={doc.fileUrl} title={doc.name} className="w-full h-[75vh] rounded-xl border border-slate-200" />
        ) : (
          /* High-Fidelity Verification Certificate Sheet */
          <div className="border-4 border-double border-slate-300 p-8 sm:p-12 rounded-xl space-y-8 bg-slate-50/50">
            <div className="text-center border-b pb-6 space-y-2">
              <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                <FileText size={32} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                {doc.name || "Statutory Document Record"}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Digital Archival Certificate &bull; Ref: {vendor?.vendorId || vendor?.id || "VND-001"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Entity</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">{vendor?.companyName || "Vendor"}</span>
                <span className="text-[11px] text-slate-500 font-mono">Reg No: {vendor?.registrationNumber || "N/A"}</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Document Particulars</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">{doc.name || doc.type}</span>
                <span className="text-[11px] text-slate-500 font-mono">File: {doc.fileName || "document.pdf"} ({doc.size || "1.2 MB"})</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Submission Date</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">{doc.uploadedAt || new Date().toISOString().split("T")[0]}</span>
                <span className="text-[11px] text-slate-500">Security: Encrypted Document Repository</span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Verification Status</span>
                <span className="font-bold text-emerald-700 text-sm block mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Verified & Approved
                </span>
                <span className="text-[11px] text-slate-500">Authorized by Vista Overseas Compliance Desk</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 text-center font-medium">
              This statutory record has been verified and registered on the Vista global workforce portal. Click <b>"Download Document"</b> above to retrieve the full original source file.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
