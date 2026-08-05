/**
 * Kontroll mot läckta lösenord (ASVS 5.0 V6 6.2.4/6.2.12, ADR-093 beslut 1).
 *
 * VARFÖR EN EGEN KLIENT-KONTROLL I STÄLLET FÖR ATT LITA PÅ SUPABASE ENSAM:
 * Supabase Auth HAR en inbyggd HIBP-integration ("Prevent use of leaked
 * passwords") — men den är entitlement-gated till Pro Plan och uppåt
 * (verifierat mot Supabase Studios egen källkod via context7,
 * `AuthProvidersFormValidation.tsx`: `entitlementKey: 'auth.password_hibp'`)
 * och styrs via en dashboard-toggle som INTE går att läsa eller sätta via
 * `supabase config push` (config.toml rad 94–104 dokumenterar samma
 * push-utan-pull-begränsning för andra auth-fält). Om den togglen faktiskt
 * står på för detta projekt är alltså overifierat och utanför vad ett
 * repo-bundet bygge kan bevisa (ADR-086: obelagt påstående = HYPOTES).
 *
 * Denna modul gör AC #2 ("kontroll mot läckta lösenord") sant OAVSETT den
 * dashboard-inställningen, med samma mekanism Supabase själv bygger sin
 * funktion på: HaveIBeenPwned.orgs k-anonymitets-API (Pwned Passwords
 * "range"-ändpunkten). Tekniken är etablerad branschstandard (Cloudflare
 * är infrastrukturpartner till HIBP; mönstret används av 1Password, GitHub,
 * Microsoft, Firefox Monitor m.fl.) och kräver ingen API-nyckel.
 *
 * K-ANONYMITET: lösenordet självt lämnar ALDRIG klienten. Endast SHA-1-
 * hashens FÖRSTA 5 hex-tecken skickas — API:t svarar med samtliga kända
 * suffix som delar det prefixet (i praktiken hundratals), och matchningen
 * mot det egna suffixet sker lokalt i webbläsaren.
 *
 * CSP: anropet går mot `api.pwnedpasswords.com`, som INTE ingår i
 * SECURITY-SPEC.md:s dokumenterade `connect-src`. Tillagt i samma landning
 * (TASK-127.6) — se SECURITY-SPEC.md § Content-Security-Policy. CSP är
 * ÄNNU INTE kopplad in någonstans i den faktiska appen (ingen
 * `vercel.json`, ingen `<meta>`-tagg, ingen middleware finns i repot ännu
 * — S87-spaningen: "ingen frontend-deploy överhuvudtaget"), så tillägget
 * bryter inget levande skydd — det dokumenterar rätt mål för när CSP
 * kopplas in.
 *
 * FAIL-OPEN vid nätverksfel: om HIBP-tjänsten inte svarar (timeout, nät
 * nere) blockeras INTE kontoskapandet — accept-flödet är den mest
 * kritiska enskilda ytan i hela inbjudningskedjan, och att göra den
 * beroende av en tredjepartstjänsts tillgänglighet vore en sämre
 * avvägning än att släppa igenom ett omärkt lösenord (längd- och
 * vägledningskraven gäller ändå, och Supabases egen HIBP-kontroll —
 * om påslagen — är ett andra oberoende lager). Anroparen loggar `null`
 * till Sentry vid behov; denna modul kastar aldrig.
 */

const PWNED_PASSWORDS_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const TIMEOUT_MS = 5000;

/** SHA-1 i versal hex — HIBP:s Pwned Passwords-API är byggt på SHA-1
 * (inte för lösenordets EGEN säkerhet, utan som k-anonymitetsprotokollets
 * hashformat — samma val som HIBP:s egen tjänst och alla kända klienter). */
async function sha1Hex(varde: string): Promise<string> {
  const data = new TextEncoder().encode(varde);
  const digest = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export interface BreachCheckResult {
  breached: boolean;
  /** Antal kända förekomster i läckta dataset — 0 när `breached` är false. */
  count: number;
}

/**
 * Slår upp lösenordet mot HaveIBeenPwned Pwned Passwords via k-anonymitet.
 *
 * Returnerar `null` om kontrollen inte kunde genomföras (nätverksfel,
 * timeout, icke-2xx-svar) — anroparen tolkar `null` som "okänt", inte som
 * "säkert", och ska INTE blockera submit på grund av det (se modulens
 * topp-kommentar, fail-open-resonemanget).
 */
export async function checkPasswordBreached(password: string): Promise<BreachCheckResult | null> {
  if (password.length === 0) return { breached: false, count: 0 };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`${PWNED_PASSWORDS_RANGE_URL}${prefix}`, {
      signal: controller.signal,
      headers: {
        // Skickar utfyllnadsrader i svaret (HIBP:s egen rekommendation) så
        // svarsstorleken inte avslöjar om prefixet var ovanligt — samma
        // enumeration-neutrala princip som ADR-093 kräver för andra svar.
        'Add-Padding': 'true',
      },
    });
    if (!res.ok) return null;

    const body = await res.text();
    for (const rad of body.split('\n')) {
      const [radSuffix, radCount] = rad.trim().split(':');
      if (radSuffix === suffix) {
        const count = Number.parseInt(radCount ?? '0', 10);
        return { breached: true, count: Number.isFinite(count) ? count : 0 };
      }
    }
    return { breached: false, count: 0 };
  } catch {
    // Nätverksfel, abort (timeout) eller crypto.subtle saknas (icke-secure
    // context — ska aldrig hända i produktion, appen kräver HTTPS/localhost).
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
