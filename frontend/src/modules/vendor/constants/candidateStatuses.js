// Candidate Application Status Constants & Helper Utilities

export class CandidateStatus {
  static SUBMITTED = "Submitted";
  static UNDER_VERIFICATION = "Under Verification";
  static SHORTLISTED = "Shortlisted";
  static INTERVIEW_SCHEDULED = "Interview Scheduled";
  static INTERVIEW_COMPLETED = "Interview Completed";
  static SELECTED = "Selected";
  static REJECTED = "Rejected";
  static HOLD = "Hold";
  static PAYMENT_PENDING = "Payment Pending";
  static PAYMENT_COMPLETED = "Payment Completed";
  static JOINED = "Joined";
  static LEFT = "Left";
  static DID_NOT_JOIN = "Did Not Join";
  static REFUND_PENDING = "Refund Pending";
  static REFUNDED = "Refunded";
}

export const KANBAN_STAGES = [
  { id: "Submitted", label: "Submitted", color: "bg-amber-500" },
  { id: "Under Verification", label: "Verification", color: "bg-blue-500" },
  { id: "Shortlisted", label: "Shortlisted", color: "bg-purple-500" },
  { id: "Interview Scheduled", label: "Interview Scheduled", color: "bg-indigo-500" },
  { id: "Interview Completed", label: "Interview Cleared", color: "bg-sky-500" },
  { id: "Selected", label: "Selected", color: "bg-emerald-500" },
  { id: "Payment Pending", label: "Payment", color: "bg-orange-500" },
  { id: "Joined", label: "Joined / Deployed", color: "bg-green-600" },
  { id: "Did Not Join", label: "Did Not Join / Refund", color: "bg-rose-600" },
];

export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case CandidateStatus.SUBMITTED:
      return "bg-amber-50 text-amber-800 border-amber-200";
    case CandidateStatus.UNDER_VERIFICATION:
      return "bg-blue-50 text-blue-800 border-blue-200";
    case CandidateStatus.SHORTLISTED:
      return "bg-purple-50 text-purple-800 border-purple-200";
    case CandidateStatus.INTERVIEW_SCHEDULED:
    case CandidateStatus.INTERVIEW_COMPLETED:
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case CandidateStatus.SELECTED:
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case CandidateStatus.JOINED:
      return "bg-green-50 text-green-800 border-green-200";
    case CandidateStatus.REJECTED:
      return "bg-rose-50 text-rose-800 border-rose-200";
    case CandidateStatus.HOLD:
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case CandidateStatus.DID_NOT_JOIN:
    case CandidateStatus.REFUND_PENDING:
    case CandidateStatus.REFUNDED:
      return "bg-rose-100 text-rose-900 border-rose-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
};
