import React from 'react';

const cards = (stats) => [
  {
    label: 'Total Complaints',
    value: stats.total,
    sub: 'all time',
    bg: 'from-slate-600 to-slate-700',
    glow: 'stat-glow-slate',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    label: 'Resolved',
    value: `${stats.resolvedPct}%`,
    sub: `${stats.resolved} complaints`,
    bg: 'from-emerald-500 to-teal-500',
    glow: 'stat-glow-green',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Pending',
    value: `${stats.pendingPct}%`,
    sub: `${stats.pending} complaints`,
    bg: 'from-amber-400 to-orange-400',
    glow: 'stat-glow-amber',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Avg Response',
    value: stats.avgResponseHours != null
      ? stats.avgResponseHours >= 24
        ? `${(stats.avgResponseHours / 24).toFixed(1)}d`
        : `${stats.avgResponseHours}h`
      : 'N/A',
    sub: stats.avgResponseHours != null ? 'avg resolution time' : 'no resolved data',
    bg: 'from-violet-500 to-purple-600',
    glow: 'stat-glow-purple',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards(stats).map((c) => (
        <div key={c.label}
          className={`bg-gradient-to-br ${c.bg} ${c.glow} rounded-3xl p-4 sm:p-5 text-white border border-white/10 transition-transform duration-200 hover:-translate-y-1`}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              {c.icon}
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-1">{c.value}</p>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{c.label}</p>
          {c.sub && <p className="text-white/50 text-xs mt-0.5">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}
