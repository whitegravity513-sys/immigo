import React from "react";
import { Search, X } from "lucide-react";

export default function VendorFilterToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  onClearFilter,
  vendorCount,
  stateFilter,
  setStateFilter,
  availableStates = [],
  cityFilter,
  setCityFilter,
  availableCities = [],
  specFilter,
  setSpecFilter,
  availableSpecs = [],
  dateFilter,
  setDateFilter,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Vendor ID, agency name, contact person, city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {statusFilter !== "All" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <span>
                Filter:{" "}
                {statusFilter === "Registered"
                  ? "Registered (Pending)"
                  : statusFilter === "MOU Pending"
                  ? "MOU In-Process"
                  : statusFilter === "Approved"
                  ? "Verified & Approved"
                  : statusFilter}
              </span>
              <button
                type="button"
                onClick={onClearFilter}
                className="hover:text-blue-900 p-0.5 rounded cursor-pointer"
                title="Clear filter"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            {vendorCount} {vendorCount === 1 ? "vendor" : "vendors"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter by State
          </label>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All States</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter by City
          </label>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Cities</option>
            {availableCities.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter by Specialization
          </label>
          <select
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Specializations</option>
            {availableSpecs.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Registration Date
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Dates</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>
    </div>
  );
}
