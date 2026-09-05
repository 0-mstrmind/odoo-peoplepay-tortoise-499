import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  phone?: string
}

export interface UpdatePasswordInput {
  currentPassword?: string
  newPassword: string
}

/**
 * Mutation hook to update logged-in user profile details (first name, last name, phone)
 */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const response = await apiClient.patch<any>('/auth/me/profile', data)
      return response.data
    },
    onSuccess: () => {
      // Invalidate my employee profile and auth me cache to refresh UI
      queryClient.invalidateQueries({ queryKey: ['employee', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

/**
 * Mutation hook to change logged-in user password
 */
export function useUpdateMyPassword() {
  return useMutation({
    mutationFn: async (data: UpdatePasswordInput) => {
      const response = await apiClient.patch<any>('/auth/me/password', data)
      return response.data
    },
  })
}
