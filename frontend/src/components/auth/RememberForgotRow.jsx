import React from "react";

/**
 * Remember me checkbox and Forgot Password link row.
 */
export default function RememberForgotRow() {
  return (
    <div className="flex items-center justify-between pt-0.5">
      <label className="flex items-center gap-2 cursor-pointer select-none group">
        <input
          type="checkbox"
          defaultChecked
          className="accent-blue-600 w-3.5 h-3.5 rounded cursor-pointer"
        />
        <span className="text-xs text-slate-600 font-medium group-hover:text-slate-800 transition-colors">
          Keep me signed in
        </span>
      </label>
      <a
        href="#"
        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
      >
        Forgot Password?
      </a>
    </div>
  );
}
