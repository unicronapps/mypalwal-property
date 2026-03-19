'use client';

import { useAuthContext } from '@/context/AuthContext';

/**
 * Hook to access auth state and actions.
 * Re-exports AuthContext for convenience.
 */
export function useAuth() {
  return useAuthContext();
}
