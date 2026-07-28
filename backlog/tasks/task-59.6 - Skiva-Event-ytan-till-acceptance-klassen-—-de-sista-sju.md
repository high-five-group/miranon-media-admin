---
id: TASK-59.6
title: 'Skiva: Event-ytan till acceptance-klassen — de sista sju'
status: Done
assignee: []
created_date: '2026-07-27 20:42'
updated_date: '2026-07-28 09:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.5
parent_task_id: TASK-59
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Event-ytans sju filer — anmälningsdetaljen, lägg-till-anmälan, anmälda, anteckningar, närvaro, ny anmälan och kalendervyn — flyttas till acceptance-klassen. Efter denna skiva är samtliga arton ute.

BETEENDET ÄNDE-TILL-ÄNDE: hela event-ytans hermetiska del svarar ur det mutexfria jobbet. Ytan är den största och den mest sammansatta — anmälningsflöden, närvaro och kalender rör flera Edge Functions per vy.

VARFÖR SIST: ytan är störst, och när den flyttas är mönstret prövat på tre mindre ytor. Ett fel i mekaniken ska ha upptäckts på två filer, inte på sju.

GRÄNSDRAGNINGEN ÄR KÄNSLIG HÄR. Flera event-filer som INTE ingår i denna skiva ligger kvar som skarpa — bekräftelse, bor-över, deltagare, eventdetaljen, närvaroregistret och eventlistan. De har kvarvarande skarpa anrop och hör därför till den andra klassen. Att de heter nästan samma sak som filerna i denna skiva är precis varför klassningen måste läsas ur mätdatan och inte ur filnamnen.

Täcker användarberättelser: 1, 8, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Event-ytans sju filer kör i acceptance-klassen och är gröna
- [x] #2 TVÅSIDIGT BEVIS per fil: grön hermetiskt OCH fälld när dess egna mockar tas bort
- [x] #3 Filernas a11y-assertioner följer med och kör fortfarande
- [x] #4 Klassningen av de sju filerna är HÄRLEDD ur mätdatan och räkningen redovisad i PR:en
- [x] #5 De sex likartat namngivna event-filer som har kvarvarande skarpa anrop ligger KVAR i den skarpa klassen — verifierat mot mätdatan, ej mot filnamn
- [x] #6 Samtliga arton är nu ute; räkningen stämmer mot 18/14 och redovisas
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Leverans (2026-07-28)

A5:s SISTA skiva. Migrering, inte nybygge: klassen, det mutexfria jobbet, sömmen
och task-60:s körbara tvåsidiga bevis fanns redan. Sju filer flyttade med
`git mv` (historiken bevarad — rename-detektion `RM` i hela diffen).

`anmalan-detalj` · `event-add-registration` · `event-anmalda` ·
`event-anteckningar` · `event-narvaro` · `event-ny-anmalan` ·
`events-list-kalender` → `tests/acceptance/*.acceptance.test.ts`, importerande
`./support/acceptance-bas` + `EF`/`json` ur `handlers.ts`.

### Klassningen — härledd ur mätdatan, ej handplockad (AC 4)

Räknat ur `.hermetik/rapport.jsonl` (863 poster, 32 filer — den ursprungliga
mätkörningen, när alla arton ännu låg i e2e; T105 gäller utskriften, inte
underlaget):

| fil | anrop | typsnitt | SKARPA |
|---|---|---|---|
| `anmalan-detalj.staging.test.ts` | 16 | 16 | **0** |
| `event-add-registration.staging.test.ts` | 11 | 11 | **0** |
| `event-anmalda.staging.test.ts` | 13 | 13 | **0** |
| `event-anteckningar.staging.test.ts` | 17 | 17 | **0** |
| `event-narvaro.staging.test.ts` | 17 | 17 | **0** |
| `event-ny-anmalan.staging.test.ts` | 43 | 43 | **0** |
| `events-list-kalender.staging.test.ts` | 25 | 25 | **0** |
| **summa** | **142** | **142** | **0** |

Samtliga 142 anrop går till `fonts.googleapis.com` / `fonts.gstatic.com` — noll
tredje värdnamn, noll EF-anrop mot skarp staging.

### De sex som STANNAR — mot mätdatan, aldrig mot filnamn (AC 5)

Tre av dem bildar namnpar med flyttade filer. Diskriminatorn är antalet skarpa
anrop, och EF-namnen är matchade på HELA sista path-segmentet (59.4:s
`get-person`/`get-persons`-lärdom):

| fil | anrop | typsnitt | SKARPA | vilka |
|---|---|---|---|---|
| `event-narvaro-register` (par: `event-narvaro`) | 25 | 17 | **8** | `get-event-notes` ×8 |
| `events-list` (par: `events-list-kalender`) | 72 | 59 | **13** | `get-event` ×7 · `get-registrations` ×6 |
| `event-deltagare` (par: `event-anmalda`) | 35 | 23 | **12** | `get-event-notes` ×10 · `get-events` ×2 |
| `event-bekraftelse` | 62 | 42 | **20** | `get-event-notes` ×20 |
| `event-bor-over` | 16 | 11 | **5** | `get-event-notes` ×5 |
| `event-detail` | 121 | 117 | **4** | `get-registrations` ×4 |

Ingen av de sex har noll skarpa anrop; ingen av de sju har fler än noll. Snittet
är alltså helt mätdatans — namnlikheten bär ingen klassinformation.

### Checksumman (AC 6) — samtliga arton är ute

| katalog | före | efter |
|---|---|---|
| `tests/e2e/` `.test.ts` | 21 | **14** |
| `tests/acceptance/` `.test.ts` | 11 | **18** |

De 14 kvarvarande, kontrollerade mot den namngivna listan med exakt
sträng-jämförelse: `auth-flow` · `css-cascade` · `event-bekraftelse` ·
`event-bor-over` · `event-deltagare` · `event-detail` ·
`event-narvaro-register` · `events-list` · `mark-paid` · `mer-index` ·
`persist-cache` · `pwa-offline` · `shell` · `skapa-event`. **EXAKT MATCH.**

### Tvåsidigt bevis — grindens, inte handens (AC 2, DoD 6)

**Led 1 — hermetiskt grön.** `npm run test:acceptance` ⇒ **152 passed (2,0 min)**
(var 90 före flytten).

**Led 2 — vakten fäller, körd av grinden.** `npm run test:acceptance:sjalvtest`:

```
152 tester · 152 fällda · 152 med OmockadRequestError som orsak
✅ BEVISET HÅLLER — varje test i acceptance-klassen hänger på fixturvärlden,
   och vakten är fällningsorsaken i vart och ett.
```

Varje enskilt av de 62 nya testerna föll alltså, och föll PÅ VAKTEN. Ingen fil
överlevde utan sina svar; ingen behövde skrivas om för att hänga på fixturen.

### Testantal före/efter

| projekt | före | efter |
|---|---|---|
| `acceptance` | 90 tester / 11 filer | **152 / 18** |

Exakt 62 tester flyttade (6 + 5 + 6 + 8 + 8 + 18 + 11) — inga tappade, inga
tillkomna. Räkningen stämmer mot tidsbudget-dokumentets per-fil-siffror.

### Muterande EF:er — payloaden bevisas här, skrivningen i API-sviten

Tre av de sju rör muterande EF:er. Ingen av dem SKRIVER: anropen är avlyssnade
av fixturvärlden, och det som bevisas är payloaden appen skickar plus
gränssnittets reaktion.

- `create-registration` (`event-add-registration`, `event-ny-anmalan`):
  fältuppsättningen (`fornamn`/`efternamn`/`email`/`antalPlatser`/`notering`),
  `idempotencyKey` som sträng, eventId-bytet vid väljarbyte och
  NYCKELROTATIONEN (`alla[1].idempotencyKey !== alla[0].idempotencyKey`,
  ADR-059 F7). Skrivbeviset: `tests/api/create-registration.staging.test.ts`.
- `create-event-note` (`event-anteckningar`): SERVER-SIDE-FÖRFATTAR-BEVISET
  oförändrat — `captured() === { eventId, text }`, alltså att klienten ALDRIG
  skickar `forfattare` (ADR-075). Skrivbeviset:
  `tests/api/create-event-note.staging.test.ts`.
- `send-registration-confirmation` (`anmalan-detalj`): exakt ETT anrop med
  `registrationIds === ['recBjorn']`, plus att den optimistiska flytten
  ÖVERLEVER refetchen (tillståndsbärande handler). Skrivbeviset:
  `tests/api/send-registration-confirmation.staging.test.ts`.

Ingen av de tre API-filerna är i diffen. Hade något faktiskt skrivit vore
klassningen fel och skivan skulle ha stannat.

### A11y följde med (AC 3)

Tio axe-analyser i de sju filerna, samtliga gröna: `anmalan-detalj` (BÅDA
statuslägena — bekräftad + obekräftad, 2) · `event-add-registration` (öppen
modal) · `event-anmalda` (renderad roster) · `event-anteckningar`
(scopad till Anteckningar-gruppen) · `event-narvaro` (renderad vy) ·
`event-ny-anmalan` (skarpa formen + tomt läge helsides + öppen väljare scopad,
3) · `events-list-kalender` (renderad kalendervy).

### Mönstret som följdes

- `page.route` → `network.use()` i alla sju; **noll `page.route`-anrop kvar i
  hela `tests/acceptance/`** (verifierat med kod-grep, inte prosa-grep).
- Mönstren byggda med `EF(namn)` + svaren med `json(...)` ur `handlers.ts` —
  motmedlet mot den TYSTA FÄLLAN. Noll handskrivna path-strängar; nio gamla
  regex-/glob-konstanter (`GET_EVENT`, `GET_EVENTS`, `GET_REGISTRATIONS`,
  `GET_REGISTRATION`, `GET_ATTENDANCE`, `GET_EVENT_NOTES`, `CREATE_EVENT_NOTE`,
  `CREATE_REGISTRATION`, `CONFIRM`) är borta.
- **HTTP-VERBEN VERIFIERADE, INTE ANTAGNA** (59.5:s fångst). Läst i
  `src/data/adapters/AirtableAdapter.ts` + `src/data/config/supabase-client.ts`:
  `callEdgeFunction` är GET (`get-event` · `get-events` · `get-registrations` ·
  `get-registration` · `get-attendance` · `get-event-notes`),
  `postEdgeFunction` är POST (`create-registration` ·
  `send-registration-confirmation` · `create-event-note`). Ett fel verb hade
  fallit igenom till normalläget (för de fyra som finns där) eller till vakten
  (för de fem som inte gör det) — aldrig gett ett tyst felsvar.
- **`EF('get-event')` vs `EF('get-events')` är två SKILDA mönster** — tre av
  filerna mockar båda samtidigt. Samma diskriminator som bär
  `get-person`/`get-persons` i normalläget: MSW matchar hela sista
  path-segmentet, inte en prefix-substräng. Bevisat av att `event-ny-anmalan`s
  eventväljar-tester (som kräver att listan och detaljen ger OLIKA svar) är
  gröna.
- Parkerade svar (`manualRelease` i `event-anmalda` + `event-narvaro`) bärs nu
  av obesvarade löften i MSW-resolvern i stället för uppskjutna Route-objekt.
  Samma bevis, en mekanism (task-59.4:s form).
- `get-attendance`, `get-registration`, `create-registration`,
  `create-event-note` och `send-registration-confirmation` lades AVSIKTLIGT inte
  till i normalläget — samma skäl som 59.5: en delad skrivväg hade gjort tyst
  lyckad mutation till default för hela klassen, och en delad läsväg hade gjort
  ett glömt `use()` osynligt.
- `get-events`, `get-event`, `get-registrations` och `get-event-notes` ligger i
  normalläget men överskuggas ändå där testet asserterar EXAKT data (exakta
  dag-plattor, exakt antal-summa, exakt fas-härledning). Mot normalläget hade
  beviset blivit ett kopplat påstående om fixturens datamängd.
- Namn-residuet `visual-fixture` i fixtur-URL och lagringsnyckel är ORÖRT.
- `tests/support/fixturvarld/fixture-data.ts` är ORÖRD — endast **importerad**
  (`FROZEN_NOW` i `events-list-kalender`). Filen finns inte i diffen, så
  `TASK-61` kan sekvenseras fritt.

### Avvikelser mot originalfilerna — bokförda

**1. Klockan bytte källa i `events-list-kalender` (den enda beteendebärande).**
E2E-formen pinnade klockan till VERKLIG "nu" (`page.clock.setFixedTime(new
Date())`). Det GÅR INTE att bära in i acceptance-klassen: fixturvärldens seedade
session är en JWT som går ut `FROZEN_NOW + 24 h` (2026-09-16), så en klocka satt
till verklig tid hade — så snart kalendern passerat den utgången — fått
supabase-js att försöka förnya sessionen, alltså ett nätverksanrop rakt in i
hermetik-vakten. Testet hade varit grönt idag och rött av sig självt om sju
veckor: precis den klass av "grön av fel skäl" skivan finns för att undvika.
"Nu" är därför `FROZEN_NOW` (2026-09-15), som klockan REDAN står på när testet
börjar — ingen egen `setFixedTime` behövs. Följdändring: den tomma
muted-referensdagen flyttades från 15 till **19** (FROZEN_NOW ÄR den 15:e och
den plattan bär idag-ringen; en tom referensdag som samtidigt är "idag" hade
blandat två påståenden i en mätning), och tangentbords-testets navigering till
tom dag gick från `ArrowLeft ×2` till `ArrowRight ×2`. Dag-bandet 14–22 är
fortsatt unikt i månads-gridden. Allt annat i filen är oförändrat — inga
toleranser, inga marginaler.

**2. `mockValjarLista`-stubben släppt i `anmalan-detalj` + `event-anteckningar`.**
E2E-formen stubbade `get-events` (task-18.19: väljarens listquery fick inte läcka
mot staging). I acceptance-klassen finns `get-events` i normalläget, och ingen av
de två filerna asserterar något om listan. Överskuggningen är därför borta, inte
glömd — noterat i respektive filhuvud. Hjälparen `tests/e2e/helpers/valjar-lista.ts`
STANNAR: sex e2e-filer använder den fortfarande (`event-bor-over`,
`event-narvaro-register`, `event-deltagare`, `mark-paid`, `event-detail`,
`event-bekraftelse`).

**3. `delayMs`-grenen följde inte med** i `mockRegistrations` (`event-anmalda`)
och `mockAttendance` (`event-narvaro`). Noll callers i båda filerna, och den är
den race-benägna väg `manualRelease` ersatte (T26 Landning B / TASK-3 — samma
lastkänsliga fönster som gjorde `event-narvaro:155` intermittent rött). Samma
klass av beslut som 59.4:s `mockPerson.delayMs` och 59.5:s tre. Inget bevis
påverkas; båda loading-testerna kör oförändrat via `manualRelease`.

**Sidoeffekt av 1–3:** sex `page: any` + deras `biome-ignore`-rader och två
`type Route`-importer är borta — hjälparna tar nu `NetworkFixture` respektive
`Page` med riktiga typer.

### T102 visade sig INTE — och kunde strukturellt inte göra det

`anmalan-detalj` bär två `page.screenshot({ fullPage: true })` bortom vyporten
(facit-avprickningens dumpar, DoD #6). De är ARTEFAKTER, inte jämförelser:
`toHaveScreenshot` förekommer inte i någon av de sju filerna, så det finns
ingenting för bit-instabiliteten att fälla. Inget uppvärmningsskott infört
(det hade varit ceremoni utan mätning att skydda), ingen pixelmarginal, ingen
tolerans. Bägge dumparna produceras gröna i led 1.

### Pre-flight länk-kontroll FÖRE flytten (S91 § 14.4-lärdomen)

`grep -rn "<filnamn>" --include="*.md" docs/ tasks/ backlog/ *.md` kördes för var
och en av de sju filerna, plus ett svep över hela repot utanför `*.md` och en
kontroll av markdown-LÄNKAR (`grep -rnoE "\]\([^)]*tests/[^)]*\)"`). Utfall:

| Träff | Klass | Åtgärd |
|---|---|---|
| `tests/e2e/event-narvaro-register.staging.test.ts:16` — "Skild från event-narvaro.staging.test.ts (den STANDALONE /narvaro-routen…)" | **levande pekare i KOD**, i en fil som STANNAR och pekar på en som FLYTTAR | **lagad**: ny hemvist namngiven + varför den ena flyttade och den andra inte (8 skarpa anrop) |
| `tests/e2e/event-detail.staging.test.ts:33` — "…egna beteenden bevisas i event-anteckningar.staging.test.ts" | **levande pekare i KOD**, samma klass | **lagad**: ny hemvist + flytten noterad |
| `tests/visual/event-anmalda.spec.ts:12` — `toHaveScreenshot('event-anmalda.png')` | INGEN pekare — ett baseline-FILNAMN som råkar likna | orörd (att röra den hade brutit den visuella baseline-jämförelsen) |
| `docs/research/staging-svitens-tidsbudget-2026-07-26.md` (7 tabellrader) | daterad MÄTDATA med proveniens-block | orörd — samma behandling som 59.3/59.4/59.5 gav sina filers rader |
| `tasks/todo.md:3439`, `tasks/sessions/2026-07-11-session-61.md`, `2026-06-20-session-26.md`, `tasks/sessions/bilagor/s87-spaning/{a1,a7,a9}` | historiska poster + frusna spanings-bilagor | orörda |
| `backlog/tasks/task-3`, `task-18.9`, `task-18.13`, `task-18.18` | historiska kort — **samtliga verifierade `Done`** (18.13 kontrollerad explicit: dess rivnings-scope är avslutat, inte framåtriktat) | orörda |

**NOLL markdown-LÄNKAR** pekade på någon av de sju (kontrollerat över hela
dokumentträdet). `npm run check:docs` 9/9 grönt.

### En körnings-artefakt att inte misstolka (T105)

`tests/global-teardown.ts` skriver ut hermetik-mätningens sammanfattning vid
VARJE körning utan att pröva `PLAYWRIGHT_HERMETIK_RAPPORT` — så den hermetiska
acceptance-körningen skrev återigen ut skarpa staging-URL:er ur den GAMLA
mätdatan (bl.a. `shell`s 24 och `skapa-event`s 9). Känt fynd (`T105`), inte ett
tecken på att hermetiken läcker: vakten är avbrytande i klassen, och led 2
bevisar att den fäller. Fixen hör till `TASK-59.7`, som äger mätinstrumentet.

### Grindar (lokalt, CI:s exakta kommandon)

`npm run test:acceptance` 152 passed · `npm run test:acceptance:sjalvtest`
152/152/152 ✅ · `npm run typecheck` 0 · `npm run typecheck:tests` 0 ·
`npx @biomejs/biome check .` **0 fel** (6 pre-existing warnings, ingen i rörd
fil: `src/styles/base.css`, `tests/api/*`, `tests/e2e/support/test-bas.ts`,
`docs/backfill/*`) · `npm run check:docs` 9/9 · `npm run build` grön.

`npm run test:visual` ej körd och ej tillämplig: fixturvärlden är orörd —
`handlers.ts`, `hermetic.ts` och `fixture-data.ts` är identiska med HEAD och
finns inte i diffen. Staging-sviterna ej körda lokalt (mutexen) — CI är deras
bevis.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Event-ytans sju filer i acceptance-klassen. A5:s migreringsfas är därmed KLAR — samtliga arton filer ute.

CHECKSUMMAN GICK IHOP EXAKT: e2e 14 / acceptance 18, och de fjorton kvarvarande matchar den namngivna listan med exakt strängjämförelse. Klassningen härledd ur mätdatan: 142 anrop över de sju, samtliga mot typsnitts-CDN, noll skarpa. Namnparen höll åt rätt håll — event-narvaro-register (8 skarpa), events-list (13), event-deltagare (12) ligger kvar, verifierade mot mätdatan och inte mot filnamnen.

SJÄLVTESTET: 152 tester / 152 fällda / 152 med OmockadRequestError som orsak. Exakt 62 tester flyttade, inga tappade.

AGENTEN HITTADE EN TIDSINSTÄLLD BOMB SOM INTE FANNS I BRIEFEN. events-list-kalender pinnade sin klocka till VERKLIG tid i e2e-formen. Fixtursessionens JWT byggs som FROZEN_NOW + 24h, och FROZEN_NOW är 2026-09-15 — alltså utgång 2026-09-16. Med verklig tid hade supabase-js efter det datumet sett en utgången session och försökt förnya den: ett nätverksanrop rakt in i hermetik-vakten. Testet hade varit grönt vid landning och rött av sig självt om sju veckor, och felet hade läst som ett hermetik-läckage i stället för ett datumproblem. Kedjan verifierad mot koden av orkestreraren innan beteendeändringen accepterades (referensdag 15→19, ArrowLeft→ArrowRight).

PRE-FLIGHT GAV TVÅ LEVANDE PEKARE, båda i KOD och inte markdown: event-narvaro-register:16 och event-detail:33 korsrefererade flyttade filer vid gammal sökväg. Lagade. Noll markdown-länkar pekade på någon av de sju. Ett baseline-filnamn i tests/visual som liknar men inte är en pekare lämnades korrekt orört.

INGET SKRIVBEVIS FLYTTAT: tre muterande EF:er (create-registration, create-event-note, send-registration-confirmation) är avlyssnade med payload-assertioner; skrivbevisen ligger kvar i tests/api/ och är inte i diffen.

fixture-data.ts RÖRD EJ — endast importerad. TASK-61 kan därmed sekvenseras fritt.

ORKESTRERARENS GRANSKNING (verifierat, ej godtaget på rapport): checksumman räknad mot git · sju renames bekräftade · fixture-data.ts:s frånvaro i diffen bekräftad · JWT-kedjan verifierad mot fixture-data.ts och hermetic.ts · de två kod-pekarna lästa i diffen.

CI grön per jobb 9/9, körning 30346750369, PR #318 (merge e6a69a4). PR:en var BEHIND vid armering — uppdaterad FÖRE armering denna gång, till skillnad från 59.5 där det lagades efteråt.

MÄTNING VID LANDNING (formell mätning är 59.7:s uppgift): staging-sviten 9,10 min (30320122732, före 59.5) → 8 min → 6,50 min (denna körning). Vinsten är verklig men mindre än de ~2,4 min som projicerades. SAMTIDIGT: acceptance-jobbet ligger nu på 6,7 min mot taket 8 — skarp svit 174 s plus självtest 202 s. Marginalen 1,3 min är en risk för falsk röd och överlämnas till 59.7.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Klassningen av varje flyttad fil är HÄRLEDD ur hermetik-mätdatan och räkningen redovisad — ingen handplockning
- [x] #6 Varje flyttad fil har tvåsidigt bevis: passerar hermetiskt OCH vakten fäller när dess mockar tas bort
- [x] #7 Samma zod-scheman parsar fixtursvar som parsar skarpa svar — fogen verifierad, ej antagen
<!-- DOD:END -->
