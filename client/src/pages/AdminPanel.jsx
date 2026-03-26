import React, { useCallback, useState, useMemo } from 'react';
import { getComplaints, updateStatus, moderateComplaint, getFlagged } from '../services/complaints';
import { usePolling } from '../hooks/usePolling';
import StatusBadge from '../components/StatusBadge';

const statusColors = {
  pending: 'border-l-amber-400',
  'in-progress': 'border-l-blue-400',
  resolved: 'border-l-emerald-400',
};

const STATUSES = ['pending', 'in-progress', 'resolved'];

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl text-sm font-bold shadow-xl flex items-center gap-2 transition-all
      ${type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
      {type === 'error'
        ? <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        : <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      }
      {msg}
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('wards');
  const [wardFilter, setWardFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [moderating, setModerating] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const fetchComplaints = useCallback(() => getComplaints(), []);
  const fetchFlagged = useCallback(() => getFlagged(), []);
  const { data: complaints, loading, refetch } = usePolling(fetchComplaints, 6000);
  const { data: flagged, loading: flagLoading, refetch: refetchFlagged } = usePolling(fetchFlagged, 8000);

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await updateStatus(id, status);
      refetch();
      showToast(status === 'resolved' ? 'Marked as resolved ✓' : 'Status updated');
    } catch {
      showToast('Failed to update status', 'error');
    } finally { setUpdating(null); }
  };

  const handleModerate = async (id, moderationStatus) => {
    setModerating(id);
    try {
      await moderateComplaint(id, moderationStatus);
      refetchFlagged();
      refetch();
      showToast('Moderation applied');
    } catch {
      showToast('Failed to moderate', 'error');
    } finally { setModerating(null); }
  };

  const wards = useMemo(() => {
    if (!complaints) return [];
    return [...new Set(complaints.map(c => c.wardNumber).filter(Boolean))].sort((a, b) => a - b);
  }, [complaints]);

  const grouped = useMemo(() => {
    if (!complaints) return {};
    const list = complaints.filter(c => {
      const matchSearch = !search ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchWard = wardFilter === 'all' || String(c.wardNumber) === wardFilter;
      return matchSearch && matchWard;
    });
    return list.reduce((acc, c) => {
      const key = c.wardNumber || 'Unassigned';
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {});
  }, [complaints, search, wardFilter]);

  const wardKeys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-6">
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.625rem] font-black text-slate-800 leading-tight">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Kathmandu · All 32 Wards</p>
        </div>
        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
          <button onClick={() => setTab('wards')}
            className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'wards' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>By Ward</button>
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
      </div>

      {/* ── BY WARD TAB ── */}
      {tab === 'wards' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 border border-slate-200 card-3d">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search complaints..."
                className="text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none w-44 bg-transparent" />
            </div>
            <select value={wardFilter} onChange={e => setWardFilter(e.target.value)}
              className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white hover:border-emerald-300 transition-colors">
              <option value="all">All Wards</option>
              {wards.map(w => <option key={w} value={w}>Ward {w}</option>)}
            </select>
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

          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl h-32 animate-pulse card-3d" />
              ))}
            </div>
          )}

          {!loading && wardKeys.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl card-3d">
              <p className="text-slate-500 font-semibold">No complaints found</p>
            </div>
          )}

          {!loading && wardKeys.map(ward => {
            const items = grouped[ward];
            const pending = items.filter(c => c.status === 'pending').length;
            const inProgress = items.filter(c => c.status === 'in-progress').length;
            const resolved = items.filter(c => c.status === 'resolved').length;

            return (
              <div key={ward} className="bg-white rounded-3xl card-3d overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white text-sm font-black flex items-center justify-center">{ward}</div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">Ward {ward}</p>
                      <p className="text-xs text-slate-400">{items.length} complaint{items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {pending > 0 && <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">{pending} pending</span>}
                    {inProgress > 0 && <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">{inProgress} in progress</span>}
                    {resolved > 0 && <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">{resolved} resolved</span>}
                  </div>
                </div>

                <div className="divide-y divide-slate-50">
                  {items.map(c => (
                    <div key={c._id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 border-l-4 ${statusColors[c.status] || 'border-l-slate-200'}`}>
                      {c.image
                        ? <img src={c.image} alt="" className="w-full sm:w-16 h-16 object-cover rounded-xl flex-shrink-0" loading="lazy" />
                        : <div className="w-16 h-16 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                            </svg>
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium line-clamp-2">{c.description}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-slate-400">{c.isAnonymous ? 'Anonymous' : c.userName || 'Unknown'}</span>
                          <span className="text-slate-300 text-xs">·</span>
                          <span className="text-xs text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <StatusBadge status={c.status} />
                          {c.count > 1 && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200">×{c.count} reports</span>}
                          {c.upvotes > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100">▲ {c.upvotes}</span>}
                          {c.status === 'resolved' && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-lg border border-emerald-200">
                              Auto-deletes in ~10 min
                            </span>
                          )}
                        </div>
                      </div>
                      <select value={c.status} disabled={updating === c._id}
                        onChange={e => handleStatusChange(c._id, e.target.value)}
                        className="border border-slate-200 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white cursor-pointer disabled:opacity-50 hover:border-emerald-300 transition-colors min-w-[130px] flex-shrink-0">
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
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
                ? <img src={c.image} alt="" className="w-full sm:w-20 h-20 object-cover rounded-2xl flex-shrink-0" loading="lazy" />
                : <div className="w-20 h-20 bg-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                  </div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 font-medium line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {c.wardNumber && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-100">Ward {c.wardNumber}</span>}
                  <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200">Pending Review</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <button disabled={moderating === c._id} onClick={() => handleModerate(c._id, 'approved')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50 btn-press">
                  Approve
                </button>
                <button disabled={moderating === c._id} onClick={() => handleModerate(c._id, 'rejected')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 btn-press">
                  Reject
                </button>
                <button disabled={moderating === c._id} onClick={() => handleModerate(c._id, 'spam')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50 btn-press">
                  Spam
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
