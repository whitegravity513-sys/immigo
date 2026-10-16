import React from "react";
import { Search, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  onClear,
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={14}
        className="absolute left-2.5 text-gray-400 pointer-events-none shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-gray-200 rounded-md text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-150"
      />
      {value && (
        <button
          type="button"
          onClick={onClear || (() => onChange({ target: { value: "" } }))}
          className="absolute right-2 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
