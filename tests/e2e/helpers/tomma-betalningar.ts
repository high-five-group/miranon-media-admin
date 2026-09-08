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
 * LISTAN NEDAN RÄKNAR ANROPSPLATSER, INTE FILER — och det är en rättelse,
 * inte en stilfråga. Den första versionen av detta docblock listade FILER
 * ("BÅDA: event-detail"), vilket lät en fil se täckt ut fastän bara EN av
 * dess tre uppsättnings-funktioner hade stubben; två vägar i samma fil gick
 * omockade mot skarp staging (r1-fynd på PR #2474). En fil är fel
 * granularitet när täckningen bestäms per `page.route`-uppsättning.
 *
 * Anropsplatserna, med form:
 *   · BÅDA (`mockTommaBetalningar`): `event-detail` × 3 — `mockEvent`,
 *     `mockaPersonkort`, `mockaGruppdynamik` (alla tre serverar aktiva
 *     anmälningar till `/event/$eventId`) · `event-bekraftelse` × 1 ·
 *     `event-bor-over` × 1 · `event-deltagare`s kringgåendeblock (det som
 *     inte går via `mocka()` och därför saknar egen belopps-mock).
 *   · ENBART batchen (`mockTommaInbetalningar`): `event-deltagare`s `mocka()`
 *     och `betalningar-inkorg-markera-lage` — båda bär en egen,
 *     ämnesbärande `hamta-oppna-betalningar`-mock som lämnas orörd.
 *
 * INTE STUBBADE, och skälet per plats: `mark-paid.staging.test.ts` mockar båda
 * själv med räknare (förvärmningen ÄR dess ämne sedan TASK-442);
 * `event-narvaro-register` svarar `registrations: []`, och en tom aktiv-lista
 * gatar bort förvärmningen redan i callbacken; `skapa-event` och
 * `aktivitetslogg-skarv` når aldrig en eventdetalj med anmälningar.
 *
 * FIXTURKLASSERNA (acceptance/visual/webblasarbeteende) behöver ingen stub av
 * en ANNAN orsak, och den ska inte blandas ihop med ovanstående: deras
 * webServer byggs med `VITE_FEATURE_BETALNINGAR: 'av'`
 * (`playwright.config.ts`), och `betalningarPa()` är en byggtidskonstant, så
 * callbackens första rad returnerar innan något anrop formuleras. Det är ett
 * KODLÄSNINGS-argument om en enda grind-rad — inte en observation ur att
 * deras körningar är gröna: ett avvisat `prefetchQuery` är per konstruktion
 * osynligt för ett testresultat.
 *
 * ATT LÄCKAGET SYNS ALLS kräver `PLAYWRIGHT_HERMETIK_RAPPORT=1`
 * (`tests/support/test-bas.ts`) — catch-all-vakten som loggar varje
 * icke-lokalt anrop som slank förbi testets egna mockar. I normal drift är
 * den en no-op, och ett omockat förvärmningsanrop är därför tyst. Kör den när
 * en ny uppsättnings-funktion tillkommer.
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
