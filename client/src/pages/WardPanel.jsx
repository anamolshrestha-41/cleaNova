import React, { useCallback, useState } from 'react';
import { getWardComplaints, updateStatus, optimizeRoute } from '../services/complaints';
import { usePolling } from '../hooks/usePolling';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['pending', 'in-progress', 'resolved'];

const statusColors = {
  pending: 'border-l-amber-400',
  'in-progress': 'border-l-blue-400',
  resolved: 'border-l-emerald-400',
};

export default function WardPanel() {
  const wardNumber = JSON.parse(atob(localStorage.getItem('adminToken').split('.')[1])).wardNumber;

  const [updating, setUpdating] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeOrder, setRouteOrder] = useState(null); // optimized complaint order
  const [search, setSearch] = useState('');

  const fetchComplaints = useCallback(() => getWardComplaints(), []);
  const { data: complaints, loading, refetch } = usePolling(fetchComplaints, 4000);

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try { await updateStatus(id, status); refetch(); }
    catch { alert('Failed to update status.'); }
    finally { setUpdating(null); }
  };

  const handleOptimizeRoute = async () => {
    if (!complaints?.length) return;
    const pending = complaints.filter(c => c.status !== 'resolved');
    if (!pending.length) return alert('No active complaints to route.');
    setRouteLoading(true);
    try {
      const ids = pending.map(c => c._id);
      const result = await optimizeRoute(ids);
      setRouteOrder(result.order || ids);
    } catch {
      // Fallback: sort by nearest using simple lat distance
      const sorted = [...pending].sort((a, b) => {
        const la = a.location?.coordinates?.[1] ?? a.location?.lat ?? 0;
        const lb = b.location?.coordinates?.[1] ?? b.location?.lat ?? 0;
        return la - lb;
      });
      setRouteOrder(sorted.map(c => c._id));
    } finally {
      setRouteLoading(false);
    }
  };

  const displayList = (() => {
    if (!complaints) return [];
    let list = complaints;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.description.toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q)
      );
    }
    if (routeOrder) {
      const map = Object.fromEntries(list.map(c => [c._id, c]));
      return routeOrder.map(id => map[id]).filter(Boolean);
    }
    return list;
  })();

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.625rem] font-black text-slate-800 leading-tight">Ward {wardNumber} Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Manage complaints assigned to your ward</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 border border-slate-200 card-3d">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search complaints..."
              className="text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none w-40 bg-transparent" />
          </div>
          {/* Optimize Route */}
          <button onClick={handleOptimizeRoute} disabled={routeLoading || loading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-2xl text-sm shadow-lg shadow-teal-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 btn-press">
            {routeLoading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            )}
            Optimize Route
          </button>
          {routeOrder && (
            <button onClick={() => setRouteOrder(null)}
              className="px-3 py-2.5 rounded-2xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors btn-press">
              Clear Route
            </button>
          )}
        </div>
      </div>

      {/* Route active banner */}
      {routeOrder && (
        <div className="flex items-center gap-2.5 bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm font-bold text-teal-700">Optimized route active — complaints sorted by nearest location</p>
        </div>
      )}

      {/* Summary strip */}
      {!loading && complaints && (
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Total', count: complaints.length, color: 'bg-slate-100 text-slate-700' },
            { label: 'Pending', count: complaints.filter(c => c.status === 'pending').length, color: 'bg-amber-50 text-amber-700 border border-amber-200' },
            { label: 'In Progress', count: complaints.filter(c => c.status === 'in-progress').length, color: 'bg-blue-50 text-blue-700 border border-blue-200' },
            { label: 'Resolved', count: complaints.filter(c => c.status === 'resolved').length, color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
          ].map(s => (
            <span key={s.label} className={`px-3 py-1.5 rounded-2xl text-xs font-bold ${s.color}`}>
              {s.label}: {s.count}
            </span>
          ))}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl h-24 animate-pulse card-3d" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && displayList.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl card-3d">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-500 font-semibold">No complaints in Ward {wardNumber}</p>
        </div>
      )}

      {/* List */}
      {!loading && displayList.length > 0 && (
        <div className="space-y-3">
          {displayList.map((c, idx) => (
            <div key={c._id}
              className={`bg-white rounded-3xl card-3d border-l-4 ${statusColors[c.status] || 'border-l-slate-200'} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200 hover:shadow-md`}>

              {/* Route step number */}
              {routeOrder && (
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>
              )}

              {/* Thumbnail */}
              {c.image ? (
                <img src={c.image} alt="" className="w-full sm:w-20 h-20 object-cover rounded-2xl flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm text-slate-700 font-medium line-clamp-2 leading-relaxed">{c.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">
                    {c.location?.coordinates
                      ? `${c.location.coordinates[1].toFixed(4)}, ${c.location.coordinates[0].toFixed(4)}`
                      : `${c.location?.lat?.toFixed(4)}, ${c.location?.lng?.toFixed(4)}`}
                  </span>
                  <span className="text-slate-300 text-xs">·</span>
                  <span className="text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <StatusBadge status={c.status} />
                  {c.count > 1 && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200">
                      ×{c.count} reports
                    </span>
                  )}
                </div>
              </div>

              {/* Status selector */}
              <div className="flex-shrink-0">
                <select value={c.status} disabled={updating === c._id}
                  onChange={e => handleStatusChange(c._id, e.target.value)}
                  className="border border-slate-200 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white cursor-pointer disabled:opacity-50 hover:border-teal-300 transition-colors min-w-[130px]">
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
