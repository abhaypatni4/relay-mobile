import { create } from 'zustand';

export type ToastVariant = 'success' | 'error';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface UiState {
  isOffline: boolean;
  /** UTC ms of last successful API response while online (for offline banner). */
  lastSyncedAt: number | null;
  toastQueue: ToastItem[];
  pendingTransferRequest: string | null;
  setOffline: (v: boolean) => void;
  setLastSyncedAt: (t: number) => void;
  addToast: (variant: ToastVariant, message: string) => void;
  dismissToast: (id: string) => void;
  setPendingTransferRequest: (id: string | null) => void;
}

let toastSeq = 0;

export const useUiStore = create<UiState>((set) => ({
  isOffline: false,
  lastSyncedAt: null,
  toastQueue: [],
  pendingTransferRequest: null,
  setOffline: (v) => set({ isOffline: v }),
  setLastSyncedAt: (t) => set({ lastSyncedAt: t }),
  addToast: (variant, message) =>
    set((s) => ({
      toastQueue: [...s.toastQueue, { id: `t-${++toastSeq}`, variant, message }],
    })),
  dismissToast: (id) =>
    set((s) => ({
      toastQueue: s.toastQueue.filter((t) => t.id !== id),
    })),
  setPendingTransferRequest: (id) => set({ pendingTransferRequest: id }),
}));
