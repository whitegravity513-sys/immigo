import React from "react";
import { Link } from "react-router-dom";

export default function ClientStatsCards({ clientCards }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {clientCards.map((card) => (
        <Link
          key={card.title}
          to={card.to}
          className="p-2 sm:p-2.5 px-3 bg-white rounded-lg border border-gray-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all duration-150 block text-left group"
        >
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400 truncate">
            {card.title}
          </p>
          <p className="text-base sm:text-lg font-bold text-gray-900 tracking-tight mt-0.5 leading-none group-hover:text-blue-600 transition-colors">
            {card.value}
          </p>
          <p className="text-[9.5px] text-gray-500 mt-1 truncate">
            {card.sub}
          </p>
        </Link>
      ))}
    </div>
  );
}
