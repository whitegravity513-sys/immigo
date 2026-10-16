import React from "react";

export function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  error = "",
  disabled = false,
  helperText = "",
  icon: Icon,
  className = "",
  min,
  max,
  step,
  autoComplete,
}) {
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
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
            <Icon size={14} />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          autoComplete={autoComplete}
          className={`w-full text-xs rounded-md border transition-all duration-150 py-1.5 bg-white text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${
            Icon ? "pl-8 pr-3" : "px-2.5"
          } ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 focus:outline-none"
          }`}
        />
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

export default InputField;
