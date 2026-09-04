import { create } from 'zustand';

export interface Toast {
  id: string;
  tone: 'success' | 'error' | 'info';
  message: string;
}

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toasts: [],
  pushToast: (toast) =>
    set((s) => ({ toasts: [...s.toasts, { ...toast, id: Math.random().toString(36).slice(2) }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function notifySuccess(message: string) {
  useUiStore.getState().pushToast({ tone: 'success', message });
}
export function notifyError(message: string) {
  useUiStore.getState().pushToast({ tone: 'error', message });
}
