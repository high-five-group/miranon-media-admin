import * as Sentry from '@sentry/react';
import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useEffect, useState } from 'react';
import { supabase } from '../data/config/supabase-client';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
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
 * Översätter Supabase Session → AuthUser. Returnerar null om session saknas eller user-data
 * är ofullständig. Designval: `user` är endast non-null när vi har en faktisk, autentiserad
 * Supabase-user — anon-key-fallback hanteras som null (utloggad).
 *
 * Note: `getSession()` läser från local storage utan re-validation mot server. Server-sidans
 * `requireUser` (Fas A M2) är slutgiltig validator. För 11/10+ klient-side identity-validation
 * kan `getClaims()` övervägas i Fas 2.5+ — overkill för K3-scope.
 */
function sessionToUser(session: Session | null): AuthUser | null {
  if (!session?.user?.id || !session?.user?.email) return null;
  return { id: session.user.id, email: session.user.email };
}

/**
 * Full Supabase-auth-integration. Lyssnar på `onAuthStateChange` för reactive updates.
 * Använder `getSession()` för initial mount-state (snabbt, lokal storage).
 *
 * **KRITISK ARKITEKTUR-NOT (K3 byggplan §4 + sessionsdok Del 5.0):**
 * Faller INTE tillbaka på anon-key. När session saknas → user = null → isAuthenticated = false.
 * UI-flow ska aldrig anropa Edge Functions med anon-key som "lite auth" — guard:en i
 * `src/routes/_authenticated.tsx beforeLoad` (K3.3) redirectar till /login FÖRE datafetch.
 *
 * Klientens `getAuthHeader()` i `src/data/config/supabase-client.ts` throws AuthError när
 * session saknas (K3.4, defense-in-depth skikt 2 — se `src/auth/AuthError.ts`). UI-flow ska
 * aldrig nå dit pga guard-redirect, men throw är säkerhetsnätet om skikt 1 brister.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initial state vid mount.
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          Sentry.captureException(error, { tags: { auth: 'getSession-init' } });
        }
        setUser(sessionToUser(session));
        setIsLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        Sentry.captureException(err, { tags: { auth: 'getSession-init-throw' } });
        setUser(null);
        setIsLoading(false);
      });

    // Reactive updates — listener körs vid login/logout/token-refresh/expire.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      // event-typer: 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED',
      // 'PASSWORD_RECOVERY', 'INITIAL_SESSION'. För K3-scope reagerar vi på session-state
      // oavsett event-typ; user-state härleds från session.
      setUser(sessionToUser(session));
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Sentry.captureException(error, { tags: { auth: 'login' } });
      throw error; // Caller (LoginRoute) renderar felmeddelande.
    }
    // setUser uppdateras via onAuthStateChange-listener. Ingen explicit setUser-anrop här.
  };

  const logout = async (): Promise<void> => {
    // scope: 'local' = rensa bara denna session, inte alla devices.
    // Per Supabase docs lämpligare default för de flesta apps.
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      Sentry.captureException(error, { tags: { auth: 'logout' } });
      throw error;
    }
    // setUser uppdateras via onAuthStateChange-listener.
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
