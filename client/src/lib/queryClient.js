/**
 * FreelanceFlow - React Query Configuration
 * Optimized caching and performance for enterprise usage
 * 
 * Usage in components:
 * import { useQuery, useMutation } from '@tanstack/react-query'
 * 
 * Or use our custom hooks from useQueries.js
 */

import { QueryClient } from '@tanstack/react-query'

// ============================================
// Query Client Configuration (Enterprise)
// ============================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time before data is considered stale (5 minutes)
      staleTime: 5 * 60 * 1000,
      
      // Time before unused cache is garbage collected (10 minutes)
      gcTime: 10 * 60 * 1000,
      
      // Don't refetch on window focus (reduces API calls)
      refetchOnWindowFocus: false,
      
      // Don't refetch on mount (use cache first)
      refetchOnMount: false,
      
      // Retry failed requests only once
      retry: 1,
    },
    mutations: {
      // Don't retry mutations
      retry: 0,
    }
  }
})

// ============================================
// Query Keys - Centralized for consistency
// ============================================

export const queryKeys = {
  // Auth
  me: ['me'],
  profile: ['profile'],
  
  // Dashboard
  dashboard: ['dashboard'],
  dashboardStats: ['dashboard', 'stats'],
  
  // Clients
  clients: (filters) => ['clients', filters],
  client: (id) => ['client', id],
  
  // Projects
  projects: (filters) => ['projects', filters],
  project: (id) => ['project', id],
  
  // Invoices
  invoices: (filters) => ['invoices', filters],
  invoice: (id) => ['invoice', id],
  
  // Contracts
  contracts: (filters) => ['contracts', filters],
  contract: (id) => ['contract', id],
  
  // Leads
  leads: (filters) => ['leads', filters],
  lead: (id) => ['lead', id],
  
  // Expenses
  expenses: (filters) => ['expenses', filters],
  
  // Time Logs
  timeLogs: (filters) => ['timeLogs', filters],
  
  // Payments
  payments: (filters) => ['payments', filters],
  
  // Tasks
  tasks: (filters) => ['tasks', filters],
  
  // Search
  search: (query) => ['search', query],
}

// ============================================
// Query Configuration by Type
// ============================================

export const queryConfig = {
  // Frequently changing data - shorter stale time
  dashboard: {
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  },
  
  // User data - longer stale time (since it's less frequent)
  user: {
    staleTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // List data - medium stale time
  lists: {
    staleTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Single items - longer stale time
  single: {
    staleTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // Static data - very long stale time
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutes
  },
}

// ============================================
// Helper Functions
// ============================================

/**
 * Invalidate all queries for a specific entity
 * Call this after create/update/delete operations
 */
export const invalidateQueries = (entity) => {
  queryClient.invalidateQueries({ queryKey: [entity] })
}

/**
 * Pre-set query data (optimistic updates)
 */
export const setQueryData = (key, data) => {
  queryClient.setQueryData(key, data)
}

/**
 * Get cached query data
 */
export const getQueryData = (key) => {
  return queryClient.getQueryData(key)
}

/**
 * Clear all cached data (on logout)
 */
export const clearAllQueries = () => {
  queryClient.clear()
}

// ============================================
// Default Query Options (for hooks)
// ============================================

export const defaultQueryOptions = {
  // Don't show error toast on every failure (handled by components)
  throwOnError: false,
}

export default queryClient