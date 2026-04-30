import axios, { AxiosInstance } from 'axios';
import { STORAGE_KEYS } from './storage-keys';
import { clearAuthAndTenantStorageSync } from './clear-tenant-state';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — add token from localStorage/cookie
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight: compartilha a mesma promise entre 401s concorrentes.
// Com rotation, se duas requests disparassem refresh ao mesmo tempo, a segunda
// usaria um refresh_token já revogado pela primeira → 401 e logout forçado.
let refreshPromise: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const refreshToken =
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null;

  if (!refreshToken) {
    throw new Error('no_refresh_token');
  }

  const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  const { access_token, refresh_token: newRefreshToken } = response.data;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
    if (newRefreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    }
  }

  return access_token;
}

// Response interceptor — handle 401 and refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = runRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const access_token = await refreshPromise;

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAuthAndTenantStorageSync();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/login') return;
  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?returnUrl=${returnUrl}`;
}

export default apiClient;
