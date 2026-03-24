import React from 'react';
import StatusBadge from './StatusBadge';

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const WardIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export default function ComplaintCard({ complaint }) {
  const { image, description, location, userName, isAnonymous, status, createdAt, city, wardNumber } = complaint;
  const date = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white rounded-3xl card-3d card-3d-hover transition-all duration-300 overflow-hidden flex flex-col">

      {/* Image / placeholder */}
      {image ? (
        <div className="h-44 overflow-hidden bg-slate-100 flex-shrink-0">
          <img src={image} alt="complaint" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-28 flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
          <div className="text-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-300 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
            <p className="text-slate-400 text-xs font-medium">No photo</p>
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Status + description */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-3 flex-1">{description}</p>
          <StatusBadge status={status} />
        </div>

        {/* City + Ward */}
        {(city || wardNumber) && (
          <div className="flex items-center gap-2 flex-wrap">
            {city && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                <LocationIcon />
                {city}
              </span>
            )}
            {wardNumber && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
                <WardIcon />
                Ward {wardNumber}
              </span>
            )}
          </div>
        )}

        {/* Footer meta */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium min-w-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-[10px] font-black">
                {isAnonymous ? 'A' : (userName?.[0]?.toUpperCase() || 'U')}
              </span>
            </div>
            <span className="truncate">{isAnonymous ? 'Anonymous' : (userName || 'Unknown')}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs flex-shrink-0">
            <CalendarIcon />
            {date}
          </div>
        </div>

        {/* Coordinates */}
        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <LocationIcon />
          <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
        </div>

      </div>
    </div>
  );
}
