import React from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Enterprise Security & Compliance Trust Badge.
 */
export default function SecurityTrustBadge() {
  return (
    <div className="mt-6 flex items-center justify-between gap-2 p-3 bg-gradient-to-r from-blue-50/70 to-emerald-50/70 border border-slate-300 rounded-xl">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
        <span className="text-[11px] text-slate-700 font-bold">
          Enterprise Security &bull; ISO 27001 Certified &bull; Anti-Bruteforce Guard
        </span>
      </div>
      <span className="hidden sm:inline-block text-[10px] font-extrabold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
        Active
      </span>
    </div>
  );
}
