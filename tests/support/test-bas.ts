/**
 * Delad `test`-bas för e2e-sviten (S91, mätningens steg 1).
 *
 * HEMVISTEN ÄR KLASSDELAD, INTE E2E-ÄGD (task-110, tråd T103). Modulen bodde
 * till och med task-109 under `tests/e2e/support/`, vilket lästes som ägarskap
 * — men sedan task-59.3 komponerar acceptance-klassens söm
 * (`tests/acceptance/acceptance-bas.ts` — platt fil sedan TASK-123, tidigare
 * `tests/acceptance/support/acceptance-bas.ts`) BÅDA fixturmodulerna via
 * `mergeTests` och importerar alltså tvärs klassgränsen. Samma skäl som
 * flyttade fixturvärlden i task-59.1. Flytten var ren: noll beteendeändring,
 * bevisad med `PLAYWRIGHT_HERMETIK_RAPPORT=1` före och efter.
 *
 * VARFÖR FILEN FINNS: e2e-sviten saknade helt en gemensam söm — samtliga 32
 * filer importerade `test` direkt ur `@playwright/test`. Det gjorde det
 * omöjligt att applicera någonting tvärs över sviten utan att röra varje fil,
 * vilket i sin tur var skälet till att restrafiken mot staging aldrig hade
 * kunnat mätas. Sömmen är alltså inte bara medlet för mätningen; frånvaron av
 * den var en del av problemet.
 *
 * VAD DEN GÖR I DAG: exakt ingenting, om inte `PLAYWRIGHT_HERMETIK_RAPPORT=1`
 * är satt. Fixturen är en no-op i normal drift — inga routes registreras, inga
 * filer skrivs, ingen mätbar kostnad. Det är avsiktligt: ett mätinstrument som
 * ändrar det det mäter är värdelöst, och ett som ligger påslaget i skarp drift
 * är en risk utan motprestation.
 *
 * MÄTLÄGET (`PLAYWRIGHT_HERMETIK_RAPPORT=1`): en catch-all-route registreras
 * FÖRE testkroppen, vilket i Playwright betyder att den prövas SIST — routes
 * matchas i omvänd registreringsordning. Testets egna mockar fångar alltså
 * sina anrop först, och vakten ser enbart det som slank förbi dem. Det är
 * precis restrafiken frågan gäller.
 *
 * RAPPORTERANDE, INTE AVBRYTANDE: anropet släpps igenom med `fallback()` efter
 * loggning. Sviten ska bete sig identiskt under mätningen — annars mäter vi en
 * annan svit än den vi vill flytta. Fixturvärldens vakt
 * (`tests/support/fixturvarld/hermetic.ts`) `abort`:ar i stället; det är rätt
 * läge där, och det är läget steg 2 ska använda när filer faktiskt flyttas
 * till ett mutexfritt jobb.
 *
 * Källa: docs/research/staging-svitens-tidsbudget-2026-07-26.md § 5 steg 1.
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { test as base } from '@playwright/test';
import { HERMETIK_RAPPORT_FIL } from './hermetik-rapport-fil';

export { expect, type Page, type Request, type Route } from '@playwright/test';

/** Aktiveras enbart när mätningen körs; annars är hela fixturen en no-op. */
const RAPPORT_AKTIV = process.env.PLAYWRIGHT_HERMETIK_RAPPORT === '1';

/**
 * JSONL — en rad per restanrop. Formatet är rad-per-händelse just för att
 * flera Playwright-workers skriver samtidigt: korta `appendFileSync`-skrivningar
 * radbryts inte av varandra på POSIX, medan en delad JSON-array hade krävt
 * läs-modifiera-skriv och tappat rader.
 */
const RAPPORT_FIL = HERMETIK_RAPPORT_FIL;

function ärLokal(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export const test = base.extend<{ hermetikRapport: void }>({
  hermetikRapport: [
    async ({ page }, use, testInfo) => {
      if (!RAPPORT_AKTIV) {
        await use();
        return;
      }

      mkdirSync(dirname(RAPPORT_FIL), { recursive: true });

      // Registreras här = prövas sist. Se filhuvudet om ordningen.
      await page.route('**/*', (route) => {
        let hostname = '';
        let pathname = '';
        try {
          const url = new URL(route.request().url());
          hostname = url.hostname;
          pathname = url.pathname;
        } catch {
          // Ogiltig URL (data:, blob:) — inte staging-trafik, inget att logga.
          return route.fallback();
        }

        if (!ärLokal(hostname)) {
          appendFileSync(
            RAPPORT_FIL,
            `${JSON.stringify({
              fil: testInfo.titlePath[0] ?? testInfo.file,
              test: testInfo.title,
              projekt: testInfo.project.name,
              host: hostname,
              metod: route.request().method(),
              sokvag: pathname,
            })}\n`,
          );
        }

        // RAPPORTERANDE läge: släpp igenom. Sviten ska bete sig identiskt.
        return route.fallback();
      });

      await use();
    },
    { auto: true },
  ],
});
