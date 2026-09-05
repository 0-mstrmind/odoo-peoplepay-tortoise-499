/**
 * TanStack Query — global QueryClient configuration
 *
 * Defaults:
 *  - staleTime:  60 seconds  (data stays fresh for 1 min before background refetch)
 *  - gcTime:     5 minutes   (inactive cached queries garbage-collected after 5 min)
 *  - retry:      1           (one automatic retry on failure; auth errors skip retry)
 *  - refetchOnWindowFocus: true  (refetch on tab focus to keep ERP data fresh)
 *
 * Error handling:
 *  - 401 responses are NOT retried (handled by axios interceptor)
 *  - Network errors get 1 retry with default exponential back-off
 */
import { QueryClient } from '@tanstack/react-query'
import { type AxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,            // 60 s
      gcTime:    5 * 60 * 1000,         // 5 min
      retry: (failureCount, error) => {
        // Do not retry on 401 / 403 — axios interceptor already handles them
        const axiosError = error as AxiosError
        const status = axiosError?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 1
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})