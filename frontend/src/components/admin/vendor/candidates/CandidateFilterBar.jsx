import React from "react";
import { Search } from "lucide-react";

export default function CandidateFilterBar({
  searchQuery,
  setSearchQuery,
  vendorFilter,
  setVendorFilter,
  vendorOptions = [],
  getVendorName,
  positionFilter,
  setPositionFilter,
  positionOptions = [],
  countryFilter,
  setCountryFilter,
  countryOptions = [],
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
      <div className="relative sm:col-span-1">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, ID, vendor..."
          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
        />
      </div>

      <select
        value={vendorFilter}
        onChange={(e) => setVendorFilter(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
      >
        <option value="All">All Sourcing Vendors</option>
        {vendorOptions.map((v) => (
          <option key={v} value={v}>
            {getVendorName(v)}
          </option>
        ))}
      </select>

      <select
        value={positionFilter}
        onChange={(e) => setPositionFilter(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
      >
        <option value="All">All Trade Positions</option>
        {positionOptions.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={countryFilter}
        onChange={(e) => setCountryFilter(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
      >
        <option value="All">All Destinations</option>
        {countryOptions.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
