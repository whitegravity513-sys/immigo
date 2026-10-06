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
      className={`bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden scroll-mt-36 sm:scroll-mt-44 transition-all duration-150 ${className}`}
    >
      <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-b border-gray-100 flex items-start sm:items-center justify-between flex-wrap gap-2.5 sm:gap-3 bg-gray-50/50">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Icon size={17} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 leading-snug">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 line-clamp-2 sm:line-clamp-none">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="p-3.5 sm:p-6">{children}</div>
    </div>
  );
}

export default FormSection;
