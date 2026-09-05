import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { useCompanyId } from '@/store/auth.store'

export interface PayslipItem {
  id: string
  companyId: string
  payrunId: string
  employeeId: string
  periodStart: string
  periodEnd: string
  workedDays: number
  leaveDays: number
  status: 'draft' | 'computed' | 'validated' | 'paid' | 'cancelled'
  basic: number
  totalAllowances: number
  gross: number
  totalDeductions: number
  net: number
  employee?: {
    id: string
    firstName: string
    lastName: string
    employeeCode: string
    department?: { name: string }
  }
}

export interface PayrunItem {
  id: string
  companyId: string
  name: string
  periodLabel: string
  status: 'draft' | 'computing' | 'computed' | 'validated' | 'paid' | 'cancelled'
  totalGross: number
  totalDeductions: number
  totalNet: number
  totalEmployees: number
}

/**
  Fetch list of payslips for active tenant
 */
export function usePayslips(params?: { payrunId?: string; employeeId?: string }) {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['payroll', 'payslips', companyId, params],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: PayslipItem[] | { items: PayslipItem[] } }>(
        '/payslips',
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
  Fetch list of payruns for active tenant
 */
export function usePayruns() {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['payroll', 'payruns', companyId],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: PayrunItem[] | { items: PayrunItem[] } }>(
        '/payruns'
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
  Compute Payrun Mutation
 */
export function useComputePayrun() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payrunId: string) => {
      const response = await apiClient.post(`/payruns/${payrunId}/compute`, {})
      return response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] })
    },
  })
}

/**
  Validate Payrun Mutation
 */
export function useValidatePayrun() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payrunId: string) => {
      const response = await apiClient.post(`/payruns/${payrunId}/validate`, {})
      return response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] })
    },
  })
}
