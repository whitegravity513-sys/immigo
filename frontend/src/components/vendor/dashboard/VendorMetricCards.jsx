import React from "react";
import { Link } from "react-router-dom";

export default function VendorMetricCards({ cards }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 w-full">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.title}
            to={card.to}
            className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all duration-150 block text-left group cursor-pointer min-w-0"
          >
            <div className="flex items-center justify-between mb-1.5 gap-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                {card.title}
              </span>
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${card.bgClass || "bg-slate-100 text-slate-600"}`}>
                <Icon size={13} className="sm:w-3.5 sm:h-3.5" />
              </div>
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors leading-none">
              {card.value}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
              {card.subtitle}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
