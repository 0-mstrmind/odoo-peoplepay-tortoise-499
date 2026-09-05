/**
 * Zustand Auth Store — PeoplePay360
 *
 * Persisted to localStorage under key "pp-auth".
 * The Axios instance reads token + companyId from localStorage directly
 * to avoid circular imports at request time.
 *
 * Slices:
 *  - token         JWT access token
 *  - companyId     Active tenant company ID (multi-tenant)
 *  - user          Authenticated user profile (id, email, role, name)
 *  - isLoading     Auth initialisation flag
 *
 * Actions:
 *  - setAuth(token, user)  — called after login / token refresh
 *  - setCompanyId(id)      — called after company context resolves
 *  - logout()              — clears all auth state + query cache
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole =
  | 'admin'
  | 'super_admin'
  | 'hr_manager'
  | 'hr_payroll_manager'
  | 'hr_payroll_user'
  | 'payroll_manager'
  | 'employee'
  | (string & {})

export interface AuthUser {
  id:        string
  email:     string
  name:      string
  role:      UserRole
  avatarUrl?: string
}

interface AuthState {
  token:      string | null
  companyId:  string | null
  user:       AuthUser | null
  isLoading:  boolean
}

interface AuthActions {
  setAuth:       (token: string, user: AuthUser) => void
  setCompanyId:  (companyId: string) => void
  setLoading:    (loading: boolean) => void
  logout:        () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // ── State ────────────────────────────────────────────────
      token:      null,
      companyId:  null,
      user:       null,
      isLoading:  false,

      // ── Actions ──────────────────────────────────────────────
      setAuth: (token, user) =>
        set({ token, user, isLoading: false }),

      setCompanyId: (companyId) =>
        set({ companyId }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      logout: () => {
        set({ token: null, companyId: null, user: null, isLoading: false })
        // TanStack Query cache cleared from main.tsx provider on re-render
      },
    }),
    {
      name: 'pp-auth',          // localStorage key (also read by axios interceptor)
      partialize: (state) => ({ // only persist these fields
        token:     state.token,
        companyId: state.companyId,
        user:      state.user,
      }),
    },
  ),
)

// ── Selectors (avoids object equality pitfalls) ────────────────────────────
export const useToken     = () => useAuthStore((s) => s.token)
export const useAuthUser  = () => useAuthStore((s) => s.user)
export const useCompanyId = () => useAuthStore((s) => s.companyId)
export const useIsAuthed  = () => useAuthStore((s) => !!s.token && !!s.user)

/**
 * Checks if a given role satisfies the allowed roles list.
 * 'admin' and 'super_admin' bypass role restrictions.
 */
export function hasRolePermission(userRole?: string | null, allowedRoles?: UserRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true
  if (!userRole) return false
  if (userRole === 'admin' || userRole === 'super_admin') return true
  return allowedRoles.includes(userRole as UserRole)
}