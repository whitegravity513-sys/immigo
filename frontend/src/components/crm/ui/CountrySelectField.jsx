import React, { useState } from "react";
import { ChevronDown, Globe, Edit3, List } from "lucide-react";
import { ALL_COUNTRIES, GCC_COUNTRIES } from "../../../constants/countries.js";

export function CountrySelectField({
  label = "Country",
  name = "country",
  value = "",
  onChange,
  required = false,
  error = "",
  disabled = false,
  helperText = "",
  className = "",
  placeholder = "Select or type country",
}) {
  const [isManual, setIsManual] = useState(() => {
    return Boolean(value && !ALL_COUNTRIES.includes(value));
  });

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={name}
            className="block text-[11px] font-semibold text-gray-700 tracking-wide"
          >
            {label}
            {required && <span className="text-red-500 ml-1 font-bold">*</span>}
          </label>
        )}

        <button
          type="button"
          onClick={() => setIsManual(!isManual)}
          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer select-none"
          title={isManual ? "Switch to standard list" : "Type custom country manually"}
        >
          {isManual ? (
            <>
              <List size={11} />
              <span>Select from list</span>
            </>
          ) : (
            <>
              <Edit3 size={11} />
              <span>Type manually</span>
            </>
          )}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
          <Globe size={13} />
        </div>

        {isManual ? (
          <input
            id={name}
            name={name}
            type="text"
            value={value ?? ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Type country name..."
            className={`w-full text-xs rounded-md border transition-all duration-150 py-1.5 pl-8 pr-3 bg-white text-gray-900 disabled:bg-gray-50 ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 focus:outline-none"
            }`}
          />
        ) : (
          <>
            <select
              id={name}
              name={name}
              value={value ?? ""}
              onChange={onChange}
              disabled={disabled}
              className={`w-full appearance-none text-xs rounded-md border transition-all duration-150 py-1.5 pl-8 pr-8 bg-white text-gray-900 disabled:bg-gray-50 cursor-pointer ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 focus:outline-none"
              }`}
            >
              {placeholder && (
                <option value="" disabled className="text-gray-400">
                  {placeholder}
                </option>
              )}

              <optgroup label="Popular GCC Destinations">
                {GCC_COUNTRIES.map((c) => (
                  <option key={`gcc-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>

              <optgroup label="All Global Countries">
                {ALL_COUNTRIES.map((c) => (
                  <option key={`all-${c}`} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>

            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
              <ChevronDown size={13} />
            </div>
          </>
        )}
      </div>

      {error ? (
        <p className="text-[10px] text-red-600 font-medium flex items-center gap-1 mt-0.5">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-gray-400 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}

export default CountrySelectField;
