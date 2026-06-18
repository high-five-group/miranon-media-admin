# ADR-056: List-paginerings-port — cursor-baserad, dubbel-källa

- Status: Proposed (Session 23 — 2026-06-18; villkorad flip → Marcus Gate-2 → Accepted, ADR-053-mönstret). Ingen implementation förrän ratificerad.
- Datum: 2026-06-18
- Fas: 6a (Persons-domän) — kanonisk för alla Fas 6-list-endpoints (6b Event, 6c Registrations …)

## Kontext

Fas 6a Landning 2 (personlistan) levererade **klient-slice**-paginering som
medveten kompromiss: adaptern hämtar upp till 1000 records i ett svep
(`PERSONS_FETCH_LIMIT`) och `?page` skär ut sidan klient-sida, eftersom den
befintliga `get-persons`-EF:en bara exponerar `search` + `limit` (maxRecords),
ingen offset. Defekten flaggades i Landning 2:s transparens-rapport: vid tillväxt
förbi taket **trunkeras listan tyst** i botten av Namn-sorteringen, och varje
hämtning gör en **full Airtable-walk** (~6 anrop för dagens 568 records).

Detta är en **precedensbärande** fråga: Fas 6 har fem list-vyer (Persons, Event,
Registrations, Väntelista, Hem-aggregering) och varje framtida produkt på
biblioteket ärver mönstret. Paginering måste lösas en gång, källa-agnostiskt och i
världsklass — inte lappas per vy.

### Airtable-mekanismen (verifierad mot `supabase/functions/_shared/airtable-client.ts` + web)

- **Rate-limit:** 5 requests/sekund/bas (`support.airtable.com` —
  *managing-api-call-limits*). Översvämning → 429 + 30 s lockout.
- **Sidstorlek:** `pageSize` ≤ 100 records/svar (`support.airtable.com` —
  *getting-started-with-airtables-web-api*).
- **Cursor:** svaret bär en **opak framåt-offset-token** (`offset`-fältet);
  saknas den → sista sidan är nådd. **Ingen numerisk offset, ingen
  totalräkning.** `fetchFromAirtable` (rad 46–98) loopar redan internt över denna
  token tills den tar slut (`do { … } while (offset)`).
- **Konsekvens:** 501 records = 6 sidor = 6 sekventiella anrop. Numeriskt
  sid-hopp (gå direkt till sida N) finns inte i API:t — det måste emuleras genom
  att **walk:a 1→N**, vilket är ett anti-mönster mot Airtables design och dessutom
  driftkänsligt (records som ändras mellan anrop ger skip/dubbletter; offset-baserad
  paginering är instabil under samtidiga skrivningar — `apicourse.com`, `stacksync`,
  Gusto Embedded engineering-blogg, `elysiate`).

### Vision (Marcus): permanent dubbel datakälla

Airtable och Supabase/Postgres ska samexistera **permanent** bakom
`DataSourceAdapter` ([ADR-055](ADR-055-datakalla-atkomst-router-context-di.md)) —
inte migration-ersättning där den ena byts ut. Pagineringen måste därför vara
världsklass på **båda** backendarna samtidigt, bakom ETT klient-kontrakt.

## Beslut

Inför en **cursor-baserad list-paginerings-PORT** på `DataSourceAdapter` som varje
datakälla implementerar optimalt för sin egen motor, bakom ett opakt,
källa-agnostiskt kontrakt.

### Kontrakt (kanoniskt för alla Fas 6-list-endpoints)

```ts
listPersons({ search?: string; cursor?: string; pageSize?: number })
  => { persons: Person[]; nextCursor: string | null }
```

- `cursor` är **opak** — klienten behandlar den som en black box och får aldrig se
  backend-formad token-struktur. `nextCursor: null` ⇒ sista sidan.
- Mönstret generaliseras (`listEvents`, `listRegistrations`, …) — en form för hela
  Fas 6.

### Airtable-implementation (byggs NU, i ratificerings-landningen)

- EF tar `?cursor` + `?pageSize` (default 50, klamp ≤ 100).
- EF gör **ETT** Airtable-listanrop per anrop (slutar walk:a) och returnerar
  `{ persons, nextCursor }`, där `nextCursor` är en **tunn wrapper** runt Airtables
  `offset`-token. Wrappern frikopplar: klienten ser aldrig en Airtable-formad token
  (opak-token-frikoppling — Slack Engineering via `medium.com/@tpierrain`), så
  Fas E-bytet av backend inte läcker upp i klienten.
- `search` (filterByFormula) behålls. 5 req/sek respekteras automatiskt (ett anrop
  per sida). Detta är **världsklass för Airtables API**: optimal framåt-sekventiell
  laddning — Airtable saknar random access, så ett bättre mönster finns inte.

### Postgres-implementation (DESIGN LÅST NU, byggs Fas E)

- **Keyset/seek-paginering**, inte `OFFSET`. Compound cursor över samtliga
  sort-kolumner + unik `id`-tiebreaker:

  ```sql
  where (sort_col, id) > (cursor_sort_val, cursor_id)
  order by sort_col, id
  limit pageSize
  ```

- Stödindex `(sort_col, id)`; cursor base64-opak. Ren flerkolumns-jämförelse via
  RPC (eller `supabase-js` `.or()/.gt()/.lt()` + `.order()` + `.limit()`).
- **O(1) seek** oavsett djup (till skillnad mot `OFFSET` som skannar förbi alla
  hoppade rader). Detta är **Supabases egen rekommenderade pattern**
  (`github.com/supabase/agent-skills` →
  *supabase-postgres-best-practices/data-pagination*; `supaexplorer.com`).

### Klient

- **`useInfiniteQuery`** (TanStack Query v5, officiell —
  `tanstack.com/query/v5` → *infinite-queries*):
  `getNextPageParam: (last) => last.nextCursor`; `cursor` skickas som `pageParam`
  och ingår **inte** i `queryKey` (`queryKeys.persons.search({ q })`).
  `data.pages.flatMap(p => p.persons)` ger den ackumulerade listan.
- Källa-agnostisk via router-context-DI (ADR-055): klienten anropar
  `listPersons` utan att veta vilken backend som svarar.

### A11y (11/10 — ICKE-FÖRHANDLINGSBART)

- "**Ladda fler**" är en riktig `<button>` med **fokus-behållning** efter laddning
  (fokus får inte tappas/hoppa till sidtopp) + **aria-live-annonsering** av antal
  nya rader.
- Infinite-scroll är **enbart progressiv förbättring** — ALDRIG enda mekanismen.
  En ren scroll-trigger fallerar tangentbords- och skärmläsaranvändare och bryter
  WCAG. Knappen är sanningskällan; scroll-observern, om den byggs, triggar samma
  knapp-väg.

## Alternativ övervägda (kartlagd options-rymd)

- **A — Klient-slice (nuvarande Landning 2).** Hämtar ≤ 1000, skär klient-sida.
  Förkastad: detta ÄR defekten — tyst trunkering vid taket + full walk per
  hämtning.
- **B — Numerisk offset server-side.** Airtable saknar numerisk offset → måste
  walk:a 1→N per anrop + offset-drift under samtidiga skrivningar. **Anti-mönster
  mot Airtables design.** Förkastad.
- **C — Cursor-passthrough + `useInfiniteQuery`. VALD.** Airtable-nativ,
  O(1)/sida, ingen skip/dubblett, opak token frikopplar backend → världsklass på
  båda källorna.
- **D — Postgres + keyset NU.** Det är Fas E (Postgres-schemat är nära tomt). Att
  bygga adaptern mot ett fantom-schema vore spekulativt och otestbart. **Designen
  låses här**, implementationen defereras till Fas E.
- **E — Sök-smalnad + klient-fönster.** En osmalnad "bläddra alla"-vy möter samma
  cap. Otillräcklig som allmän paginering.
- **F — Cursor + ungefärliga sid-ankare** (uppskattade sidnummer). Överbygge för
  en admin-lista. YAGNI.

## Rationale

- **En port, två världsklass-implementationer.** Airtable får sin optimala
  framåt-sekventiella laddning; Postgres får O(1) keyset — bådas styrkor, ett
  klient-kontrakt.
- **Opak cursor = äkta decoupling.** Eftersom klienten aldrig ser token-formen kan
  Fas E byta backend utan klient-ändring (samma princip som ADR-055:s DI-söm).
- **Framåt-bara cursor matchar admin-bruk.** Lotta bläddrar/laddar fler eller
  smalnar med sök; slumpvis sid-hopp är inte ett reellt behov (jfr ADR-053:s
  MEDIUM-på-MINIMAL — bygg behovet, inte spekulationen).
- **Förstaparts-mönster rakt igenom.** TanStack (`useInfiniteQuery`) + Supabase
  (keyset) + Airtable (offset-token) är alla respektive leverantörs egna
  rekommenderade pattern — golvet, inte uppfinning.

## Konsekvenser

- "Ladda fler"/infinite ersätter numeriska sidnummer. Numeriskt `?page` **lämnar
  URL:en** (passar inte cursor-modellen — cursor är opak, ej delbar som sidnummer);
  `?q` består. `STATE-STRATEGY.md` §2/§3 (som anger `?page` + `search({q,page})`)
  **driftar** mot detta beslut och reconcilieras i implementations-landningen — den
  driften **flaggas här men auto-rättas inte** i denna ADR-commit (samma
  öppen-rivning-disciplin som ADR-055 mot STATE-STRATEGY:152).
- Fas E får ett **låst världsklass-target** (keyset-designen ovan) — ingen "lös det
  sen"-skuld.
- **Dubbel-källa-RUTNING** (vilken backend som är aktiv per domän) är en SEPARAT
  fråga — den bor i `DataSourceAdapter`-sömmen + en framtida Fas E-ADR, **inte**
  denna ADR.
- Knyter an: [ADR-017](ADR-017-polling-vs-realtime.md) (Fas E Realtime — push kan
  komplettera men cursor förblir list-laddnings-mekanismen),
  [ADR-055](ADR-055-datakalla-atkomst-router-context-di.md) (DI-söm),
  [ADR-026](ADR-026-runtime-validering-vid-datagrans.md) (Zod `.parse()` vid datagräns
  — gäller varje sidladdnings svar).

## Källor

Web-research-underlag (fångat här eftersom Code/klienten inte kan re-köra
researchen):

- **Airtable rate-limit 5/sek/bas, `pageSize` ≤ 100, offset-cursor:**
  `support.airtable.com` — *getting-started-with-airtables-web-api* +
  *managing-api-call-limits*.
- **Offset-drift vs cursor (O(1), stabil, framåt-bara):** `apicourse.com`; Gusto
  Embedded engineering-blogg; `stacksync`; `elysiate`.
- **Opak-token-frikoppling:** Slack Engineering (via `medium.com/@tpierrain`).
- **`useInfiniteQuery` (officiell):** `tanstack.com/query/v5` → *infinite-queries*.
- **Postgres keyset (förstaparts):** `github.com/supabase/agent-skills` →
  *supabase-postgres-best-practices/data-pagination*; `supaexplorer.com`.
