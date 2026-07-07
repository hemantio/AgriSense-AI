/**
 * AgriSense AI — Auth Hooks
 * ============================
 * React Query hooks for authentication operations.
 * Integrates with the Zustand auth store for state management.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, setTokens, clearTokens } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import type {
  LoginRequest,
  PasswordChangeRequest,
  TokenResponse,
  User,
  UserUpdateRequest,
} from "@/types";

/** Login and store tokens + user in auth store. */
export function useLogin() {
  const { setUser } = useAuthStore();
  return useMutation<TokenResponse, Error, LoginRequest>({
    mutationFn: async (credentials) => {
      const response = await api.login(credentials.email, credentials.password);
      return response.data as TokenResponse;
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    },
  });
}

/** Fetch current user profile. */
export function useProfile() {
  const { isAuthenticated } = useAuthStore();
  return useQuery<User>({
    queryKey: ["auth", "profile"],
    queryFn: () => api.getProfile().then((r) => r.data as User),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

/** Update the current user's profile. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: (data: UserUpdateRequest) => api.updateProfile(data),
    onSuccess: (response) => {
      const user = response.data as User;
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["auth", "profile"] });
    },
  });
}

/** Change the current user's password. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: PasswordChangeRequest) =>
      api.changePassword(data.current_password, data.new_password),
  });
}

/** Logout: clear tokens and auth state. */
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  return () => {
    clearTokens();
    logout();
    queryClient.clear();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };
}
