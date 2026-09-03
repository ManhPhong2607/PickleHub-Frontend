import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5105';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token if available
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('picklehub_token');
      if (!token) {
        token = useAuthStore.getState().token;
        if (token) {
          localStorage.setItem('picklehub_token', token);
        }
      }

      if (token && config.headers) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401 Unauthorized & Errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Smart Fallback Fetcher helper to prevent broken UI when services start up
export async function fetchWithFallback<T>(
  apiCall: () => Promise<T>,
  fallbackData: T
): Promise<T> {
  try {
    return await apiCall();
  } catch (err) {
    console.warn('[PickleHub API] Backend offline/starting up. Serving fallback data.', err);
    return fallbackData;
  }
}
