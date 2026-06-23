// ADR-061 Pelare 2 (keystone) — fail-fast mode-medveten miljö-koherens.
//
// Ren, dependency-fri regel-modul (ingen Vite-/Node-/Supabase-koppling) så att
// den kan importeras från BÅDE klient-ytan (src/env.ts, import.meta.env) OCH
// node-api-test-ytan (tests/api, process.env) utan att dra in miljö-specifika
// bindningar. Logiken är hermetisk och enhetstestad (tests/api/env-coherence.test.ts).
//
// Syfte: gör miljö-bindningen självverifierande. En icke-prod-väg som pekar på
// prod-ref VÄGRAS vid uppstart — symptom-klassen (T28 lokal→prod, T12 test→prod)
// kan inte återuppstå utan att grind-koden tas bort, vilket är synligt i review/CI.

/** PROD-projektets Supabase-ref (läst från .env.production, ADR-061 Pelare 1). */
export const PROD_SUPABASE_REF = 'lvjsfnphlauldxqlncpl';

/** Sant om url:en pekar på PROD-Supabase-projektet. */
export function isProdRef(url: string): boolean {
  return url.includes(PROD_SUPABASE_REF);
}

/**
 * Klient-ytan: prod-ref får förekomma i VITE_SUPABASE_URL ENDAST i production-mode.
 * Varje icke-prod-mode (development, test, staging, …) som pekar på prod kastar.
 */
export function assertModeCoherent(mode: string, url: string): void {
  if (isProdRef(url) && mode !== 'production') {
    throw new Error(
      `FATAL (ADR-061 Pelare 2): prod-Supabase-ref i VITE_SUPABASE_URL men MODE=${mode}. ` +
        'Icke-prod-mode får aldrig peka på prod. Kör rätt mode eller rätta .env-filen.',
    );
  }
}

/**
 * Test-ytan: TEST_SUPABASE_URL får ALDRIG peka på prod (T12). Kastar ovillkorligt
 * om prod-ref — test-ytan ska aldrig nå prod-databasen.
 */
export function assertTestSurfaceNotProd(url: string): void {
  if (isProdRef(url)) {
    throw new Error(
      'FATAL (ADR-061 Pelare 2): test-ytans TEST_SUPABASE_URL pekar på prod-ref. ' +
        'Test-ytan får aldrig nå prod (T12). Rätta din .env.test.',
    );
  }
}
