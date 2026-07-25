import type { Page, Route } from '@playwright/test';

/**
 * Delad get-events-stub för e2e-sviter som besöker eventdetaljsidan.
 *
 * Sedan task-18.19 är sidhuvudets h1 EVENTVÄLJAREN (EventValjare), och dess
 * listquery (`events.list`) fetchar get-events vid mount — en deterministisk
 * svit som mockar sina EF-svar får inte låta det anropet läcka mot staging
 * (latens-/flake-exponering; review-pilotens F3). Varje fil som gör
 * `page.goto('/event/<id>')` mot detalj-INDEXET ska stubba listan — antingen
 * med default-raderna här eller med egna rader via `rows`.
 *
 * Raddatum ligger i 2099 (events-list-precedenten): väljarens kommande-filter
 * jämför mot verklig klocka och testerna får aldrig åldras till rött.
 */

export const GET_EVENTS_GLOB = '**/functions/v1/get-events*';

export type ValjarRad = Record<string, unknown>;

/** Komplett get-events-rad (EF-svarets form — EventSchema .parse:as i
    adaptern). `vantelista` MEDVETET utelämnad: bara get-event aggregerar den
    (ADR-078 beslut 2 — listposten är partiell). `eventKey` ingår: get-events
    levererar den (EF:ens rad 119) och sidhuvudets pill ska kunna stå direkt
    ur placeholdern (review-pilotens F4). */
export function valjarRad(o: {
  id: string;
  namn: string;
  ort?: string | null;
  startdatum: string | null;
  slutdatum?: string | null;
  eventKey?: string;
}): ValjarRad {
  return {
    id: o.id,
    eventlabel: `${o.namn} (label)`,
    eventNamn: o.namn,
    typ: 'Utbildning',
    ort: o.ort !== undefined ? o.ort : 'Skövde',
    startdatum: o.startdatum,
    slutdatum: o.slutdatum ?? o.startdatum,
    tidKvarTillEvent: null,
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    eventKey: o.eventKey,
    borOverAntal: 0,
  };
}

/** Neutrala default-rader: ett kommande event — nog för att väljarens query
    ska få ett giltigt, deterministiskt svar i sviter som inte öppnar den. */
const DEFAULT_RADER: ValjarRad[] = [
  valjarRad({
    id: 'recVALJARDEFAULT',
    namn: 'Framtida event',
    startdatum: '2099-06-01',
    eventKey: 'Event-99',
  }),
];

/** Stubbar get-events deterministiskt (default-rader eller egna via `rows`). */
export async function mockValjarLista(
  page: Page,
  rows: ValjarRad[] = DEFAULT_RADER,
): Promise<void> {
  await page.route(GET_EVENTS_GLOB, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: rows }),
    });
  });
}
