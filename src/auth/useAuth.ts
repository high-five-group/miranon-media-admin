import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthProvider';

/**
 * Hook för att läsa auth-state. Throws om använd utanför AuthProvider —
 * ger meningsfullt fel istället för cryptic undefined-access.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth måste användas inom AuthProvider');
  }
  return ctx;
}
