import { createContext, type ReactNode } from 'react';

export interface AuthContextValue {
  user: { id: string; email: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * K3.1-skelett — innehåller no-op-stubs för login/logout så context-shape är komplett
 * inför K3.2:s InnerApp-pattern-byte. Full Supabase-integration kommer i K3.2.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const value: AuthContextValue = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: async () => {
      throw new Error('AuthProvider K3.1 skelett — login implementeras i K3.2');
    },
    logout: async () => {
      throw new Error('AuthProvider K3.1 skelett — logout implementeras i K3.2');
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
