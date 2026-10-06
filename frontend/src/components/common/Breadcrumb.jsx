import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-gray-500 font-medium select-none overflow-x-auto whitespace-nowrap py-1"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={item.path || item.label || index}>
            {index > 0 && (
              <ChevronRight size={13} className="text-gray-300 shrink-0 mx-0.5" />
            )}

            {isLast ? (
              <span className="font-bold text-gray-900 truncate">
                {item.label}
              </span>
            ) : item.path ? (
              <Link
                to={item.path}
                className="hover:text-blue-600 transition-colors text-gray-600 truncate flex items-center gap-1"
              >
                {index === 0 && <Home size={12} className="shrink-0 text-gray-400" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="text-gray-600 truncate">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
