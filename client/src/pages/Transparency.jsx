import React, { useCallback } from 'react';
import { getStats } from '../services/complaints';
import { usePolling } from '../hooks/usePolling';

const getRateColor = (rate) => {
  if (rate >= 70) return { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (rate >= 40) return { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { bar: 'bg-red-400', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
};

const formatResponseTime = (hours) => {
  if (hours === null || hours === undefined) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours}h`;
  return `${(hours / 24).toFixed(1)}d`;
};

export default function Transparency() {
  const fetchStats = useCallback(() => getStats(), []);
  const { data: stats, loading } = usePolling(fetchStats, 30000);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-700 text-xs font-bold uppercase tracking-widest">Public Transparency Report</span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 leading-tight">Ward Performance Dashboard</h1>
        <p className="text-slate-500 text-sm mt-2">
          Real-time accountability between citizens and local government.
          All data is publicly accessible and updates automatically.
        </p>
      </div>

      {/* City-wide summary */}
      {!loading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Complaints', value: stats.total, sub: 'city-wide', color: 'from-slate-600 to-slate-700' },
            { label: 'Resolved', value: `${stats.resolvedPct}%`, sub: `${stats.resolved} complaints`, color: 'from-emerald-500 to-teal-500' },
            { label: 'Pending', value: stats.pending, sub: 'awaiting action', color: 'from-amber-400 to-orange-400' },
            { label: 'In Progress', value: stats.inProgress, sub: 'being handled', color: 'from-blue-500 to-indigo-500' },
          ].map(c => (
            <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-3xl p-4 sm:p-5 text-white border border-white/10`}>
              <p className="text-3xl font-black tracking-tight leading-none mb-1">{c.value}</p>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{c.label}</p>
              <p className="text-white/50 text-xs mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ward table */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Per-Ward Breakdown</p>

        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-20 animate-pulse card-3d" />
            ))}
          </div>
        )}

        {!loading && stats?.wardStats?.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl card-3d">
            <p className="text-slate-500 font-semibold">No ward data available yet</p>
          </div>
        )}

        {!loading && stats?.wardStats?.length > 0 && (
          <div className="bg-white rounded-3xl card-3d overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="col-span-2">Ward</div>
              <div className="col-span-2 text-center">Total</div>
              <div className="col-span-2 text-center">Open</div>
              <div className="col-span-4">Resolution Rate</div>
              <div className="col-span-2 text-center">Avg Response</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50">
              {stats.wardStats.map(w => {
                const colors = getRateColor(w.resolutionRate);
                return (
                  <div key={w._id} className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors">

                    {/* Ward */}
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                        {w._id}
                      </div>
                      <span className="text-sm font-bold text-slate-700 hidden sm:block">Ward {w._id}</span>
                    </div>

                    {/* Total */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-bold text-slate-700">{w.total}</span>
                    </div>

                    {/* Open */}
                    <div className="col-span-2 text-center">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        w.open > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {w.open}
                      </span>
                    </div>

                    {/* Resolution rate bar */}
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                          style={{ width: `${w.resolutionRate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-black w-10 text-right ${colors.text}`}>
                        {w.resolutionRate}%
                      </span>
                    </div>

                    {/* Avg response time */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-bold text-slate-600">
                        {formatResponseTime(w.avgResponseHours)}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> ≥70% resolved</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 40–69% resolved</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> &lt;40% resolved</span>
        <span className="ml-auto">— means no resolved complaints yet</span>
      </div>
    </div>
  );
}
