import { create } from 'zustand';

interface AuthState {
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (userId: string, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (userId, accessToken) =>
    set({ userId, accessToken, isAuthenticated: true }),
  clearAuth: () =>
    set({ userId: null, accessToken: null, isAuthenticated: false }),
}));
