# ADR-055: Datakälla-åtkomst via TanStack Router-context-DI

- Status: Accepted (Session 22 — 2026-06-17; ratificerad av Marcus i direktion, byggs omedelbart)
- Datum: 2026-06-17
- Fas: Session 22 — Fas 5.5 K2 (klient-UI, första UI→data-wiringen)

## Kontext

Fas 5.5 K2 är den **första gången** React-UI:t konsumerar en datakälla. Innan K2 fanns
ingen åtkomstväg: ingen `export const dataSource`, ingen factory, ingen hook — adaptrarna
(`AirtableAdapter`, `SupabaseAdapter`) existerade men instansierades aldrig av något UI.
Hur en komponent når datakällan är därför ett **precedensbärande** val: alla Fas 6-mutationer
(6a–6e) ärver mönstret. Ingen tidigare ADR beslutade åtkomst-*mekanismen* —
[ADR-016](ADR-016-tanstack-optimistic-mutation-pattern.md) antog en `dataSource`-referens i sitt
mönster-exempel utan att fastställa hur den nås, och
[`STATE-STRATEGY.md`](../specs/STATE-STRATEGY.md):152 skissade en direkt-importerad
modul-singleton (`dataSource.executeOperation(...)`) som illustration, inte som beslut.

Den live-körbara adaptern är `AirtableAdapter` (talar Airtable via Supabase-Edge-Functions);
`SupabaseAdapter` kastar `NOT_IMPLEMENTED` i varje metod och aktiveras först i Fas E.

## Beslut

React-UI:t når datakällan via **TanStack Router-context-DI**: adapter-instansen injiceras i
router-context bredvid `queryClient` och `auth` (`createRouter({ context: { queryClient,
dataSource, auth } })`). Komponenter och hooks läser `dataSource` ur route-context —
**inte** via direkt-import av en modul-singleton.

Adapter-instansen bor i ett dedikerat, namngivet hem (`src/data/dataSource.ts`) så att
"vilken adapter är live" är upptäckbart, och typas mot `DataSourceAdapter`-interfacet.
Den injiceras som statisk modul-instans (som `queryClient`) — ingen per-render-bootstrap
av det slag `auth` kräver.

## Alternativ övervägda

- **Direkt-importerad modul-singleton** (STATE-STRATEGY:152-skissen). Avvisad: blandar
  DI-idiom (skulle leva sida vid sida med router-contextens `queryClient`/`auth`) och ger
  per-test-mock-friktion (modul-mock i stället för `createRouter({ context })`). Acceptabel
  rent tekniskt eftersom adaptern är tillståndslös — men inkonsekvent med repots etablerade
  mönster.
- **Dedikerad React Context-provider** (`createContext` + `<DataSourceProvider>` runt
  komponentträdet — SKILD från router-context-läsning). Avvisad: redundant — router-context är
  redan det DI-kärl repot använder för render-skild infrastruktur. En andra, separat
  context-apparat för samma sorts beroende vore dubblerad apparat. *Kontrast:* den LEVERERADE
  `useDataSource()`-hooken (`src/data/useDataSource.ts`) läser **router-context** (det valda
  mönstret per detta beslut) via `useRouteContext` — den är INTE en sådan separat React
  Context-provider. Namnlikheten är ytlig; mekanismen skiljer sig.
- **Env-driven factory (Airtable/Supabase-växel).** Avvisad: YAGNI. `SupabaseAdapter` kastar
  överallt; Fas E-bytet är en enradsändring vid instansieringen i `src/data/dataSource.ts`.
  En växel-apparat idag löser ett problem som inte finns.

## Rationale

- **TanStack förstaparts-rekommendation.** Router-context-guiden anger uttryckligen att
  context är platsen för "a data fetching client, a mutation service" — exakt detta beroende
  (`tanstack.com/router` → router-context-guide).
- **Repo-intern konsekvens.** `queryClient` och `auth` injiceras redan via router-context;
  `dataSource` följer samma idiom — ETT DI-mönster, inte tre.
- **Testbarhet.** En mock-adapter injiceras via `createRouter({ context: { dataSource:
  mockAdapter, ... } })` utan modul-mockning.

## Konsekvenser

- Fas 6-mutationer (6a–6e) läser `dataSource` ur route-context — detta är precedensen de ärver.
- Fas E:s Supabase-byte är en enda rad vid instansieringen i `src/data/dataSource.ts`.
- [`STATE-STRATEGY.md`](../specs/STATE-STRATEGY.md):152-singletonskissen är **superseder:ad** —
  en additiv, daterad errata-not pekar hit (historisk text bevarad, ej tyst patchad).
- [ADR-016](ADR-016-tanstack-optimistic-mutation-pattern.md):s `dataSource`-referens får en
  motsvarande additiv not: ADR-016 beslutade mönstret (fem komponenter), ADR-055 beslutar
  åtkomst-mekanismen.
