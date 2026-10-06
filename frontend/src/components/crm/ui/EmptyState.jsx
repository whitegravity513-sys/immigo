import React from "react";
import { FolderX, Plus } from "lucide-react";

export function EmptyState({
  icon: Icon = FolderX,
  title = "No records found",
  description = "Get started by adding a new record to your system.",
  actionText,
  onAction,
  actionIcon: ActionIcon = Plus,
  className = "",
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center mb-4">
        <Icon size={28} strokeWidth={1.5} />
      </div>

      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1.5 leading-relaxed max-w-xs">
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          {ActionIcon && <ActionIcon size={16} />}
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}

export default EmptyState;
