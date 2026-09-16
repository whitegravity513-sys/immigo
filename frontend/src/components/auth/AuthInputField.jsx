import React, { useState } from "react";

/**
 * Enterprise standard InputField with active focus styling,
 * icon accentuation, and support for CapsLock notification.
 */
export default function AuthInputField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  autoFocus = false,
  autoComplete,
  rightElement,
  onCapsLockChange,
  id,
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyUp = (e) => {
    if (onCapsLockChange && e.getModifierState) {
      onCapsLockChange(e.getModifierState("CapsLock"));
    }
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5"
      >
        {label}
      </label>
      <div className="relative group">
        <span
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
            isFocused ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
          }`}
        >
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyUp={handleKeyUp}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={`w-full pl-10.5 ${
            rightElement ? "pr-11" : "pr-4"
          } py-3 bg-slate-50/90 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none hover:border-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-2xs`}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}
