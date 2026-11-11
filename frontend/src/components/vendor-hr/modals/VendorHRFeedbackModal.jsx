import { Star } from "lucide-react";

export default function VendorHRFeedbackModal({
  show,
  feedbackInterviewTarget,
  onClose,
  onSubmit,
  feedbackForm,
  setFeedbackForm,
  actionLoading = false,
}) {
  if (!show || !feedbackInterviewTarget) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Record Interview Evaluation</h3>
            <p className="text-xs text-slate-500">
              {feedbackInterviewTarget.candidateName} • {feedbackInterviewTarget.round}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Technical Score (1-5 Stars)</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= feedbackForm.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
              <span className="font-extrabold text-slate-800 text-sm ml-2">
                {feedbackForm.rating} / 5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Recommendation</label>
            <select
              value={feedbackForm.recommendation}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, recommendation: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs cursor-pointer font-bold"
            >
              <option value="Shortlist">Shortlist for Next Round / Selection</option>
              <option value="Select Directly">Direct Selection Approved</option>
              <option value="Hold">Put on Hold</option>
              <option value="Reject">Reject Candidate</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Evaluation Comments</label>
            <textarea
              rows="3"
              value={feedbackForm.feedback}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
              placeholder="Enter technical interview feedback..."
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Submitting..." : "Save Evaluation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

