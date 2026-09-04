import { env } from '@/env';

/**
 * [TASK-346.4 AC #6, PRD TASK-346 § Miljöflagga (B2)] Betalningsflödets
 * miljöflagga.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD FLAGGAN ÄR TILL FÖR
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD:ns användarberättelse 36, ordagrant: "Som Marcus vill jag att nya ytor
 * är avstängda i prod tills jag slår på dem, så att Lotta aldrig möter en
 * halvfärdig yta."
 *
 * Betalningsdomänen kräver dessutom tre saker i PROD innan den kan fungera
 * alls: migrationerna, Vault-hemligheten och cron-posten (ADR-129 § Negativa
 * och skuld). Alla tre är Marcus egna steg i prod-runbooken (TASK-346.11).
 * En yta som vore synlig innan dess hade inte varit halvfärdig utan trasig.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MILJÖ, INTE ANVÄNDARE
 * ═══════════════════════════════════════════════════════════════════════════
 * Detta är en MILJÖFLAGGA, inte en funktionsflagg-tjänst. Värdet bestäms vid
 * BYGGTID av Vites mode-fil (`.env.development` / `.env.staging` /
 * `.env.production`) och kan inte ändras i drift. Det är avsiktligt: en
 * runtime-flagga hade krävt en distributionsyta vi inte har, för ETT beslut
 * som fattas en gång.
 *
 * Frånvarande i `.env.production` ⇒ `false` i prod. Ingen kod behöver veta
 * vilken miljö den kör i.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RIVNINGSNOT — VAD SOM FÖRSVINNER, OCH NÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * `TASK-346.12` ("Efter promovering: riv miljöflaggan, pensionera
 * Airtable-ledgern, CHANGELOG/byggplan") river flaggan när Marcus slagit på
 * betalningsytorna i prod och de stått gröna. Rivningen omfattar EXAKT:
 *
 *   1. `VITE_FEATURE_BETALNINGAR` ur `src/env.ts`s client-schema.
 *   2. Raden ur `.env.development`, `.env.staging` och `.env.example`.
 *   3. DENNA FIL, i sin helhet.
 *   4. Varje `betalningarPa()`-anrop — villkoret tas bort, den villkorade
 *      grenen blir ovillkorlig. `git grep betalningarPa` är den fullständiga
 *      listan; det är hela skälet till att flaggan läses genom EN funktion
 *      och inte genom `env.VITE_FEATURE_BETALNINGAR` på spridda ställen.
 *
 * Det som rivs är alltså FLAGGAN OCH VÄXELN, aldrig formen bakom dem
 * (ADR-103 § promoveringskontraktet: "det som rivs efter godkännande är
 * flaggor och växlar, aldrig formen").
 */
export function betalningarPa(): boolean {
  return env.VITE_FEATURE_BETALNINGAR === 'pa';
}
