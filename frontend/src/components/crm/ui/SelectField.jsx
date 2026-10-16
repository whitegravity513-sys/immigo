import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

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
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-[11px] font-semibold text-gray-700 tracking-wide"
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
          className={`w-full appearance-none text-xs rounded-md border transition-all duration-150 py-1.5 pl-2.5 pr-8 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer ${
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
          {options.length > 0
            ? options.map((opt) => {
                const optVal = typeof opt === "string" ? opt : opt.value;
                const optLabel = typeof opt === "string" ? opt : opt.label;
                return (
                  <option key={optVal} value={optVal}>
                    {optLabel}
                  </option>
                );
              })
            : children}
        </select>

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
          <ChevronDown size={13} />
        </div>
      </div>

      {isOther && (
        <div className="mt-1">
          <input
            type="text"
            value={otherValue !== undefined ? otherValue : internalOther}
            onChange={handleCustomChange}
            placeholder={`Specify custom ${label || "option"}...`}
            className="w-full text-xs rounded-md border border-blue-400 py-1.5 px-2.5 bg-blue-50/20 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
      )}

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

export default SelectField;
