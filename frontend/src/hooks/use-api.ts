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

// ────────────────────────────────────────────────────────────────────────────
// Attendance Domain Types & Hooks
// ────────────────────────────────────────────────────────────────────────────

export interface TodayAttendancePresentItem {
  attendanceId: string
  employeeId: string
  employeeCode: string
  employeeName: string
  department: string
  departmentId: string | null
  jobPosition: string
  checkIn: string | null
  checkOut: string | null
  workedHours: number
  expectedHours: number
  overtimeHours: number
  status: 'present' | 'late' | 'half_day'
  managerName: string | null
  isCorrected: boolean
}

export interface TodayAttendanceAbsentItem {
  employeeId: string
  employeeCode: string
  employeeName: string
  email: string
  department: string
  departmentId: string | null
  jobPosition: string
  status: 'absent' | 'on_leave'
  managerName: string | null
  attendanceId: string | null
}

export interface DepartmentItem {
  id: string
  name: string
  code: string | null
}

export interface TodayAttendanceStats {
  totalEmployees: number
  presentCount: number
  absentCount: number
  lateCount: number
  halfDayCount: number
  onLeaveCount: number
  attendanceRate: number
}

export interface TodayAttendanceSummary {
  date: string
  stats: TodayAttendanceStats
  present: TodayAttendancePresentItem[]
  absent: TodayAttendanceAbsentItem[]
  departments: DepartmentItem[]
}

export interface AttendanceRecordItem {
  id: string
  companyId: string
  employeeId: string
  attendanceDate: string
  checkIn: string | null
  checkOut: string | null
  workedHours: number | null
  expectedHours: number | null
  overtimeHours: number | null
  source: string
  status: 'present' | 'late' | 'absent' | 'half_day' | 'on_leave' | 'holiday'
  isCorrected: boolean
  correctionReason: string | null
  employee?: {
    id: string
    firstName: string
    lastName: string
    employeeCode: string
    email: string
    department?: { id: string; name: string } | null
    jobPosition?: { id: string; title: string } | null
    manager?: { id: string; firstName: string; lastName: string } | null
  }
}

/** Hook to fetch Today's Present & Absent Attendance Breakdown */
export function useTodayAttendanceSummary(params?: {
  departmentId?: string
  hrAllotted?: boolean
  date?: string
  search?: string
}) {
  return useQuery({
    queryKey: queryKeys.attendance.todaySummary(params),
    queryFn: async () => {
      const queryParams: Record<string, string> = {}
      if (params?.departmentId && params.departmentId !== 'all') {
        queryParams.departmentId = params.departmentId
      }
      if (typeof params?.hrAllotted === 'boolean') {
        queryParams.hrAllotted = String(params.hrAllotted)
      }
      if (params?.date) queryParams.date = params.date
      if (params?.search && params.search.trim()) queryParams.search = params.search.trim()

      const res = await apiClient.get('/attendance/today-summary', { params: queryParams })
      return (res.data?.data || res.data) as TodayAttendanceSummary
    },
    staleTime: 30 * 1000, // 30 seconds fresh cache
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  })
}

/** Hook to fetch paginated Attendance Log Records */
export function useAttendanceList(params?: {
  departmentId?: string
  hrAllotted?: boolean
  date?: string
  startDate?: string
  endDate?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: queryKeys.attendance.list(params),
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {}
      if (params?.departmentId && params.departmentId !== 'all') queryParams.departmentId = params.departmentId
      if (typeof params?.hrAllotted === 'boolean') queryParams.hrAllotted = String(params.hrAllotted)
      if (params?.date) queryParams.date = params.date
      if (params?.startDate) queryParams.startDate = params.startDate
      if (params?.endDate) queryParams.endDate = params.endDate
      if (params?.status && params.status !== 'all') queryParams.status = params.status
      if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
      if (params?.page) queryParams.page = params.page
      if (params?.limit) queryParams.limit = params.limit

      const res = await apiClient.get('/attendance', { params: queryParams })
      return res.data?.data || res.data
    },
    staleTime: 30 * 1000,
  })
}

/** Hook to perform employee punch check-in */
export function useCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload?: { employeeId?: string; checkInTime?: string; attendanceDate?: string }) => {
      const res = await apiClient.post('/attendance/check-in', payload || {})
      return res.data?.data || res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance.all })
    },
  })
}

/** Hook to perform employee punch check-out */
export function useCheckOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload?: { employeeId?: string; checkOutTime?: string; attendanceId?: string }) => {
      const res = await apiClient.post('/attendance/check-out', payload || {})
      return res.data?.data || res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance.all })
    },
  })
}

/** Hook for HR Manager to create manual attendance entry */
export function useCreateAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      employeeId: string
      attendanceDate: string
      checkIn?: string | null
      checkOut?: string | null
      status?: string
      correctionReason?: string
    }) => {
      const res = await apiClient.post('/attendance', payload)
      return res.data?.data || res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance.all })
    },
  })
}

/** Hook to fetch company departments for filters */
export function useDepartmentsMaster() {
  const companyId = useCompanyId()
  return useQuery({
    queryKey: ['departments', companyId],
    queryFn: async () => {
      const res = await apiClient.get('/employees/meta/masters')
      const data = res.data?.data || res.data
      return (data?.departments || []) as DepartmentItem[]
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!companyId,
  })
}