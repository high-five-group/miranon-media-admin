---
id: TASK-277
title: Personlistan — äkta totalsiffra och täckningshålet mot Leads-ytan
status: To Do
assignee: []
created_date: '2026-08-18 11:44'
labels: []
dependencies: []
ordinal: 503000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-08-18: *"Det står 'Visar 50 personer (fler finns).' och det tycker
jag är oproffsigt. Jag vill att det ska stå 'Visar 50 av XXX'."*

## Del 1 — den äkta totalsiffran

Copyn bor i `src/components/persons/PersonsList.tsx:456-458`. `total` är
antalet LADDADE rader (`:395`), och `(fler finns)` tänds av `hasNextPage`
(`:457`) — det finns **ingen serversiffra** för totalen.

**Airtable kan strukturellt inte ge en count för ett filtrerat urval.**
`docs/reference/airtable-constraints.md` P6 verbatim: *"Pagineringen är en
opak `offset`-token (ingen numerisk offset, ingen totalräkning)."*
`get-persons` svarar `{ persons, nextCursor }` (`index.ts:152`) och gör ETT
listanrop per sida — det finns ingen punkt där ett antal faller ut som
biprodukt.

**Vald väg (Code:s rekommendation, Marcus GO 2026-08-18):** räkna
server-side i `get-persons` **enbart när `cursor` saknas** — alltså en gång
per vy-/sökladdning, aldrig per sida. Full-walk med `fields[]` begränsat
till ett enda fält håller payloaden minimal; tabellen är ~238 poster, vilket
med `pageSize` 100 är tre anrop. Returnera `total` som ett **additivt**
svarsfält.

Precedent i huset: `supabase/functions/get-activity-log/index.ts:236-269`
gör exakt detta mot Postgres (`count: 'exact', head: true`) och markerar
fältet som additivt. Formen är etablerad — bara källan skiljer.

## Del 2 — täckningshålet (defekt, inte designval)

`get-persons/index.ts:104-108` påstår i sin egen kommentar att `BAS_FILTER`
är *"exakt komplementet till get-leads LEAD_FILTER … så de två ytorna täcker
basen utan hål och utan överlapp"*.

**Det är falskt.** `BAS_FILTER` är `{Antal anmälningar (totalt)} > 0`
(`:121`). `LEAD_FILTER` är `AND({Antal hämtningar} > 0, {Antal anmälningar
(totalt)} = 0)` (`get-leads/index.ts:23-24`) — den kräver **dessutom** minst
en hämtning. Mängden `anmälningar = 0 AND hämtningar = 0` faller utanför
BÅDA ytorna.

Klassen är verklig och mätt: **35 personer i prod** (2026-08-18) har både
`Antal anmälningar (totalt) = 0` och `Antal hämtningar = 0`. De är osynliga
i hela appen. `data-model.md` dokumenterar dessutom tre av dem som bärare av
en `Inskickad anmälan`-touchpoint utan länkad anmälan.

## Testskulden — nio bundna ställen, inte sju

Copyn är bunden på **nio** ställen, inte de sju en tidigare orientering
angav (den citerade en stale kodkommentar, se nedan):

- **Fem acceptance-assertions** i `tests/acceptance/persons-list.acceptance.test.ts`
  rad **113, 129, 134, 144, 162**. Rad 129 använder `toBeFocused()`, inte
  `toBeVisible()` — fokusflytten när "Ladda fler" försvinner.
- **Fyra låsta aria-snapshotrader** under
  `tests/visual/__aria__/personer-promoverings-grind.spec.ts/` — två
  desktop, två mobile, fällda av `tests/visual/personer-promoverings-grind.spec.ts:89-111`.

**Stale prosa som ska rättas i samma landning:** `PersonsList.tsx:443-448`,
`:414-415` och `:473-475` varnar för assertions i
`persons-list.staging.test.ts` — en fil som **inte finns** (flyttad i
`task-59.4`) — och för en migrering som redan är utförd (ADR-103 B2 steg 4,
godkänd 2026-08-10). Samma felklass finns i `tests/api/get-persons.staging.test.ts:57`.

## Utanför omfattningen

Filter-UI på Personer-vyn (synliga snitt à la basens elva vyer) är ett
DESIGNBESLUT som ligger hos Marcus och inte ingår här. Denna skiva ändrar
inte `BAS_FILTER`s default-beteende utöver att stänga hålet ovan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 get-persons returnerar ett additivt total-fält, beräknat server-side ENBART när cursor saknas; full-walk med fields[] begränsat till ett fält, aldrig en räkning per sida
- [ ] #2 Copyn lyder 'Visar N av TOTAL personer' (och 'Visar N av TOTAL personer för "sökterm"' vid sökning); formuleringen (fler finns) utgår helt
- [ ] #3 Täckningshålet stängt: personer med noll anmälningar OCH noll hämtningar är synliga i appen; EF-kommentaren på get-persons:104-108 rättad så den inte längre påstår ett komplement utan hål
- [ ] #4 Samtliga NIO bundna ställen migrerade i SAMMA landning: fem acceptance-assertions (rad 113/129/134/144/162, varav 129 använder toBeFocused) och fyra aria-snapshotrader under tests/visual/__aria__/
- [ ] #5 Stale prosa rättad: PersonsList.tsx:443-448, :414-415, :473-475 och tests/api/get-persons.staging.test.ts:57 pekar inte längre på persons-list.staging.test.ts eller på en migrering som redan är utförd
- [ ] #6 Totalsiffrans kostnad mätt och redovisad: faktiskt antal Airtable-anrop och svarstid för en vy-laddning före och efter, aldrig antaget
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
