
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
| `period` | `'upcoming' \| 'past'` | `'upcoming'` | `parseAsStringEnum` |
| `vy` | `'lista' \| 'kalender'` | `'lista'` | `parseAsStringEnum` |
| `typ` | `string \| null` | `null` (inget filter) | `parseAsString` |
| `ort` | `string \| null` | `null` (inget filter) | `parseAsString` |
| `status` | `EventStatusValue \| null` | `null` (inget filter) | `parseAsStringEnum` |

```typescript
const [period, setPeriod] = useQueryState(
  'period',
  parseAsStringEnum(['upcoming', 'past']).withDefault('upcoming')
    .withOptions({ history: 'push' })
);
const [vy, setVy] = useQueryState(
  'vy',
  parseAsStringEnum(['lista', 'kalender']).withDefault('lista')
    .withOptions({ history: 'push' })
);

// /event                → Kommande i listvyn (default, inga synliga params)
// /event?period=past    → Tidigare
// /event?vy=kalender    → Kalendervyn
```

**Period** (ORDLISTA) härleds ur eventets startdatum mot idag — ALDRIG ur
Status-fältet (stänger T14). Sorteringen är LÅST per period (Kommande
närmast först, Tidigare senast först) — inget `?sort`-val existerar.

**Vy** (task-17.4): lista är default med REN URL (nuqs `clearOnDefault`
rensar parametern när Listvy väljs); `?vy=kalender` bär kalenderläget.
Parametrarna är oberoende: kalendern ÄGER tiden (månadsnavet ersätter
period-toggeln och läser hela källan ofiltrerad), så `?period` är inert i
kalenderläget men bevaras i URL:en — växlingen tillbaka till listan
återställer exakt periodläget. Dag-valet i kalendern är UI-state
(`useState`, HUR-klassen) — inte URL-buret.

**Filtervalen** (task-17.7, URL-BESLUTET Marcus 2026-07-24): `?typ`/`?ort`/
`?status` bär filtervyns tre dropdown-val — kopierbar länk, back-bart
(history push), omladdnings-säkert. `null` = inget filter = parametern
BORTA (nuqs tar bort parametern vid null — ren URL utan filter,
clearOnDefault-klassens beteende). `typ`/`ort` är fria strängar (värdena
härleds ur källan); `status` enum-parsas mot de kanoniska värdena
(Planerat/Genomfört/Inställt/Flyttat) så ogiltiga params — inklusive
gamla kontraktets `?status=past` — är inerta. Filtret appliceras
klient-side på den periodfiltrerade listan (AND över dimensioner, live
utan Apply). Panelens öppet/stängt är UI-state (HUR-klassen); i
kalenderläget är filterparams inerta men bevaras (samma modell som
`?period`). Exempel: `/event?typ=Kurs&ort=Skövde` → Kommande kurser i
Skövde i listvyn.

> **Reconcilierad (task-17.2, 2026-07-21 — S72-facitet):** `?period`
> ERSÄTTER den tidigare `?status`+`?sort`-modellen. Skäl: S72-konvergensen
> låste period-toggeln [Kommande|Tidigare] med låst ordning per period
> (PRD TASK-17 beslut 5); "status" som namn på tidsfiltret var
> T14-begreppsgrumligheten (status = planeringstillstånd, inte tidsaxel).
> Gamla params ignoreras av parsern (okända params ar inerta).
> Vyvalet `?vy=kalender` levererades i kalendervy-skivan (task-17.4).

Query-nyckeln ar STABIL (`['events', 'list']` — hela listan hamtas,
period-filtret sker klient-side, se `src/queries/keys.ts`).

### Event-detalj (`/event/$eventId`)

Event-detaljens ytor är **separata routes** (C1, Fas 6b L1), inte flikar i en
URL-param. Var yta har sin egen data-källa → sin egen route-gräns för parallell
data-laddning:

| Yta | Route | Data-källa |
|-----|-------|------------|
| Info (default) | `/event/$eventId` | `fetchEvent` |
| Närvaro | `/event/$eventId/narvaro` | `fetchAttendance` |
| Betalning | `/event/$eventId/betalning` | `fetchRegistrations` |

Ingen `?tab=`-param — ytan bärs av route-segmentet, så varje yta är direkt
länk-/bokmärkbar (`/event/rec123/betalning`) och Back rör sig mellan ytor naturligt.

> **Reconcilierad (C1, 2026-06-20 Fas 6b L1):** ersätter den tidigare
> `?tab=registrations|payments|attendance`-modellen. Skäl: de tre ytorna har var
> sin data-källa (`fetchEvent`/`fetchAttendance`/`fetchRegistrations`) → var sin
> route-gräns ger parallell laddning + äkta länkbarhet per yta (Ryan Florence,
> "When To Fetch"; react.wiki: nested routes när olika innehållsvägar ska ha olika
> URL:er). Flik-modellen (en route, tab-villkorad query) deferrades till förmån
> för routes. Listans filter-state är URL-buret (`?period` sedan task-17.2).

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

## Dev-parametrar — prototyp-substratet (ADR-074)

Endast i dev-lage (`import.meta.env.DEV`) bar routes tre extra
query-params for UI-prototyp-passen (prototype-skillen; vaxlaren
`src/components/dev/PrototypeSwitcher.tsx`):

| Param | Varden | Betydelse |
|-------|--------|-----------|
| `variant` | stabil nyckel `a`/`b`/`c` | Vald prototyp-variant; franvarande = skarpa vyn |
| `data` | `verklig` | Vaxlar demo→verklig data (demo ar konvergens-default) |
| `<vyParam>` | semantisk vy-nyckel (`login`, `accept`) | VALFRI tredje axel: vilken SKARM i familjen som visas. Parameternamnet agas av call-siten (default `vy`; auth-familjen kor `skarm`) |

Nyckel-livscykeln: divergens-varianter far stabila nycklar `a`/`b`/`c`;
vinnaren BEHALLER sin nyckel genom konvergensen (ingen omdopning);
samma schema galler over familjens alla ytor sa att familje-flodet bar
vardet utan oversattning. Aliaser i vaxlaren ar enbart legacy-inmappning
for historiska URL:er — aldrig for nya pass. Steg adresseras inte i
URL:en; frysta steg lever som snapshot-par i sessionsbilagorna. I
produktion ar parametrarna inerta (vaxlaren monteras ej; skarpa vyn
renderas).

Vy-axeln (ADR-074 Amendering 6, S96): URL:en bar SEMANTISKA nycklar aven
om knappen visar ordningstalet 1..N — talet ar UI-form, inte adress.
Axeln renderas endast nar familjen har mer an en vy; en ensam vy ger
ingen knapp. Saknas eller ar okand parametern faller axeln tillbaka pa
FORSTA vyn, samma default som routen renderar, sa knapp och yta aldrig
pekar at olika hall. Fullt beslut: [ADR-074](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md).

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
const [period, setPeriod] = useQueryState('period',
  parseAsStringEnum(['upcoming', 'past']).withDefault('upcoming')
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
| Tidigare event | `/event?period=past` |
| Kalendervyn | `/event?vy=kalender` |
| Event-betalning (route, C1) | `/event/rec123/betalning` |
| Personsokning | `/personer?q=andersson` |

Roger skickar Lotta en lank → hon ser exakt det han ser. Lotta bokmarker → sokningen finns kvar nasta gang.

## Serialisering och felhantering

nuqs hanterar serialisering automatiskt. Ogiltiga params kraschar aldrig appen:

- `parseAsInteger`: `"3"` → `3`, `"abc"` → default (`1`)
- `parseAsStringEnum`: `"past"` → `'past'`, `"bananas"` → default (`'upcoming'`)
- `parseAsString`: `"anna"` → `'anna'`, tom → default (`''`)

Alla parsers ar typsokra -- TypeScript vet att `period` ar `'upcoming' | 'past'` (aldrig `string`, aldrig `undefined`).

## Samspel: nuqs + TanStack Router + TanStack Query

```text
URL (/event?period=past)
       |
       +-- TanStack Router: validerar route, kor loader
       |       L- loader: queryClient.ensureQueryData({ queryKey: ['events'] })
       |
       L-- nuqs: laser ?period=past → React state
               L- komponent: useQuery({ queryKey: ['events', 'list'] })
                       L- TanStack Query: data fran cache → klient-side periodfilter → render
```

Tre bibliotek, en URL, noll konflikter. Routern ager navigering, nuqs ager params, Query ager data.
