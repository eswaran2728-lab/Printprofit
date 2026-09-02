import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data),
  loginUrl: `${API_BASE}/auth/google`,
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const materialsApi = {
  list: () => api.get('/materials').then((r) => r.data),
  create: (data) => api.post('/materials', data).then((r) => r.data),
  update: (id, data) => api.put(`/materials/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/materials/${id}`).then((r) => r.data),
};

export const hardwareApi = {
  list: () => api.get('/hardware').then((r) => r.data),
  create: (data) => api.post('/hardware', data).then((r) => r.data),
  update: (id, data) => api.put(`/hardware/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/hardware/${id}`).then((r) => r.data),
};

export const printersApi = {
  list: () => api.get('/printers').then((r) => r.data),
  create: (data) => api.post('/printers', data).then((r) => r.data),
  update: (id, data) => api.put(`/printers/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/printers/${id}`).then((r) => r.data),
};

export const laborApi = {
  list: () => api.get('/labor').then((r) => r.data),
  create: (data) => api.post('/labor', data).then((r) => r.data),
  update: (id, data) => api.put(`/labor/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/labor/${id}`).then((r) => r.data),
};

export const productsApi = {
  list: () => api.get('/products').then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (data) => api.post('/products', data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
  price: (id, data) => api.post(`/products/${id}/price`, data).then((r) => r.data),
};

export const salesApi = {
  list: () => api.get('/sales').then((r) => r.data),
  create: (data) => api.post('/sales', data).then((r) => r.data),
  remove: (id) => api.delete(`/sales/${id}`).then((r) => r.data),
  syncSummary: () => api.post('/sales/sync-summary').then((r) => r.data),
  extract: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/sales/extract', form).then((r) => r.data);
  },
};

export const dashboardApi = {
  get: () => api.get('/dashboard').then((r) => r.data),
};

export const syncApi = {
  status: () => api.get('/sync/status').then((r) => r.data),
};
