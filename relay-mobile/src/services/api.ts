import axios, { type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { navigateToLogin } from '@/navigation/navigationRef';
import { useAuthStore } from '@/store/authStore';
import { useTeamStore } from '@/store/teamStore';
import { useUiStore } from '@/store/uiStore';
import { apiBaseUrl } from './env';

const REFRESH_KEY = 'relay_refresh_token';
const USER_ID_KEY = 'relay_user_id';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});
console.log('[API] baseURL', api.defaults.baseURL);

export async function testConnection(): Promise<void> {
  try {
    const res = await api.get('/health');
    console.log('[API] /health ok', res.status, api.defaults.baseURL);
  } catch (e) {
    console.log('[API] /health failed', api.defaults.baseURL, e);
  }
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (!useUiStore.getState().isOffline) {
    useUiStore.getState().setLastSyncedAt(Date.now());
  }
  return response;
});

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(REFRESH_KEY);
  const userId = await SecureStore.getItemAsync(USER_ID_KEY);
  if (!raw || !userId) {
    return null;
  }
  const res = await axios.post<{ accessToken: string }>(
    `${apiBaseUrl}/auth/refresh`,
    { refreshToken: raw },
    { timeout: 15000 },
  );
  const accessToken = res.data.accessToken;
  useAuthStore.getState().setAuth(userId, accessToken);
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
        useTeamStore.getState().clearTeamContext();
        await clearAuthSession();
        navigateToLogin();
        return Promise.reject(error);
      }
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch {
      useAuthStore.getState().clearAuth();
      useTeamStore.getState().clearTeamContext();
      await clearAuthSession();
      navigateToLogin();
      return Promise.reject(error);
    }
  },
);

export async function saveAuthSession(refreshToken: string, userId: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  await SecureStore.setItemAsync(USER_ID_KEY, userId);
}

export async function clearAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
}

/** Attempt refresh using stored credentials; sets auth store on success. */
export async function restoreSessionFromRefresh(): Promise<boolean> {
  try {
    const token = await performRefresh();
    return token !== null;
  } catch {
    await clearAuthSession();
    useAuthStore.getState().clearAuth();
    return false;
  }
}
