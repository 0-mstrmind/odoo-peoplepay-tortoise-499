import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { useCompanyId } from '@/store/auth.store'

export interface CreateContractPayload {
  employeeId: string
  contractReference?: string
  startDate: string
  endDate?: string | null
  departmentId?: string | null
  jobPositionId?: string | null
  scheduleId?: string | null
  wage: number
  currency?: string
  payFrequency?: 'monthly' | 'bi_weekly' | 'weekly'
  salaryStructureId?: string | null
  status?: 'draft' | 'active' | 'expired' | 'terminated'
  notes?: string | null
}

export interface MasterDataResponse {
  departments: Array<{ id: string; name: string; code?: string }>
  jobPositions: Array<{ id: string; title: string; code?: string; departmentId?: string }>
  schedules: Array<{ id: string; name: string; scheduleType?: string; totalWeeklyHours?: number }>
  managers: Array<{ id: string; firstName: string; lastName: string; employeeCode?: string }>
}

export interface ApiContractItem {
  id: string
  companyId: string
  employeeId: string
  contractReference: string
  startDate: string
  endDate?: string | null
  wage: number
  currency: string
  status: 'active' | 'draft' | 'expired' | 'terminated'
  employee?: {
    id: string
    firstName: string
    lastName: string
    employeeCode: string
  }
  department?: {
    id: string
    name: string
  }
  jobPosition?: {
    id: string
    title: string
  }
  schedule?: {
    id: string
    name: string
  }
  salaryStructure?: {
    id: string
    name: string
  }
}

export interface ApiSalaryStructureItem {
  id: string
  name: string
  code: string
  description?: string | null
  active: boolean
  ruleCount: number
  employeeCount: number
  structureRules?: Array<{
    id: string
    sequence: number
    rule?: {
      id: string
      name: string
      code: string
      category: string
      amountType: string
      amountFix?: number | null
      amountPercentage?: number | null
      pythonCode?: string | null
    }
  }>
}

export interface ApiWorkingScheduleItem {
  id: string
  name: string
  code: string
  scheduleType: string
  totalWeeklyHours: number
  timezone: string
  isActive: boolean
  employeesCount: number
  contractsCount: number
  linesCount: number
}

/**
 * Fetch list of contracts from backend API
 */
export function useContracts(params?: { status?: string; search?: string }) {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['contracts', companyId, params],
    queryFn: async () => {
      const response = await apiClient.get<any>('/contracts', { params })
      const data = response.data?.data || response.data
      if (Array.isArray(data)) return data as ApiContractItem[]
      if (data && 'items' in data && Array.isArray(data.items)) return data.items as ApiContractItem[]
      if (data && 'contracts' in data && Array.isArray(data.contracts)) return data.contracts as ApiContractItem[]
      return [] as ApiContractItem[]
    },
    enabled: !!companyId,
  })
}

/**
 * Mutation for creating a new employment contract
 */
export function useCreateContract() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateContractPayload) => {
      const response = await apiClient.post<any>('/contracts', payload)
      const res = response.data?.data || response.data
      return (res?.item || res?.contract || res) as ApiContractItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

/**
 * Mutation for updating contract details or status (e.g. Activate/Terminate)
 */
export function useUpdateContract() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateContractPayload> }) => {
      const response = await apiClient.patch<any>(`/contracts/${id}`, data)
      const res = response.data?.data || response.data
      return (res?.item || res?.contract || res) as ApiContractItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

/**
 * Fetch company employee master data (departments, positions, schedules, managers)
 */
export function useEmployeeMasters() {
  const companyId = useCompanyId()

  return useQuery<MasterDataResponse>({
    queryKey: ['employee-masters', companyId],
    queryFn: async () => {
      const response = await apiClient.get<any>('/employees/meta/masters')
      const data = response.data?.data || response.data
      return {
        departments: data?.departments || [],
        jobPositions: data?.jobPositions || [],
        schedules: data?.schedules || [],
        managers: data?.managers || [],
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!companyId,
  })
}

/**
 * Fetch list of salary structures from backend API
 */
export function useSalaryStructures() {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['salary-structures', companyId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: ApiSalaryStructureItem[] | { items: ApiSalaryStructureItem[] } }>(
        '/salary-structures'
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
 * Fetch list of working schedules from backend API
 */
export function useWorkingSchedules() {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['working-schedules', companyId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: ApiWorkingScheduleItem[] | { items: ApiWorkingScheduleItem[] } }>(
        '/working-schedules'
      )
      const data = response.data?.data
      if (Array.isArray(data)) return data
      if (data && 'items' in data && Array.isArray(data.items)) return data.items
      return []
    },
    enabled: !!companyId,
  })
}

export interface CreateWorkingSchedulePayload {
  name: string
  code?: string | null
  scheduleType?: 'fixed' | 'flexible' | 'shift'
  timezone?: string
  scheduleLines?: Array<{
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    startTime?: string | null
    endTime?: string | null
    breakDurationMinutes?: number
    isDayOff?: boolean
  }>
}

/**
 * Mutation for creating a new working schedule
 */
export function useCreateWorkingSchedule() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateWorkingSchedulePayload) => {
      const response = await apiClient.post<any>('/working-schedules', payload)
      return response.data?.data || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['working-schedules'] })
      qc.invalidateQueries({ queryKey: ['employee-masters'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
