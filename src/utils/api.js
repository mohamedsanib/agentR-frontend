// src/utils/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor - attach token + log
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("rf_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || config.params || "");
    return config;
  },
  (error) => {
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - log + handle auth
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`, response.data);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message;
    console.error(`[API] ❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${status}: ${msg}`);

    if (status === 401) {
      localStorage.removeItem("rf_token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ──────────────────────────────────────────────────────────────────
export const authAPI = {
  googleLogin: (credential) => api.post("/auth/google", { credential }),
  getMe: () => api.get("/auth/me"),
  deleteAccount: () => api.delete("/auth/account"),
  updateTimezone: (timezone) => api.put("/auth/timezone", { timezone }),
};

// ─── REMINDERS ────────────────────────────────────────────────────────────
export const remindersAPI = {
  process: (message, sessionId) => api.post("/reminders/process", { message, sessionId }),
  list: (params) => api.get("/reminders", { params }),
  create: (data) => api.post("/reminders", data),
  update: (id, data) => api.put(`/reminders/${id}`, data),
  delete: (id) => api.delete(`/reminders/${id}`),
  get: (id) => api.get(`/reminders/${id}`),
};

// ─── TELEGRAM ─────────────────────────────────────────────────────────────
export const telegramAPI = {
  generateCode: () => api.post("/telegram/generate-code"),
  getStatus: () => api.get("/telegram/status"),
  disconnect: () => api.delete("/telegram/disconnect"),
};

export default api;
