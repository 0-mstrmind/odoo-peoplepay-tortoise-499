/**
 * Axios instance for PeoplePay360 API
 *
 * - Base URL sourced from VITE_API_URL env variable
 * - Automatically injects Authorization Bearer token from Zustand auth store
 * - Globally handles 401 Unauthorized by clearing auth state
 * - Attaches X-Company-ID header from auth store for multi-tenant routing
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor — inject auth token + company ID ──────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Lazily import to avoid circular dependency with store
    // Token is stored in Zustand auth store (persisted to localStorage)
    const raw = localStorage.getItem('pp-auth')
    if (raw) {
      try {
        const state = JSON.parse(raw) as { state: { token: string | null; companyId: string | null } }
        const { token, companyId } = state.state
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        if (companyId) {
          config.headers['X-Company-ID'] = companyId
        }
      } catch {
        // malformed storage — ignore
      }
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// ── Response interceptor — handle global errors ────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear persisted auth state so next navigation goes to login
      localStorage.removeItem('pp-auth')
      // Redirect to login without full page reload where possible
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient