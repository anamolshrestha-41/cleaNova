import React from 'react';
import StatusBadge from './StatusBadge';

export default function ComplaintCard({ complaint }) {
  const { image, description, userName, isAnonymous, status, createdAt, wardNumber, count, upvotes } = complaint;
  const date = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white rounded-3xl card-3d card-3d-hover transition-all duration-300 overflow-hidden flex flex-col">

      {/* Image */}
      {image ? (
        <div className="h-44 overflow-hidden bg-slate-100 flex-shrink-0">
          <img src={image} alt="complaint" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="h-28 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </div>
      )}

      <div className="p-4 flex flex-col gap-2.5 flex-1">

        {/* Status + description */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-3 flex-1">{description}</p>
          <StatusBadge status={status} />
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          {wardNumber && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
              Ward {wardNumber}
            </span>
          )}
          {count > 1 && (
            <span className="px-2.5 py-1 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200">
              ×{count} reports
            </span>
          )}
          {upvotes > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">
              ▲ {upvotes}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium min-w-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-[10px] font-black">
                {isAnonymous ? 'A' : (userName?.[0]?.toUpperCase() || 'U')}
              </span>
            </div>
            <span className="truncate">{isAnonymous ? 'Anonymous' : (userName || 'Unknown')}</span>
          </div>
          <span className="text-slate-400 text-xs flex-shrink-0">{date}</span>
        </div>
      </div>
    </div>
  );
}
