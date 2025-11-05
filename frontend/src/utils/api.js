import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const signup = (userData) => api.post('/auth/signup', userData);
export const login = (userData) => api.post('/auth/login', userData);

// Event APIs
export const getEvents = () => api.get('/events');
export const createEvent = (eventData) => api.post('/events', eventData);
export const updateEvent = (id, eventData) => api.put(`/events/${id}`, eventData);
export const updateEventStatus = (id, status) => api.patch(`/events/${id}/status`, { status });
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Swap APIs
export const getSwappableSlots = () => api.get('/swaps/swappable-slots');
export const createSwapRequest = (mySlotId, theirSlotId) => 
  api.post('/swaps/swap-request', { mySlotId, theirSlotId });
export const respondToSwap = (requestId, accept) => 
  api.post(`/swaps/swap-response/${requestId}`, { accept });
export const getMyRequests = () => api.get('/swaps/my-requests');

export default api;
