
# URL-STATE-SPEC — URL-state per vy

*Skapad: 2026-04-07 | Integrerad fran gap-analysis.md (Fas 2, punkt 1 + Del 2, punkt 6)*
*Galler: miranon-media-admin (React 19 SPA)*

---

## Princip

URL:en ar appens delningsbara state. Om Lotta filtrerar event pa "kommande" och Roger vill se samma vy -- hon kopierar URL:en. Om Lotta trycker Back -- filtret aterstalls. Om Lotta bokmarker en sokning -- den finns kvar.

Allt som paverkar **VAD** som visas (filter, sortering, sokning, aktiv flik) lever i URL:en.
Allt som paverkar **HUR** det visas (modal oppen, meny expanderad, skeleton synlig) lever i `useState`.

| State-typ | Lever i | Exempel |
|-----------|---------|---------|
| Serverdata | TanStack Query | Event, anmalningar, personer |
| URL-state | nuqs | Filter, sort, sok, flik, sida |
| UI-state | useState | Modal oppen, dropdown expanderad |
| Formular | React Aria Form | Login-input, sokfalt-text |

## nuqs-konfiguration

```typescript
// nuqs v2 med TanStack Router-adapter
import { useQueryState, parseAsString, parseAsInteger, parseAsStringEnum } from 'nuqs';
```

TanStack Router ager routens schema (Zod-validering i loaders). nuqs ager komponent-niva URL-state (las/skriv direkt i React-komponenter). De tva systemen samexisterar utan konflikt.

---

## Per-vy specifikation

### Hem (`/hem`)

Ingen URL-state. Hem visar alltid aktuell status. Inget att bokmerka, inget att dela.

### Event (`/event`)

| Param | Typ | Default | Parsning |
|-------|-----|---------|----------|
| `status` | `'upcoming' \| 'past' \| 'all'` | `'upcoming'` | `parseAsStringEnum` |
| `sort` | `'date' \| 'name' \| 'capacity'` | `'date'` | `parseAsStringEnum` |

```typescript
const [status, setStatus] = useQueryState(
  'status',
  parseAsStringEnum(['upcoming', 'past', 'all']).withDefault('upcoming')
);
const [sort, setSort] = useQueryState(
  'sort',
  parseAsStringEnum(['date', 'name', 'capacity']).withDefault('date')
);

// /event                          → upcoming + date (defaults, inga synliga params)
// /event?status=past              → past + date
// /event?status=all&sort=name     → all + name
```

Koppling till TanStack Query -- nar `status` eller `sort` andras via nuqs andras query key automatiskt:

```typescript
const { data: events } = useSuspenseQuery({
  queryKey: ['events', { status, sort }],
  queryFn: () => dataSource.fetchEvents({ status, sort }),
});
```

### Event-detalj (`/event/$eventId`)

| Param | Typ | Default | Parsning |
|-------|-----|---------|----------|
| `tab` | `'registrations' \| 'payments' \| 'attendance'` | `'registrations'` | `parseAsStringEnum` |

```typescript
const [tab, setTab] = useQueryState(
  'tab',
  parseAsStringEnum(['registrations', 'payments', 'attendance']).withDefault('registrations')
);
// /event/rec123?tab=payments → Roger skickar Lotta direkt till betalningsfliken
```

### Personer (`/personer`)

| Param | Typ | Default | Parsning |
|-------|-----|---------|----------|
| `q` | `string` | `''` | `parseAsString` |
| `page` | `integer` | `1` | `parseAsInteger` |

Debounced sokning med nuqs + `useDeferredValue` (React 19):

```tsx
function PersonerPage() {
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const deferredQ = useDeferredValue(q); // UI uppdateras direkt, query vanter
  const isStale = q !== deferredQ;

  const { data: persons } = useSuspenseQuery({
    queryKey: ['persons', { q: deferredQ, page }],
    queryFn: () => dataSource.searchPersons({ q: deferredQ, page, pageSize: 25 }),
  });

  return (
    <>
      <SearchField
        value={q}
        onChange={(value) => { setQ(value); setPage(1); }}
        aria-label="Sok person"
      />
      <div aria-busy={isStale} className={isStale ? 'opacity-60' : ''}>
        <PersonList persons={persons.items} />
      </div>
      <Pagination current={page} total={persons.totalPages} onChange={setPage} />
    </>
  );
}
```

### Mer (`/mer`)

Ingen URL-state. Statiska lankar -- inget att filtrera eller dela.

---

## Back-knapp-beteende

nuqs skriver till `window.history` via `pushState` (default) eller `replaceState`. Nar Lotta trycker Back:

1. Webblasaren aterstaller foregaende URL
2. nuqs laser den nya URL:en och uppdaterar React-states
3. TanStack Query visar cachad data direkt (stale-while-revalidate)
4. Lotta ser exakt den vy hon var pa innan -- utan laddningstid

**History-strategi per param:**

```typescript
// push = ny historikpost (Back fungerar) — for filter och flikar
const [status, setStatus] = useQueryState('status',
  parseAsStringEnum(['upcoming', 'past', 'all']).withDefault('upcoming')
    .withOptions({ history: 'push' })
);
// replace = ingen ny historikpost — for paginering (undviker "Back-trappa")
const [page, setPage] = useQueryState('page',
  parseAsInteger.withDefault(1).withOptions({ history: 'replace' })
);
```

## Bokmarkbarhet och delbarhet

Varje filtrerad vy ar en unik URL:

| Scenario | URL |
|----------|-----|
| Kommande event (default) | `/event` |
| Tidigare event | `/event?status=past` |
| Betalningsflik | `/event/rec123?tab=payments` |
| Personsokning | `/personer?q=andersson` |

Roger skickar Lotta en lank → hon ser exakt det han ser. Lotta bokmarker → sokningen finns kvar nasta gang.

## Serialisering och felhantering

nuqs hanterar serialisering automatiskt. Ogiltiga params kraschar aldrig appen:

- `parseAsInteger`: `"3"` → `3`, `"abc"` → default (`1`)
- `parseAsStringEnum`: `"past"` → `'past'`, `"bananas"` → default (`'upcoming'`)
- `parseAsString`: `"anna"` → `'anna'`, tom → default (`''`)

Alla parsers ar typsokra -- TypeScript vet att `status` ar `'upcoming' | 'past' | 'all'` (aldrig `string`, aldrig `undefined`).

## Samspel: nuqs + TanStack Router + TanStack Query

```text
URL (/event?status=past&sort=name)
       |
       +-- TanStack Router: validerar route, kor loader
       |       L- loader: queryClient.ensureQueryData({ queryKey: ['events'] })
       |
       L-- nuqs: laser ?status=past, ?sort=name → React state
               L- komponent: useSuspenseQuery({ queryKey: ['events', { status, sort }] })
                       L- TanStack Query: data fran cache (seedad av loader) → render
```

Tre bibliotek, en URL, noll konflikter. Routern ager navigering, nuqs ager params, Query ager data.
