import React from "react";
import { Search } from "lucide-react";

export default function ClientPaymentFilterBar({
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  selectedClient,
  setSelectedClient,
  clients = [],
  selectedStatus,
  setSelectedStatus,
  statusList = [],
  onResetFilters,
  setPage,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-2xs">
      <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Client, UTR, Milestone..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={selectedClient}
            onChange={(e) => {
              setSelectedClient(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-700"
          >
            <option value="">All Clients</option>
            {(Array.isArray(clients) ? clients : []).map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-700"
          >
            {statusList.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            Apply Filter
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
