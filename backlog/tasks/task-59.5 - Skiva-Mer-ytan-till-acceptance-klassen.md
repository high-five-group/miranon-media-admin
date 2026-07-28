---
id: TASK-59.5
title: 'Skiva: Mer-ytan till acceptance-klassen'
status: Done
assignee: []
created_date: '2026-07-27 20:41'
updated_date: '2026-07-28 09:04'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.4
parent_task_id: TASK-59
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mer-ytans sex filer — anmälningar, intresserade, maillogg, väntelista, segment och segment-utskick — flyttas till acceptance-klassen.

BETEENDET ÄNDE-TILL-ÄNDE: hela Mer-ytan svarar ur det mutexfria jobbet. Segment-filerna är ytans tyngsta: de rör beräknat medlemskap och utskick, alltså vyer vars svar är sammansatta. De bevisar efter flytten samma sak som före — att appen renderar och beter sig rätt givet svar av rätt form.

VARFÖR SEX FILER I EN SKIVA: de delar yta, och en granskare som ser Mer-ytan flytta i ett stycke kan hålla hela ändringen i huvudet. Sex godtyckliga filer hade krävt att granskaren håller sex separata sammanhang.

SÄRSKILT ATT SE UPP MED: utskicks-filen rör en muterande Edge Function. Den skriver inte skarpt — anropet är avlyssnat och testet verifierar payloaden appen skickar plus hur gränssnittet reagerar på svaret. Skrivbeviset ligger i API-sviten och ska ligga kvar där. Flyttas något som faktiskt skriver är klassningen fel och skivan ska stanna.

Täcker användarberättelser: 1, 5, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mer-ytans sex filer kör i acceptance-klassen och är gröna
- [x] #2 TVÅSIDIGT BEVIS per fil: grön hermetiskt OCH fälld när dess egna mockar tas bort
- [x] #3 Filernas a11y-assertioner följer med och kör fortfarande
- [x] #4 Klassningen av de sex filerna är HÄRLEDD ur mätdatan och räkningen redovisad i PR:en
- [x] #5 Utskicks-filen verifierar fortfarande PAYLOADEN appen skickar — inget skrivbevis har flyttats ur API-sviten
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Leverans (2026-07-28)

Migrering, inte nybygge: klassen, det mutexfria jobbet, sömmen och sedan
task-60 även det körbara tvåsidiga beviset fanns redan. Sex filer flyttade med
`git mv` (historiken bevarad, rename-detektion R067–R074 i diffen).

`mer-anmalningar` · `mer-intresserade` · `mer-maillogg` · `mer-vantelista` ·
`mer-segment` · `mer-segment-send` → `tests/acceptance/*.acceptance.test.ts`,
importerande `./support/acceptance-bas` + `EF`/`json` ur `handlers.ts`.

### Klassningen — härledd ur mätdatan, ej handplockad (AC 4)

Räknat ur `.hermetik/rapport.jsonl` (863 poster, 32 filer — den ursprungliga
mätkörningen, när alla arton filer ännu låg i e2e):

| fil | anrop | typsnitt | SKARPA |
|---|---|---|---|
| `mer-anmalningar.staging.test.ts` | 11 | 11 | **0** |
| `mer-intresserade.staging.test.ts` | 15 | 15 | **0** |
| `mer-maillogg.staging.test.ts` | 18 | 18 | **0** |
| `mer-vantelista.staging.test.ts` | 13 | 13 | **0** |
| `mer-segment.staging.test.ts` | 22 | 22 | **0** |
| `mer-segment-send.staging.test.ts` | 6 | 6 | **0** |
| **summa** | **85** | **85** | **0** |

Samtliga 85 anrop går till `fonts.googleapis.com` / `fonts.gstatic.com` — noll
tredje värdnamn, noll EF-anrop mot skarp staging.

DISKRIMINATORN, och skälet skivan är sex filer och inte sju: Mer-ytans sjunde
fil `mer-index.staging.test.ts` mäter **29 anrop, 25 typsnitt, 4 SKARPA**
(`get-events` ×2 + `get-registrations` ×2). Den STANNAR i e2e. Skivans snitt är
alltså mätdatans, inte ytans.

### Tvåsidigt bevis — handrutinen är avskaffad (AC 2, DoD 6)

**Led 1 — hermetiskt grön.** `npm run test:acceptance` ⇒ **90 passed (1,2 min)**
(var 51 före flytten).

**Led 2 — vakten fäller, körd av grinden.** `npm run test:acceptance:sjalvtest`
(task-60) i stället för handpatchning:

```
90 tester · 90 fällda · 90 med OmockadRequestError som orsak
✅ BEVISET HÅLLER — varje test i acceptance-klassen hänger på fixturvärlden,
   och vakten är fällningsorsaken i vart och ett.
```

Varje enskilt av de 39 nya testerna föll alltså, och föll PÅ VAKTEN. Ingen fil
överlevde utan sina svar; ingen behövde skrivas om.

### Testantal före/efter

| projekt | före | efter |
|---|---|---|
| `chromium-authenticated` (e2e) | 282 tester / 28 filer | **243 / 22** |
| `acceptance` | 51 tester / 5 filer | **90 / 11** |

Exakt 39 tester flyttade (5 + 7 + 8 + 6 + 10 + 3) — inga tappade, inga
tillkomna.

### Utskicks-filen: payloaden bevisas här, skrivningen i API-sviten (AC 5)

`send-email` är muterande, men anropet är avlyssnat — ingen mail lämnar
fixturvärlden. Body-kontraktet asserteras oförändrat i acceptance-klassen:
`segmentIds === ['recSAVED1']`, `amne`, `mailtext` och `idempotencyKey` mot
UUID-v4-regexen. Därtill gränssnittets reaktion på SVARET: låst faro-knapp,
skriv-för-att-bekräfta-grinden (fel antal → fortsatt låst), grön-knapp-regelns
färglås, och `accepted===0` → ärlig icke-success-rendering med breakdown.

Skrivbeviset ligger kvar i `tests/api/send-email.staging.test.ts` — filen är
INTE i diffen. Ingenting som faktiskt skriver har flyttats: `save-segment` (i
`mer-segment`) och `compute-segment` är likaså avlyssnade, och deras
server-kontrakt bor i API-sviten. Hade något faktiskt skrivit vore klassningen
fel och skivan skulle ha stannat.

### A11y följde med (AC 3)

Åtta axe-analyser i åtta tester, samtliga gröna: `mer-anmalningar` (renderad
lista) · `mer-intresserade` (renderad vy) · `mer-maillogg` (TOM vy + IFYLLD vy,
två separata tester) · `mer-vantelista` (renderad vy) · `mer-segment`
(byggar-vyn med klartext-spegling + hela export-L4-flödet) · `mer-segment-send`
(hela compose-flödet inklusive resultat-renderingen).

### Mönstret som följdes

- `page.route` → `network.use()` i alla sex. Page-routes prövas FÖRE MSW:s
  context-routes; en kvarlämnad page.route hade lagt en andra
  avlyssningsmekanism ovanpå fixturvärlden (tudelningen task-54.2 rev bort).
- Mönstren byggda med `EF(namn)` + svaren med `json(...)` ur `handlers.ts` —
  motmedlet mot den TYSTA FÄLLAN. Noll handskrivna path-strängar; de sex gamla
  regex-konstanterna (`GET_WAITLIST`, `COMPUTE_SEGMENT`, …) är borta.
- **HTTP-verben verifierade, inte antagna.** `page.route` matchar ALLA metoder,
  `http.get`/`http.post` gör det inte. Läst i `src/data/config/supabase-client.ts`:
  `callEdgeFunction` är GET (`get-events`/`get-segments`/`get-leads`/
  `get-mail-log`/`get-waitlist`/`get-registrations`), `postEdgeFunction` är POST
  (`compute-segment`/`save-segment`/`send-email`). Ett fel verb här hade fallit
  igenom till normalläget eller till vakten — inte gett ett tyst felsvar.
- Överskuggnings-PRECEDENSEN som `beforeEach`-mönstren lutar sig mot:
  `use()` lägger sina handlers FÖRST (`[...overridesForKind, ...existingForKind]`,
  msw handlers-controller) och första träffen vinner, så ett SENARE `use()` slår
  ett tidigare. Det bevarar exakt semantiken hos page.route-formens "sist
  registrerad matchas först" i `mer-segment`s spara-test (stateful `get-segments`)
  och `mer-segment-send`s 0-mottagar-test (`compute-segment` → count 0).
- Parkerade svar (`manualRelease` i intresserade/maillogg/väntelista) bärs nu av
  obesvarade löften i MSW-resolvern i stället för uppskjutna Route-objekt. Samma
  bevis, en mekanism (task-59.4:s form).
- `get-leads`, `get-mail-log`, `get-waitlist`, `get-segments`, `compute-segment`,
  `save-segment` och `send-email` lades AVSIKTLIGT inte till i normalläget. En
  delad skrivväg hade gjort tyst lyckad mutation till default för hela klassen,
  och en delad läsväg hade gjort ett glömt `use()` osynligt. De överskuggas per
  test — och ett test som glömmer sin överskuggning fälls av vakten med adressen
  namngiven (bevisat av led 2 ovan).
- `get-events` och `get-registrations` ligger i normalläget men överskuggas ändå
  i `mer-anmalningar` respektive `mer-segment`/`mer-segment-send`: testerna
  asserterar EXAKT sorteringsordning, exakt antal och exakta par-grupper ur
  taxonomin. Mot normalläget hade beviset blivit ett kopplat påstående om
  fixturens datamängd. Svarsformen är oförändrat EF:ens — snittet ligger kvar
  vid protokollet.
- Namn-residuet `visual-fixture` i fixtur-URL och lagringsnyckel är ORÖRT.

### T102-instabiliteten visade sig INTE

Ingen av de sex filerna bär en skärmdumps-jämförelse (`toHaveScreenshot`
förekommer inte i någon av dem) — klassen av bit-instabilitet task-59.3 mötte
kan strukturellt inte uppstå här. Ingen pixelmarginal införd, ingen tolerans
tillagd.

### Pre-flight länk-kontroll FÖRE flytten (S91 § 14.4-lärdomen)

`grep -rn "<filnamn>" --include="*.md" docs/ tasks/ backlog/ *.md` kördes för
var och en av de sex filerna, plus ett svep över hela repot utanför `*.md`
(config, workflows, skript). Utfall:

|Träff|Klass|Åtgärd|
|---|---|---|
|`docs/research/verktygsval-fyra-egenbyggen-2026-07-27.md:206`|**levande pekare** — "Nuvarande form, hämtad ur `tests/e2e/mer-vantelista.staging.test.ts`", och formen är precis den denna skiva ersatte|**lagad** i samma commit: historiken bevarad, ny hemvist länkad, rekommendationens verkställande noterat|
|`docs/research/staging-svitens-tidsbudget-2026-07-26.md` (6 tabellrader)|daterad MÄTDATA med proveniens-block|orörd — samma behandling som 59.3/59.4 gav sina filers rader|
|`docs/BUILD-LOG.md:1894–1895`|historisk "filer rörda"-lista för Fas 6h-landningen|orörd|
|`tasks/sessions/*` + `backlog/tasks/task-3`, `task-18.10`, `task-18.16`, `task-49`|historiska poster, oformaterade filnamn|orörda|

INGEN markdown-LÄNK pekade på någon av de sex filerna (kontrollerat med
`grep -rnoE "\]\([^)]*tests/[^)]*\)"` över hela dokumentträdet) — den enda
länken mot `tests/e2e/mer-*` går till `mer-index.staging.test.ts`, som stannar.
`npm run check:docs` 9/9 grönt EFTER doc-ändringen, alltså med lychee körd.

### En körnings-artefakt att inte misstolka (T105)

`tests/global-teardown.ts` skriver ut hermetik-mätningens sammanfattning vid
VARJE körning utan att pröva `PLAYWRIGHT_HERMETIK_RAPPORT` — så den hermetiska
acceptance-körningen skrev ut skarpa staging-URL:er ur den GAMLA mätdatan.
Känt fynd (`T105`), inte ett tecken på att hermetiken läcker. Vakten är
avbrytande i klassen; hade ett anrop gått ut hade testet fällts.

### Avvikelse mot originalfilerna — bokförd

`delayMs`-grenen i `mockLeads`, `mockMailLog` och `mockWaitlist` följde INTE med
i flytten. Ingen caller använde den i någon av de tre filerna, och den är den
race-benägna väg `manualRelease` ersatte (T26 Landning B / TASK-3 — samma
lastkänsliga fönster som gjorde `mer-vantelista:142` intermittent rött). Att
bära en foot-gun vidare in i en hermetisk klass vore fel; borttagningen
redovisas här i stället för att göras tyst. Samma klass av beslut som 59.4:s
`mockPerson.delayMs`. Inget bevis påverkas — samtliga 39 tester är gröna, och
alla tre loading-testerna kör oförändrat via `manualRelease`.

Sidoeffekt: `page: any` + dess tre `biome-ignore`-rader och `type Route`-importen
i segment-filerna är borta — hjälparna tar nu `NetworkFixture` respektive `Page`
med riktiga typer.

### Grindar (lokalt, CI:s exakta kommandon)

`npm run test:acceptance` 90 passed · `npm run test:acceptance:sjalvtest`
90/90/90 ✅ · `npm run typecheck` 0 · `npm run typecheck:tests` 0 ·
`npx @biomejs/biome check .` exit 0 (0 fel) · `npm run check:docs` 9/9 ·
`npm run build` grön.

`npm run test:visual` ej körd och ej tillämplig: fixturvärlden är orörd —
`handlers.ts`, `hermetic.ts` och `fixture-data.ts` är identiska med HEAD och
finns inte i diffen. Staging-sviterna ej körda lokalt (mutexen) — CI är deras
bevis.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Mer-ytans sex filer i acceptance-klassen. Sex git mv med bevarad historik; page.route → network.use() genomgående, mönster via EF(namn) och svar via json(...) — noll handskrivna path-strängar.

KLASSNINGEN HÄRLEDD UR MÄTDATAN: 85 anrop över de sex filerna, samtliga mot typsnitts-CDN, noll skarpa. Diskriminatorn är mätdatans, inte ytans — Mer-ytans SJUNDE fil mer-index mäter 4 skarpa (get-events ×2 + get-registrations ×2) och stannar i e2e.

BEVISET KÖRDES MED TASK-60:s GRIND, inte för hand: acceptance 90 passed (var 51), självtest 90 tester / 90 fällda / 90 med OmockadRequestError som orsak. Alla 39 nya tester hängde på fixturen direkt — ingen fil behövde skrivas om. Detta var självtestets första skarpa användning, en skiva efter att det byggdes.

PRE-FLIGHT-LÄNKKONTROLLEN GAV ETT ÄKTA FYND: docs/research/verktygsval-fyra-egenbyggen-2026-07-27.md:206 var en levande pekare mot en form denna skiva ersatte. Lagad i samma commit med historiken bevarad. Daterad mätdata, BUILD-LOG:s historiska listor och sessionsdok lämnades orörda — rätt behandling per 59.3/59.4:s precedent.

HTTP-VERBEN VAR EN FÄLLA AGENTEN VERIFIERADE I STÄLLET FÖR ATT GISSA: page.route matchar alla metoder, http.get/http.post gör det inte. compute-segment/save-segment/send-email är POST via postEdgeFunction, resten GET. Fel verb hade fallit igenom till normalläget eller till vakten. Lärdomen är inlagd i 59.6:s brief.

INGET SKRIVBEVIS FLYTTAT: send-email är avlyssnat, payload-assertionerna följde med, skrivbeviset ligger kvar i tests/api/send-email.staging.test.ts som inte är i diffen.

BOKFÖRD AVVIKELSE: delayMs-grenen i mockLeads/mockMailLog/mockWaitlist följde inte med — ingen caller använde den, och det är den race-benägna väg manualRelease ersatte. Samma beslutsklass som 59.4:s mockPerson.delayMs.

ORKESTRERARENS GRANSKNING (verifierat, ej godtaget på rapport): sex renames bekräftade i git; page.route finns endast i förklarande kommentarer, noll anrop; skrivbevisen kvar i api-sviten; mer-index stannade; diffen är 8 filer utan strökar. En siffra skavde — agenten rapporterade 22 e2e-filer, git ger 21; förklaringen är att Playwright räknar auth.setup.ts. Olika räknesätt, inte olika verklighet.

CI grön per jobb 9/9, körning 30344181005, PR #313 (merge 2bf23d9). PR:en fastnade först i BEHIND sedan TASK-61 landat under tiden — orkestrerarens sekvenseringsmiss, L328:s BEHIND-svält; löst med gh pr update-branch och omstartad vakt mot ny SHA.

A5 står därmed på 11 av 18 filer.
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
