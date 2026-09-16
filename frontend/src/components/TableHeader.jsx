import React from 'react';

/**
 * Reusable table header component.
 * Props:
 * - columns: array of strings representing column titles.
 * - className: optional extra classes for the <thead> element.
 */
export default function TableHeader({ columns, className = '' }) {
  return (
    <thead className={className}>
      <tr>
        {columns.map((col) => (
          <th
            key={col}
            className="px-4 sm:px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-100"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}
