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
    // Eventformat-poster för create-event:s Eventtyp-dropdown (Fas 6f L2): GLOBAL läs-
    // lista (get-event-formats). STABIL nyckel — `getEventFormats()` hämtar alla format,
    // inga klient-filters. Speglar waitlist.all-formen (parameterlös global lista).
    formats: ['events', 'formats'] as const,
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
  waitlist: {
    // Väntelista (Fas 6c Leverabel 3): GLOBAL läs-lista (get-waitlist). STABIL
    // nyckel — `fetchWaitlist()` hämtar HELA den aktiva listan (NOT Flyttad),
    // vy-konsumenten passar inga filters. Nyckeln bär därför inget eventId-arg
    // (speglar events.list-mönstret: global hämtning, ingen param i nyckeln).
    all: ['waitlist'] as const,
  },
  intresserade: {
    // Intresserade/leads (Fas 6e L1 Landning 3): GLOBAL läs-lista (get-leads).
    // STABIL nyckel — `fetchIntresserade()` hämtar FÖRSTA sidan av den strikta
    // lead-mängden (hämtat något, noll Anmälningar totalt), inga klient-filters.
    // Speglar waitlist.all-formen: parameterlös global lista, ingen param i nyckeln.
    all: ['intresserade'] as const,
  },
  maillog: {
    // Maillogg/utskickslogg (Fas 6e L2 Landning 2): GLOBAL läs-lista (get-mail-log).
    // STABIL nyckel — `fetchMailLog()` hämtar HELA utskicksloggen (ingen filter/event-
    // gren), inga klient-filters. Speglar waitlist.all-formen: parameterlös global lista.
    all: ['maillog'] as const,
  },
  segment: {
    // App-sparade segment (Fas 6g L3, ADR-065): GLOBAL läs-lista (get-segments). STABIL
    // nyckel — `listSegments()` hämtar alla app-sparade segment (legacy Make-rader
    // exkluderas server-side), inga klient-filters. Speglar waitlist.all-formen.
    // `saveSegment`-mutationen invaliderar denna nyckel → listan refetchar.
    saved: ['segment', 'saved'] as const,
    // Mottagar-antal för ETT sparat segment inför send (Fas 6h L3): compute-segment
    // på segmentets egen regel. PER-SEGMENT-nyckel (record-ID) → cachas så att om-val
    // av samma segment inte re-walkar källan; ett annat segment → egen fetch.
    sendRecipients: (segmentId: string) => ['segment', 'sendRecipients', segmentId] as const,
  },
  dashboard: {
    // Hem-aggregering (Fas 6d). EGNA nycklar, MEDVETET skilda från events.list /
    // registrations.byEvent: Hem-vyns cards hämtar GLOBALA listor (alla event,
    // alla anmälningar — inget eventId) och L2 lägger 60s-polling enbart på
    // dashboard-grenen (ADR-017). Egna nycklar gör polling-scopet exakt — /event-
    // listans cache ska inte tvingas polla för att Hem gör det. Två komponenter
    // som delar `registrations`-nyckeln dedupas av React Query till EN fetch.
    all: ['dashboard'] as const,
    registrations: ['dashboard', 'registrations'] as const,
    events: ['dashboard', 'events'] as const,
  },
} as const;
