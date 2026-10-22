import React from "react";
import { Search } from "lucide-react";

export default function ProjectsFilterBar({
  search,
  setSearch,
  clientFilter,
  setClientFilter,
  statusFilter,
  setStatusFilter,
  countryFilter,
  setCountryFilter,
  clients,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-2xs space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Project ID, Name, Client..."
            className="w-full text-xs rounded-md border border-gray-300 pl-8 pr-3 py-1.5 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full text-xs rounded-md border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 cursor-pointer focus:border-blue-600 focus:outline-none"
          >
            <option value="All">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs rounded-md border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 cursor-pointer focus:border-blue-600 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="w-full text-xs rounded-md border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 cursor-pointer focus:border-blue-600 focus:outline-none"
          >
            <option value="All">All Countries</option>
            <option value="UAE">UAE</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="Qatar">Qatar</option>
            <option value="Oman">Oman</option>
            <option value="Kuwait">Kuwait</option>
            <option value="Bahrain">Bahrain</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Germany">Germany</option>
          </select>
        </div>
      </div>
    </div>
  );
}
