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
/**
 * Hem-spaltens "Senaste aktivitet"-korts radantal (TASK-201.7,
 * `SenasteAktivitet.tsx`) — ENDA SANNINGSKÄLLAN för talet (TASK-218.3).
 *
 * Fram till denna rad speglade `startvarmningen.ts` (`src/data/warmup/`)
 * talet som en egen hårdkodad, ospårad konstant — bokfört öppet av
 * TASK-218.1-agenten som KÄND KOPPLINGSRISK: `limit` är DEL av
 * `queryKeys.activityLog.latest(limit)`, så en warmup-seedning med fel tal
 * skriver en cache-post ingen konsument läser. Denna export löser driften:
 * komponenten OCH warmup-motorn importerar BÅDA härifrån i stället för att
 * hårdkoda sitt eget tal. Hemvisten är `queries/keys.ts` — inte komponenten
 * — av lagerriktningsskäl: warmup-motorn (`src/data/warmup/`) får aldrig
 * importera en UI-komponent, men får (liksom komponenten) importera denna
 * datalagerfil; den riktningen är redan etablerad (warmup importerar
 * `queryKeys` härifrån sedan TASK-218.1).
 */
export const HEM_SENASTE_AKTIVITET_ANTAL = 4;

export const queryKeys = {
  registrations: {
    all: ['registrations'] as const,
    byEvent: (eventId: string) => ['registrations', eventId] as const,
    // Per-anmälan-detalj (task-18.17): aggregerande get-registration per
    // record-ID. Egen gren under 'registrations' (persons.detail-mönstret) så
    // detalj-cachen kan invalideras oberoende av event-listorna — och tvärtom:
    // `invalidateQueries({ queryKey: registrations.all })` träffar båda.
    detail: (id: string) => ['registrations', 'detail', id] as const,
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
    // Anteckningar per event (task-18.11, ADR-075): get-event-notes (Anteckningar
    // via eventets omvända länk). Egen gren så antecknings-strömmen kan invalideras
    // av useCreateEventNote oberoende av event-detaljen.
    notes: (eventId: string) => ['events', 'notes', eventId] as const,
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
    //
    // [UTAN KONSUMENT SEDAN TASK-286.2] `PersonsList` läser inte längre denna
    // nyckel (bytt mot `register` nedan, ADR-123). Nyckeln och sin adapter-metod
    // (`listPersons`) lever kvar orörda tills TASK-286.3 river dem — ingen
    // big-bang-rivning (ADR-123 § Beslut 1).
    search: (params: { q: string }) => ['persons', params] as const,
    // HELA personregistret (ADR-123 beslut 1, TASK-286.2) — PARAMETERLÖS,
    // STABIL nyckel (speglar `events.list`/`waitlist.all`-formen): en global
    // lista, inga klient-filter i nyckeln. `PersonsList` läser denna EN gång
    // (global 5 min staleTime, TASK-286.4 höjer den efter bevisad invalidering)
    // och söker/paginerar i minnet på den laddade arrayen — se
    // `src/lib/person-sok.ts`. `TabBar.tsx` prefetchar samma nyckel på
    // hover/fokus (ADR-078 beslut 3).
    register: ['persons', 'register'] as const,
    // Persondetalj (Fas 6a L5a): aggregerande get-person per record-ID. Egen
    // gren under 'persons' så detalj-cachen kan invalideras oberoende av listan.
    detail: (id: string) => ['persons', 'detail', id] as const,
    // Anteckningar per person (S103, T97-bygg-spåret): get-person-notes (samma
    // additiva Anteckningar-tabell som events.notes, ADR-075 utökad med ett
    // Person-länkfält). Egen gren så antecknings-strömmen kan invalideras av
    // useCreatePersonNote oberoende av persondetaljen — speglar events.notes.
    notes: (personId: string) => ['persons', 'notes', personId] as const,
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
  attachments: {
    // Eventets bilagor (TASK-147.5): get-event-attachments (Bilagor via eventets
    // omvända länk). Egen gren, PER-EVENT-nyckel (mönster ur events.notes)
    // — bilageväljaren och granskningsytans "valda bilagor"-summering delar
    // samma cache-entry, ingen dubbel-fetch när båda monteras kort efter varandra.
    //
    // [RIVET, TASK-273.4] `downloadUrl`/`documentPreviews` (nedan, tidigare
    // ett eget top-level-block) fanns bara för Visa-dialogens lazy
    // `useQuery({enabled: isOpen})`-mönster. Ikonparet som ersatte dialogen
    // (`DokumentAtgardsKnappar`, DokumentYta.tsx) hämtar imperativt via
    // `useMutation` vid klick i stället — inget cache-bundet läsläge kvar
    // att nyckla. Git bevarar formen (`git log -p -- src/queries/keys.ts`).
    byEvent: (eventId: string) => ['attachments', eventId] as const,
    // [TASK-275.3, ADR-118 beslut 5] Räckviddslägets lista (ALLA gemensamma
    // bilagor, inget event) — EGEN gren under SAMMA `'attachments'`-prefix
    // som `byEvent`, medvetet: en uppladdning/ersättning/radering av en
    // GEMENSAM bilaga kan påverka VILKET events union-fråga som helst (inte
    // bara det event Lotta råkar stå på), så mutationerna invaliderar hela
    // `all`-prefixet nedan (`exact: false`, React Querys default) i stället
    // för att försöka räkna ut exakt vilka event-nycklar som berörs —
    // `gemensamma` fångas då automatiskt i samma svep.
    gemensamma: ['attachments', 'gemensamma'] as const,
    /** Invalideringsroten (TASK-275.3): matchar `byEvent(*)` OCH `gemensamma`
        — se ovan för varför en bred invalidering är RÄTT här, inte en genväg. */
    all: ['attachments'] as const,
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
  activityLog: {
    // ROT-nyckeln (TASK-210) — prefixet BÅDA grenarna nedan delar. Enda
    // konsument: `recordActivity`s invalidering efter en lyckad loggning.
    // Prefix, inte `latest`-nyckeln ensam, MEDVETET: en ny post gör hela
    // loggen inaktuell, och VILKEN filterkombination i `history` den råkar
    // matcha vet bara servern — att gissa det klient-side vore fel. Kostnaden
    // är noll extra nätverksanrop: `invalidateQueries` refetchar bara AKTIVA
    // (monterade) queries, och spalten (`/hem`) och historikvyn
    // (`/mer/aktivitetshistorik`) kan aldrig vara monterade samtidigt.
    // Inaktiva filterkombinationer markeras bara stale och hämtas om först
    // om de återbesöks.
    all: ['activityLog'] as const,
    // Aktivitetshistoriken (TASK-201.6, kärnvyn): cursor-paginerad via
    // `useInfiniteQuery` (ADR-056-mönstret, `persons.search`-precedenten).
    // Nyckeln bär FILTERPARAMETRARNA (kategori/eventId/tidsintervall) —
    // de ändrar VILKEN datamängd get-activity-log-EF:en hämtar server-side,
    // så olika filter måste ge olika cache-poster (speglar `persons.search`s
    // `q`-resonemang). Cursorn skickas som `pageParam`, ALDRIG i nyckeln —
    // alla sidor för samma filterkombination ackumuleras i samma cache-entry.
    history: (filters: { category?: string; eventId?: string; from?: string; to?: string }) =>
      ['activityLog', 'history', filters] as const,
    // Hem-spaltens "Senaste aktivitet" (TASK-201.7): EN liten, opaginerad
    // sida. Egen gren (parametrerad bara med `limit`) så spaltens cache
    // aldrig krockar med historikvyns ackumulerade sidor — speglar
    // `dashboard`s "egna nycklar gör scopet exakt"-resonemang.
    latest: (limit: number) => ['activityLog', 'latest', limit] as const,
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
