import type { Page, Route } from '@playwright/test';

/**
 * Delade tom-stubbar för eventsidans TVÅ betalnings-EF:er.
 *
 * TASK-442: eventdetaljens deltagarlista (`Deltagare.tsx`s `ArbetsKo`)
 * förvärmer sedan denna skiva BÅDA frågorna bakom "Öppna detaljer" — belopp
 * (`hamta-oppna-betalningar`) och inbetalningar (`hamta-inbetalningar`,
 * batch-vägen, POST) — vid SIDMONTERING, inte längre vid klicket
 * (`data/betalningar/useBetalningar.ts` § `useForberedEventBetalningar`).
 * Varje e2e-svit som besöker `/event/$eventId` med minst en aktiv anmälan
 * träffar därför nu TVÅ begäranden den inte bad om.
 *
 * SAMMA KLASS OCH SAMMA LÖSNING SOM `helpers/tom-narvaro.ts` (TASK-416.16)
 * och `helpers/tomma-anteckningar.ts` (task-47): de flesta sviter bryr sig
 * inte om svarens EGNA form (den bevisas av
 * `tests/e2e/mark-paid.staging.test.ts`, som mockar båda själv med räknare)
 * och stubbar därför tomt, så sidans övriga sviter förblir deterministiska i
 * stället för att skicka restrafik mot staging vid varje sidladdning.
 *
 * DÄRFÖR ÄR STUBBARNA SEPARERADE, inte bara buntade: en svit som redan
 * mockar `hamta-oppna-betalningar` själv ska ta ENBART den den saknar
 * (`mockTommaInbetalningar`), i stället för att lita på att Playwrights
 * route-ordning (omvänd registreringsordning — senast registrerad prövas
 * först) råkar låta dess egen mock vinna. En stub som bara fungerar så länge
 * ingen flyttar en rad är en fälla, inte en söm.
 *
 * Filerna som fick stubben vid TASK-442, och vilken form:
 *   · BÅDA (`mockTommaBetalningar`): `event-detail`, `event-bekraftelse`,
 *     `event-bor-over` — navigerar till bare `/event/$eventId` med aktiva
 *     anmälningar och hade ingen av mockarna.
 *   · ENBART batchen (`mockTommaInbetalningar`): `event-deltagare`,
 *     `betalningar-inkorg-markera-lage` — bär en egen, ämnesbärande
 *     `hamta-oppna-betalningar`-mock som lämnas orörd.
 *
 * INTE STUBBADE, mätt och medvetet: `mark-paid.staging.test.ts` mockar båda
 * själv med räknare (förvärmningen ÄR dess ämne sedan TASK-442);
 * `event-narvaro-register` svarar `registrations: []`, och en tom aktiv-lista
 * gatar bort förvärmningen redan i callbacken; `skapa-event` och
 * `aktivitetslogg-skarv` når aldrig en eventdetalj med anmälningar; hela
 * acceptance-/visual-/webblasarbeteende-klassen kör med
 * `VITE_FEATURE_BETALNINGAR: 'av'` (`playwright.config.ts`), och flaggan
 * gatar förvärmningen.
 */

export const HAMTA_OPPNA_BETALNINGAR_GLOB = '**/functions/v1/hamta-oppna-betalningar*';
export const HAMTA_INBETALNINGAR_GLOB = '**/functions/v1/hamta-inbetalningar*';

/** Stubbar belopps-frågan deterministiskt: inga öppna betalningar. */
export async function mockTommaOppnaBetalningar(page: Page): Promise<void> {
  await page.route(HAMTA_OPPNA_BETALNINGAR_GLOB, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ betalningar: [], forfallna: 0 }),
    });
  });
}

/**
 * Stubbar batch-frågan servertroget: en TOM grupp per efterfrågat id, precis
 * som `hamta-inbetalningar` svarar för anmälningar utan rader. GET-vägen (per
 * anmälan/person) används inte av eventsidan och släpps vidare, så ett sådant
 * anrop förblir synligt i stället för att tystas av denna stub.
 */
export async function mockTommaInbetalningar(page: Page): Promise<void> {
  await page.route(HAMTA_INBETALNINGAR_GLOB, async (route: Route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const kropp = JSON.parse(route.request().postData() ?? '{}') as {
      anmalanRecordIds?: string[];
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        grupper: (kropp.anmalanRecordIds ?? []).map((id) => ({
          anmalanRecordId: id,
          inbetalningar: [],
          kvitton: [],
          jobbfel: [],
        })),
      }),
    });
  });
}

/** Båda tom-stubbarna i ett anrop — normalfallet för en svit som bara vill
    att eventsidans förvärmning ska vara deterministisk. */
export async function mockTommaBetalningar(page: Page): Promise<void> {
  await mockTommaOppnaBetalningar(page);
  await mockTommaInbetalningar(page);
}
