/**
 * Example custom React Query hooks wired to the Axios API client.
 *
 * Pattern used throughout PeoplePay360:
 *  1. API function  — thin wrapper around apiClient (Axios) that returns typed data
 *  2. useQuery hook — wraps the API function with caching, loading, error state
 *  3. useMutation   — for POST/PATCH/DELETE with optimistic/invalidation logic
 *
 * Add domain-specific hooks in their own files, e.g.:
 *   src/hooks/use-employees.ts
 *   src/hooks/use-payroll.ts
 *   src/hooks/use-timeoff.ts
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { queryKeys } from '@/hooks/query-keys'
import { useCompanyId } from '@/store/auth.store'

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface Employee {
  id:           string
  firstName:    string
  lastName:     string
  email:        string
  department:   string | null
  jobPosition:  string | null
  status:       'active' | 'inactive' | 'on_leave'
  contractType: string | null
  avatarUrl:    string | null
}

export interface PaginatedResponse<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
}

// ────────────────────────────────────────────────────────────────────────────
// Employees
// ────────────────────────────────────────────────────────────────────────────

/** Fetch paginated employee list for current tenant */
export function useEmployees(params?: { page?: number; limit?: number; search?: string }) {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: queryKeys.employees.list(companyId ?? ''),
    queryFn:  async () => {
      const { data } = await apiClient.get<PaginatedResponse<Employee>>('/employees', { params })
      return data
    },
    enabled: !!companyId,
  })
}

/** Fetch logged-in user's own detailed employee profile */
export function useMyEmployeeProfile() {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['employee', 'me', companyId],
    queryFn: async () => {
      const response = await apiClient.get<any>('/employees/me')
      const res = response.data
      return res?.employee || res?.data?.employee || res?.data || null
    },
    enabled: !!companyId,
  })
}

/** Fetch a single employee by ID */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn:  async () => {
      const { data } = await apiClient.get<Employee>(`/employees/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/** Update an employee (PATCH) */
export function useUpdateEmployee() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Employee> }) => {
      const { data } = await apiClient.patch<Employee>(`/employees/${id}`, payload)
      return data
    },
    onSuccess: (updated) => {
      // Update single record cache
      qc.setQueryData(queryKeys.employees.detail(updated.id), updated)
      // Invalidate list so it refetches with updated record
      qc.invalidateQueries({ queryKey: queryKeys.employees.all })
    },
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Dashboard overview
// ────────────────────────────────────────────────────────────────────────────

export interface DashboardOverview {
  totalEmployees:    number
  onLeaveToday:      number
  pendingApprovals:  number
  payrollThisMonth:  number
  recentActivity:    Array<{ id: string; type: string; description: string; createdAt: string }>
}

export function useDashboardOverview(params?: { departmentId?: string; dateRange?: string }) {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: queryKeys.dashboard.overview(companyId ?? '', params ?? {}),
    queryFn:  async () => {
      const { data } = await apiClient.get<DashboardOverview>('/dashboard/overview', { params })
      return data
    },
    staleTime: 2 * 60 * 1000,  // 2 min — matches Redis TTL on backend
    enabled:   !!companyId,
  })
}