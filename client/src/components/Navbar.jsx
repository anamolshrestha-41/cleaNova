import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const NavLink = ({ to, children, active }) => (
  <Link
    to={to}
    className={`relative px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 btn-press
      ${active
        ? 'bg-white text-emerald-700 shadow-md shadow-emerald-900/20'
        : 'text-white/90 hover:text-white hover:bg-white/15'
      }`}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdmin = !!localStorage.getItem('adminToken');
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => { localStorage.removeItem('adminToken'); navigate('/'); };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-500"
      style={{ boxShadow: '0 4px 24px -4px rgba(5,150,105,0.5), 0 1px 0 rgba(255,255,255,0.1)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-900/25 group-hover:scale-105 transition-transform duration-200">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v5M14 11v5" />
              </svg>
            </div>
            <div>
              <span className="text-white text-lg font-black tracking-tight leading-none block">CleaNova</span>
              <span className="text-emerald-200 text-[10px] font-medium leading-none">Clean · New Beginning</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/" active={pathname === '/'}>Dashboard</NavLink>
            <NavLink to="/map" active={pathname === '/map'}>Map</NavLink>
            {!isAdmin && <NavLink to="/submit" active={pathname === '/submit'}>Report Issue</NavLink>}
            {isAdmin ? (
              <>
                <NavLink to="/admin" active={pathname === '/admin'}>Admin Panel</NavLink>
                <button onClick={logout}
                  className="ml-1 px-4 py-2 rounded-2xl text-sm font-semibold bg-white/15 text-white hover:bg-red-500 transition-all duration-200 btn-press">
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/admin/login" active={pathname === '/admin/login'}>Admin</NavLink>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(o => !o)}
            className="sm:hidden p-2 rounded-xl text-white hover:bg-white/15 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-3 flex flex-col gap-1">
            <NavLink to="/" active={pathname === '/'}>Dashboard</NavLink>
            <NavLink to="/map" active={pathname === '/map'}>Map</NavLink>
            {!isAdmin && <NavLink to="/submit" active={pathname === '/submit'}>Report Issue</NavLink>}
            {isAdmin ? (
              <>
                <NavLink to="/admin" active={pathname === '/admin'}>Admin Panel</NavLink>
                <button onClick={logout}
                  className="px-4 py-2 rounded-2xl text-sm font-semibold text-white hover:bg-red-500 transition-all text-left">
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/admin/login" active={pathname === '/admin/login'}>Admin</NavLink>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
