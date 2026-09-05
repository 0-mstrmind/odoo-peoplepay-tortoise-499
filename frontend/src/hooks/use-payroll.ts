/**
 * Payroll, Payslips, Salary Structures & Salary Rules hooks
 *
 * Fully integrated with backend REST API:
 *  - /payruns
 *  - /payslips
 *  - /salary-structures
 *  - /salary-rules
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { queryKeys } from '@/hooks/query-keys'
import { useCompanyId } from '@/store/auth.store'

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface SalaryRule {
  id: string
  companyId?: string
  name: string
  code: string
  category: 'basic' | 'allowance' | 'deduction' | 'net'
  sequence: number
  computationMethod: 'fixed' | 'percentage' | 'formula'
  amount?: number | string | null
  percentageValue?: number | string | null
  basedOnCode?: string | null
  formula?: string | null
  appearsOnPayslip: boolean
  description?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SalaryStructureRule {
  structureRuleId?: string
  ruleId?: string
  name?: string
  code?: string
  category?: string
  sequence: number
  rule?: SalaryRule
}

export interface SalaryStructure {
  id: string
  name: string
  code: string
  description?: string | null
  active?: boolean
  isActive?: boolean
  ruleCount?: number
  employeeCount?: number
  rules?: SalaryStructureRule[]
  createdAt?: string
  updatedAt?: string
}

export interface Payrun {
  id: string
  companyId?: string
  name: string
  periodLabel: string
  periodStart: string
  periodEnd: string
  salaryStructureId?: string | null
  status: 'draft' | 'computed' | 'validated' | 'paid' | 'cancelled'
  totalGross: number | string
  totalDeductions: number | string
  totalNet: number | string
  totalEmployees: number
  notes?: string | null
  computedAt?: string | null
  validatedAt?: string | null
  paidAt?: string | null
  salaryStructure?: {
    id: string
    name: string
  } | null
  creator?: { id: string; email: string } | null
  validator?: { id: string; email: string } | null
  _count?: {
    payslips: number
    payrollWarnings: number
  }
  createdAt?: string
  updatedAt?: string
}

export interface PayslipLine {
  id?: string
  ruleCode: string
  ruleName: string
  category: string
  sequence: number
  amount: number | string
  rate?: number | string | null
}

export interface Payslip {
  id: string
  companyId?: string
  payrunId: string
  employeeId: string
  contractId?: string | null
  structureId?: string | null
  periodStart: string
  periodEnd: string
  workedDays: number | string
  leaveDays: number | string
  overtimeHours: number | string
  status: 'draft' | 'computed' | 'validated' | 'paid' | 'cancelled'
  currency: string
  basic: number | string
  totalAllowances: number | string
  gross: number | string
  totalDeductions: number | string
  net: number | string
  pdfUrl?: string | null
  computedAt?: string | null
  paidAt?: string | null
  createdAt?: string
  updatedAt?: string
  employee?: {
    id: string
    firstName: string
    lastName: string
    employeeCode: string
    email: string
    department?: string | { name: string } | null
    jobPosition?: string | { title: string } | null
  }
  payrun?: {
    id: string
    name: string
    periodLabel: string
  }
  contract?: {
    id?: string
    wage?: number | string
    structureId?: string
  } | null
  lines?: PayslipLine[]
  payslipLines?: PayslipLine[]
}

export type PayslipItem = Payslip


// ────────────────────────────────────────────────────────────────────────────
// Payruns Hooks
// ────────────────────────────────────────────────────────────────────────────

export function usePayruns(params?: { status?: string; page?: number; limit?: number }) {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: [...queryKeys.payroll.runs(companyId ?? ''), params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; items: Payrun[]; pagination: any }>('/payruns', { params })
      return data?.items || []
    },
    enabled: true,
  })
}

export function usePayrun(id: string) {
  return useQuery({
    queryKey: queryKeys.payroll.run(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; payrun: Payrun }>(`/payruns/${id}`)
      return data?.payrun
    },
    enabled: !!id,
  })
}

export function useCreatePayrun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      periodLabel: string
      periodStart: string
      periodEnd: string
      salaryStructureId?: string | null
      notes?: string
    }) => {
      const { data } = await apiClient.post<{ success: boolean; payrun: Payrun }>('/payruns', payload)
      return data?.payrun
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
    },
  })
}

export function useComputePayrun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/payruns/${id}/compute`)
      return data
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.run(id) })
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
    },
  })
}

export function useValidatePayrun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/payruns/${id}/validate`)
      return data
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.run(id) })
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
    },
  })
}

export function useMarkPaidPayrun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/payruns/${id}/mark-paid`)
      return data
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.run(id) })
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
    },
  })
}

export function useCancelPayrun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/payruns/${id}/cancel`)
      return data
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.run(id) })
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
    },
  })
}

export function useSelectPayrunEmployees() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, employeeIds }: { id: string; employeeIds: string[] }) => {
      const { data } = await apiClient.post(`/payruns/${id}/select-employees`, { employeeIds })
      return data
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.run(id) })
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all })
    },
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Payslips Hooks
// ────────────────────────────────────────────────────────────────────────────

export function usePayslips(params?: { payrunId?: string; employeeId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['payslips', params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; items: Payslip[]; pagination: any }>('/payslips', { params })
      return data?.items || []
    },
  })
}

export function usePayslip(id?: string | null) {
  return useQuery({
    queryKey: queryKeys.payroll.payslip(id ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; payslip: Payslip }>(`/payslips/${id}`)
      return data?.payslip
    },
    enabled: !!id,
  })
}

export const usePayslipDetail = usePayslip

// ────────────────────────────────────────────────────────────────────────────
// Salary Structures Hooks
// ────────────────────────────────────────────────────────────────────────────

export function useSalaryStructures() {
  const companyId = useCompanyId()
  return useQuery({
    queryKey: queryKeys.salary.structures(companyId ?? ''),
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; structures: SalaryStructure[] }>('/salary-structures')
      return data?.structures || []
    },
  })
}

export function useSalaryStructure(id: string) {
  return useQuery({
    queryKey: queryKeys.salary.structure(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; structure: SalaryStructure }>(`/salary-structures/${id}`)
      return data?.structure
    },
    enabled: !!id,
  })
}

export function useCreateSalaryStructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; code: string; description?: string; isActive?: boolean }) => {
      const { data } = await apiClient.post<{ success: boolean; structure: SalaryStructure }>('/salary-structures', payload)
      return data?.structure
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
  })
}

export function useUpdateSalaryStructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<SalaryStructure> }) => {
      const { data } = await apiClient.put<{ success: boolean; structure: SalaryStructure }>(`/salary-structures/${id}`, payload)
      return data?.structure
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
  })
}

export function useDeleteSalaryStructure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/salary-structures/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Salary Rules Hooks
// ────────────────────────────────────────────────────────────────────────────

export function useSalaryRules() {
  return useQuery({
    queryKey: ['salary-rules'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: boolean; rules: SalaryRule[] }>('/salary-rules')
      return data?.rules || []
    },
  })
}

export function useCreateSalaryRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<SalaryRule>) => {
      const { data } = await apiClient.post<{ success: boolean; rule: SalaryRule }>('/salary-rules', payload)
      return data?.rule
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-rules'] })
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
  })
}

export function useUpdateSalaryRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<SalaryRule> }) => {
      const { data } = await apiClient.put<{ success: boolean; rule: SalaryRule }>(`/salary-rules/${id}`, payload)
      return data?.rule
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-rules'] })
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
  })
}

export function useDeleteSalaryRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete(`/salary-rules/${id}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-rules'] })
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
  })
}

export function useAddStructureRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ structureId, ruleId, sequence }: { structureId: string; ruleId: string; sequence: number }) => {
      const { data } = await apiClient.post(`/salary-structures/${structureId}/rules`, { ruleId, sequence })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
  })
}

export function useRemoveStructureRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ structureId, ruleId }: { structureId: string; ruleId: string }) => {
      const { data } = await apiClient.delete(`/salary-structures/${structureId}/rules/${ruleId}`)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
  })
}
