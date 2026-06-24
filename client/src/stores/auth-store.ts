/**
 * AgriSense AI — Zustand Auth Store
 * =====================================
 * Global state for authentication with persistence.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "farmer";
  phone_number?: string;
  village_name?: string;
  preferred_language: string;
  is_active: boolean;
  is_verified: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user: User) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("agrisense_access_token");
          localStorage.removeItem("agrisense_refresh_token");
        }
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: "agrisense-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
