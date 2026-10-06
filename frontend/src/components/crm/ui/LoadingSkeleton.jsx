import React from "react";

export function LoadingSkeleton({ type = "table", count = 5 }) {
  if (type === "stats") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-7 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 bg-gray-200 rounded w-1/4" />
              <div className="h-5 bg-gray-100 rounded w-20" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-100 border-b border-gray-200" />
      <div className="divide-y divide-gray-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
              <div className="space-y-2 flex-1 max-w-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-24 hidden sm:block" />
            <div className="h-4 bg-gray-200 rounded w-16 hidden md:block" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingSkeleton;
