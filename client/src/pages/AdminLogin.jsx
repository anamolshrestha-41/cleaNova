import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/complaints';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [role, setRole] = useState('admin'); // 'admin' | 'ward'
  const [form, setForm] = useState({ email: '', password: '' });
  const [wardNum, setWardNum] = useState('1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Auto-fill email when ward number changes
  const handleWardNum = (val) => {
    setWardNum(val);
    setForm(p => ({ ...p, email: `ward${val}@cleanvoa.com` }));
  };

  // Reset email when switching roles
  const switchRole = (r) => {
    setRole(r);
    setError('');
    setForm({ email: r === 'admin' ? '' : `ward${wardNum}@cleanvoa.com`, password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await adminLogin(form.email, form.password);
      localStorage.setItem('adminToken', data.token);
      navigate(data.role === 'ward' ? '/ward' : '/admin');
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 bg-gradient-to-br ${role === 'ward' ? 'from-teal-500 to-cyan-500' : 'from-emerald-500 to-teal-500'} rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-xl shadow-emerald-200`}>
            {role === 'ward' ? (
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
          </div>
          <h1 className="text-[1.625rem] font-black text-slate-800">
            {role === 'ward' ? 'Ward Officer Login' : 'Admin Login'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">CleaNova Management Portal</p>

          {/* Role toggle */}
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-1 mt-5 w-fit mx-auto">
            <button type="button" onClick={() => switchRole('admin')}
              className={`px-5 py-1.5 rounded-xl text-sm font-bold transition-all ${
                role === 'admin' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>Admin</button>
            <button type="button" onClick={() => switchRole('ward')}
              className={`px-5 py-1.5 rounded-xl text-sm font-bold transition-all ${
                role === 'ward' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>Ward Officer</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl card-3d p-7 space-y-4">

          {/* Ward number picker — only in ward mode */}
          {role === 'ward' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ward Number</label>
              <select value={wardNum} onChange={e => handleWardNum(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all bg-white">
                {Array.from({ length: 32 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>Ward {n}</option>
                ))}
              </select>
            </div>
          )}

          {/* Email — hidden in ward mode (auto-filled) */}
          {role === 'admin' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@cleanvoa.com" required
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all placeholder:text-slate-400" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" required
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all placeholder:text-slate-400" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                {showPw ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
              <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-200 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 btn-press text-base mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>

          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3 mt-1">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {role === 'admin' ? (
              <p className="text-xs text-slate-500">
                Demo: <span className="font-semibold text-slate-700">admin@cleanvoa.com</span> / <span className="font-semibold text-slate-700">ChangeMe123!</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Select your ward and enter password: <span className="font-semibold text-slate-700">ward123</span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
