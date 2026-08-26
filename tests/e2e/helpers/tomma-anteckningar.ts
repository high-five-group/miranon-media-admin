import type { Page, Route } from '@playwright/test';

/**
 * Delad tom-stub för get-event-notes.
 *
 * Anteckningar-gruppen (task-18.11) fetchar get-event-notes för VARJE event
 * som visas på eventdetaljsidan. De flesta e2e-sviter bryr sig inte om
 * anteckningsströmmens EGNA beteenden (de bevisas i
 * `tests/acceptance/event-anteckningar.acceptance.test.ts`, dit filen
 * flyttade i task-59.6) och stubbar därför tomt, så sidans övriga sviter
 * förblir deterministiska.
 *
 * TASK-47: innan denna modul fanns stubben kopierad byte-för-byte i sex
 * filer (`event-detail` som `mockNotes()`, `event-bekraftelse`,
 * `event-bor-over`, `event-deltagare` (två anropsställen), `mark-paid`,
 * `aktivitetslogg-skarv`) — samma shotgun surgery-klass som
 * `helpers/valjar-lista.ts` löste för get-events-stubben (task-18.19).
 */

export const GET_EVENT_NOTES_GLOB = '**/functions/v1/get-event-notes*';

/** Stubbar get-event-notes deterministiskt till en tom lista. */
export async function mockTommaAnteckningar(page: Page): Promise<void> {
  await page.route(GET_EVENT_NOTES_GLOB, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ notes: [] }),
    });
  });
}
