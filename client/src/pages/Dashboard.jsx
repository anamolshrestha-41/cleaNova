import React, { useCallback, useState, useMemo } from 'react';
import { getComplaints, getStats } from '../services/complaints';
import { usePolling } from '../hooks/usePolling';
import ComplaintCard from '../components/ComplaintCard';
import StatsCards from '../components/StatsCards';
import QuotesBanner from '../components/QuotesBanner';
import { Link } from 'react-router-dom';

const STATUS_FILTERS = ['all', 'pending', 'in-progress', 'resolved'];

const FilterPill = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 btn-press whitespace-nowrap
      ${active
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
        : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
      }`}>
    {children}
  </button>
);

export default function Dashboard() {
  const isAdmin = !!localStorage.getItem('adminToken');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');

  const fetchComplaints = useCallback(() => getComplaints(), []);
  const fetchStats = useCallback(() => getStats(), []);

  const { data: complaints, loading } = usePolling(fetchComplaints, 8000);
  const { data: stats } = usePolling(fetchStats, 10000);

  const availableWards = useMemo(() => {
    if (!complaints) return [];
    return [...new Set(complaints.map(c => c.wardNumber).filter(Boolean))].sort((a, b) => a - b);
  }, [complaints]);

  const filtered = useMemo(() => {
    if (!complaints) return [];
    return complaints.filter(c => {
      const statusOk = statusFilter === 'all' || c.status === statusFilter;
      const wardOk = wardFilter === 'all' || String(c.wardNumber) === wardFilter;
      return statusOk && wardOk;
    });
  }, [complaints, statusFilter, wardFilter]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.625rem] font-black text-slate-800 leading-tight">Complaint Dashboard</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-slate-500 text-sm">Live · Kathmandu Metropolitan City</p>
          </div>
        </div>
        {!isAdmin && (
          <Link to="/submit"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-200 transition-all duration-200 hover:-translate-y-0.5 btn-press self-start sm:self-auto">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Report an Issue
          </Link>
        )}
      </div>

      {/* Quotes banner */}
      <QuotesBanner />

      {/* Stats */}
      {stats && <StatsCards stats={stats} />}

      {/* Ward chips */}
      {stats?.wardStats?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Complaints by Ward</p>
          <div className="flex gap-2 flex-wrap">
            {stats.wardStats.map(w => (
              <button key={w._id}
                onClick={() => setWardFilter(wardFilter === String(w._id) ? 'all' : String(w._id))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all duration-200 btn-press
                  ${wardFilter === String(w._id)
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-200'
                    : 'bg-white text-teal-700 border-teal-200 hover:border-teal-400 hover:bg-teal-50'
                  }`}>
                Ward {w._id}
                <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black
                  ${wardFilter === String(w._id) ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-700'}`}>
                  {w.total}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {STATUS_FILTERS.map(f => (
          <FilterPill key={f} active={statusFilter === f} onClick={() => setStatusFilter(f)}>
            {f === 'all' ? 'All Status' : f.charAt(0).toUpperCase() + f.slice(1)}
          </FilterPill>
        ))}
        {availableWards.length > 0 && (
          <select value={wardFilter} onChange={e => setWardFilter(e.target.value)}
            className="ml-auto border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white cursor-pointer hover:border-teal-300 transition-colors">
            <option value="all">All Wards</option>
            {availableWards.map(w => <option key={w} value={w}>Ward {w}</option>)}
          </select>
        )}
      </div>

      {/* Results count */}
      {!loading && complaints && (
        <p className="text-sm text-slate-400 font-medium -mt-2">
          Showing <span className="text-slate-600 font-bold">{filtered.length}</span> complaint{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden card-3d">
              <div className="h-44 bg-slate-100 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-100 rounded-full animate-pulse w-3/4" />
                <div className="h-3 bg-slate-100 rounded-full animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-white rounded-3xl card-3d mx-auto mb-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </div>
          <p className="text-slate-600 font-bold text-lg">No complaints found</p>
          <p className="text-slate-400 text-sm mt-1">Try changing your filters or be the first to report</p>
          {!isAdmin && (
            <Link to="/submit"
              className="inline-flex items-center gap-2 mt-5 bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-200 hover:-translate-y-0.5 transition-all">
              Report an Issue
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map(c => <ComplaintCard key={c._id} complaint={c} />)}
        </div>
      )}
    </div>
  );
}
