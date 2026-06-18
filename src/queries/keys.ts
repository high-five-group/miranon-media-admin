/**
 * Query-key-factory (STATE-STRATEGY.md §3). Hierarkiska, `as const`-typade
 * nycklar så att invalidering kan ske på olika nivåer:
 * `invalidateQueries({ queryKey: queryKeys.registrations.all })` träffar alla
 * registreringar; `...byEvent(id)` bara ett events.
 *
 * Minimal vid Fas 5.5 K2 — växer per Fas 6-sub-fas allteftersom fler queries
 * läggs till (events, persons, dashboard …). En enda sanningskälla för nycklar
 * så list-query och mutation-cache-ops aldrig kan divergera.
 */
export const queryKeys = {
  registrations: {
    all: ['registrations'] as const,
    byEvent: (eventId: string) => ['registrations', eventId] as const,
  },
  persons: {
    all: ['persons'] as const,
    // STATE-STRATEGY §3 specificerar `search({ q, page })` — den signaturen
    // antog server-side paginering. `get-persons` exponerar bara `search`
    // (filterByFormula) + `limit` (maxRecords), INGEN offset/cursor. Därför
    // paginerar Fas 6a klient-sida och `page` ingår INTE i fetch-nyckeln:
    // vore den med, skulle hela q-setet (568 records) refetchas per sidklick.
    // Nyckeln bär `q`; `page` är ren URL→klient-slice (nuqs). En framtida
    // offset-kapabel EF återinför `{ q, page }` — defererat (Session 23 L2-flagg).
    search: (params: { q: string }) => ['persons', params] as const,
  },
} as const;
