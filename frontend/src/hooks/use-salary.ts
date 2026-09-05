import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { useCompanyId } from '@/store/auth.store'

export interface SalaryRuleItem {
  id: string
  companyId?: string | null
  name: string
  code: string
  category: 'basic' | 'allowance' | 'gross' | 'deduction' | 'net'
  sequence: number
  computationMethod: 'fixed' | 'percentage' | 'formula'
  amount?: number | null
  percentageValue?: number | null
  basedOnCode?: string | null
  formula?: string | null
  appearsOnPayslip: boolean
  description?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SalaryStructureItem {
  id: string
  name: string
  code: string
  description?: string | null
  active: boolean
  ruleCount: number
  employeeCount: number
  rules?: Array<{
    structureRuleId?: string
    ruleId: string
    name: string
    code: string
    category: string
    sequence: number
    computationMethod: string
    amount?: number | null
    percentageValue?: number | null
    basedOnCode?: string | null
    formula?: string | null
    appearsOnPayslip?: boolean
  }>
  createdAt?: string
  updatedAt?: string
}

export interface CreateSalaryStructurePayload {
  name: string
  code?: string | null
  description?: string | null
  isActive?: boolean
  rules?: Array<{
    ruleId: string
    sequence: number
  }>
}

export interface CreateSalaryRulePayload {
  name: string
  code: string
  category: 'basic' | 'allowance' | 'gross' | 'deduction' | 'net'
  sequence?: number
  computationMethod: 'fixed' | 'percentage' | 'formula'
  amount?: number | null
  percentageValue?: number | null
  basedOnCode?: string | null
  formula?: string | null
  appearsOnPayslip?: boolean
  description?: string | null
  isActive?: boolean
}

/**
 * Fetch all salary structures with their ordered rules
 */
export function useSalaryStructures() {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['salary-structures', companyId],
    queryFn: async () => {
      const response = await apiClient.get<any>('/salary-structures')
      const data = response.data?.data || response.data
      if (Array.isArray(data)) return data as SalaryStructureItem[]
      if (data?.structures && Array.isArray(data.structures)) return data.structures as SalaryStructureItem[]
      if (data?.items && Array.isArray(data.items)) return data.items as SalaryStructureItem[]
      return [] as SalaryStructureItem[]
    },
    enabled: !!companyId,
  })
}

/**
 * Fetch all salary rules catalog
 */
export function useSalaryRules() {
  const companyId = useCompanyId()

  return useQuery({
    queryKey: ['salary-rules', companyId],
    queryFn: async () => {
      const response = await apiClient.get<any>('/salary-rules')
      const data = response.data?.data || response.data
      if (Array.isArray(data)) return data as SalaryRuleItem[]
      if (data?.rules && Array.isArray(data.rules)) return data.rules as SalaryRuleItem[]
      if (data?.items && Array.isArray(data.items)) return data.items as SalaryRuleItem[]
      return [] as SalaryRuleItem[]
    },
    enabled: !!companyId,
  })
}

/**
 * Create a new Salary Structure (optionally with initial linked rules)
 */
export function useCreateSalaryStructure() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSalaryStructurePayload) => {
      const response = await apiClient.post<any>('/salary-structures', payload)
      return response.data?.data || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-structures'] })
      qc.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

/**
 * Update an existing Salary Structure
 */
export function useUpdateSalaryStructure() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSalaryStructurePayload> }) => {
      const response = await apiClient.put<any>(`/salary-structures/${id}`, data)
      return response.data?.data || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-structures'] })
      qc.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}

/**
 * Create a new Salary Rule in the catalog
 */
export function useCreateSalaryRule() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSalaryRulePayload) => {
      const response = await apiClient.post<any>('/salary-rules', payload)
      return response.data?.data || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-rules'] })
      qc.invalidateQueries({ queryKey: ['salary-structures'] })
    },
  })
}

/**
 * Update an existing Salary Rule
 */
export function useUpdateSalaryRule() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSalaryRulePayload> }) => {
      const response = await apiClient.put<any>(`/salary-rules/${id}`, data)
      return response.data?.data || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-rules'] })
      qc.invalidateQueries({ queryKey: ['salary-structures'] })
    },
  })
}

/**
 * Delete a Salary Rule from the catalog
 */
export function useDeleteSalaryRule() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<any>(`/salary-rules/${id}`)
      return response.data?.data || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-rules'] })
      qc.invalidateQueries({ queryKey: ['salary-structures'] })
    },
  })
}

/**
 * Link an existing rule to a salary structure
 */
export function useAddRuleToStructure() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ structureId, ruleId, sequence }: { structureId: string; ruleId: string; sequence: number }) => {
      const response = await apiClient.post<any>(`/salary-structures/${structureId}/rules`, { ruleId, sequence })
      return response.data?.data || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-structures'] })
    },
  })
}

/**
 * Remove a rule from a salary structure
 */
export function useRemoveRuleFromStructure() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ structureId, ruleId }: { structureId: string; ruleId: string }) => {
      const response = await apiClient.delete<any>(`/salary-structures/${structureId}/rules/${ruleId}`)
      return response.data?.data || response.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salary-structures'] })
    },
  })
}
