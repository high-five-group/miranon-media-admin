/**
 * Thrown by `getAuthHeader()` (src/data/config/supabase-client.ts) när ingen
 * Supabase-session finns. Tidigare föll klienten tyst tillbaka på anon-key
 * (Fas A §A3 fynd, 2026-05-04 security-hardening) — den fallbacken är
 * borttagen i K3.4.
 *
 * **Defense-in-depth (sessionsdok Del 5.5 tre-skikt):**
 * - Skikt 1: AuthProvider + `_authenticated.tsx` beforeLoad-guard (K3.2/K3.3)
 *   redirectar utloggade till `/login` FÖRE datafetch. AuthError ska inte
 *   nå någon catch i normal UI-flow.
 * - Skikt 2: DENNA — om getAuthHeader anropas utan session är skikt 1
 *   brustet. Loud failure istället för tyst anon-key-fallback.
 * - Skikt 3: `requireUser` (supabase/functions/_shared/auth.ts) avvisar
 *   anon-key role serverside oberoende — oförändrad.
 *
 * **Sentry-konvention:** callers fångar och rapporterar med
 * `{ tags: { auth: 'getAuthHeader-no-session' } }` per AuthProvider-mönstret
 * (getSession-init, login, logout är redan så taggade).
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
    // Krävs för att `instanceof AuthError` ska fungera över alla TS
    // transpilation targets — ES5-output förlorar prototyp-kedjan annars.
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}
