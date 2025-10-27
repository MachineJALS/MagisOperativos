import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },
  verifyToken: () => api.get('/auth/verify'),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout')
};

export const filesAPI = {
  upload: (formData) => api.post('/api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyFiles: (type = '') => api.get(`/api/files/my-files${type ? `?type=${type}` : ''}`),
  getFileInfo: (fileId) => api.get(`/api/files/info/${fileId}`),
  testStorage: () => api.get('/api/files/test-storage')
};

export const systemAPI = {
  getHealth: () => api.get('/health'),
  getNodes: () => api.get('/api/nodes'),
  getStats: () => api.get('/api/stats')
};

export default api;