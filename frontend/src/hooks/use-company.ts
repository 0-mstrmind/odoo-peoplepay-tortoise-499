import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import { useCompanyId } from '@/store/auth.store'

export interface Company {
  id: string
  name: string
  slug: string
  industry?: string | null
  country?: string | null
  currency: string
  timezone: string
  address?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCompanyPayload {
  name: string
  slug?: string
  industry?: string
  country?: string
  currency?: string
  timezone?: string
  address?: string
  phone?: string
  adminEmail: string
  adminPassword?: string
  adminName?: string
}

export interface UpdateCompanyPayload {
  name?: string
  industry?: string
  country?: string
  currency?: string
  timezone?: string
  address?: string
  phone?: string
  email?: string
  logoUrl?: string
}

export const useCompany = () => {
  const companyId = useCompanyId()

  return useQuery<Company>({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const response = await apiClient.get('/companies/me')
      return response.data?.data || response.data
    },
    enabled: !!companyId,
  })
}

export const useUpdateCompany = () => {
  const queryClient = useQueryClient()
  const companyId = useCompanyId()

  return useMutation({
    mutationFn: async (payload: UpdateCompanyPayload) => {
      const response = await apiClient.put('/companies/me', payload)
      return response.data?.data || response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
    },
  })
}

export const useCreateCompany = () => {
  return useMutation({
    mutationFn: async (payload: CreateCompanyPayload) => {
      const response = await apiClient.post('/companies', payload)
      return response.data?.data || response.data
    },
  })
}
