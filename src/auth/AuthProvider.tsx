import { type ReactNode, createContext } from 'react';

export interface AuthContextValue {
  // Full implementation i K3 — denna typ är skelett för router-context-typing.
  user: { id: string; email: string } | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * K2-skelett. Levererar `value={{ user: null, isLoading: false }}` så TS-typer + router-context
 * är på plats. Full Supabase-auth-integration implementeras i K3 (onAuthStateChange, login, logout).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const value: AuthContextValue = {
    user: null,
    isLoading: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
