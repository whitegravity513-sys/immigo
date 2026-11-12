import { FileText, Upload, Eye, Trash2 } from "lucide-react";

export default function MilestoneClearanceDocs({
  application,
  currentM,
  docTitle,
  setDocTitle,
  docAudience,
  setDocAudience,
  docUploading,
  onUploadClearanceDoc,
  onRemoveClearanceDoc,
}) {
  const isVendorApp = Boolean(application?.vendorId && application.vendorId !== "DIRECT");

  return (
    <div className="p-3 sm:p-3.5 bg-slate-50/70 border-b border-slate-200 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-[#163868] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#163868]" />
            <span>
              {isVendorApp
                ? "Milestone Clearance Documents (Candidate & Vendor Access)"
                : "Milestone Clearance Documents (Candidate Portal)"}
            </span>
          </h4>
          <p className="text-[10px] text-slate-500">
            {isVendorApp
              ? `Upload signed offer letters, GAMCA medical fit reports, visa stamps, or flight tickets for Candidate & Vendor (${application.vendorName || "Associated Vendor"}).`
              : "Upload signed offer letters, medical reports, visa stamps, or flight tickets for Candidate view."}
          </p>
        </div>
        <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
          <span>Access:</span>
          <strong className="text-[#163868] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {isVendorApp
              ? `👥 Candidate & Vendor (${application.vendorName || "Vendor"})`
              : "👤 Candidate Only (Direct Candidate)"}
          </strong>
        </div>
      </div>

      <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="text"
            placeholder="Document Title (e.g. Visa Stamping Copy / Flight Ticket / Medical Fit)"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#163868]"
          />

          {isVendorApp ? (
            <select
              value={docAudience}
              onChange={(e) => setDocAudience(e.target.value)}
              className="px-2 py-1 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#163868] cursor-pointer"
            >
              <option value="both">👥 Both Candidate & Vendor</option>
              <option value="candidate">👤 Candidate Only</option>
              <option value="vendor">🏢 Vendor Only ({application.vendorName || "Vendor"})</option>
            </select>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-[#163868] border border-blue-200 shrink-0">
              👤 Candidate Only
            </span>
          )}
        </div>

        <div>
          <label className="px-3 py-1 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs">
            <Upload size={12} />
            <span>{docUploading ? "Uploading..." : "Upload Document"}</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={onUploadClearanceDoc}
              disabled={docUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {Array.isArray(currentM.clearanceDocuments) && currentM.clearanceDocuments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {currentM.clearanceDocuments.map((doc) => (
            <div
              key={doc.id}
              className="p-2 rounded-lg bg-white border border-blue-200 flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-6 h-6 rounded-md bg-blue-100 text-[#163868] flex items-center justify-center shrink-0">
                  <FileText size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 truncate">{doc.title}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <span>{doc.size || "PDF"}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#163868]">
                      {doc.targetAudience === "candidate"
                        ? "👤 Candidate"
                        : doc.targetAudience === "vendor"
                        ? "🏢 Vendor"
                        : "👥 Candidate & Vendor"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-[#163868] hover:text-[#1e4a82] hover:bg-blue-50 rounded"
                  title="View / Download"
                >
                  <Eye size={13} />
                </a>
                <button
                  onClick={() => onRemoveClearanceDoc(doc.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  title="Delete document"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-slate-500 italic py-1">
          No clearance documents uploaded for this milestone yet. Use the upload box above to release documents for Candidate and Vendor.
        </div>
      )}
    </div>
  );
}

