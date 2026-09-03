import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Base API Gateway endpoint
export const GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:5105';

export const apiClient = axios.create({
  baseURL: GATEWAY_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach Bearer JWT Token on every request
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('picklehub_token');
      
      // Fallback: Lấy token từ Zustand Auth Store nếu localStorage bị xóa mất
      if (!token) {
        token = useAuthStore.getState().token;
        if (token) {
          localStorage.setItem('picklehub_token', token);
        }
      }

      if (token) {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else if (config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      // Session ID for anonymous cart tracking
      let sessionId = localStorage.getItem('picklehub_session');
      if (!sessionId) {
        sessionId = `sess_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('picklehub_session', sessionId);
      }
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('X-Session-Id', sessionId);
      } else if (config.headers) {
        config.headers['X-Session-Id'] = sessionId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 → Xóa trạng thái đăng nhập đồng bộ trên giao diện
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

/**
 * Utility: Try calling the API, fall back to local data if the service is unreachable.
 */
export async function fetchWithFallback<T>(apiCall: () => Promise<T>, fallbackData: T): Promise<T> {
  try {
    return await apiCall();
  } catch (err) {
    console.warn('[PickleHub] Service offline or error. Using fallback data.', err);
    return fallbackData;
  }
}
