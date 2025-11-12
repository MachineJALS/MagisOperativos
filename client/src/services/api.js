// client/src/services/api.js - VERSIÓN ACTUALIZADA
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


export const mediaAPI = {
  // Conversión de archivos
  convertFile: (fileId, targetFormat, quality, uploadToCloud = false) => 
    api.post(`/api/media/convert/${fileId}`, { 
      targetFormat, 
      quality,
      uploadToCloud 
    }),
  
  // Formatos soportados
  getSupportedFormats: (fileType = '') => 
    api.get(`/api/media/supported-formats${fileType ? `?fileType=${fileType}` : ''}`),
  
  // Información de archivo
  getMediaInfo: (fileId) => api.get(`/api/media/info/${fileId}`)
};

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
  testStorage: () => api.get('/api/files/test-storage'),
  getAllUserFiles: (filters = {}) => api.get('/api/files/all', { params: filters }),
  downloadToLocal: (fileId) => api.post(`/api/files/${fileId}/download-to-local`),
  uploadToCloud: (fileId) => api.post(`/api/files/${fileId}/upload-to-cloud`),
  
  // NUEVOS MÉTODOS PARA URLs FIRMADAS
  getSignedUrl: (fileId) => api.get(`/api/files/signed-url/${fileId}`),
  getDownloadUrl: (fileId) => api.get(`/api/files/download-url/${fileId}`),
  
  // Sincronización S3
  syncS3: () => api.post('/api/files/sync-s3')
};

// En client/src/services/api.js - CORREGIR systemAPI:
export const systemAPI = {
  // ✅ CORREGIDO: Usar la ruta correcta
  getNodes: () => api.get('/api/nodes/stats'),
  registerNode: (nodeData) => api.post('/api/nodes/register', nodeData),
  updateNodeStats: (nodeId, stats) => api.post(`/api/nodes/${nodeId}/stats`, stats),
  distributeTask: (taskData) => api.post('/api/nodes/distribute-task', taskData),
  
  // ✅ NUEVO: Para obtener estadísticas del sistema
  getSystemStats: () => api.get('/api/nodes/stats')
};

export default api;