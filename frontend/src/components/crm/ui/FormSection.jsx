import React from "react";

export function FormSection({
  id,
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  children,
  className = "",
}) {
  return (
    <div
      id={id}
      className={`bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden scroll-mt-36 transition-all duration-150 ${className}`}
    >
      <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b border-gray-100 flex items-start sm:items-center justify-between flex-wrap gap-2 bg-gray-50/50">
        <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
          {Icon && (
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Icon size={14} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

export default FormSection;
