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
 * BYGGTID och kan inte ändras i drift. Det är avsiktligt: en runtime-flagga
 * hade krävt en distributionsyta vi inte har, för ETT beslut som fattas en
 * gång. Ingen kod behöver veta vilken miljö den kör i.
 *
 * [TASK-442, RÄTTELSE av en preexisterande rad — ADR-083] Här stod tidigare
 * att värdet bestäms av "Vites mode-fil" och att "Frånvarande i
 * `.env.production` ⇒ `false` i prod". Andra ledet är FALSKT i dag, och det
 * första är bara halva mekaniken: mode-filen är EN källa, BYGGMILJÖNS
 * process-miljövariabler är en annan — och de VINNER.
 *
 * KÄLLÄST, inte antaget (`vite` 8.2.2, `dist/node/chunks/node.js`,
 * `loadEnv()`): mode-filens värden läggs in först, och SISTA ledet är
 *
 *     for (const key in process.env)
 *       if (prefixes.some((p) => key.startsWith(p))) env[key] = process.env[key];
 *
 * alltså skriver varje `VITE_`-prefixad variabel i byggprocessens miljö över
 * mode-filen. Mätt direkt mot `loadEnv()` (TASK-442): mode `production` utan
 * process-variabel ⇒ `undefined`; med `VITE_FEATURE_BETALNINGAR=pa` i miljön
 * ⇒ `'pa'`; och mode `staging` — vars fil säger `pa` — med `av` i miljön
 * ⇒ `'av'`.
 *
 * KONSEKVENSEN FÖR PROD, mätt: flaggan är PÅ I PROD. `.env.production` bär
 * ingen rad för den; Vercels miljövariabler gör det, och de ÄR byggprocessens
 * miljö. `.env.production` är därför INTE auktoritativ för vad prod-bundeln
 * bär. Belägg, ordagrant ur `tasks/todo.md`: S123 *"Mätt: prod = `29a3c16d`,
 * bundeln bär `VITE_FEATURE_BETALNINGAR: pa`"* och S124 *"flaggan
 * `VITE_FEATURE_BETALNINGAR` är PÅ i prod via Vercel"*. Vill du veta vad som
 * gäller i prod: läs Vercels miljövariabler eller mät bundeln — aldrig
 * mode-filens frånvaro.
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
