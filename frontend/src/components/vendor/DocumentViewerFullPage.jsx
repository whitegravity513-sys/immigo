import { useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  ArrowLeft,
  CheckCircle2,
  Printer,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  downloadUploadedDocument,
  openUploadedDocument,
  printUploadedDocument,
} from "../../utils/printDocument.js";

export default function DocumentViewerFullPage({ doc, vendor, candidate, onBack }) {
  const fileUrl = doc?.fileUrl;
  const pdfBlobUrl = useMemo(() => {
    if (!fileUrl || !fileUrl.startsWith("data:application/pdf")) {
      return "";
    }
    try {
      const base64 = fileUrl.split(",")[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      return URL.createObjectURL(blob);
    } catch {
      return "";
    }
  }, [fileUrl]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  if (!doc) return null;

  const isDocVerified = Boolean(
    doc.status === "Verified" ||
      (vendor?.documentVerified && (!doc.status || doc.status === "Pending" || doc.status === "Submitted"))
  );
  const isDocRejected = doc.status === "Rejected" || doc.status === "Correction Required";
  const displayStatus = isDocVerified
    ? "Verified"
    : isDocRejected
    ? doc.status
    : doc.status && doc.status !== "Pending"
    ? doc.status
    : "Pending Review";

  const hasFileUrl = Boolean(doc.fileUrl);
  const isImage = Boolean(
    doc.fileUrl && (doc.fileUrl.startsWith("data:image") || doc.mimeType?.startsWith("image/"))
  );
  const isPdf = Boolean(
    doc.fileUrl &&
      (doc.fileUrl.startsWith("data:application/pdf") ||
        doc.mimeType === "application/pdf" ||
        String(doc.fileName || "").toLowerCase().endsWith(".pdf"))
  );

  const handleDownload = () => {
    downloadUploadedDocument(doc);
  };

  const handlePrint = () => {
    if (!hasFileUrl) return;
    printUploadedDocument(doc);
  };

  return (
    <div className="doc-print-root w-full space-y-6 pb-16 animate-fadeIn font-sans text-slate-800">
      <style>{`
        @media print {
          @page {
            margin: 0;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          .doc-print-root,
          .doc-print-only,
          .doc-print-only * {
            visibility: visible !important;
          }
          .doc-print-root {
            animation: none !important;
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .doc-print-hide {
            display: none !important;
            visibility: hidden !important;
          }
          .doc-print-only {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
          }
          .doc-print-only img,
          .doc-print-only iframe {
            max-width: 100vw !important;
            max-height: 100vh !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
      <div className="doc-print-hide bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                {doc.type || "Statutory Document"}
              </span>
              <span className="text-xs font-mono text-slate-400">File: {doc.fileName || "document"}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isDocVerified
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : isDocRejected
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : "bg-amber-100 text-amber-800 border-amber-200"
                }`}
              >
                {isDocVerified ? (
                  <CheckCircle2 size={12} />
                ) : isDocRejected ? (
                  <AlertCircle size={12} />
                ) : (
                  <Clock size={12} />
                )}
                {displayStatus}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
              {doc.name || "Verification Document"}
            </h1>
            <p className="text-xs text-slate-500">
              {candidate ? (
                <>
                  Candidate: <strong className="text-slate-800">{candidate.fullName}</strong> ({candidate.id} &bull; {candidate.currentPosition || "Candidate"})
                  {vendor && <> &bull; Vendor: <b>{vendor?.companyName || vendor?.name}</b></>}
                </>
              ) : (
                <>
                  Agency: <b>{vendor?.companyName || "Vendor"}</b> &bull; Uploaded: {doc.uploadedAt || "Recently"}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {hasFileUrl && (
            <button
              type="button"
              onClick={() => openUploadedDocument(doc)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={15} />
              <span>{isPdf ? "Open PDF" : "Open File"}</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            disabled={!hasFileUrl}
            type="button"
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!hasFileUrl}
            type="button"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={15} />
            <span>Download Document</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 sm:p-10 max-w-4xl mx-auto space-y-6">
        {hasFileUrl && isImage ? (
          <div className="doc-print-only flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <img src={doc.fileUrl} alt={doc.name} className="max-h-[70vh] object-contain rounded-lg" />
          </div>
        ) : hasFileUrl && isPdf ? (
          <div className="doc-print-only">
            <iframe
              src={pdfBlobUrl || doc.fileUrl}
              title={doc.name}
              className="w-full h-[75vh] rounded-xl border border-slate-200"
            />
          </div>
        ) : hasFileUrl ? (
          <div className="doc-print-hide p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <FileText size={36} className="mx-auto text-blue-600" />
            <p className="text-sm font-bold text-slate-900">{doc.fileName || doc.name}</p>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Download Uploaded File</span>
            </button>
          </div>
        ) : (
          <div className="doc-print-hide border-2 border-dashed border-slate-300 p-8 sm:p-12 rounded-xl space-y-6 bg-slate-50/50 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <FileText size={32} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">{doc.name || "Document Record"}</h2>
              <p className="text-xs text-slate-500">
                Status: <b>{displayStatus}</b> &bull; File: {doc.fileName || "Not attached"} ({doc.size || "—"})
              </p>
              <p className="text-xs text-amber-700 font-medium">
                The uploaded binary file preview is unavailable for this record. Re-upload the document to attach a downloadable preview.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
