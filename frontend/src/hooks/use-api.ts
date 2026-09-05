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

/** Create a new employee (POST) */
export function useCreateEmployee() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      employeeCode: string
      firstName: string
      lastName: string
      email: string
      phone?: string
      departmentId?: string
      jobPositionId?: string
      employeeType?: string
      status?: string
      dateOfJoining?: string
    }) => {
      const { data } = await apiClient.post('/employees', payload)
      return (data as any)?.data?.employee || (data as any)?.employee || (data as any)?.data || data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.employees.all })
    },
  })
}

/** Fetch all departments for the current company */
export function useDepartmentsList() {
  return useQuery({
    queryKey: ['departments', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/employees/departments')
      const items = (res.data as any)?.data?.departments
        || (res.data as any)?.data?.items
        || (res.data as any)?.departments
        || (res.data as any)?.items
        || (Array.isArray(res.data) ? res.data : [])
      return items as Array<{ id: string; name: string; code: string | null }>
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** Fetch all job positions for the current company */
export function useJobPositionsList() {
  return useQuery({
    queryKey: ['job-positions', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/employees/job-positions')
      const items = (res.data as any)?.data?.positions
        || (res.data as any)?.data?.items
        || (res.data as any)?.positions
        || (res.data as any)?.items
        || (Array.isArray(res.data) ? res.data : [])
      return items as Array<{ id: string; title: string; code: string | null }>
    },
    staleTime: 5 * 60 * 1000,
  })
}


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
  status: 'present' | 'late' | 'half_day' | 'pending' | 'on_leave' | 'absent' | string
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
  pendingRequestsCount?: number
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
  status: 'present' | 'pending' | 'late' | 'absent' | 'half_day' | 'on_leave' | 'holiday' | string
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
  date?: string
  startDate?: string
  endDate?: string
  status?: string
  search?: string
  source?: string
  hasRequest?: boolean
  requestStatus?: 'pending' | 'approved' | 'refused' | 'all'
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: queryKeys.attendance.list(params),
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {}
      if (params?.departmentId && params.departmentId !== 'all') queryParams.departmentId = params.departmentId
      if (params?.date) queryParams.date = params.date
      if (params?.startDate) queryParams.startDate = params.startDate
      if (params?.endDate) queryParams.endDate = params.endDate
      if (params?.status && params.status !== 'all') queryParams.status = params.status
      if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
      if (params?.source) queryParams.source = params.source
      if (typeof params?.hasRequest === 'boolean') queryParams.hasRequest = String(params.hasRequest)
      if (params?.requestStatus && params.requestStatus !== 'all') queryParams.requestStatus = params.requestStatus
      if (params?.page) queryParams.page = params.page
      if (params?.limit) queryParams.limit = params.limit

      const res = await apiClient.get('/attendance', { params: queryParams })
      return res.data?.data || res.data
    },
    staleTime: 30 * 1000,
  })
}

/** Hook to fetch User Attendance Requests / Corrections */
export function useAttendanceRequests(params?: {
  departmentId?: string
  date?: string
  search?: string
  requestStatus?: 'pending' | 'approved' | 'refused' | 'all'
  page?: number
  limit?: number
}) {
  return useAttendanceList({
    ...params,
    hasRequest: true,
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

/** Hook for HR Manager to approve employee attendance request */
export function useApproveAttendanceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reviewNote }: { id: string; reviewNote?: string }) => {
      const res = await apiClient.patch(`/attendance/requests/${id}/approve`, {
        action: 'approve',
        reviewNote,
      })
      return res.data?.data || res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance.all })
    },
  })
}

/** Hook for HR Manager to reject / refuse employee attendance request */
export function useRefuseAttendanceRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reviewNote }: { id: string; reviewNote?: string }) => {
      const res = await apiClient.patch(`/attendance/requests/${id}/refuse`, {
        action: 'refuse',
        reviewNote,
      })
      return res.data?.data || res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance.all })
    },
  })
}

/** Hook for HR Manager to remove / delete employee attendance request or record */
export function useDeleteAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/attendance/${id}`)
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

// ────────────────────────────────────────────────────────────────────────────
// Time Off Module Hooks & Types
// ────────────────────────────────────────────────────────────────────────────

export interface TimeOffRequestItem {
  id: string
  companyId: string
  employeeId: string
  timeOffTypeId: string
  allocationId: string | null
  startDate: string
  endDate: string
  duration: number
  halfDay: boolean
  halfDayPeriod: 'am' | 'pm' | null
  reason: string | null
  status: 'pending' | 'approved' | 'refused' | 'cancelled'
  refusalReason: string | null
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
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
  timeOffType?: {
    id: string
    name: string
    unit: string
    requiresAllocation: boolean
    approvalRequired: boolean
    color: string | null
  }
  approver?: {
    id: string
    email: string
  } | null
}

export interface TimeOffTypeItem {
  id: string
  name: string
  code: string | null
  unit: string
  color: string | null
  requiresAllocation: boolean
  approvalRequired: boolean
}

/** Hook to fetch list of Time Off Requests with status filter */
export function useTimeOffRequests(params?: {
  employeeId?: string
  status?: string
  timeOffTypeId?: string
  departmentId?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['timeoff', 'requests', params],
    queryFn: async () => {
      const queryParams: Record<string, string> = {}
      if (params?.employeeId) queryParams.employeeId = params.employeeId
      if (params?.status && params.status !== 'all') queryParams.status = params.status
      if (params?.timeOffTypeId && params.timeOffTypeId !== 'all') queryParams.timeOffTypeId = params.timeOffTypeId
      if (params?.departmentId && params.departmentId !== 'all') queryParams.departmentId = params.departmentId
      if (params?.search && params.search.trim()) queryParams.search = params.search.trim()

      const res = await apiClient.get('/time-off-requests', { params: queryParams })
      const data = res.data?.data || res.data
      return (data?.items || (Array.isArray(data) ? data : [])) as TimeOffRequestItem[]
    },
    staleTime: 30 * 1000,
  })
}

/** Hook to fetch available Time Off Types */
export function useTimeOffTypes() {
  return useQuery({
    queryKey: ['timeoff', 'types'],
    queryFn: async () => {
      const res = await apiClient.get('/time-off-types')
      const data = res.data?.data || res.data
      return (data?.items || (Array.isArray(data) ? data : [])) as TimeOffTypeItem[]
    },
    staleTime: 10 * 60 * 1000,
  })
}

/** Hook to approve a time off request */
export function useApproveTimeOffRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/time-off-requests/${id}/approve`)
      return res.data?.data || res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeoff'] })
    },
  })
}

/** Hook to refuse / reject a time off request */
export function useRefuseTimeOffRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, refusalReason }: { id: string; refusalReason?: string }) => {
      const res = await apiClient.patch(`/time-off-requests/${id}/refuse`, { refusalReason })
      return res.data?.data || res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeoff'] })
    },
  })
}

/** Hook to submit a new time off request */
export function useCreateTimeOffRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      employeeId: string
      timeOffTypeId: string
      startDate: string
      endDate: string
      reason?: string
      halfDay?: boolean
      halfDayPeriod?: 'am' | 'pm'
    }) => {
      const res = await apiClient.post('/time-off-requests', payload)
      return res.data?.data || res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeoff'] })
    },
  })
}