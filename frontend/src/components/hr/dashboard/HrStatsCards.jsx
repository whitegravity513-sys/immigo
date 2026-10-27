import React from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, FileText, Clock, CheckCircle2, XCircle, AlertTriangle, Building } from "lucide-react";

const CARD_ICONS = [Users, UserPlus, AlertTriangle, FileText, CheckCircle2, Clock, FileText, Building];

export default function HrStatsCards({ hrCards }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
      {hrCards.map((card, idx) => {
        const Icon = CARD_ICONS[idx % CARD_ICONS.length];
        return (
          <Link
            key={card.title}
            to={card.to}
            className="p-4 bg-white rounded-xl border border-gray-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-150 block text-left group min-h-[90px]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Icon size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-gray-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
              {card.value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate mt-1">
              {card.title}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              {card.sub}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
