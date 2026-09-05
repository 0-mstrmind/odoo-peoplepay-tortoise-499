import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { useCompanyId } from '@/store/auth.store'

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
      const response = await apiClient.get<{ success: boolean; data: ApiContractItem[] | { items: ApiContractItem[] } }>(
        '/contracts',
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
