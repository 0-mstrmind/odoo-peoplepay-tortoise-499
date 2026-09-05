import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { useAuthUser, useCompanyId } from '@/store/auth.store'

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
  status: 'present' | 'late' | 'half_day' | 'absent' | 'on_leave' | 'holiday'
  source: 'system' | 'manual' | 'biometric' | 'mobile'
  isCorrected?: boolean
  employee?: {
    id: string
    firstName: string
    lastName: string
    employeeCode: string
    email?: string
  }
}

export interface AttendanceListResponse {
  items: AttendanceRecordItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
  Fetch attendances with filter options
 */
export function useAttendanceList(params?: {
  employeeId?: string
  startDate?: string
  endDate?: string
  status?: string
  page?: number
  limit?: number
}) {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['attendance', 'list', companyId, params],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: AttendanceListResponse }>(
        '/attendances',
        { params }
      )
      // Return unwrapped items / pagination
      return response.data?.data || response.data
    },
    enabled: !!companyId,
  })
}

/**
  Fetch today's attendance record for the current employee
 */
export function useTodayAttendance() {
  const user = useAuthUser()
  const companyId = useCompanyId()
  const todayStr = new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['attendance', 'today', user?.id, todayStr],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: AttendanceListResponse }>(
        '/attendances',
        {
          params: {
            startDate: todayStr,
            endDate: todayStr,
            limit: 1,
          },
        }
      )
      const listData = response.data?.data || response.data
      const record = listData?.items?.[0] || null
      return record as AttendanceRecordItem | null
    },
    enabled: !!companyId && !!user,
  })
}

/**
  Mutation for Punch In (Check-In)
 */
export function useCheckIn() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: { checkInTime?: string; source?: 'system' | 'manual' | 'mobile' }) => {
      const response = await apiClient.post<{ success: boolean; message: string; data: { item: AttendanceRecordItem } }>(
        '/attendances/check-in',
        payload || { source: 'system' }
      )
      return response.data?.data?.item || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

/**
  Mutation for Punch Out (Check-Out)
 */
export function useCheckOut() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: { attendanceId?: string; checkOutTime?: string }) => {
      const response = await apiClient.post<{ success: boolean; message: string; data: { item: AttendanceRecordItem } }>(
        '/attendances/check-out',
        payload || {}
      )
      return response.data?.data?.item || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
