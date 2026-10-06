import React, { useState } from "react";
import { ChevronDown, Coins, Edit3, List } from "lucide-react";
import { POPULAR_CURRENCIES } from "../../../constants/currencies.js";

export function CurrencySelectField({
  label = "Currency",
  name = "currency",
  value = "AED",
  onChange,
  disabled = false,
  error = "",
  className = "",
}) {
  const [isManual, setIsManual] = useState(() => {
    // If current value is not in standard list, start in manual mode
    return Boolean(value && !POPULAR_CURRENCIES.some((c) => c.code === value));
  });

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={name}
            className="block text-xs font-semibold text-gray-700 tracking-wide"
          >
            {label}
          </label>
        )}

        <button
          type="button"
          onClick={() => setIsManual(!isManual)}
          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-0.5 transition-colors cursor-pointer select-none"
          title={isManual ? "Select from standard list" : "Type custom currency"}
        >
          {isManual ? (
            <>
              <List size={11} />
              <span>List</span>
            </>
          ) : (
            <>
              <Edit3 size={11} />
              <span>Custom</span>
            </>
          )}
        </button>
      </div>

      <div className="relative">
        {isManual ? (
          <input
            id={name}
            name={name}
            type="text"
            list={`${name}-cur-datalist`}
            value={value ?? ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g. AED, USD, EUR..."
            className="w-full text-xs uppercase font-mono rounded-lg border border-gray-300 py-2.5 px-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        ) : (
          <>
            <select
              id={name}
              name={name}
              value={value ?? "AED"}
              onChange={onChange}
              disabled={disabled}
              className="w-full appearance-none text-xs rounded-lg border border-gray-300 py-2.5 pl-3 pr-8 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer transition-all"
            >
              {POPULAR_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </>
        )}

        <datalist id={`${name}-cur-datalist`}>
          {POPULAR_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </datalist>
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

export default CurrencySelectField;
