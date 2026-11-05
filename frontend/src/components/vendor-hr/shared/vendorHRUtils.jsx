import React from "react";

export function Sparkline({ color = "#6366F1", id = "spark" }) {
  return (
    <svg className="w-16 h-8 overflow-visible" viewBox="0 0 70 30" fill="none">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M 0,25 C 15,22 25,12 35,18 C 45,24 55,8 70,10 L 70,30 L 0,30 Z"
        fill={`url(#grad-${id})`}
      />
      <path
        d="M 0,25 C 15,22 25,12 35,18 C 45,24 55,8 70,10"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function formatSalary(salary) {
  if (!salary) return "Standard Package";
  if (typeof salary === "string") return salary;
  if (typeof salary === "number") return salary.toLocaleString() + " AED";
  if (typeof salary === "object") {
    const { min, max, currency } = salary;
    const curr = currency || "AED";
    if (min && max) {
      return `${Number(min).toLocaleString()} - ${Number(max).toLocaleString()} ${curr}`;
    }
    if (min) return `From ${Number(min).toLocaleString()} ${curr}`;
    if (max) return `Up to ${Number(max).toLocaleString()} ${curr}`;
    return `Competitive (${curr})`;
  }
  return String(salary);
}

export const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80",
];

