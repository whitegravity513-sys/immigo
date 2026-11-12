export default function TextModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-[100dvh] border-l border-slate-200 shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50">
          <h3 className="text-base font-bold text-slate-800">{data.title}</h3>
          <button className="text-slate-500 text-xl cursor-pointer p-1" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {data.content}
          </p>
          <div className="flex justify-end pt-4">
            <button
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
