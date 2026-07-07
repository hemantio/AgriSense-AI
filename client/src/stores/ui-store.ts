/**
 * AgriSense AI — Zustand UI Store
 * ====================================
 * Global state for UI components: sidebar, modals, and notifications.
 */

import { create } from "zustand";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // auto-dismiss in ms (default: 5000)
}

interface UIState {
  // --- Sidebar ---
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // --- Modal ---
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  openModal: (id: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // --- Notifications ---
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

let notificationCounter = 0;

export const useUIStore = create<UIState>()((set) => ({
  // --- Sidebar ---
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // --- Modal ---
  activeModal: null,
  modalData: null,
  openModal: (id, data) => set({ activeModal: id, modalData: data ?? null }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // --- Notifications ---
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: `notif-${++notificationCounter}` },
      ],
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
