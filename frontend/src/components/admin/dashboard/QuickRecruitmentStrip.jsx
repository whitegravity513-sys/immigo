import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  FileText,
  Briefcase,
  Calendar,
  Award,
  TrendingUp,
} from "lucide-react";

export default function QuickRecruitmentStrip({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2">
      <Link
        to="/admin/candidates/new-registrations"
        className="p-1.5 sm:p-2 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/70 rounded-lg transition-all group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-amber-800">
          <span className="text-[9px] font-bold uppercase tracking-wider">New Registrations</span>
          <Clock size={11} className="text-amber-600" />
        </div>
        <div className="text-sm sm:text-base font-bold text-amber-950 mt-0.5">
          {stats.pendingRegistrations}
        </div>
        <span className="text-[8.5px] text-amber-700/80 font-semibold group-hover:underline">
          Review &rarr;
        </span>
      </Link>

      <Link
        to="/admin/candidates/documents"
        className="p-1.5 sm:p-2 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/70 rounded-lg transition-all group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-indigo-800">
          <span className="text-[9px] font-bold uppercase tracking-wider">Pending Docs</span>
          <FileText size={11} className="text-indigo-600" />
        </div>
        <div className="text-sm sm:text-base font-bold text-indigo-950 mt-0.5">
          {stats.pendingDocuments}
        </div>
        <span className="text-[8.5px] text-indigo-700/80 font-semibold group-hover:underline">
          Verify docs &rarr;
        </span>
      </Link>

      <Link
        to="/admin/candidates/applications"
        className="p-1.5 sm:p-2 bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200/70 rounded-lg transition-all group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-sky-800">
          <span className="text-[9px] font-bold uppercase tracking-wider">Applications</span>
          <Briefcase size={11} className="text-sky-600" />
        </div>
        <div className="text-sm sm:text-base font-bold text-sky-950 mt-0.5">
          {stats.totalApplications}
        </div>
        <span className="text-[8.5px] text-sky-700/80 font-semibold group-hover:underline">
          View pipeline &rarr;
        </span>
      </Link>

      <Link
        to="/admin/candidates/interviews"
        className="p-2 sm:p-2.5 bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200/70 rounded-lg transition-all group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-purple-800">
          <span className="text-[10px] font-bold uppercase tracking-wider">Interviews</span>
          <Calendar size={12} className="text-purple-600" />
        </div>
        <div className="text-base sm:text-lg font-bold text-purple-950 mt-1">
          {stats.interviewsScheduled}
        </div>
        <span className="text-[9px] text-purple-700/80 font-semibold group-hover:underline">
          Schedule &rarr;
        </span>
      </Link>

      <Link
        to="/admin/candidates/selected"
        className="p-2 sm:p-2.5 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/70 rounded-lg transition-all group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-emerald-800">
          <span className="text-[10px] font-bold uppercase tracking-wider">Selected</span>
          <Award size={12} className="text-emerald-600" />
        </div>
        <div className="text-base sm:text-lg font-bold text-emerald-950 mt-1">
          {stats.selectedCandidates}
        </div>
        <span className="text-[9px] text-emerald-700/80 font-semibold group-hover:underline">
          Deployments &rarr;
        </span>
      </Link>

      <Link
        to="/client/ledger"
        className="p-2 sm:p-2.5 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/70 rounded-lg transition-all group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-teal-800">
          <span className="text-[10px] font-bold uppercase tracking-wider">Total Inward</span>
          <TrendingUp size={12} className="text-teal-600" />
        </div>
        <div className="text-base sm:text-lg font-bold text-teal-950 mt-1">
          {stats.totalReceived > 0 ? `₹${(stats.totalReceived / 100000).toFixed(1)}L` : "₹0"}
        </div>
        <span className="text-[9px] text-teal-700/80 font-semibold group-hover:underline">
          Open ledger &rarr;
        </span>
      </Link>
    </div>
  );
}

