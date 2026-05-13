import { createClient } from '@supabase/supabase-js';
import { AuthError } from '@/auth/AuthError';
import { env } from '@/env';
import { fetchWithRetry } from '../utils';

// Env-variabler valideras i src/env.ts (via @t3-oss/env-core) vid uppstart.
// Ingen defensiv if-check här — uppstarten kraschar redan om något saknas.
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

/**
 * Returnerar Authorization-header med session-token. Throws AuthError när
 * ingen session finns — anon-key-fallbacken är borttagen i K3.4 (Fas A §A3
 * fynd). Se `src/auth/AuthError.ts` för defense-in-depth-rationale.
 *
 * **Förväntat anropsmönster:** UI-flow ska aldrig nå callEdgeFunction/
 * postEdgeFunction utan session — `_authenticated.tsx` beforeLoad-guard
 * redirectar till /login först. Om AuthError fångas i produktion är skikt 1
 * brustet (regression).
 *
 * **Server-side:** `requireUser` (supabase/functions/_shared/auth.ts) avvisar
 * anon-key role oberoende — slutgiltig validator.
 */
async function getAuthHeader(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new AuthError('No Supabase session — UI-flow guard should have redirected to /login');
  }
  return `Bearer ${session.access_token}`;
}

/**
 * Anropar en Edge Function via GET med query params.
 * Returnerar JSON-responsen typad som T.
 *
 * [GA] Nätverkslagret använder fetchWithRetry: 3 retries med exponentiell
 * backoff + jitter. 5xx och nätverksfel retryas, 4xx propageras direkt.
 *
 * Throws AuthError (från getAuthHeader) om ingen session finns vid anrop.
 */
export async function callEdgeFunction<T>(
  name: string,
  params?: Record<string, string>,
): Promise<T> {
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';

  const url = `${env.VITE_SUPABASE_URL}/functions/v1/${name}${queryString}`;
  const authorization = await getAuthHeader();

  const res = await fetchWithRetry(url, {
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Edge Function "${name}" ${res.status}: ${body}`);
  }

  return (await res.json()) as T;
}

/**
 * Anropar en Edge Function via POST med JSON body.
 * Används för update-record och andra skrivoperationer.
 *
 * [GA] Samma retry-strategi som callEdgeFunction.
 *
 * Throws AuthError (från getAuthHeader) om ingen session finns vid anrop.
 */
export async function postEdgeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const url = `${env.VITE_SUPABASE_URL}/functions/v1/${name}`;
  const authorization = await getAuthHeader();

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`Edge Function "${name}" ${res.status}: ${bodyText}`);
  }

  return (await res.json()) as T;
}
