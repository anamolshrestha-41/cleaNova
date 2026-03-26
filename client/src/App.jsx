import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import WardPanel from './pages/WardPanel';
import MapView from './pages/MapView';
import Transparency from './pages/Transparency';

const getRole = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])).role; } catch { return null; }
};

const PrivateRoute = ({ children, role }) => {
  const userRole = getRole();
  if (!userRole) return <Navigate to="/admin/login" />;
  if (role && userRole !== role) return <Navigate to="/" />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/submit" element={<SubmitComplaint />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/transparency" element={<Transparency />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminPanel /></PrivateRoute>} />
          <Route path="/ward" element={<PrivateRoute role="ward"><WardPanel /></PrivateRoute>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
