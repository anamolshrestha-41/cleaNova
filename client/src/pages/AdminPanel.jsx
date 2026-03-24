import React, { useCallback, useState } from 'react';
import { getComplaints, updateStatus, moderateComplaint, getFlagged } from '../services/complaints';
import { usePolling } from '../hooks/usePolling';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['pending', 'in-progress', 'resolved'];

const statusColors = {
  pending:      'border-l-amber-400',
  'in-progress':'border-l-blue-400',
  resolved:     'border-l-emerald-400',
};

export default function AdminPanel() {
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'flagged'
  const [moderating, setModerating] = useState(null);

  const fetchComplaints = useCallback(() => getComplaints(), []);
  const fetchFlagged = useCallback(() => getFlagged(), []);
  const { data: complaints, loading, refetch } = usePolling(fetchComplaints, 4000);
  const { data: flagged, loading: flagLoading, refetch: refetchFlagged } = usePolling(fetchFlagged, 6000);

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try { await updateStatus(id, status); refetch(); }
    catch { alert('Failed to update status.'); }
    finally { setUpdating(null); }
  };

  const handleModerate = async (id, moderationStatus) => {
    setModerating(id);
    try { await moderateComplaint(id, moderationStatus); refetchFlagged(); refetch(); }
    catch { alert('Failed to moderate.'); }
    finally { setModerating(null); }
  };

  const filtered = complaints
    ? complaints.filter(c =>
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        (c.city || '').toLowerCase().includes(search.toLowerCase()) ||
        String(c.wardNumber || '').includes(search)
      )
    : [];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.625rem] font-black text-slate-800 leading-tight">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Review and update complaint statuses</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
            <button onClick={() => setTab('all')}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                tab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>All Complaints</button>
            <button onClick={() => setTab('flagged')}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                tab === 'flagged' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              Flagged
              {flagged?.length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {flagged.length}
                </span>
              )}
            </button>
          </div>
          {/* Search — only on all tab */}
          {tab === 'all' && complaints && (
            <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 border border-slate-200 card-3d">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search description, city, ward..."
                className="text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none w-44 sm:w-56 bg-transparent" />
            </div>
          )}
        </div>
      </div>

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

      {/* ── FLAGGED TAB ── */}
      {tab === 'flagged' && (
        <div className="space-y-3">
          {flagLoading && [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl h-24 animate-pulse card-3d" />
          ))}
          {!flagLoading && (!flagged || flagged.length === 0) && (
            <div className="text-center py-20 bg-white rounded-3xl card-3d">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-emerald-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-500 font-semibold">No flagged complaints</p>
              <p className="text-slate-400 text-sm mt-1">Everything looks clean</p>
            </div>
          )}
          {!flagLoading && flagged?.map(c => (
            <div key={c._id}
              className="bg-white rounded-3xl card-3d border-l-4 border-l-red-400 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {c.image
                ? <img src={c.image} alt="" className="w-full sm:w-20 h-20 object-cover rounded-2xl flex-shrink-0" />
                : <div className="w-20 h-20 bg-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  </div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 font-medium line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {c.city && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg">{c.city}</span>}
                  {c.wardNumber && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-100">Ward {c.wardNumber}</span>}
                  <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200">Pending Review</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <button disabled={moderating === c._id}
                  onClick={() => handleModerate(c._id, 'approved')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50 btn-press">
                  Approve
                </button>
                <button disabled={moderating === c._id}
                  onClick={() => handleModerate(c._id, 'rejected')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 btn-press">
                  Reject
                </button>
                <button disabled={moderating === c._id}
                  onClick={() => handleModerate(c._id, 'spam')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50 btn-press">
                  Spam
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ALL COMPLAINTS TAB ── */}
      {tab === 'all' && (
        <>
      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl h-24 animate-pulse card-3d" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl card-3d">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-500 font-semibold">No complaints found</p>
          {search && <p className="text-slate-400 text-sm mt-1">Try a different search term</p>}
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c._id}
              className={`bg-white rounded-3xl card-3d border-l-4 ${statusColors[c.status] || 'border-l-slate-200'} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200 hover:shadow-md`}>

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
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm text-slate-700 font-medium line-clamp-2 leading-relaxed">{c.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {c.city && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {c.city}
                    </span>
                  )}
                  {c.wardNumber && (
                    <span className="px-2.5 py-1 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
                      Ward {c.wardNumber}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {c.isAnonymous ? 'Anonymous' : c.userName || 'Unknown'}
                  </span>
                  <span className="text-slate-300 text-xs">·</span>
                  <span className="text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <StatusBadge status={c.status} />
                  {c.upvotes > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100">
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                      {c.upvotes}
                    </span>
                  )}
                </div>
              </div>

              {/* Status selector */}
              <div className="flex-shrink-0">
                <select value={c.status} disabled={updating === c._id}
                  onChange={e => handleStatusChange(c._id, e.target.value)}
                  className="border border-slate-200 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white cursor-pointer disabled:opacity-50 hover:border-emerald-300 transition-colors min-w-[130px]">
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
