import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function SummaryCardsGrid({ stats, summaryCards }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5 sm:gap-3">
      <div className="lg:col-span-1 p-3 sm:p-3.5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-lg text-white shadow-xs flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
            Workforce Strength
          </span>
          <div className="text-xl sm:text-2xl font-bold mt-0.5">{stats.totalEmployees}</div>
          <div className="text-[10px] text-indigo-100 mt-1 font-medium bg-white/15 inline-block px-2 py-0.5 rounded-full">
            {stats.presentToday > 0
              ? `${stats.presentToday} present today`
              : stats.newEmployeesThisMonth > 0
              ? `+${stats.newEmployeesThisMonth} new this month`
              : "Active staff"}
          </div>
        </div>
        <Link
          to="/admin/dashboard/workforce"
          className="mt-2 pt-1.5 border-t border-indigo-500/50 flex items-center justify-between text-xs font-bold hover:text-white group"
        >
          <span>View HR Dashboard</span>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-colors">
            <ArrowRight size={11} />
          </span>
        </Link>
      </div>

      <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
        {summaryCards.slice(1, 7).map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              className="p-2 sm:p-2.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-1 mb-1.5 relative z-10">
                <span className={`p-1 rounded-md border font-bold ${card.badgeBg}`}>
                  <Icon size={13} />
                </span>
                <span className="text-[8.5px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100 truncate max-w-[100px]">
                  {card.trend}
                </span>
              </div>

              <div className="relative z-10">
                <p className="text-base sm:text-lg font-bold text-slate-800 tracking-tight leading-none mb-0.5 group-hover:text-indigo-600 transition-colors">
                  {card.value}
                </p>
                <p className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
