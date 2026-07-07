/**
 * AgriSense AI — Type-Safe API Client
 * =====================================
 * Axios-based API client with JWT auth, token refresh,
 * and interceptor-based error handling.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// --- Token Storage (client-side only) ---
const TOKEN_KEY = "agrisense_access_token";
const REFRESH_KEY = "agrisense_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// --- Axios Instance ---
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// --- Request Interceptor: Attach JWT ---
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor: Token Refresh ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefresh } = response.data;
        setTokens(access_token, newRefresh);
        processQueue(null, access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// --- Typed API Helpers ---
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),

  register: (data: Record<string, unknown>) =>
    apiClient.post("/auth/register", data),

  getProfile: () => apiClient.get("/auth/me"),

  updateProfile: (data: object) =>
    apiClient.put("/auth/me", data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  // Farmers
  listFarmers: (params?: Record<string, any>) =>
    apiClient.get("/farmers", { params }),

  createFarmer: (data: Record<string, any>) =>
    apiClient.post("/farmers", data),

  getFarmer: (id: string) => apiClient.get(`/farmers/${id}`),

  updateFarmer: (id: string, data: Record<string, any>) =>
    apiClient.put(`/farmers/${id}`, data),

  deleteFarmer: (id: string) => apiClient.delete(`/farmers/${id}`),

  // Plots
  listPlots: (params?: Record<string, any>) =>
    apiClient.get("/plots", { params }),

  createPlot: (data: Record<string, any>) =>
    apiClient.post("/plots", data),

  getPlot: (id: string) => apiClient.get(`/plots/${id}`),

  updatePlot: (id: string, data: Record<string, any>) =>
    apiClient.put(`/plots/${id}`, data),

  verifyPlot: (id: string, status: string) =>
    apiClient.post(`/plots/${id}/verify`, { verification_status: status }),

  deletePlot: (id: string) => apiClient.delete(`/plots/${id}`),

  // Crop Health
  analyzeHealth: (formData: FormData) =>
    apiClient.post("/health/analyze", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getHealthHistory: (params?: Record<string, any>) =>
    apiClient.get("/health/history", { params }),

  getHealthRecord: (id: string) => apiClient.get(`/health/${id}`),

  // Crops
  listCrops: (params?: Record<string, any>) =>
    apiClient.get("/crops", { params }),

  createCrop: (data: Record<string, any>) =>
    apiClient.post("/crops", data),

  getCrop: (id: string) => apiClient.get(`/crops/${id}`),

  updateCrop: (id: string, data: Record<string, any>) =>
    apiClient.put(`/crops/${id}`, data),

  deleteCrop: (id: string) => apiClient.delete(`/crops/${id}`),

  // Expenses
  listExpenses: (params?: Record<string, any>) =>
    apiClient.get("/expenses", { params }),

  createExpense: (data: Record<string, any>) =>
    apiClient.post("/expenses", data),

  getExpense: (id: string) => apiClient.get(`/expenses/${id}`),

  updateExpense: (id: string, data: Record<string, any>) =>
    apiClient.put(`/expenses/${id}`, data),

  deleteExpense: (id: string) => apiClient.delete(`/expenses/${id}`),

  // Weather & Recommendations
  getWeather: (params?: Record<string, any>) =>
    apiClient.get("/weather", { params }),

  getWeatherForecast: (params?: Record<string, any>) =>
    apiClient.get("/weather/forecast", { params }),

  getRecommendations: (params?: Record<string, any>) =>
    apiClient.get("/recommendations", { params }),

  // Simulation
  listSimulations: () =>
    apiClient.get("/simulation/scenarios"),

  runSimulation: (data: Record<string, any>) =>
    apiClient.post("/simulation/run", data),

  getSimulationHistory: (params?: Record<string, any>) =>
    apiClient.get("/simulation/history", { params }),

  // Inputs & OCR
  listInputs: (params?: Record<string, any>) =>
    apiClient.get("/inputs", { params }),

  getInput: (id: string) => apiClient.get(`/inputs/${id}`),

  createInput: (data: Record<string, any>) =>
    apiClient.post("/inputs", data),

  deleteInput: (id: string) => apiClient.delete(`/inputs/${id}`),

  uploadInputOCR: (formData: FormData) =>
    apiClient.post("/inputs/ocr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Dashboard
  getDashboardStats: () => apiClient.get("/dashboard/stats"),

  // CIE Chat
  sendChat: (data: { message: string; session_id?: string | null; page_context?: string | null }) =>
    apiClient.post("/chat/send", data),

  sendChatStream: async (
    data: { message: string; session_id?: string | null; page_context?: string | null },
    onEvent: (event: { type: string; data: any }) => void
  ) => {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/chat/send`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7);
          } else if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            try {
              const eventData = JSON.parse(dataStr);
              onEvent({ type: currentEvent, data: eventData });
            } catch (err) {
              console.error("Error parsing event data:", err);
            }
            currentEvent = "";
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  closeSession: (session_id: string) =>
    apiClient.post(`/chat/sessions/${session_id}/close`),

  getChatSessions: () => apiClient.get("/chat/sessions"),

  getChatHistory: (id: string) => apiClient.get(`/chat/sessions/${id}`),

  submitFeedback: (data: { message_id: string; rating: number; was_helpful: boolean; correction?: string }) =>
    apiClient.post("/chat/feedback", data),
};

