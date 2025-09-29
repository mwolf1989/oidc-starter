import { useRouterState } from '@tanstack/react-router'
import type { OIDCUser } from '../ssr/interfaces'

export interface AuthState {
  user: OIDCUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Hook to get the current authentication state
 * Returns user information and authentication status
 */
export function useAuth(): AuthState {
  const routerState = useRouterState();
  
  // Get user from router context (set in beforeLoad)
  const user = routerState.matches?.[0]?.context?.user || null;
  
  return {
    user,
    isAuthenticated: !!user,
    isLoading: false, // Since we load auth state in beforeLoad, it's always available
  };
}

/**
 * Simple hook to check if user is authenticated
 * Returns boolean indicating authentication status
 */
export function useIsAuthed(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
