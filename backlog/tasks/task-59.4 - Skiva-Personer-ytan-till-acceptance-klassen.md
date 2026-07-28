---
id: TASK-59.4
title: 'Skiva: Personer-ytan till acceptance-klassen'
status: Done
assignee: []
created_date: '2026-07-27 20:41'
updated_date: '2026-07-28 00:21'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.3
parent_task_id: TASK-59
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Personer-ytans tre filer — listan, detaljvyn och anteckningsredigeringen — flyttas till acceptance-klassen.

BETEENDET ÄNDE-TILL-ÄNDE: en ändring i personlistans rendering, sökning eller ladda-fler får sitt svar ur det mutexfria jobbet. Detaljvyn och anteckningsredigeringen likaså. Ytan bevisar fortfarande samma sak som före flytten — att APPEN beter sig rätt givet svar av rätt form — men säger det nu genom sin klass i stället för genom sin kropp.

VARFÖR PERSONER KOMMER FÖRE MER OCH EVENT: tre filer, sammanhängande yta, och personlistans resolvers i fixturvärlden är redan de mest utbyggda (sök, sidstorlek, markör). Ytan prövar alltså fixturens rikaste del tidigt, medan mekaniken fortfarande är färsk.

MÖNSTRET SOM SKIVAN LUTAR SIG MOT är dokumenterat i fixturmodulen: behöver ETT test ett annat svar än den delade handlern överskuggas den lokalt, per test. Den tysta fällan står där också och ska läsas före första filen — en överskuggning vars mönster inte matchar faller igenom till den delade handlern utan att något fälls, och testet ser då normalläget i stället för sitt specialfall.

Täcker användarberättelser: 1, 5, 8, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Personer-ytans tre filer kör i acceptance-klassen och är gröna
- [x] #2 TVÅSIDIGT BEVIS per fil: grön hermetiskt OCH fälld när dess egna mockar tas bort
- [x] #3 Filernas a11y-assertioner följer med och kör fortfarande
- [x] #4 Klassningen av de tre filerna är HÄRLEDD ur mätdatan och räkningen redovisad i PR:en
- [x] #5 Ingen fil som kräver skarp backend har flyttats med på köpet — de fjorton skarpa är oförändrade
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Leverans (2026-07-28)

Migrering, inte nybygge: klassen, det mutexfria jobbet och sömmen fanns sedan
task-59.3. Tre filer flyttade med `git mv` (historiken bevarad, rename-detektion
R063–R066 i diffen).

`persons-list` · `person-detail` · `person-note-edit`
→ `tests/acceptance/*.acceptance.test.ts`, importerande
`./support/acceptance-bas` + `EF`/`json` ur `handlers.ts`.

### Klassningen — härledd ur mätdatan, ej handplockad (AC 4)

Räknat ur `.hermetik/rapport.jsonl` (863 poster, 32 filer) i detta pass —
reproducerar ADR-080:s korrigerade 18/14 exakt (19 mekaniskt rena minus
doktrinärt undantagna `pwa-offline`; 13 skarpa + `pwa-offline` = 14):

| fil | anrop | typsnitt | SKARPA |
|---|---|---|---|
| `persons-list.staging.test.ts` | 9 | 9 | **0** |
| `person-detail.staging.test.ts` | 18 | 18 | **0** |
| `person-note-edit.staging.test.ts` | 10 | 10 | **0** |

Samtliga anrop går till `fonts.googleapis.com` / `fonts.gstatic.com` — noll
tredje värdnamn, noll EF-anrop mot skarp staging.

### Tvåsidigt bevis per fil (AC 2)

**Led 1 — hermetiskt grön.** `npm run test:acceptance` ⇒ **51 passed (45,0 s)**
(var 35 före flytten; hem 28, hem-laddlage 7, person-detail 8, persons-list 4,
person-note-edit 4).

**Led 2 — vakten fäller.** Filernas egna `network.use()` neutraliserade OCH
normalläget tömt (`handlers` → tom array), så anropen når vakten:

| fil | utfall | vakt-fällningar | adress i meddelandet |
|---|---|---|---|
| `persons-list` | **4 failed** | 4 | `GET …/functions/v1/get-persons?pageSize=50` |
| `person-detail` | **8 failed** | 8 | `GET …/functions/v1/get-person?id=recDETAIL0000001` |
| `person-note-edit` | **4 failed** | 4 | `GET …/functions/v1/get-person?id=recNOTEEDIT000001` |

**Led 2b — skrivvägen bevisad separat.** I `person-note-edit` fäller vakten på
`get-person` innan `update-record` ens nås, så det ledet bevisar inget om
skrivvägen. Extra prov: ENDAST `http.post(EF('update-record'))`-överskuggningen
neutraliserad, `get-person` kvar ⇒ **2 failed / 2 passed** — de två testerna som
sparar föll på

```
OmockadRequestError: Hermetik-vakten stoppade ett omockat anrop i fixturvärlden.
  POST https://visual-fixture.supabase.co/functions/v1/update-record
Ingen handler matchar denna Edge Function. Mockat här (7):
  · GET */functions/v1/get-events
  · GET */functions/v1/get-registrations
  … 
```

medan Esc-testet och axe-testet passerade — de sparar aldrig, vilket är exakt
rätt utfall. Riggen återställd; 51 passed på nytt efter återställningen
(`git diff HEAD --name-status` = enbart de tre renamen).

### A11y följde med (AC 3)

Fem axe-analyser i fyra tester, samtliga gröna: `persons-list` "DoD 4 — axe 0 …
listan"; `person-detail` "axe 0 … detaljvyn" + "GLES data … empty-state UTANFÖR
`<dl>`"; `person-note-edit` "axe 0 — read-läge OCH edit-läge" (två analyser i
ett test).

### De fjorton skarpa är orörda (AC 5)

`git diff HEAD` mot var och en av de fjorton: **14/14 identiska med HEAD**.
Hela diffen består av tre renames — inga andra filer alls.

### Mönstret som följdes (och en avvikelse som inte gjordes)

- `page.route` → `network.use()` i alla tre. Page-routes prövas FÖRE MSW:s
  context-routes; en kvarlämnad page.route hade lagt en andra
  avlyssningsmekanism ovanpå fixturvärlden (tudelningen task-54.2 rev bort).
- Mönstren byggda med `EF(namn)` + svaren med `json(...)` ur `handlers.ts` —
  motmedlet mot den tysta fällan. Inga handskrivna path-strängar.
- `person-detail`:s gamla `/get-person\?/`-regex bar frågetecknet ENBART för att
  en page.route-substrängsmatchning annars svalt `get-persons`. `EF('get-person')`
  matchar hela sista path-segmentet och kan per konstruktion inte träffa
  `get-persons` — samma sak som skiljer `get-event` från `get-events`. Verifierat
  i körning: listan och detaljen får rätt svar var för sig.
- Parkerade svar (`manualRelease`, svars-gate) bärs nu av obesvarade löften i
  MSW-resolvern i stället för uppskjutna Route-objekt. Samma bevis, en mekanism.
- `update-record` lades AVSIKTLIGT inte till i normalläget: en delad skrivväg
  hade gjort tyst lyckad mutation till default för hela klassen. Den överskuggas
  per test, och ett test som sparar utan överskuggning fälls (bevisat ovan).
- Namn-residuet `visual-fixture` i fixtur-URL och lagringsnyckel är ORÖRT.

### Resolver-beroende beteende (sök, "Ladda fler")

Normalläget bär en rik `get-persons`-resolver (speglar EF:ens
`search`/`pageSize`/`cursor` mot 17 personer). Filen överskuggar den ändå, och
det är ett medvetet val: testet asserterar EXAKTA sidstorlekar (2 + 2 + 1) och en
exakt träffmängd per sökterm. Mot normalläget hade beviset blivit ett kopplat
påstående om fixturens datamängd, och varje ny fixturperson hade brutit tester
som handlar om cursor-portens round-trip, inte om personer. Svarsformen är
oförändrat EF:ens (`{ persons, nextCursor }`) — snittet ligger kvar vid
protokollet. Sök och "Ladda fler" krävde därför ingen särskild åtgärd: inget
tidsberoende, ingen debounce-fälla, grönt i första körningen.

### T102-instabiliteten visade sig INTE

Ingen av de tre filerna bär en skärmdumps-jämförelse (`toHaveScreenshot`
förekommer inte i någon av dem) — klassen av bit-instabilitet task-59.3 mötte
kan strukturellt inte uppstå här. Ingen pixelmarginal införd, ingenting att
kompensera.

### Testantal före/efter

| projekt | före | efter |
|---|---|---|
| `chromium-authenticated` (e2e) | 298 tester / 31 filer | **282 / 28** |
| `acceptance` | 35 tester / 2 filer | **51 / 5** |

Exakt 16 tester flyttade — inga tappade, inga tillkomna.

### Grindar (lokalt, CI:s exakta kommandon)

`npm run test:acceptance` 51 passed · `npm run typecheck` 0 ·
`npm run typecheck:tests` 0 · `npx @biomejs/biome check .` exit 0 ·
`npm run build` grön · `npm run test:api:pure` 224 passed ·
`npm run test:visual` 28 passed (fixturvärlden orörd — `handlers.ts` identisk
med HEAD).

Docs-grindarna är ej tillämpliga: diffen är tre .ts-renames plus detta kort, och
`backlog/` ligger medvetet utanför både markdownlints globs och `lint:prose`.

### Avvikelse mot kortets ordalydelse — bokförd

`mockPerson`:s `delayMs`-gren följde INTE med i flytten. Ingen caller använde
den, och filens egen kommentar beskrev den som den race-benägna väg
`manualRelease` ersatte (T26 Landning B). Att bära en foot-gun vidare in i en
hermetisk klass vore fel; borttagningen redovisas här i stället för att göras
tyst. Inget bevis påverkas — samtliga åtta tester i filen är gröna.
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
