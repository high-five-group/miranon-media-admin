---
id: TASK-277
title: Personlistan — äkta totalsiffra och täckningshålet mot Leads-ytan
status: Done
assignee: []
created_date: '2026-08-18 11:44'
updated_date: '2026-08-24 13:05'
labels: []
dependencies: []
ordinal: 503000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
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

## ROTORSAKEN — mätt i prod 2026-08-18, ersätter "täckningshålet" ovan

Marcus pushback: *"Men har man varken anmält sig eller hämtat ett erbjudande
så kan man väl inte ens finnas i vårt register?"* Frågan var rätt, och
mätningen vände hela bilden.

**De 35 HAR hämtat.** 33 av dem bär `Senaste interaktion (text)` =
`"Hämtade Meditationen Kraftfältet"` eller `"Hämtade Pyramidernas Vajrar"`;
de två övriga säger `"Anmälde sig"`. Kontrollmätning på en post:
`Antal hämtningar` = **0**, men `Totalt antal hämtningar (erbjudande)` = **1**
och `Alla hämtningar` = `"Meditationen Kraftfältet (2025-11-25)"`.

**Detta är fälla 47, redan bokförd** (`docs/reference/data-model.md:1458`,
live-belagd 2026-08-10 i S103): *"`Personer.Antal hämtningar` räknar INTE
hämtningar. Formeln är `COUNTA({Engagemang})` — den räknar rader i tabellen
`Engagemang`, inte i `Touchpoints` eller `Hämtade erbjudanden`. Fältnamnet
säger något annat än fältet gör."* Fällan varnar uttryckligen: *"fältet får
ALDRIG användas som facit mot en hämtningslista."*

**`get-leads` gör exakt det fällan förbjuder.** `LEAD_FILTER`
(`get-leads/index.ts:23-24`) kräver `{Antal hämtningar} > 0`.

**Omfattningen, mätt mot prod:** **69 personer** bär
`Totalt antal hämtningar (erbjudande)` > 0 medan `Antal hämtningar` = 0.
Av dem har **33 noll anmälningar** — rena leads, osynliga i BÅDE Personer-
och Leads-ytan. Övriga 36 syns i Personer-vyn men med osynlig
hämtningshistorik. Fältet är inte dött: andra personer har `Antal hämtningar`
> 0, så datan är **inkonsekvent**, inte frånvarande.

**Trolig uppkomst:** 21 av de 33 skapades 2025-11-25 mellan 18:43 och 18:49
— en batch på sex minuter. `Engagemang` fylls av automation **A5**
(`data-model.md:1119-1122`, *"om Engagemang finns → uppdatera Senaste
hämtning, annars → skapa nytt Engagemang"*). Posterna ser ut att ha
importerats utan att A5 fyrade. **Ej verifierat — hypotes, inte fynd.**

### Varför AC #3 ("gör dem synliga") REVS

Den ursprungliga formuleringen ville visa raderna i UI:t. Att rendera rader
vars underliggande fält är fel löser ingenting. Rätt fix är att läsa det
fält som bär sanningen — därav AC #6.

### Vad som INTE görs här, och varför

- **Backfill av 69 `Engagemang`-rader** (skapa dem retroaktivt, replikera
  A5). Dyrast, löser minst, riskerar dubbletter, och lämnar fältnamnet lika
  missvisande. Bokförs som öppen fråga, ej i denna skiva.
- **Ompekning av `Antal hämtningar`-formeln i basen.** Detta är
  rotorsaksfixen och fälla 47:s egen rekommendation (*"döp om fältet till
  vad det faktiskt räknar, eller peka om formeln"*, maximerings-kandidat
  T16). Den är en PROD-SCHEMAÄNDRING och kräver Marcus uttryckliga GO —
  läggs fram separat, aldrig i samma andetag som appfixen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 get-persons returnerar ett additivt total-fält, beräknat server-side ENBART när cursor saknas; full-walk med fields[] begränsat till ett fält, aldrig en räkning per sida
- [x] #2 Copyn lyder 'Visar N av TOTAL personer' (och 'Visar N av TOTAL personer för "sökterm"' vid sökning); formuleringen (fler finns) utgår helt
- [x] #3 Samtliga NIO bundna ställen migrerade i SAMMA landning: fem acceptance-assertions (rad 113/129/134/144/162, varav 129 använder toBeFocused) och fyra aria-snapshotrader under tests/visual/__aria__/
- [x] #4 Stale prosa rättad: PersonsList.tsx:443-448, :414-415, :473-475 och tests/api/get-persons.staging.test.ts:57 pekar inte längre på persons-list.staging.test.ts eller på en migrering som redan är utförd
- [x] #5 Totalsiffrans kostnad mätt och redovisad: faktiskt antal Airtable-anrop och svarstid för en vy-laddning före och efter, aldrig antaget
- [x] #6 get-leads LEAD_FILTER läser 'Totalt antal hämtningar (erbjudande)' i stället för 'Antal hämtningar' — det senare är COUNTA({Engagemang}) och räknar rader i aggregeringstabellen Engagemang, inte hämtningar (fälla 47, live-belagd S103). Mätt i prod 2026-08-18: 69 personer bär rollup > 0 medan COUNTA ger 0, varav 33 är rena leads osynliga i HELA appen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Premisskontroll mot prod 2026-08-19 (orkestreraren, före bygg-agent)

Tre av kortets premisser mättes om mot prod-basen `app8uGPrVCVOm6LfD`
tabell `Personer` (`tbl6ZyCm3V026iFTU`) via Airtable-MCP, READ-only:

1. **Fältet finns:** `Totalt antal hämtningar (erbjudande)` =
   **`fldd782imiCRtFJ4t`**. Bekräftat i tabellens fältlista.
2. **AC #6:s bärande premiss var OVERIFIERAD och är nu mätt:** rollup-fältet
   ÄR filtrerbart i `filterByFormula`. Skarpt prövat med
   `AND({Totalt antal hämtningar (erbjudande)} > 0, {Antal anmälningar (totalt)} = 0)`
   — anropet returnerade poster, ingen formelfel. Kortet antog detta utan bevis.
3. **De 33 står kvar:** `AND({Totalt antal hämtningar (erbjudande)} > 0,
   {Antal hämtningar} = 0, {Antal anmälningar (totalt)} = 0)` gav **exakt 33
   poster** 2026-08-19 — samma tal som 2026-08-18. Mängderna är disjunkta per
   konstruktion, så Leads-ytan växer med exakt 33.

### Två tillägg till omfattningen som följer av mätningen

**(a) `data-model.md` saknar fältet helt.** Referensen dokumenterar
`Antal hämtningar` (fälla 47, rad 1458) och `Alla hämtningar`, men
`Totalt antal hämtningar (erbjudande)` finns inte i filen. Efter denna skiva
är det fältet en LÄST yta i produktionskod — det ska stå i referensen, med
korsreferens till fälla 47. Läggs i samma landning.

**(b) Bifynd, ingen åtgärd här:** en stor andel av de 33 bär `Namn` =
`"Ej tillgängligt"` och blir därmed namnlösa rader i Leads-ytan när de blir
synliga. Det är ett datakvalitetsproblem i basen, inte i appen. Bokförs som
observation — INTE denna skivas jobb att lösa.

### AC #2 — copyn Marcus-kvitterad 2026-08-19

Marcus formulering varierade mellan två pass ("Visar 50 av XXX" 2026-08-18,
"Visar 50 totalt XXX personer" 2026-08-19). Framlagt som val; Marcus valde
**kortets befintliga AC #2-form**: `Visar N av TOTAL personer`. AC:n är
oförändrad och är den låsta ordalydelsen.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): PR #1614 (feat/task-277-totalsiffra-och-lead-filter) MERGED 2026-08-19T09:29:15Z, samtliga checks SUCCESS (gh pr view 1614). Följdfix b55412a4 (isolera totalsiffrans full-walk-fel) samma PR-sekvens, ancestor av origin/main bekräftad. Tråd T146 (staging-fixturer fel fält, blockerade get-leads-deploy) LÖST 2026-08-19 per tasks/threads/README.md. Filer i PR: persons/leads-domänen uteslutande, inga orelaterade. Samtliga 4 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
