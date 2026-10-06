export default function TextModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-base font-black text-slate-800">{data.title}</h3>
          <button className="text-slate-500 text-xl cursor-pointer p-1" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="p-6">
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
