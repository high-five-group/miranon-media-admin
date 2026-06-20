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
  events: {
    all: ['events'] as const,
    // Fas 6b L1: STABIL nyckel — `fetchEvents()` hämtar HELA listan (inga
    // params), status-filter + sort sker klient-side via useMemo. Nyckeln bär
    // därför INTE status/sort (de skulle annars refetcha samma data per ändring).
    // Skiljer sig medvetet från STATE-STRATEGY §3:s `list({ status, sort })` som
    // beskriver target-server-shapen (post-Fas E, när get-events tar params).
    list: ['events', 'list'] as const,
    // Event-detalj (Fas 6b L2): aggregerande get-event per record-ID.
    detail: (id: string) => ['events', 'detail', id] as const,
    // Närvaro per event (Fas 6b L3): get-attendance (Deltaganden filtrerade på
    // eventId). Egen gren så närvaro-cachen kan invalideras oberoende av detaljen.
    attendance: (eventId: string) => ['events', 'attendance', eventId] as const,
  },
  persons: {
    all: ['persons'] as const,
    // Cursor-paginering via `useInfiniteQuery` (ADR-056): nyckeln bär ENBART
    // sökterm `q`. Cursorn skickas som `pageParam` och ingår ALDRIG i nyckeln —
    // alla sidor för en given `q` ackumuleras under samma cache-entry. (Ersätter
    // STATE-STRATEGY §3:s `search({ q, page })` — opak cursor, inga numeriska sidor.)
    search: (params: { q: string }) => ['persons', params] as const,
    // Persondetalj (Fas 6a L5a): aggregerande get-person per record-ID. Egen
    // gren under 'persons' så detalj-cachen kan invalideras oberoende av listan.
    detail: (id: string) => ['persons', 'detail', id] as const,
  },
} as const;
