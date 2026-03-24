import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createComplaint, upvoteComplaint } from '../services/complaints';

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">
      {label} {required && <span className="text-emerald-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-white placeholder:text-slate-400";

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [form, setForm] = useState({ description: '', userName: '', isAnonymous: false, city: 'Kathmandu', wardNumber: '' });
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [duplicate, setDuplicate] = useState(null); // { _id, description, upvotes }
  const [upvoted, setUpvoted] = useState(false);

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
      () => { setError('Location access denied. Please enable location.'); setLocLoading(false); }
    );
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) return setError('Please capture your location first.');
    if (!form.description.trim()) return setError('Description is required.');
    setSubmitting(true);
    setError('');
    setDuplicate(null);
    try {
      const fd = new FormData();
      fd.append('description', form.description);
      fd.append('lat', location.lat);
      fd.append('lng', location.lng);
      fd.append('city', form.city);
      fd.append('wardNumber', form.wardNumber);
      fd.append('userName', form.isAnonymous ? '' : form.userName);
      fd.append('isAnonymous', form.isAnonymous);
      if (file) fd.append('image', file);
      await createComplaint(fd);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2200);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.code === 'DUPLICATE') {
        setDuplicate(data.existing);
      } else if (data?.code === 'RATE_LIMITED') {
        setError(data.message);
      } else if (data?.code === 'INVALID_IMAGE') {
        setError(data.message);
      } else {
        setError(data?.message || 'Failed to submit. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl shadow-emerald-200">
          <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-800">Complaint Submitted!</h2>
        <p className="text-slate-500 mt-2 text-sm">Thank you for helping keep your community clean.</p>
        <p className="text-slate-400 text-xs mt-1">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-7">
        <h1 className="text-[1.625rem] font-black text-slate-800 leading-tight">Report a Waste Issue</h1>
        <p className="text-slate-500 text-sm mt-1">Help keep your community clean — every report matters.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl card-3d p-6 sm:p-7 space-y-5">

        {/* Image Upload */}
        <Field label="Photo">
          <div onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-200 overflow-hidden">
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-52 object-cover" />
            ) : (
              <div className="py-8 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm font-semibold">Click to upload a photo</p>
                <p className="text-slate-400 text-xs mt-0.5">JPG, PNG or WebP · max 5MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </Field>

        {/* Description */}
        <Field label="Description" required>
          <textarea rows={4} value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Describe the waste issue — location details, severity, how long it's been there..."
            className={`${inputCls} resize-none`} />
        </Field>

        {/* Location */}
        <Field label="GPS Location" required>
          {location ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-emerald-700 text-sm font-bold">Location captured</p>
                <p className="text-emerald-600 text-xs">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
              </div>
              <button type="button" onClick={getLocation} className="text-xs text-emerald-600 font-semibold underline underline-offset-2 flex-shrink-0">
                Refresh
              </button>
            </div>
          ) : (
            <button type="button" onClick={getLocation} disabled={locLoading}
              className="w-full border-2 border-dashed border-slate-200 rounded-2xl py-4 text-sm font-semibold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all duration-200 disabled:opacity-50 btn-press">
              {locLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
                  </svg>
                  Getting your location...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Capture My Location
                </span>
              )}
            </button>
          )}
        </Field>

        {/* City (locked) + Ward */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <input type="text" value={form.city} readOnly
              className={`${inputCls} bg-slate-50 text-slate-500 cursor-not-allowed`} />
          </Field>
          <Field label="Ward Number">
            <select value={form.wardNumber}
              onChange={e => setForm(p => ({ ...p, wardNumber: e.target.value }))}
              className={inputCls}>
              <option value="">Select ward</option>
              {Array.from({ length: 32 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>Ward {n}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Name / Anonymous */}
        <Field label="Your Name">
          <input type="text" value={form.userName}
            onChange={e => setForm(p => ({ ...p, userName: e.target.value }))}
            disabled={form.isAnonymous}
            placeholder="Enter your name (optional)"
            className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`} />
          <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer group">
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all
              ${form.isAnonymous ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-emerald-400'}`}>
              {form.isAnonymous && (
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input type="checkbox" checked={form.isAnonymous}
              onChange={e => setForm(p => ({ ...p, isAnonymous: e.target.checked }))}
              className="sr-only" />
            <span className="text-sm text-slate-600 font-medium">Submit anonymously</span>
          </label>
        </Field>

        {/* Duplicate warning */}
        {duplicate && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">This issue is already reported nearby</p>
                <p className="text-xs text-amber-700 mt-0.5 line-clamp-2">{duplicate.description}</p>
              </div>
            </div>
            {upvoted ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-bold text-emerald-700">Thanks! Your support was recorded.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await upvoteComplaint(duplicate._id);
                  setDuplicate(d => ({ ...d, upvotes: d.upvotes + 1 }));
                  setUpvoted(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-all btn-press text-sm">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                Upvote existing complaint ({duplicate.upvotes + (upvoted ? 1 : 0)} support)
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-200 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 btn-press text-base">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M12 2a10 10 0 0110 10" />
              </svg>
              Submitting...
            </span>
          ) : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
}
