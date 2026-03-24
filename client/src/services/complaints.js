import api from './api';

export const getComplaints = (page = 1, limit = 50) =>
  api.get('/api/complaints', { params: { page, limit } }).then(r => r.data.complaints ?? r.data);
export const createComplaint = (formData) => api.post('/api/complaints', formData).then(r => r.data);
export const updateStatus = (id, status) => api.patch(`/api/complaints/${id}`, { status }).then(r => r.data);
export const getStats = () => api.get('/api/stats').then(r => r.data);
export const adminLogin = (email, password) => api.post('/api/auth/login', { email, password }).then(r => r.data);
export const optimizeRoute = (ids) => api.post('/api/route/optimize', { ids }).then(r => r.data);
export const upvoteComplaint = (id) => api.post(`/api/complaints/${id}/upvote`).then(r => r.data);
export const moderateComplaint = (id, moderationStatus) => api.patch(`/api/complaints/${id}/moderate`, { moderationStatus }).then(r => r.data);
export const getFlagged = () => api.get('/api/complaints/flagged').then(r => r.data);
