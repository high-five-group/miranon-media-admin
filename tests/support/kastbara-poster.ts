/**
 * ÄGAR-MANIFESTET för kastbara staging-poster (TASK-309.15).
 *
 * ═══ PROBLEMET DEN LÖSER ═══
 * `.purge-staging-policy.json`s setup-purge (ADR-060 punkt 3) städar FÖRE varje
 * staging-jobb, aldrig efter. Mellan en testkörning och nästa staging-jobb
 * ligger raderna alltså kvar i den delade staging-basen — och de kastbara
 * eventen bär `startdatum` i framtiden, vilket gör dem till KOMMANDE event som
 * dyker upp i appens eventväljare. Mätt 2026-08-24: 151 kastbara ZZ-event,
 * samtliga skapade inom 2,4 h (setup-purgen HADE alltså kört — fönstret är
 * strukturellt, inte ett fel i purgen). Marcus valde ett av dem vid en
 * granskning och fick en tom genereringsvy, vilket läste som ett designfel.
 *
 * ═══ VARFÖR ETT MANIFEST OCH INTE EN TEARDOWN I TESTET ═══
 * Testet får ALDRIG en Airtable-token (ADR-060 punkt 2+4, EF-only-gränsen), och
 * det finns ingen delete-EF för event. Testet kan därför inte radera sina egna
 * rader — men det VET vilka de är. Manifestet bär exakt den kunskapen över till
 * `scripts/purge-staging-sentinels.mjs --efter-korning`, som körs i en
 * Airtable-creddad kontext SKILD från testet (CI: eget jobb, egen secret —
 * ADR-060 punkt 4 verbatim; lokalt: `npm run purge:staging:efter`).
 *
 * Manifestet är en ÄGARSKAPS-utsaga ("dessa rader skapade denna körning"), inte
 * en radera-order. Purgen kontrollerar varje ID mot policyns filter,
 * exakt-mönster och länk-guard precis som i setup-läget — ett ID som inte
 * matchar någon target raderas ALDRIG, det rapporteras.
 *
 * ═══ VARFÖR INTE `test-results/` ═══
 * Samma skäl som `tests/support/hermetik-rapport-fil.ts` redan bär: Playwright
 * RENSAR sin `outputDir` vid varje körningsstart, och CI kör `test:api:staging`
 * och `test:e2e:staging` som TVÅ separata Playwright-invokationer i samma jobb.
 * Ett manifest i `test-results/` hade raderats av den andra invokationen innan
 * någon hann läsa det.
 *
 * ═══ APPEND-ONLY, ALDRIG NOLLSTÄLLT VID START ═══
 * Filen trunkeras medvetet INTE av något setup-steg. Två skäl:
 *   1. De två Playwright-invokationerna ovan skulle annars radera varandras
 *      manifest.
 *   2. En kvarlämnad post från en tidigare körning är INERT: purgen listar
 *      basen och skär snittet mot manifestet, så ett redan raderat ID finns
 *      helt enkelt inte i listningen och blir en no-op-rad i rapporten.
 * `--efter-korning` tar bort filen när den lyckats, så den växer inte lokalt.
 *
 * JSONL — en rad per post, av exakt samma skäl som hermetik-rapporten: flera
 * Playwright-workers skriver samtidigt, och korta `appendFileSync`-skrivningar
 * radbryts inte av varandra på POSIX.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/** Sökvägen till ägar-manifestet. EN källa — skrivaren (testerna) och läsaren
 *  (`scripts/purge-staging-sentinels.mjs`) är olika körkontexter, och en
 *  dubblerad sträng hade gått isär TYST: purgen hade läst en tom fil och
 *  rapporterat "0 poster" utan att något såg fel ut. Skriptet läser konstanten
 *  ur denna fil via sin egen `KASTBARA_POSTER_FIL`-spegel, som
 *  `scripts/test-purge-staging-sentinels.mjs` korsläser mot denna rad. */
export const KASTBARA_POSTER_FIL = '.kastbara/poster.jsonl';

/** En rad i manifestet. `vad` är enbart för människan i purge-loggen —
 *  raderingen styrs av `id` + policyns egna guards, aldrig av `vad`. */
export interface KastbarPost {
  id: string;
  vad: string;
}

const REC_ID = /^rec[A-Za-z0-9]{14}$/;

/**
 * Registrera en kastbar Airtable-post som denna körning skapade.
 *
 * FAIL-SOFT MOT TESTET, HÖGLJUDD MOT LOGGEN: ett skrivfel får aldrig fälla ett
 * test som i sak lyckades (raden hade då blivit liggande ändå, bara med ett
 * missvisande rött test bredvid). Setup-purgen är kvar som andra
 * försvarslinje, så konsekvensen av en missad registrering är ett fördröjt
 * städ — inte ett permanent läckage.
 *
 * Ett ID som inte är rec-format skrivs ALDRIG: manifestet ska inte kunna bära
 * skräp som purgens rapport sedan måste förklara.
 */
export function registreraKastbarPost(id: string, vad: string): void {
  if (!REC_ID.test(id)) {
    console.warn(`[kastbara-poster] ignorerar icke-rec-formad post-ID "${id}" (${vad})`);
    return;
  }
  try {
    mkdirSync(dirname(KASTBARA_POSTER_FIL), { recursive: true });
    appendFileSync(KASTBARA_POSTER_FIL, `${JSON.stringify({ id, vad } satisfies KastbarPost)}\n`);
  } catch (err) {
    console.warn(
      `[kastbara-poster] kunde INTE registrera ${id} (${vad}): ${err instanceof Error ? err.message : String(err)}. ` +
        'Raden städas i stället av setup-purgen vid nästa staging-jobb.',
    );
  }
}
