import { FileText } from "lucide-react";

export default function DocPreviewModal({ previewDoc, onClose }) {
  if (!previewDoc) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <h3 className="text-base font-bold text-slate-800">Supporting Document</h3>
          <button className="text-slate-500 text-xl cursor-pointer p-1" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex justify-center items-center">
          {previewDoc.startsWith("data:image/") ? (
            <img
              src={previewDoc}
              className="max-h-[450px] w-auto object-contain rounded-lg shadow-sm"
              alt="Document"
            />
          ) : previewDoc.startsWith("data:application/pdf") ? (
            <iframe
              src={previewDoc}
              style={{
                width: "100%",
                height: "450px",
                border: "none",
                borderRadius: "8px",
              }}
              title="PDF Preview"
            />
          ) : (
            <div className="text-center py-8">
              <FileText size={48} className="mb-4 text-green-600 mx-auto" />
              <p className="text-slate-500 text-sm mb-4">Binary file attachment.</p>
              <a
                href={previewDoc}
                download="attachment"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-block shadow-sm shadow-blue-500/20 transition-all"
              >
                Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
