import React from "react";
import { Link } from "react-router-dom";

export default function HrStatsCards({ hrCards }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {hrCards.map((card) => (
        <Link
          key={card.title}
          to={card.to}
          className="p-3 bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all duration-150 block text-left group"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
            {card.title}
          </p>
          <p className="text-lg font-bold text-gray-900 tracking-tight mt-1 leading-none group-hover:text-blue-600 transition-colors">
            {card.value}
          </p>
          <p className="text-[10px] text-gray-500 mt-1 truncate">
            {card.sub}
          </p>
        </Link>
      ))}
    </div>
  );
}
