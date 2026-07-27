---
id: TASK-59.3
title: 'Skiva: Klassen etablerad — mutexfritt jobb och Hem-ytan som pilot'
status: Done
assignee: []
created_date: '2026-07-27 20:41'
updated_date: '2026-07-27 23:41'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.2
parent_task_id: TASK-59
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Acceptance-klassen får sitt eget projekt, sitt eget mutexfria CI-jobb och sin egen söm — och Hem-ytans två filer flyttas dit som pilot.

BETEENDET ÄNDE-TILL-ÄNDE: en utvecklare öppnar en PR som bara rör Hem-vyns rendering. Acceptance-jobbet startar utan att vänta på staging-mutexen, kör de två Hem-filerna mot fixturvärlden och svarar på under en minut. Ingen av dem rör nätet: gör en av dem det FÄLLER den, med adressen namngiven.

VARFÖR HEM ÄR PILOTEN: ytan är den minsta sammanhängande (två filer) men bär samtidigt den fil som har flest restanrop av alla arton. Den prövar alltså både den enkla vägen och den tyngsta lasten, utan att sätta sex filer i spel innan mekaniken är bevisad.

SÖMMEN KOMPONERAS, DEN KOPIERAS INTE. Playwrights egen mekanism för att kombinera fixturmoduler används; klassen ärver fixturvärlden från den delade hemvisten i stället för att bygga en andra. Två fixturvärldar vore emot både MSW:s och Playwrights uttalade designavsikt, och emot kravet att en fixtur och ett schema aldrig får divergera.

VAKTEN ÄR AVBRYTANDE HÄR, inte rapporterande. En fil som flyttats för tidigt ska bli röd, inte grön av fel skäl.

TVÅSIDIGT BEVIS PER FIL: att den passerar hermetiskt bevisar ingenting om vakten. Först när dess egna mockar tas bort och testet DÅ fälls är hermetiken bevisad i stället för förhoppad.

Täcker användarberättelser: 1, 2, 3, 11, 13
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Acceptance-klassen har eget projekt och eget CI-jobb som kör UTAN staging-mutex
- [x] #2 Sömmen komponeras ur den delade fixturvärlden med Playwrights egen fixtur-kompositionsmekanism — ingen andra handler-uppsättning införs
- [x] #3 Vakten är AVBRYTANDE i klassen och svarar med statuskod plus instruktionstext i klartext, inte ett anonymt avbrott
- [x] #4 Hem-ytans två filer kör i klassen och är gröna
- [x] #5 TVÅSIDIGT BEVIS för båda filerna: grön hermetiskt OCH fälld när dess egna mockar tas bort
- [x] #6 Filernas a11y-assertioner följer med och kör fortfarande — inget bevis tappas i flytten
- [x] #7 Klassningen av de två filerna är HÄRLEDD ur mätdatan och räkningen redovisad i PR:en
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Leverans (2026-07-28)

### Sömmen — komponerad, inte kopierad (AC 2)

`tests/acceptance/support/acceptance-bas.ts`:
`mergeTests(fixturvarld, matbas)` ur TVÅ befintliga fixturmoduler —
`tests/support/fixturvarld/hermetic.ts` (klassdelad sedan 59.1) och
`tests/e2e/support/test-bas.ts` (mätinstrumentet, no-op utan
`PLAYWRIGHT_HERMETIK_RAPPORT=1`). Ingen kopia, inget `.extend()`, ingen andra
handler-uppsättning. Ordningen är beroendebestämd: network → page →
hermetikRapport.

Filernas EGNA mockar konverterades från `page.route` till `network.use()`.
Skälet är inte smak: page-routes prövas FÖRE MSW:s context-routes, så
page.route-mockar hade lagt en andra avlyssningsmekanism ovanpå den
fixturvärlden bär — samma tudelning task-54.2 tog bort. `EF` och `json`
exporteras nu ur `handlers.ts` så en överskuggning per konstruktion inte kan
drifta ifrån det mönster normalläget matchar (motmedel mot den tysta fällan).

### Mutexfrihet — placering, inte flagga (AC 1)

Nytt jobb `acceptance` i `ci-suite.yml`, syskon till `test-fast`/`a11y`:
ingen `concurrency`-grupp, inget `needs: [purge]`, ingen `env:`-secret, inget
`if`. `continue-on-error` förekommer inte och är förbjuden i jobbet (den hade
gjort `needs`-resultatet till `success` och tystat paraply-checken).

Kontrollerat att jobbet inte kan fälla en PR felaktigt: (a) noll secrets ⇒
ingen dependabot-/secret-gate behövs och ingen kan saknas; (b) ingen
`concurrency` någonstans i kedjan ⇒ ingen kö, ingen mutex-timeout; (c) noll
staging/Airtable ⇒ ingen delad muterbar data och ingen annan PR:s tillstånd;
(d) sviten når inget nätverk utanför localhost — vakten avbryter. Kvar som
felkällor: appens beteende och infrastruktur (checkout/npm ci/browser).
Jobbet är BLOCKERANDE via `suite` → `ci-passed`, vilket är avsikten.

Projektet `acceptance` i `playwright.config.ts`: `testDir: ./tests/acceptance`,
`devices['Desktop Chrome']` (viewport 1280 är ett KRAV — Hem mäter
`(1280-600)/2`), egen dev-server-port 5399 med SAMMA fixtur-env som visual.
Script: `npm run test:acceptance`.

### Tvåsidigt bevis (AC 5)

Led 1 — hermetiskt grön: `npm run test:acceptance` ⇒ **35 passed (38,0 s)**
(hem 28, hem-laddlage 7).

Led 2 — vakten fäller: filernas egna `network.use()` neutraliserade OCH
normalläget tömt (`handlers = []`), så anropen når vakten:
· hem.acceptance.test.ts ⇒ **28 failed**, 56 `OmockadRequestError`
· hem-laddlage.acceptance.test.ts ⇒ **7 failed**, 14 `OmockadRequestError`
Meddelandet i klartext, statuskod-formen per ADR-080 beslut 4:
```
OmockadRequestError: Hermetik-vakten stoppade ett omockat anrop i fixturvärlden.
  GET https://visual-fixture.supabase.co/functions/v1/get-events
Ingen handler matchar denna Edge Function. Mockat här (0):
Ska svaret gälla ALLA tester: lägg till en handler i
tests/support/fixturvarld/handlers.ts. Ska det gälla bara detta test:
överskugga lokalt med network.use() …
```
Riggen återställd; 35 passed på nytt efter återställningen.

### Klassningen — härledd, ej handplockad (AC 7)

Ur `.hermetik/rapport.jsonl` (863 poster, 32 filer): 19 filer mekaniskt rena
efter typsnitts-pinning, 13 med kvarvarande skarpa anrop; minus doktrinärt
undantagna `pwa-offline` ⇒ **18 acceptance / 14 skarpa** (reproducerar
ADR-080:s korrigerade räkning exakt).
· `hem.staging.test.ts`: 62 anrop, 62 typsnitt, **0 skarpa** — HÖGST av alla
  arton (näst högst: event-ny-anmalan 43)
· `hem-laddlage.staging.test.ts`: 15 anrop, 15 typsnitt, **0 skarpa**

### A11y följde med (AC 6)

Tre axe-assertioner intakta och gröna: hem "axe 0 violations på den renderade
Hem-vyn", hem "AC 6 … axe 0 med full lista", hem-laddlage "AC 4 — axe 0
violations på Hem i laddläge".

### Avvikelser och fynd

1. **Uppvärmningsskott i task-4.5 AC 1.** Byte-identitetsprovet föll i
   acceptance-miljön. Mätt: `main#main` är 831 px mot 720 px vyport, och det
   FÖRSTA skottet bortom vyporten är inte bit-stabilt — fem skott i rad ger
   #1 ≠ #2–#5 medan #2–#5 är byte-identiska. Avvikelsen: 38 px av 498 600,
   alla ±1 i EN kanal, alla på tabbarens antialiasade rundade kant.
   Falsifierat att det är sidan: `document.getAnimations()` tom, scroll still,
   varken dubbel-rAF eller `document.fonts.ready` ändrar utfallet.
   Kontrollprov i e2e-klassen FÖRE flytten: två skott i rad är bit-identiska
   (`fore==fore2: true`). Åtgärd: ett kasserat uppvärmningsskott före
   referensen — noll tolerans behålls, ingen pixelmarginal införd.
2. **`TEST_USER_EMAIL` → `FIXTUR_EPOST`.** "Aldrig e-postadressen"-testet läste
   en staging-credential ur `process.env`. Adressen exporteras nu ur
   `hermetic.ts` och byggs in i sessionen där — samma bevis, ingen
   miljöberoende.
3. **Mätinstrumentets siffra betyder annat i klassen.** All mockning ligger på
   context-nivå (MSW), alltså UNDER instrumentets page-route-catch-all: talet
   blir en trafik-räkning, inte en läckage-räkning. Mätt på ytan: 162 anrop
   fördelade på exakt TVÅ värdar (fixtur-originet + typsnitts-CDN:en), noll
   tredje värdnamn. Dokumenterat i sömmens docblock.
4. **Namn-residu lämnad orörd:** fixtur-URL och lagringsnyckel bär fortfarande
   `visual-fixture` i sina värden. Nyckeln härleds av supabase-js ur
   värdnamnet — omdöpning vore beteendeändring förklädd till namnstädning.

### Grindar (lokalt, CI:s exakta kommandon)

`npm run typecheck` 0 · `npm run typecheck:tests` 0 ·
`npx @biomejs/biome check .` exit 0 · `npm run build` grön ·
`npm run test:api:pure` 224 passed · `npm run test:visual` 28 passed
(fixturvärlden orörd i beteende) · `npm run test:acceptance` 35 passed ·
`actionlint 1.7.12` (CI:s pinnade version + samma -ignore) exit 0 ·
`yamllint .github/` OK · `markdownlint-cli2` 0 errors ·
`npm run lint:prose` 0 errors · `npm run check:docs` 9 gröna.

E2E-projektet efter flytten: 298 tester i 31 filer (var 333/33) — de 35
flyttade återfinns i acceptance-projektet.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Klassningen av varje flyttad fil är HÄRLEDD ur hermetik-mätdatan och räkningen redovisad — ingen handplockning
- [ ] #6 Varje flyttad fil har tvåsidigt bevis: passerar hermetiskt OCH vakten fäller när dess mockar tas bort
- [ ] #7 Samma zod-scheman parsar fixtursvar som parsar skarpa svar — fogen verifierad, ej antagen
<!-- DOD:END -->
