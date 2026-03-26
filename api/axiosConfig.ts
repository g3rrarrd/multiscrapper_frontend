import axios from 'axios';
import { emitPermissionDenied } from '../utils/permissionEvents';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/`,
});

// Interceptor: Antes de cada petición, pega el token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Si el backend responde 401 (Token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorText = error.response?.data?.error;

    if (status === 403 || errorText === 'No tienes permiso') {
      emitPermissionDenied('No tienes permisos para realizar esta acción o ver este contenido.');
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_profile');
      globalThis.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;