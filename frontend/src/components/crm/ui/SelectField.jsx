import React, { useState } from "react";
import { ChevronDown, Tag } from "lucide-react";

export function SelectField({
  label,
  name,
  value,
  onChange,
  otherValue,
  onOtherChange,
  options = [],
  placeholder = "Select an option",
  required = false,
  error = "",
  disabled = false,
  helperText = "",
  className = "",
  children,
}) {
  const [internalOther, setInternalOther] = useState("");
  const isOther = String(value || "").toLowerCase() === "other";

  const handleCustomChange = (e) => {
    setInternalOther(e.target.value);
    if (onOtherChange) {
      onOtherChange(e);
    } else if (onChange) {
      onChange({
        target: {
          name: `${name}Other`,
          value: e.target.value,
        },
      });
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs font-semibold text-gray-700 tracking-wide"
        >
          {label}
          {required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          className={`w-full appearance-none text-sm rounded-lg border transition-all duration-150 py-2.5 pl-3.5 pr-9 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
          }`}
        >
          {placeholder && (
            <option value="" disabled className="text-gray-400">
              {placeholder}
            </option>
          )}

          {children ||
            options.map((opt) => {
              if (typeof opt === "string") {
                return (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                );
              }
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
        </select>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Dynamic Other Input Field */}
      {isOther && (
        <div className="pt-1.5 animate-fadeIn">
          <div className="relative">
            <Tag className="w-3.5 h-3.5 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name={`${name}Other`}
              value={otherValue !== undefined ? otherValue : internalOther}
              onChange={handleCustomChange}
              placeholder={`Specify custom ${label || "value"} type...`}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-blue-300 bg-blue-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
            />
          </div>
        </div>
      )}

      {error ? (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

export default SelectField;
