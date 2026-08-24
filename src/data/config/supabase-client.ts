import { createClient } from '@supabase/supabase-js';
import { AuthError } from '@/auth/AuthError';
import { env } from '@/env';
import { fetchWithRetry } from '../utils';
import { EdgeFunctionError } from './EdgeFunctionError';

/**
 * Bygger en `EdgeFunctionError` ur ett non-2xx-svar. Extraherar `requestId` ur
 * EF-fel-kroppen `{ error, requestId }` (errors.ts) till ett strukturerat fält;
 * faller tillbaka på rå body-text om kroppen inte är JSON. requestId vävs även
 * in i `message` så loggrader/Sentry-breadcrumbs förblir självförklarande.
 */
function edgeFunctionError(endpoint: string, status: number, bodyText: string): EdgeFunctionError {
  let message = `Edge Function "${endpoint}" ${status}: ${bodyText}`;
  let requestId: string | undefined;
  try {
    const parsed = JSON.parse(bodyText) as { error?: unknown; requestId?: unknown };
    if (typeof parsed.requestId === 'string') requestId = parsed.requestId;
    if (typeof parsed.error === 'string') {
      const suffix = requestId ? ` (requestId: ${requestId})` : '';
      message = `Edge Function "${endpoint}" ${status}: ${parsed.error}${suffix}`;
    }
  } catch {
    // Icke-JSON-kropp (t.ex. proxy-fel) — behåll rå message.
  }
  return new EdgeFunctionError({ endpoint, status, message, requestId });
}

// Env-variabler valideras i src/env.ts (via @t3-oss/env-core) vid uppstart.
// Ingen defensiv if-check här — uppstarten kraschar redan om något saknas.
//
// `auth.experimental.passkey: true` (TASK-127.8, ADR-093 beslut 2): utan
// denna flagga kastar SDK:n synkront på VARJE anrop mot
// `supabase.auth.passkey.*`/`registerPasskey`/`signInWithPasskey`, redan
// client-side, innan något nätverksanrop görs
// (`assertPasskeyExperimentalEnabled`, `@supabase/auth-js/src/lib/helpers.ts`).
// Flaggan aktiverar INGET på servern — den tillåter bara SDK:n att FRÅGA
// servern. Alla faktiska anrop bor i `src/lib/auth/passkey.ts` (den enda
// filen som bär beta-risken, AC #3) — ingen annan fil importerar
// passkey-metoderna direkt.
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { experimental: { passkey: true } },
});

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
    throw new AuthError('No Supabase session - UI-flow guard should have redirected to /login');
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
    throw edgeFunctionError(name, res.status, body);
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
    throw edgeFunctionError(name, res.status, bodyText);
  }

  return (await res.json()) as T;
}

/**
 * Anropar en Edge Function via POST med JSON body och tar emot BINÄRDATA.
 *
 * Skild från `postEdgeFunction` av en enda anledning, men en avgörande: den
 * läser `res.blob()` i stället för `res.json()`. Husets alla andra
 * PDF-vägar returnerar base64 inuti JSON (`preview-receipt`,
 * `generate-event-attachment`) och konsumeras därför av `postEdgeFunction`;
 * `test-docraptor-render` svarade i stället med rå `application/pdf`,
 * eftersom den byggdes som mätinstrument för `ADR-119` beslut 7 och mätte
 * PDF-bytesen direkt. Att i stället ändra EF:ens kontrakt till base64 hade
 * rivit grunden under den redan gjorda mätningen — därför tog klienten emot
 * det format instrumentet faktiskt talade. [RIVEN, TASK-309.4, ADR-125 § 5]
 * EF:en är riven; denna hjälpares enda anropare
 * (`AirtableAdapter.renderPdfFranHtml`) saknar i sin tur egna anropare i
 * `src/` och står bokförd som öppen skuld i `DataSourceAdapter.ts`s
 * `renderPdfFranHtml`-docblock.
 *
 * Auth-, fel- och retry-kontraktet är IDENTISKT med `postEdgeFunction`:
 * samma `getAuthHeader`, samma `edgeFunctionError` vid non-2xx (feltexten
 * läses som text — EF:ens felkontrakt är JSON även när framgångssvaret är
 * binärt), samma `fetchWithRetry`.
 *
 * VÄRT ATT VETA OM STORLEKEN: anroparen (bilage-förhandsgranskningen)
 * postar en självbärande HTML på ~4 MB, och `fetchWithRetry` gör upp till
 * 3 omförsök vid 5xx — ett verkligt serverfel kostar alltså flera
 * uppladdningar av samma volym. Det är acceptabelt för en dev-gatead
 * prototypväg och skulle inte vara det för en skarp, den dag mallen
 * renderas server-side (`ADR-119`) och HTML:en aldrig lämnar servern.
 */
export async function postEdgeFunctionBlob(
  name: string,
  body: Record<string, unknown>,
): Promise<Blob> {
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
    throw edgeFunctionError(name, res.status, bodyText);
  }

  return await res.blob();
}
