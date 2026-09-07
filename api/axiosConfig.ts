import axios from 'axios';
import { emitPermissionDenied } from '../utils/permissionEvents';
import { PostComment, SinglePostResponse, UserCommentsResponse, ScrapeResult } from '../types';

const rawBase = (import.meta.env.VITE_API_URL || '').trim();
const cleanBase = rawBase.replace(/\/+$/, '');
const baseURL = cleanBase 
  ? (cleanBase.endsWith('/api') ? `${cleanBase}/` : `${cleanBase}/api/`) 
  : '/api/';

const api = axios.create({
  baseURL,
});

// Interceptor: Pega el access token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Manejo de 401 y 403
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

/**
 * Servicios tipados de la API de Scraper
 */
export const scraperApi = {
  // Post Unitario por plataforma
  async scrapeSinglePost(platform: string, paramValue: string): Promise<SinglePostResponse> {
    const p = platform.toLowerCase();
    let url = '';

    switch (p) {
      case 'ig':
        url = `scraper/instagram-post/?post_url=${encodeURIComponent(paramValue)}`;
        break;
      case 'tk':
        url = `scraper/tiktok-post/?videoId=${encodeURIComponent(paramValue)}`;
        break;
      case 'x':
        url = `scraper/x-post/?tweet_id=${encodeURIComponent(paramValue)}`;
        break;
      case 'fb':
        url = `scraper/facebook-post/?post_url=${encodeURIComponent(paramValue)}`;
        break;
      case 'yt':
        url = `scraper/youtube-post/?video_id=${encodeURIComponent(paramValue)}`;
        break;
      default:
        throw new Error(`Plataforma no soportada para post unitario: ${platform}`);
    }

    const { data } = await api.get<SinglePostResponse>(url);
    return data;
  },

  // Comentarios de un post individual
  async getPostComments(postId: string | number): Promise<PostComment[]> {
    const { data } = await api.get<PostComment[]>(`scraper/post-comments/?post_id=${postId}`);
    return Array.isArray(data) ? data : [];
  },

  // Comentarios acumulados de un usuario
  async getUserComments(username: string, platform: string, limit = 1000): Promise<UserCommentsResponse> {
    const { data } = await api.get<UserCommentsResponse>(
      `scraper/user-comments/?username=${encodeURIComponent(username)}&platform=${platform}&limit=${limit}`
    );
    return data;
  },

  // Disparar extracción masiva
  async triggerExtraction(platform: string, targets: string[]): Promise<{ status: string; platform: string; started_at: string }> {
    const { data } = await api.post('scraper/trigger_extraction/', {
      platform: platform.toLowerCase(),
      targets,
    });
    return data;
  },

  // Resultados más recientes
  async getLatestResults(params: { platform?: string; since?: string; limit?: number }): Promise<ScrapeResult[]> {
    const query = new URLSearchParams();
    if (params.platform) query.append('platform', params.platform.toLowerCase());
    if (params.since) query.append('since', params.since);
    if (params.limit) query.append('limit', String(params.limit));

    const { data } = await api.get<ScrapeResult[]>(`scraper/latest_results/?${query.toString()}`);
    return Array.isArray(data) ? data : [];
  },

  // Historial de usuario por regex o nombre
  async getUserHistory(query: string): Promise<ScrapeResult[]> {
    const { data } = await api.get<ScrapeResult[]>(`scraper/user_history/?query=${encodeURIComponent(query)}`);
    return Array.isArray(data) ? data : [];
  }
};

export default api;