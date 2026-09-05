import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { useCompanyId } from '@/store/auth.store'

export interface TimeOffTypeItem {
  id: string
  name: string
  code?: string
  unit?: string
  color?: string
  requiresAllocation?: boolean
  approvalRequired?: boolean
  isActive?: boolean
}

export interface TimeOffRequestItem {
  id: string
  companyId: string
  employeeId: string
  timeOffTypeId: string
  startDate: string
  endDate: string
  duration: number
  status: 'draft' | 'pending' | 'approved' | 'refused' | 'cancelled'
  reason?: string
  refusalReason?: string
  employee?: {
    id: string
    firstName: string
    lastName: string
    employeeCode: string
    email?: string
  }
  timeOffType?: {
    id: string
    name: string
    code?: string
    color?: string
  }
}

export interface TimeOffAllocationItem {
  id: string
  companyId: string
  employeeId: string
  timeOffTypeId: string
  allocated: number
  taken: number
  remaining: number
  status: 'pending' | 'approved' | 'refused'
  timeOffType?: {
    id: string
    name: string
    code?: string
    color?: string
  }
}

/**
 * Fetch list of time off types
 */
export function useTimeOffTypes() {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['timeoff', 'types', companyId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: TimeOffTypeItem[] | { items: TimeOffTypeItem[] } }>(
        '/time-off-types'
      )
      const data = response.data?.data
      if (Array.isArray(data)) return data
      if (data && 'items' in data && Array.isArray(data.items)) return data.items
      return []
    },
    enabled: !!companyId,
  })
}

/**
  Fetch list of time off requests
 */
export function useTimeOffRequests(params?: { status?: string; employeeId?: string }) {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['timeoff', 'requests', companyId, params],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: TimeOffRequestItem[] | { items: TimeOffRequestItem[] } }>(
        '/time-off-requests',
        { params }
      )
      const data = response.data?.data
      if (Array.isArray(data)) return data
      if (data && 'items' in data && Array.isArray(data.items)) return data.items
      return []
    },
    enabled: !!companyId,
  })
}

/**
  Fetch list of time off allocations
 */
export function useTimeOffAllocations(employeeId?: string) {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['timeoff', 'allocations', companyId, employeeId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: TimeOffAllocationItem[] | { items: TimeOffAllocationItem[] } }>(
        '/time-off-allocations',
        { params: employeeId ? { employeeId } : {} }
      )
      const data = response.data?.data
      if (Array.isArray(data)) return data
      if (data && 'items' in data && Array.isArray(data.items)) return data.items
      return []
    },
    enabled: !!companyId,
  })
}

/**
 * Create Time Off Request Mutation
 */
export function useCreateTimeOffRequest() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      employeeId: string
      timeOffTypeId: string
      startDate: string
      endDate: string
      reason?: string
    }) => {
      const response = await apiClient.post('/time-off-requests', payload)
      return response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeoff'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

/**
  Approve Time Off Request Mutation
 */
export function useApproveTimeOffRequest() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiClient.patch(`/time-off-requests/${requestId}/approve`, {})
      return response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeoff'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

/**
  Refuse / Decline Time Off Request Mutation
 */
export function useRefuseTimeOffRequest() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, refusalReason }: { requestId: string; refusalReason?: string }) => {
      const response = await apiClient.patch(`/time-off-requests/${requestId}/refuse`, { refusalReason })
      return response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeoff'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
