import { createClient } from '@supabase/supabase-js';
import { AuthError } from '@/auth/AuthError';
import { env } from '@/env';
import { fetchWithRetry, medTidsgrans } from '../utils';
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

/** Valfria per-anrops-alternativ för {@link callEdgeFunction} (TASK-451.4).
 *
 * `signal` är TanStack Querys `queryFn`-kontextsignal, ledd GENOM adaptern
 * (lagerregeln: datalagret nås endast via sin adapter, aldrig kringgånget).
 * Den är VALFRI med avsikt — parametern är additiv, så varje befintlig
 * anropare är oförändrad, och en anropsväg kan börja leda in signalen utan
 * att någon annan väg rörs. */
export interface EdgeFunctionAnropsval {
  signal?: AbortSignal;
}

/**
 * Anropar en Edge Function via GET med query params.
 * Returnerar JSON-responsen typad som T.
 *
 * [GA] Nätverkslagret använder fetchWithRetry: 3 retries med exponentiell
 * backoff + jitter. 5xx och nätverksfel retryas, 4xx propageras direkt.
 *
 * [TASK-451.4] VARJE anrop bär dessutom en tidsgräns
 * (`HAMTNINGENS_TIDSGRANS_MS` i `src/data/utils.ts` — värdet bor på ETT
 * ställe). Gränsen gäller HELA anropet: auth-headern är redan hämtad när
 * klockan startar, och budgeten täcker `fetchWithRetry`s samtliga omförsök
 * PLUS kropps-läsningen nedan, så en EF som slutar svara mitt i en
 * `res.json()` hänger inte heller. Levereras en `signal` i {@link options}
 * fäller anropet på det som inträffar FÖRST av de två (query-cancel eller
 * tidsgräns).
 *
 * GET-vägen (läsning) bär gränsen; POST-vägen ({@link postEdgeFunction},
 * skrivning) gör det AVSIKTLIGT INTE — se den funktionens docblock.
 *
 * Throws AuthError (från getAuthHeader) om ingen session finns vid anrop.
 */
export async function callEdgeFunction<T>(
  name: string,
  params?: Record<string, string>,
  options?: EdgeFunctionAnropsval,
): Promise<T> {
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';

  const url = `${env.VITE_SUPABASE_URL}/functions/v1/${name}${queryString}`;
  const authorization = await getAuthHeader();

  const tidsgrans = medTidsgrans(options?.signal);
  try {
    const res = await fetchWithRetry(url, {
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      signal: tidsgrans.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw edgeFunctionError(name, res.status, body);
    }

    return (await res.json()) as T;
  } finally {
    // Obligatoriskt: utan detta lever timern kvar hela tidsgränsen ut även
    // för ett anrop som klarade sig på 300 ms (se `medTidsgrans`s docblock).
    tidsgrans.stang();
  }
}

/**
 * Anropar en Edge Function via POST med JSON body.
 * Används för update-record och andra skrivoperationer.
 *
 * [GA] Samma retry-strategi som callEdgeFunction.
 *
 * ## INGEN tidsgräns här, och det är ett BESLUT (TASK-451.4)
 *
 * `callEdgeFunction` ovan fick en `AbortController`-driven tidsgräns; denna
 * funktion fick det AVSIKTLIGT INTE. Skälet är semantiskt, inte ett förbiseende:
 *
 * En avbruten LÄSNING är gratis att ge upp — data finns kvar på servern och
 * nästa hämtning börjar om. En avbruten SKRIVNING är det inte: `fetch`
 * avbryts på KLIENTSIDAN, men begäran kan redan ha nått Edge Functionen och
 * genomförts i Airtable. Klienten hade då sett ett fel för en operation som
 * lyckades — dubbla betalningsrader, dubbla utskick, en registrering som
 * rapporteras misslyckad men finns. Husets skrivvägar
 * (`create-registration`, `send-email`, `update-record`, `save-segment`,
 * `create-attendance`, bilage- och kvittovägarna) går alla genom denna
 * funktion.
 *
 * Att göra skrivvägarna avbrytbara kräver en helt annan mekanism än en
 * tidsgräns: idempotensnycklar hela vägen genom EF:en, så ett omförsök
 * bevisligen inte kan dubblera. `upload-attachment`/`finalize-attachment-upload`
 * bär redan den formen för sin egen väg (`operationKey`/`upsert: true`,
 * TASK-316) — resten gör det inte. Tills den formen finns överallt är "låt
 * skrivningen bli klar" det säkra svaret, och kortet (TASK-451.4) gäller
 * uttryckligen HÄMTNINGAR på startvärmningens väg.
 *
 * BESLUTET ÄR VAKTAT, inte bara nedskrivet (runda 2, granskningens fynd 5):
 * `tests/api/hamtningens-tidsgrans.test.ts` § "SKRIVVÄGEN bär ingen
 * tidsgräns" källtextläser denna funktions kropp och FÄLLER om `signal`,
 * `medTidsgrans` eller en `AbortController` någonsin smyger in här. Samma
 * fil bevisar tvåsidigt att `callEdgeFunction` DÄREMOT bär dem, så vakten
 * inte kan passera tomt.
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

// [RIVET, TASK-309.18] `postEdgeFunctionBlob` (POST + `res.blob()`) stod
// tidigare här — dess enda anropare (`AirtableAdapter.renderPdfFranHtml`)
// var själv död kod mot en redan riven EF (`test-docraptor-render`,
// TASK-309.4). Bägge rivna i samma beslut; ingen nu levande väg svarar med
// rå binärdata via denna klient (husets PDF-vägar går via `postEdgeFunction`
// + base64-i-JSON, `preview-receipt`/`generate-event-attachment`).
