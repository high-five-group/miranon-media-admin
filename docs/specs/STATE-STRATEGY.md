
# STATE-STRATEGY -- State-arkitektur

*Skapad: 2026-04-07 | Integrerad fran gap-analysis.md (Del 2, punkt 6)*
*Galler: miranon-media-admin (React 19 SPA)*

---

## 1. State-kategorisering

Varje bit state tilhor exakt en kategori. Ingen state far leva i "fel" lager.

| Typ | Exempel i Miranon Media | Verktyg | Persistens |
|-----|-------------------|---------|------------|
| Server state | Event, anmalningar, personer | TanStack Query | Cache (staleTime 5 min) |
| URL state | Filter, sokterm, aktiv flik | nuqs | URL (overlever reload) |
| UI state | Modal oppen, tab bar aktiv | useState | Minne |
| Form state | Login-falt, sokfalt | React Aria | Minne |
| Offline state | Koade mutationer | Background Sync | IndexedDB |
| Auth state | Session, tokens | AuthProvider Context | localStorage (1h TTL) |

---

## 2. Per-vy state-plan

> **Sekvensering:** Vyerna byggs i strangler-fig-ordning per P1 Del 4 A3:
> **6a Persons → 6b Events → 6c Registrations + Väntelista → 6d Hem-aggregering → 6e Mer (villkorlig).**
> Fas-prompter i Fas 6 ska INTE plocka Hem-vyn före underliggande domäner är på plats.
> Källa: `docs/research/datamodell-research/07-migration-plan.md` §A2 + `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Del 4 A3.

### Hem (/hem)

| State | Typ | Verktyg |
|-------|-----|---------|
| Dashboard-data | Server | `useQuery(queryKeys.dashboard)` |

Ingen URL state, inga filter. Ingen UI state, inga expanderbara sektioner.

### Event (/event)

| State | Typ | Verktyg |
|-------|-----|---------|
| Event-lista | Server | `useQuery(queryKeys.events.list({ status, sort }))` |
| Status-filter | URL | `nuqs: ?status=upcoming\|past\|all` |
| Sortering | URL | `nuqs: ?sort=date\|name` |

### Event-detalj (/event/$eventId)

| State | Typ | Verktyg |
|-------|-----|---------|
| Event + registreringar | Server | `useQuery(queryKeys.events.detail(id))` |
| Aktiv flik | URL | `nuqs: ?tab=registrations\|payments\|attendance` |
| Expanderade rader | UI | `useState<Set<string>>` |

### Personer (/personer)

| State | Typ | Verktyg |
|-------|-----|---------|
| Personlista | Server | `useInfiniteQuery(queryKeys.persons.search({ q }))` (cursor, ADR-056) |
| Sokterm | URL | `nuqs: ?q=sokterm` |
| Paginering | — | Cursor/"Ladda fler" via `useInfiniteQuery` — INGEN URL-param (opak cursor) |

> **Reviderad (ADR-056, 2026-06-18):** ursprungsraderna angav numerisk `?page` +
> `search({ q, page })`. [ADR-056](../decisions/ADR-056-list-paginerings-port-cursor-dubbel-kalla.md)
> ersatte det med en cursor-baserad paginerings-port (`useInfiniteQuery` + opak
> cursor): `?page` finns inte längre i URL:en (numeriska sidor passar inte
> cursor-modellen), nyckeln bär bara `q`. `?q` består. Se även §3.

### Mer (/mer)

Statisk lista. Ingen dynamisk state.

---

## 3. TanStack Query konfiguration

### Globala defaults

```typescript
// src/providers/query-provider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min -- data anses farsk
      gcTime: 30 * 60 * 1000,          // 30 min -- cachad data lever kvar
      retry: 3,
      retryDelay: (attempt) => Math.min(200 * 2 ** attempt, 2000),
      refetchOnWindowFocus: true,       // Uppdatera nar Lotta atervander
      refetchOnReconnect: 'always',     // Uppdatera nar internet atergar
    },
  },
});
```

### Query key factory

```typescript
// src/queries/keys.ts
export const queryKeys = {
  events: {
    all: ['events'] as const,
    list: (filters: EventFilters) => ['events', filters] as const,
    detail: (id: string) => ['events', id] as const,
  },
  registrations: {
    all: ['registrations'] as const,
    byEvent: (eventId: string) => ['registrations', eventId] as const,
  },
  persons: {
    all: ['persons'] as const,
    // ADR-056: cursor-paginering via useInfiniteQuery → nyckeln bär bara `q`;
    // cursorn skickas som pageParam, aldrig i nyckeln (ingen `page` längre).
    search: (params: { q: string }) => ['persons', params] as const,
  },
  payments: {
    byEvent: (eventId: string) => ['payments', eventId] as const,
  },
  dashboard: ['dashboard'] as const,
} as const;
```

**Hierarkisk invalidering:** `invalidateQueries({ queryKey: queryKeys.events.all })`
invaliderar ALLA event-queries. Perfekt nar Lotta skapar ett nytt event.

### Prefetching via route loaders

```typescript
// src/routes/_authenticated/event/index.tsx
export const Route = createFileRoute('/_authenticated/event/')({
  validateSearch: z.object({
    status: z.enum(['upcoming', 'past', 'all']).default('upcoming'),
    sort: z.enum(['date', 'name']).default('date'),
  }),
  loader: ({ context, search }) =>
    context.queryClient.ensureQueryData(
      eventListQueryOptions({ status: search.status, sort: search.sort })
    ),
  component: EventPage,
});
```

Hover-prefetch via `preload="intent"` pa `<Link>` startar loadern
200-300ms innan Lotta klickar.

---

## 4. Optimistisk UI

Nar Lotta markerar en betalning som betald syns det *direkt*. Om servern
misslyckas rullas det tillbaka med felmeddelande.

> **Errata-not (2026-06-17, ADR-055):** Den bara `dataSource`-referensen i exemplet nedan
> var en illustration — den fastställde aldrig hur datakällan *nås*. **Superseder av
> [ADR-055](../decisions/ADR-055-datakalla-atkomst-router-context-di.md):** `dataSource`
> injiceras via TanStack Router-context (bredvid `queryClient`/`auth`), inte som
> direkt-importerad modul-singleton; den faktiska adapter-metoden är
> `dataSource.updateRecord(operationKey, recordId, fields)` (ej `executeOperation`).
> Historisk text bevarad (additiv not, ej tyst patch).

```typescript
// src/hooks/use-mark-payment.ts
export function useMarkPayment(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      dataSource.executeOperation({
        operationKey: 'registration.set-status',
        recordId: registrationId,
        fields: { Status: 'Bekräftad (mail skickat)' },  // Airtable-shape; target-shape post-Fas E
      }),

    onMutate: async (registrationId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.registrations.byEvent(eventId),
      });
      const previous = queryClient.getQueryData(
        queryKeys.registrations.byEvent(eventId)
      );
      // Optimistisk uppdatering
      queryClient.setQueryData(
        queryKeys.registrations.byEvent(eventId),
        (old: Registration[] | undefined) =>
          old?.map((r) =>
            r.id === registrationId ? { ...r, paymentStatus: 'paid' } : r
          ),
      );
      return { previous };
    },

    onError: (_err, _id, context) => {
      // Rollback till sparad data
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.registrations.byEvent(eventId), context.previous
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations.byEvent(eventId),
      });
    },
  });
}
```

**Samma monster for:** narvaromarkering, skicka paminnelse, uppdatera status.

**Operations-baserat write-API:** klienten skickar `{operationKey, recordId, fields}` (inte `{tableId, ...}`).
Se §8 för det fullständiga mönstret. Operations-registret är sanningskälla för "vad får skrivas av vem."
Fas 6 sub-fas-prompter (6a–6e) refererar §8 direkt — varje sub-fas registrerar sina nya
operations i `supabase/functions/_shared/field-allowlists.ts`.

---

## 5. Supabase Realtime-integration (framtida arkitektur — Fas E)

> **Status:** Defer:ad till **Fas E (Supabase-migration)** per P1 Del 4 B1-beslutet.
> Realtime fungerar inte så länge Airtable är primär DB utan Edge Function-triggers (inte specat).
> Mönstret nedan dokumenteras för Fas E-aktivering, men Fas 6:s Hem-aggregering (6d) använder
> polling-strategin i §5b istället.

Nar Roger registrerar en anmalning medan Lotta har appen oppen ska
hon se det utan att ladda om.

```typescript
// src/hooks/use-realtime-sync.ts
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
}
```

Anropa i `_authenticated.tsx` -- aktiv pa alla autentiserade sidor.

| Tabell | Events | Varfor |
|--------|--------|--------|
| registrations | INSERT, UPDATE, DELETE | Nya anmalningar, statusandringar |
| events | UPDATE | Andringar i event-detaljer |

---

## 5b. Hybrid polling (Fas 6d Hem-aggregering)

Tills Realtime aktiveras (Fas E) använder Hem-vyn polling + pull-to-refresh:

```typescript
// src/routes/_authenticated/hem/index.tsx
export const Route = createFileRoute('/_authenticated/hem/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(dashboardQueryOptions()),
  component: HemPage,
});

// Per-query refetchInterval (60s) på Hem-relevanta queries
function useDashboardQuery() {
  return useQuery({
    ...dashboardQueryOptions(),
    refetchInterval: 60_000,           // 60s polling
    refetchIntervalInBackground: false, // pausar när tabben inte är aktiv
  });
}
```

**Pull-to-refresh-kontroll:** En `<RefreshButton>` i Hem-headern triggar `queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })`. Detta är den enda manuella refresh-affordancen — inga andra vyer behöver den (TanStack Querys `refetchOnWindowFocus` täcker övriga fall).

**Varför 60s, inte 30s eller 5min:** P1 Del 4 B1: 60s är balanspunkt mellan upplevd "live-känsla" (Roger anmäler ny → Lotta ser det inom 1 minut) och kostnadseffektivitet (4 Edge Function-anrop/min × Lottas aktiva minuter ≈ försumbart i Supabase-quoten). Detta är ett **medvetet val**, inte default — ADR i P3 (P1 Del 7 ADR-katalog #7).

**Övergångsväg post-Fas E:** §5-mönstret ovan ersätter §5b. `refetchInterval: 60_000` tas bort. `useRealtimeSync()` aktiveras i `_authenticated.tsx`. Migration kan ske domän-för-domän — registrations först (mest värde), events sist (lägst frekvens av ändringar).

---

## 6. Offline state

Lottas mest kritiska scenario: ta narvaro pa event-plats med dalig uppkoppling.

### IndexedDB for koade mutationer

```typescript
// src/lib/offline-queue.ts
import { openDB } from 'idb';

async function getDB() {
  return openDB('miranon-offline', 1, {
    upgrade(db) {
      db.createObjectStore('pending-mutations', { keyPath: 'id', autoIncrement: true });
    },
  });
}

export async function queueMutation(mutation: {
  type: 'mark-attendance' | 'mark-payment' | 'send-reminder';
  payload: Record<string, unknown>;
  timestamp: number;
}) {
  const db = await getDB();
  await db.add('pending-mutations', mutation);
}
```

### Background Sync

Service workern synkar koade mutationer nar internet atergar:

```typescript
// public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncPendingMutations());
  }
});
```

**Konfliktlosning:** Last-write-wins med timestamp. For narvaromarkering
ar detta tillrackligt -- ordningen spelar ingen roll.

**Bekraftelse:** `alertScreenReader('3 andringar har synkroniserats.')` efter sync.

---

## 7. Beslutstrad

```text
1. Kommer datan fran ett API?     -> TanStack Query
2. Ska det overleva page reload?  -> URL state (nuqs)
3. Ska det overleva app-stangning? -> localStorage / IndexedDB
4. Ar det enbart UI-state?        -> useState
5. Ar det en mutation?            -> useMutation med optimistisk UI
```

### Snabbreferens

| "Lotta vill..." | Typ | Verktyg |
|------------------|-----|---------|
| Se event-listan | Server | `useQuery(queryKeys.events.list(...))` |
| Filtrera pa status | URL | `nuqs: ?status=upcoming` |
| Vaxla flik i event-detalj | URL | `nuqs: ?tab=payments` |
| Expandera en rad | UI | `useState<Set<string>>` |
| Markera som betald | Mutation | `useMutation` + optimistisk UI |
| Soka bland personer | URL | `nuqs: ?q=sokterm` |
| Markera narvaro offline | Offline | IndexedDB + Background Sync |
| Forbli inloggad | Auth | localStorage (1h TTL) |

---

## 8. Operations-baserat write-API (Fas A M4)

> **Källa:** Implementerat i Fas A M4 (`supabase/functions/_shared/field-allowlists.ts` + `update-record/index.ts`).
> Detaljerad spec: `SECURITY-SPEC.md §6.1` + `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md`.
> Denna sektion är klient-sidans referens — den ska refereras från Fas 6 sub-fas-prompter (6a–6e).

### 8.1 Mönster

Klient skickar `{operationKey, recordId, fields}` till Edge Function `update-record`:

```typescript
// src/data/adapters/AirtableAdapter.ts (förenklat)
async executeOperation(args: {
  operationKey: string;        // domännamn, t.ex. 'registration.set-status'
  recordId: string;            // Airtable record-ID, t.ex. 'recXYZ123'
  fields: Record<string, unknown>;  // fältvärden — INTE råa table-IDs
}): Promise<UpdateResult> {
  return postEdgeFunction<UpdateResult>('update-record', args);
}
```

Edge Function:

1. Verifierar caller via `requireUser(req, corsHeaders)` (`SECURITY-SPEC §6.3`)
2. Slår upp `operationKey` i `field-allowlists.ts` → `{tableId, allowedFields[]}`
3. Avvisar 400 om okänd operation eller fält utanför allowlist (deny-by-default)
4. Skickar PATCH till Airtable med strikt validerade fält
5. Loggar med `{requestId, callerUserId, operationKey}` (`SECURITY-SPEC §6.7`)

### 8.2 Per-vy operations-registrering

Varje Fas 6 sub-fas registrerar sina operations innan vyn levereras:

| Sub-fas | Domän | Förväntade operations |
|---|---|---|
| 6a | Persons | `person.update-note`, `person.update-flag` |
| 6b | Events | (ingen write — info-vy + närvaro-flik som läs-only) |
| 6c | Registrations + Väntelista | `registration.set-status`, `registration.mark-paid`, `registration.create` (idempotency-ADR), `waitlist.convert-to-registration` |
| 6d | Hem-aggregering | (ingen ny write — aggregerar 6a/6b/6c-data) |
| 6e | Mer (villkorlig) | `email.send` (direct-Resend-skuld-ADR), `lead.flag` om Leads behålls |

Per-sub-fas-DoD: tillhörande operation registrerad i `field-allowlists.ts`, deny-test grönt (400 vid okänd op), allow-test grönt (200 vid valid op).

### 8.3 K9-respekt: domännamn vs table-IDs

`'registration.set-status'` är ett *domännamn*. `'tbloOcrppVoyrHbrq'` är ett *table-ID*. Klient-API:t exponerar enbart domännamn. Table-ID-mappningen lever i `field-allowlists.ts` på server-sidan. Detta:

- Gör klient-koden migreringsbar mot Supabase utan API-ändring (operations-namn behålls, mappning byts från Airtable till Postgres-tabell)
- Skyddar mot felmappning vid future S-track (target-tabeller har UUID-IDs, inte Airtable-format)
- Gör operations-registret till en explicit kontraktsyta, inte en sidoartefakt

### 8.4 Optimistic mutation-mönster (refererad från §4)

`useMutation`-mönstret i §4 wrappar `executeOperation` med onMutate (snapshot + optimistisk uppdatering), onError (rollback), onSettled (invalidate). Mönstret är samma — bara mutationFn-anropet ändras (operations-baserat istället för direct-method).

**ADR-krav i P3:** "TanStack optimistic mutation-mönster med operations-baserat API" (P1 Del 7 ADR #6). Skrivs i Fas 5.5.

### 8.5 Korsreferenser

- `SECURITY-SPEC.md §6.1` — server-sidans definition (operations-registret, deny-by-default)
- `byggplan-direktiv.md §8.5.4` — Fas A:s arkitekturmönster-översikt
- `tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md` — Fas A:s implementations-detaljer
- `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` Del 4 A3 + Del 7 ADR-katalog

---

## 9. Anti-monster

| Anti-monster | Varfor fel | Ratt losning |
|--------------|-----------|--------------|
| Global store (Redux/Zustand) | Ingen komplex delad klient-state | TanStack Query + useState + URL |
| `useEffect` for datahemtning | Race conditions, ingen cache | TanStack Query |
| Filter i useState | Forsvinner vid reload, back-knappen bryts | nuqs (URL state) |
| localStorage for server-data | Ingen invalidering, manuell JSON | TanStack Query cache |
| Props-drilling for auth | 5+ nivaer prop-forwarding | AuthProvider Context |

---

## Sammanfattning

| Princip | Regel |
|---------|-------|
| Server state | TanStack Query -- alltid. Ingen `useEffect` + `fetch`. |
| URL state | nuqs -- allt som bor overleva reload eller delas via lank. |
| UI state | useState -- bara lokalt for en komponent. |
| Mutationer | useMutation med optimistisk UI -- Lotta vantar aldrig. |
| Offline | IndexedDB + Background Sync -- appen dor aldrig. |
| Auth | Context med localStorage TTL. |

**Principen:** Varje bit state har exakt ett hem. Om du ar osaker,
folj belutsatradet (sektion 7).
