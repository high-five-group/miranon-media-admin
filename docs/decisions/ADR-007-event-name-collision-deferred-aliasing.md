# ADR-007: `Event`-namnkollision — uppskjuten aliasering per fil

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 1

## Kontext

`src/domain/models/Event.ts` exporterar `interface Event`:

```ts
export interface Event {
  id: string;
  eventlabel: string | null;
  eventNamn: string | null;
  // ... 19 fält
  status: string | null;
}
```

TypeScript/DOM har en global `Event`-typ (basklass för `MouseEvent`, `KeyboardEvent`, `FocusEvent` etc.) som kommer in via `"lib": ["ES2022", "DOM", "DOM.Iterable"]` i `tsconfig.app.json`. I `.tsx`-filer som både hanterar DOM-events och domain-data blir samma symbol `Event` tvetydig:

```tsx
// Vilken Event? DOM eller domain?
function handler(e: Event) { ... }
```

Conversion-plan §C fotnot 1 flaggade detta: *"`Event` krockar med DOM:ens globala `Event`. I TSX krävs explicit import eller alias."* Fotnot i §D Fas 1 risker: *"`Event`-namnkollision med DOM. Om det blir problem: byt till `MiranonEvent` i `domain/models/`."*

Fas 1-scope var dock uteslutande `.ts`-filer — noll `.tsx`-filer. I `.ts`-kontext råder **scope-shadowing**: en lokal `import type { Event }` skuggar den globala DOM-typen utan tvetydighet, eftersom det inte finns några JSX-event-handlers i samma fil.

## Beslut

**Ingen åtgärd i Fas 1.** `Event`-interfacet kopieras rakt av utan rename, utan alias-exporter, utan `MiranonEvent`-typnamn. `tsc --noEmit` verifieras passera (och gör det).

**Strategi framåt — trepunkts-eskalering:**

1. **Fas 2+ (första `.tsx`-fil som importerar `Event`):** Lokal alias per fil.

   ```tsx
   import type { Event as MmEvent } from '@/domain/models/Event';
   ```

   Detta isolerar effekten till den fil där det faktiskt uppstår.

2. **Om 5+ `.tsx`-filer behöver samma alias:** Global rename till `MiranonEvent` (alternativt `MmEvent`) i `src/domain/models/Event.ts`. Alla konsumenter uppdaterar sina imports.

3. **Om namnet blir en blöt filt mellan domain och DOM:** Ompröva hela namnvalet. `Happening`, `Course`, `Session` är semantiskt tydligare alternativ om Miranon-domänen kan motivera det.

## Alternativ som övervägdes

**1. Global rename till `MiranonEvent` / `MmEvent` direkt i Fas 1**

- **Fördelar:** Proaktivt, framtida `.tsx`-filer slipper alias-dans. Tydligt skiljt från DOM-typen från dag ett.
- **Nackdelar:** Bryter "kopieras rakt av"-garantin från conversion-plan §C. Kräver ändring i `AirtableAdapter.ts`, `DataSourceAdapter.ts`, `SupabaseAdapter.ts` (där importen sker). Icke-trivial ändring att committa i samma commit som domäntransplant. Och kanske onödig — vi vet inte än om problemet faktiskt manifesterar sig i praktiken. Förtidig optimering.

**2. Re-export via alias: `export type { Event as MiranonEvent } from './Event';`**

- **Fördelar:** Ger konsumenter val — importera `Event` eller `MiranonEvent` efter behov.
- **Nackdelar:** Dubbelt API för samma typ. Inkonsekvent i codebase — vissa filer använder det ena, vissa det andra.

**3. Byt till `type Event = ...` istället för `interface`**

- **Fördelar:** Inget.
- **Nackdelar:** Löser inte kollisionen. Symboleffekten är identisk.

**4. Isolerad moduldeklaration: `declare module '@/domain/models/Event' { export { Event } }`**

- **Fördelar:** Håller domain-typen separerad.
- **Nackdelar:** Bara symptombekämpning. Problemet är konsumtionssidan, inte definitionssidan.

## Konsekvenser

**Positivt:**

- `src/domain/models/Event.ts` är bitwise identisk med Vue-repots version — `git diff` mellan repos visar noll skillnader
- `tsc --noEmit` passerar rent i Fas 1 utan någon aliasering
- Beslut fattas när problemet är konkret, inte abstrakt
- Om 5+ `.tsx`-filer behöver alias har vi data att rättfärdiga global rename

**Negativt:**

- Första `.tsx`-fil som behöver `Event` kräver extra mental friktion: "vilken Event? DOM eller domain?"
- Om vi missar att alias i en fil där både DOM-event-handlers och domain-Event förekommer, får vi ett tydligt TS-fel (inte tyst bug) — så risken är detekterad, inte osynlig

**Uppskjuten teknisk skuld:**

- Beslut om global rename tas i Fas 2 när första `.tsx`-konsumenten uppstår
- Om beslutet då blir global rename, uppdateras denna ADR med `Status: Superseded by ADR-NNN`

## Referenser

- `docs/conversion-plan.md` §C fotnot 1 — original-flaggningen
- `docs/conversion-plan.md` §D Fas 1 risker — fallback-strategin
- `src/domain/models/Event.ts` — oförändrad från Vue-repot
- `src/data/adapters/AirtableAdapter.ts` — nuvarande `.ts`-konsument (ingen alias behövs)
