import axios, { type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { navigateToLogin } from '@/navigation/navigationRef';
import { useAuthStore } from '@/store/authStore';
import { apiBaseUrl } from './env';

const REFRESH_KEY = 'relay_refresh_token';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!raw) {
    return null;
  }
  const res = await axios.post<{ accessToken: string }>(
    `${apiBaseUrl}/auth/refresh`,
    { refreshToken: raw },
    { timeout: 15000 },
  );
  const accessToken = res.data.accessToken;
  const { userId } = useAuthStore.getState();
  if (userId) {
    useAuthStore.getState().setAuth(userId, accessToken);
  }
  return accessToken;
}

api.interceptors.response.use(
  (r) => r,
  async (error: unknown) => {
    const err = error as { config?: InternalAxiosRequestConfig; response?: { status?: number } };
    const original = err.config;
    const status = err.response?.status;
    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    const url = original.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccess = await refreshPromise;
      if (!newAccess) {
        useAuthStore.getState().clearAuth();
        await SecureStore.deleteItemAsync(REFRESH_KEY);
        navigateToLogin();
        return Promise.reject(error);
      }
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch {
      useAuthStore.getState().clearAuth();
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      navigateToLogin();
      return Promise.reject(error);
    }
  },
);

export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
