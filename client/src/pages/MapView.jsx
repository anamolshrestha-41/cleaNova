import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { getComplaints, optimizeRoute } from '../services/complaints';
import { usePolling } from '../hooks/usePolling';
import { makeMarkerIcon, STATUS_COLORS } from '../components/markerIcons';
import RouteLayer from '../components/RouteLayer';
import StatusBadge from '../components/StatusBadge';

// Fits map to all markers when complaints load
function FitBounds({ complaints }) {
  const map = useMap();
  useEffect(() => {
    if (!complaints || complaints.length === 0) return;
    const bounds = complaints.map(c => [c.location.lat, c.location.lng]);
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
  }, [complaints, map]);
  return null;
}

const STATUS_FILTERS = ['all', 'pending', 'in-progress', 'resolved'];

export default function MapView() {
  const [selected, setSelected] = useState(new Set());
  const [routeResult, setRouteResult] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');

  const fetchComplaints = useCallback(() => getComplaints(), []);
  const { data: complaints, loading } = usePolling(fetchComplaints, 5000);

  const availableWards = useMemo(() => {
    if (!complaints) return [];
    return [...new Set(complaints.map(c => c.wardNumber).filter(Boolean))].sort((a, b) => a - b);
  }, [complaints]);

  const filtered = useMemo(() => {
    if (!complaints) return [];
    return complaints.filter(c => {
      const sOk = statusFilter === 'all' || c.status === statusFilter;
      const wOk = wardFilter === 'all' || String(c.wardNumber) === wardFilter;
      return sOk && wOk;
    });
  }, [complaints, statusFilter, wardFilter]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setRouteResult(null);
    setRouteError('');
  };

  const selectAll = () => {
    const nonResolved = filtered.filter(c => c.status !== 'resolved');
    setSelected(new Set(nonResolved.map(c => c._id)));
    setRouteResult(null);
  };

  const clearAll = () => { setSelected(new Set()); setRouteResult(null); setRouteError(''); };

  const handleOptimize = async () => {
    if (selected.size < 2) return setRouteError('Select at least 2 complaints to optimize a route.');
    setOptimizing(true);
    setRouteError('');
    setRouteResult(null);
    try {
      const result = await optimizeRoute([...selected]);
      setRouteResult(result);
    } catch (e) {
      setRouteError(e?.response?.data?.message || 'Route optimization failed. Try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const mapCenter = filtered.length > 0
    ? [filtered[0].location.lat, filtered[0].location.lng]
    : [27.7172, 85.3240]; // Kathmandu centre

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.625rem] font-black text-slate-800 leading-tight">Complaint Map</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-slate-500 text-sm">Live map · auto-refreshes every 5s</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(STATUS_COLORS).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2" style={{ background: c.fill, borderColor: c.stroke }} />
              <span className="text-xs font-semibold text-slate-500 capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => { setStatusFilter(f); clearAll(); }}
            className={`px-3.5 py-1.5 rounded-2xl text-sm font-semibold transition-all duration-200 btn-press whitespace-nowrap
              ${statusFilter === f
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'}`}>
            {f === 'all' ? 'All Status' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {availableWards.length > 0 && (
          <select value={wardFilter} onChange={e => { setWardFilter(e.target.value); clearAll(); }}
            className="ml-auto border border-slate-200 rounded-2xl px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white cursor-pointer">
            <option value="all">All Wards</option>
            {availableWards.map(w => <option key={w} value={w}>Ward {w}</option>)}
          </select>
        )}
      </div>

      {/* Main layout: map + sidebar */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* MAP */}
        <div className="flex-1 min-h-[420px] lg:min-h-[560px] rounded-3xl overflow-hidden card-3d relative isolate" style={{ maxHeight: 'calc(100vh - 64px - 2rem)' }}>
          {loading && (
            <div className="absolute inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
              <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
                </svg>
                Loading map...
              </div>
            </div>
          )}
          <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%', minHeight: '420px' }}
            zoomControl={true}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {filtered.map(c => (
              <Marker
                key={c._id}
                position={[c.location.lat, c.location.lng]}
                icon={makeMarkerIcon(c.status, selected.has(c._id))}
                eventHandlers={{ click: () => toggleSelect(c._id) }}
              >
                <Popup className="cleanvoa-popup">
                  <div className="min-w-[200px] space-y-2 p-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-3">{c.description}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    {(c.city || c.wardNumber) && (
                      <div className="flex gap-1.5 flex-wrap">
                        {c.city && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">{c.city}</span>}
                        {c.wardNumber && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-100">Ward {c.wardNumber}</span>}
                      </div>
                    )}
                    <p className="text-xs text-slate-400">{c.location.lat.toFixed(5)}, {c.location.lng.toFixed(5)}</p>
                    <button onClick={() => toggleSelect(c._id)}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all
                        ${selected.has(c._id)
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                      {selected.has(c._id) ? 'Remove from route' : 'Add to route'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
            {routeResult?.geometry && <RouteLayer geometry={routeResult.geometry} />}
            {filtered.length > 0 && !routeResult && <FitBounds complaints={filtered} />}
          </MapContainer>
        </div>

        {/* SIDEBAR */}
        <div className="w-full lg:w-80 flex flex-col gap-3">

          {/* Route controls */}
          <div className="bg-white rounded-3xl card-3d p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-slate-800 text-sm">Route Planner</h2>
              <span className="text-xs text-slate-400 font-medium">{selected.size} selected</span>
            </div>

            <div className="flex gap-2">
              <button onClick={selectAll}
                className="flex-1 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors btn-press">
                Select Pending
              </button>
              <button onClick={clearAll}
                className="flex-1 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors btn-press">
                Clear All
              </button>
            </div>

            <button onClick={handleOptimize} disabled={optimizing || selected.size < 2}
              className="w-full py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 btn-press">
              {optimizing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
                  </svg>
                  Optimizing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Optimize Route
                </span>
              )}
            </button>

            {routeError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-2xl px-3 py-2">{routeError}</p>
            )}

            {/* Route result summary */}
            {routeResult && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 space-y-2">
                <p className="text-xs font-black text-indigo-700 uppercase tracking-wider">Optimized Route</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black text-indigo-700">{routeResult.totalDistance} km</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Distance</p>
                  </div>
                  <div className="bg-white rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black text-indigo-700">{routeResult.totalDuration} min</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Est. Time</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Complaint list */}
          <div className="bg-white rounded-3xl card-3d p-4 flex-1 overflow-hidden flex flex-col">
            <h2 className="font-black text-slate-800 text-sm mb-3">
              Complaints
              <span className="ml-2 text-xs font-semibold text-slate-400">({filtered.length})</span>
            </h2>
            <div className="overflow-y-auto flex-1 space-y-2 pr-1" style={{ maxHeight: '360px' }}>
              {loading && [...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
              {!loading && filtered.map((c, idx) => (
                <div key={c._id}
                  onClick={() => toggleSelect(c._id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-150 border
                    ${selected.has(c._id)
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white'}`}>

                  {/* Order number when route is shown */}
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-black
                    ${selected.has(c._id) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {routeResult
                      ? (routeResult.orderedComplaints.findIndex(r => r._id === c._id) + 1 || '–')
                      : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-snug">{c.description}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {c.wardNumber && <span className="text-[10px] font-bold text-teal-600">Ward {c.wardNumber}</span>}
                      {c.city && <span className="text-[10px] text-slate-400">{c.city}</span>}
                    </div>
                  </div>

                  <StatusBadge status={c.status} size="sm" />
                </div>
              ))}
              {!loading && filtered.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-8">No complaints match filters</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Optimized order strip */}
      {routeResult?.orderedComplaints?.length > 0 && (
        <div className="bg-white rounded-3xl card-3d p-5">
          <h3 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Optimized Visit Order
          </h3>
          <div className="flex flex-wrap gap-2">
            {routeResult.orderedComplaints.map((c, i) => (
              <div key={c._id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-2xl px-3 py-2">
                <span className="w-5 h-5 bg-indigo-600 text-white rounded-lg text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-700 line-clamp-1 max-w-[160px]">{c.description}</p>
                  <p className="text-[10px] text-slate-400">{c.city}{c.wardNumber ? ` · Ward ${c.wardNumber}` : ''}</p>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
