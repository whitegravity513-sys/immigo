import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  trend,
  className = "",
  to = null,
  onClick = null,
}) {
  const colorStyles = {
    blue: {
      iconBg: "bg-blue-50 text-blue-600 border-blue-100",
      accent: "hover:border-blue-400 hover:shadow-sm",
      badge: "text-blue-700 bg-blue-50",
    },
    emerald: {
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accent: "hover:border-emerald-400 hover:shadow-sm",
      badge: "text-emerald-700 bg-emerald-50",
    },
    amber: {
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
      accent: "hover:border-amber-400 hover:shadow-sm",
      badge: "text-amber-700 bg-amber-50",
    },
    indigo: {
      iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
      accent: "hover:border-indigo-400 hover:shadow-sm",
      badge: "text-indigo-700 bg-indigo-50",
    },
    purple: {
      iconBg: "bg-purple-50 text-purple-600 border-purple-100",
      accent: "hover:border-purple-400 hover:shadow-sm",
      badge: "text-purple-700 bg-purple-50",
    },
    rose: {
      iconBg: "bg-rose-50 text-rose-600 border-rose-100",
      accent: "hover:border-rose-400 hover:shadow-sm",
      badge: "text-rose-700 bg-rose-50",
    },
  };

  const scheme = colorStyles[color] || colorStyles.blue;
  const isClickable = Boolean(to || onClick);
  const CardWrapper = to ? Link : onClick ? "button" : "div";
  const wrapperProps = to ? { to } : onClick ? { type: "button", onClick } : {};

  return (
    <CardWrapper
      {...wrapperProps}
      className={`bg-white rounded-xl border border-gray-200/90 p-3 sm:p-3.5 shadow-2xs transition-all duration-150 block text-left ${
        isClickable
          ? "cursor-pointer group hover:-translate-y-0.5"
          : ""
      } ${scheme.accent} ${className}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">
              {title}
            </p>
            {isClickable && (
              <ArrowUpRight
                size={12}
                className="text-gray-300 group-hover:text-blue-600 transition-colors shrink-0"
              />
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5 tracking-tight truncate leading-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[10px] text-gray-400 mt-0.5 truncate font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${scheme.iconBg}`}
          >
            <Icon size={17} strokeWidth={2} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] gap-1">
          <span className={`px-1.5 py-0.2 rounded-md font-semibold truncate ${scheme.badge}`}>
            {trend.value}
          </span>
          <span className="text-gray-400 truncate shrink-0">{trend.label}</span>
        </div>
      )}
    </CardWrapper>
  );
}

export default StatCard;
