import React from 'react';

const config = {
  pending:      { label: 'Pending',     bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400',   border: 'border-amber-200'  },
  'in-progress':{ label: 'In Progress', bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-400',    border: 'border-blue-200'   },
  resolved:     { label: 'Resolved',    bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400', border: 'border-emerald-200'},
};

export default function StatusBadge({ status, size = 'sm' }) {
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold border whitespace-nowrap
      ${c.bg} ${c.text} ${c.border}
      ${size === 'sm' ? 'px-2.5 py-1 rounded-xl text-xs' : 'px-3 py-1.5 rounded-xl text-sm'}`}>
      <span className={`rounded-full flex-shrink-0 ${c.dot} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      {c.label}
    </span>
  );
}
