import React from "react";

export function StatusBadge({ status = "Active", size = "md" }) {
  const norm = (status || "").toLowerCase().trim();

  let styles = "bg-gray-100 text-gray-700 border-gray-200";
  let dotColor = "bg-gray-400";
  let label = status;

  if (norm === "active") {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200";
    dotColor = "bg-emerald-500";
    label = "Active";
  } else if (norm === "inactive") {
    styles = "bg-gray-100 text-gray-600 border-gray-200";
    dotColor = "bg-gray-400";
    label = "Inactive";
  } else if (norm === "pending" || norm === "on hold" || norm === "draft") {
    styles = "bg-amber-50 text-amber-700 border-amber-200";
    dotColor = "bg-amber-500";
    label = norm === "on hold" ? "On Hold" : norm === "draft" ? "Draft" : "Pending";
  } else if (norm === "completed" || norm === "closed") {
    styles = "bg-blue-50 text-blue-700 border-blue-200";
    dotColor = "bg-blue-500";
    label = norm === "completed" ? "Completed" : "Closed";
  } else if (norm === "cancelled" || norm === "rejected") {
    styles = "bg-rose-50 text-rose-700 border-rose-200";
    dotColor = "bg-rose-500";
    label = "Cancelled";
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1.5"
      : "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${styles} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
}

export default StatusBadge;
