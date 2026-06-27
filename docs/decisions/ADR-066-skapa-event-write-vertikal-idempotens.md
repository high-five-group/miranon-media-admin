# ADR-066: Skapa nytt event — create-event write-vertikal mot Eventplanering + idempotens via Airtable-nativ upsert

- **Status:** Accepted
- **Datum:** 2026-06-27
- **Fas:** 6f (Skapa nytt event) — appens nästa write-vertikal efter [ADR-065](ADR-065-segment-regel-persistens.md) (6g segment-write); lyder [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) (resolution I BASEN) + [ADR-050](ADR-050-isolerad-staging-miljo.md) (bas-portabilitet per NAMN).

## Kontext

Fas 6f bygger appens nästa skriv-vertikal: Lotta skapar ett nytt event i Eventplanering direkt från appen, i stället för i Airtable-Interface. Det är repots tredje write-operation efter `create-registration` (6c L4) och `save-segment` (6g L3), och följer deras säkerhets-kontrakt: egen Edge Function, `requireUser`, server-side-byggd fält-shape och allowlist-SSOT via `_shared/field-allowlists.ts`.

Valet görs mot ett FAKTISKT live-tillstånd (forensiskt pre-pass, Session 38). Schemat låstes mot live STAGING (delat tabell-ID `tblVE3UKWl1CKrphV` staging↔prod, [data-model.md §280](../reference/data-model.md)); beslut 5 grundades dessutom mot den RIKTIGA event-populationen via en READ-only prod-introspektion (PROD `app8uGPrVCVOm6LfD`, 50 event, 0 test-rader exkluderade).

Två fynd ur pre-passet styr kontraktet:

1. **System-genererad identitet.** `Event-nr` (`fldl5By2a7jGBPpxF`) är `autoNumber` och `EventKey` (`fldhmhaz3ZnouAzDm`) är formel `"Event-" & {Event-nr}`. Eventets nyckel FÖDS vid skapande — appen kan och ska aldrig sätta den. Detta skiljer create-event från `create-registration`, som tvärtom SKRIVER `EventKey` på Anmälningar (där det är ett skrivbart matchnings-fält).
2. **Disk-referensen var update-orienterad.** `data-model.md`:s Eventplanering write-fält-tabell dokumenterade de fält automationerna rör (Status, platser, närvaro-checkboxar), inte de create-essentiella identitets-/datum-fälten (Event source, Typ, Ort, Startdatum). De senare är live-belagda som skrivbara och fångas durabelt i syskon-commiten (data-model create-avsnitt, se Konsekvenser).

Idempotens- och UI-besluten grundas på web-research (citerad nedan): mobil-PWA-nätverks-retry är en verklig felväg, och ett dubblett-event splittrar ett tillfälles anmälningar över två rader — ett affärs-golv, inte en kosmetisk detalj.

## Beslut

### 1. create-event = ETT Eventplanering-rad-write, ingen kaskad

En create-event-operation skriver exakt EN rad i Eventplanering. System-genererade fält sätts ALDRIG (`EventKey` = formel; `Event-nr` = autoNumber → föds vid skapande). Länk-fälten `Anmälningar`/`Närvaro (records)` sätts från MOTSATT sida (automation A1/A3) när anmälningar kommer in — ett nyfött event har noll. Inga nya länkade poster skapas (Eventtyp-länken pekar på en BEFINTLIG Eventformat-rad, se beslut 5). Spegelfältet `Anmälningar (länkat fält)` är read-only och rörs aldrig.

### 2. Krav-fält-set byggs server-side ur typade inputs

EF:en bygger `fields` SERVER-SIDE ur typade inputs — klienten skickar ALDRIG en rå `fields`-map. Kontrakterat create-set (live-belagt skrivbara, ej formel/rollup/lookup/autonumber):

| Syfte | Fält (NAMN) | Fält-ID | Typ |
|---|---|---|---|
| Kursnamn | `Event (source)` | `flddlv4JA5C5CeH5R` | singleSelect |
| Eventtyp-klass | `Typ` | `fldkiFRVYG0xTAhJ4` | singleSelect (Utbildning/Föreläsning) |
| Ort | `Ort` | `fldRvwXnDsgjwva2L` | singleLineText |
| Start | `Startdatum` | `fldBYhXEHLCd1o2Je` | date (ISO) |
| Slut | `Slutdatum` | `fldUMB4x3OyGQ31aL` | date (ISO) |
| Kapacitet | `Max antal platser` | `fldbyEz8djcxCBO5r` | number |
| Tillstånd | `Status` | `fld2nXlS1UG0aOHLt` | singleSelect (default `Planerat`) |
| Sessionsstruktur | `Eventtyp` | `fldCAGA9NPnd9kEmi` | multipleRecordLinks → Eventformat |
| Idempotens | `Idempotensnyckel` | _(L1)_ | singleLineText (nytt fält, se beslut 3) |

Allowlist: ny `OPERATIONS`-post i `field-allowlists.ts` `{ tableId: 'Eventplanering' (per NAMN, ADR-050), allowedFields: [...] }`; `findDisallowedField` fäller varje fält utanför listan FÖRE Airtable-anropet (SSOT-grind mot kod-drift). **Allowlist-posten LÅSES här, IMPLEMENTERAS L1.**

### 3. Idempotens via Airtable-nativ upsert på en dedikerad nyckel

create-event bär en klient-genererad **Idempotency-Key (UUID v4)** — bevarad över retries av SAMMA submit, ny för ett genuint nytt event (Stripe/IETF-semantik: gör en icke-idempotent POST fault-tolerant).

**Mekanism:** Airtable-nativ upsert — `update multiple records` med `performUpsert.fieldsToMergeOn: ['Idempotensnyckel']`. Servern gör match-or-create i ETT logiskt anrop: noll träffar → skapa; en träff → uppdatera; flera → fel. Detta kräver ett **nytt dedikerat skrivbart fält `Idempotensnyckel` (singleLineText)** i Eventplanering — merge-fält får per Airtable-API:t inte vara beräknat (formel/lookup/rollup) och måste vara number/text/long text/select/date; en singleLineText uppfyller villkoret och undviker §Kända fällor-klassen "merge mot ett formelfält". Schema-mutationen (staging FÖRST, sedan prod, additivt) är **L1** ([ADR-065](ADR-065-segment-regel-persistens.md)-mönstret; prod-deploy är en medveten separat handling).

**Avvisat:**

- **(a) Affärsnyckel-merge** (`Event source` + `Startdatum` + `Ort`). Ej garanterat unik — två pass på samma ort samma dag är möjligt → falska merge-träffar skulle TYST skriva över ett legitimt skilt event. En syntetisk UUID bär unikheten utan att låna den från affärsdata.
- **(b) Ingen idempotens** (`save-segment`-klassen). Avvisad för create-event: mobil-PWA-nätverks-retry är en verklig felväg, och till skillnad från ett dubblett-segment (operatören raderar) splittrar ett **dubblett-event** ett tillfälles anmälningar över två rader → datakorruption i en länkad domän. Retry-/double-submit-säkerhet är därför golv här.
- **(c) EF-intern check-then-create** (läs-om-finns, annars skapa). Avvisad: TOCTOU-race mellan två samtidiga retries kan passera båda läsningarna och skapa två rader. Upsert flyttar atomicitets-ansvaret till servern i ETT anrop.

**Ärlig avgränsning (ej v1):** Stripe:s strikta semantik "samma nyckel + ANDRA parametrar → fel" replikeras inte. Airtable-upsert gör i stället en last-write-wins-patch på en träff; det är acceptabelt för en admin-single-create där en retry av samma submit bär samma payload. Strikt param-match-validering registreras som möjlig senare härdning om behovet uppstår (inte spekulativt nu — dubbelriktad över-engineering-vakt).

### 4. UI: pessimistisk create, inte optimistisk

Klienten visar `pending` under in-flight och navigerar/bekräftar FÖRST vid server-OK (pessimistisk), inte optimistisk pre-rendering. Skäl: TanStack Querys egen vägledning reserverar optimistiska uppdateringar för FREKVENTA lågrisk-interaktioner; event-create är infrekvent och högre insats. Dessutom tilldelar servern `EventKey`/`Event-nr` som UI:t vill visa → en pessimistisk väg slipper temp-id-rekonciliering. Submit-knappen är `disabled` under in-flight (dubbel-klick-golv OVANPÅ idempotens-nätverks-golvet — de adresserar olika felvägar: klick-spam vs nätverks-retry).

### 5. Eventtyp (länk → Eventformat) krävs vid create — GREN A (prod-belagd)

`Eventtyp` (`fldCAGA9NPnd9kEmi`, länk → Eventformat) KRÄVS vid create. Den driver `Sessionsmall`-lookupen (`fldFSQSopc87UBXpT`) som bär hela närvaro-sessionsstrukturen; ett event utan sessionsmall är BRUTET i denna närvaro-spårande domän (Deltaganden per session).

Prod-introspektion (Session 38, READ-only, **N=50 riktiga event, 0 test-rader**) bekräftar att kravet gäller rakt av — ingen Typ-klass-carve-out behövs:

| Typ | Antal event | Eventtyp satt | Sessionsmall populerad |
|---|---|---|---|
| Utbildning | 46 | 46/46 (100 %) | 46/46 (100 %) |
| Föreläsning | 4 | 4/4 (100 %) | 4/4 (100 %) |

Båda klasser ligger på 100 % (gren-regelns tröskel: ≥80 % per klass). Även enkel-tillfälles-klassen Föreläsning bär konsekvent sessionsmall i prod → create-event gör Eventtyp obligatoriskt för alla Typ-värden, utan villkorlig logik.

### 6. Månad/år härleds ur Startdatum

`Månad/år` (`fld2BjFdBd964TzVb`) är ett MANUELLT singleSelect (inte formel) som duplicerar information härledbar ur `Startdatum`. create-event sätter det HÄRLETT ur `Startdatum` (konsekvent → eliminerar drift mellan de två). Själva designbristen — ett manuellt fält som borde vara beräknat — registreras som bas-maximerings-kandidat (`data-model.md` §Kända fällor + T16, L192-mönstret: registret är committad kravspec, inte deferra-och-glöm). Se syskon-commit (data-model + register).

## Alternativ som övervägdes

Idempotens-alternativen (affärsnyckel-merge / ingen idempotens / check-then-create) återges i beslut 3. UI-alternativet (optimistisk create) i beslut 4. Eventtyp-carve-out-grenen (GREN B) prövades men föll: prod-introspektionen visade 100 % sessionsmall även för Föreläsning → ingen klass kvalificerar för optional Eventtyp.

## Konsekvenser

**Positiva:** repots tredje write-vertikal följer ett etablerat säkerhets-kontrakt (låg ny attack-yta); idempotensen löser en verklig PWA-retry-felväg utan klient-side-race; create-set är live-grundat, inte antaget.

**Negativa / skuld:** ett nytt fält till (`Idempotensnyckel`) i en redan fält-rik tabell; Airtable-upsert ger inte Stripe-strikt param-match (registrerad härdnings-kandidat); `Månad/år`-härledningen är en route-around tills basen själv-maximeras (registrerad, T16).

**Implementeras L1 (ej här):** ny EF `create-event` (egen katalog + `index.ts` `Deno.serve`, ej generisk `update-record`; säkerhets-kontrakt speglat: POST→405 / `requireUser`→401 / body→400 / `{error}`+`requestId` / `mapErrorToResponse`); ny allowlist-post; nytt schema-fält `Idempotensnyckel` staging+prod; tester `create-event.staging.test.ts` (deny/allow) + e2e. Merge-fältets live-skrivbarhet blir en explicit STOPPA-grind i L1. 6g-EF:er-carryn (staging-only) är oförändrad.

## Källor

- **Stripe — Idempotent requests:** [docs.stripe.com/api/idempotent_requests](https://docs.stripe.com/api/idempotent_requests) + [error-handling (low-level)](https://docs.stripe.com/error-low-level) — UUID-nyckel bevarad över retries; strikt param-match-semantik (avgränsad i beslut 3).
- **IETF — The Idempotency-Key HTTP Header Field:** [draft-ietf-httpapi-idempotency-key-header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) (HTTPAPI WG, "Building Blocks for HTTP APIs") — header gör icke-idempotenta POST/PATCH fault-tolerant (POST/PATCH ej idempotenta per RFC 9110).
- **TanStack Query — Optimistic Updates:** [TanStack Query — Optimistic Updates (förstaparts-docs)](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) — optimistiskt reserverat för frekventa lågrisk-interaktioner (grundar pessimistisk create, beslut 4).
- **Airtable — Update multiple records / performUpsert:** [Airtable Web API — Update multiple records](https://airtable.com/developers/web/api/update-multiple-records) — `performUpsert.fieldsToMergeOn` (1–3 fält, EJ beräknade; 0 träffar→create, 1→update, >1→fel); grundar idempotens-mekanismen + `Idempotensnyckel`-fältets typval (beslut 3).

## Relaterat

- [ADR-065](ADR-065-segment-regel-persistens.md) — föregående write-vertikal (6g L3); additivt schema-tillägg staging→prod-mönstret som beslut 3 följer.
- [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) — resolution I BASEN; `Månad/år`-bristen + `Idempotensnyckel` registreras som maximerings-/schema-poster.
- [ADR-050](ADR-050-isolerad-staging-miljo.md) — bas-portabilitet per NAMN (tableId `'Eventplanering'`); staging↔prod-paritet.
- [ADR-059](ADR-059-idempotens-lagring-defer-fas-e.md) — idempotens-lagrings-beslutet (Idempotency-Key-prejudikatet `create-registration` bär) som beslut 3 vidareutvecklar för create-event via Airtable-nativ upsert.
- T16, `docs/reference/data-model.md` §Kända fällor — `Månad/år`-maximerings-posten + `Idempotensnyckel`-schema-tillägget.
