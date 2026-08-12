---
id: TASK-201.4
title: 'Skiva: Instrumentering — resterande mutationer'
status: To Do
assignee: []
created_date: '2026-08-11 20:23'
updated_date: '2026-08-12 17:10'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.3
parent_task_id: TASK-201
ordinal: 369000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: pilotens mönster (201.3) rullas ut mekaniskt över hela mutationsytan så att ALLT som förändrar data loggas — luckfriheten är själva förtroendemotivet (en logg med luckor är värre än ingen logg). "Lade till person" ingår i skapa-anmälan tills person-skapande får egen mutation (bokfört i PRD:n).

Täcker användarberättelser: 1, 9, 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga återstående mutationer instrumenterade via onSuccess — listan VERIFIERAS mot mutationskatalogen vid bygget (ADR-086: mät, anta inte); förväntat: skapa anmälan, boende, kvitto, uppdatera event, person-flagga, event-anteckning, person-anteckning (skapa + uppdatera)
- [ ] #2 Antecknings-poster loggar ATT något antecknades — sammanfattningen innehåller ALDRIG anteckningsinnehåll (api-test bevisar)
- [ ] #3 e2e-staging-stickprov på minst två av de nya typerna (rad med rätt aktör, typ, svensk sammanfattning)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Zod-schemat validerar varje statement runtime — ogiltigt statement når aldrig activity_log
- [ ] #6 requestId propageras klient → EF → activity_log-rad, läsbar i devtools (byggplanens DoD 3–4)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ABSOLUT MAILFÖRBUD — samma order och form som 201.3:s notes: e2e-stickprov som rör mail-typer använder ENDAST den etablerade @example.com-fixturformen; inga befintliga staging-personer som mottagare. Vid osäkerhet: STOPPA.

TVÅ SKULDER ÖVERFÖRDA FRÅN 201.3 (bokförda av orkestreraren 2026-08-12, S105).

1. EVENT_ID_EXTENSION_IRI — EMITTERAS INTE ÄN

TASK-201.5 (PR #1215) definierade konstanten EVENT_ID_EXTENSION_IRI additivt i src/domain/schemas/ActivityStatement.schema.ts (exporterad via index.ts). Läs-EF:en get-activity-log använder den för att kunna FILTRERA på eventId. Skrivvägen emitterar den inte — 201.3-agenten deferrade den hit med öppen motivering: att emittera den mitt i bygget hade riskerat merge-konflikt i schema-filen mot en då oländad PR, och ingen av 201.3:s AC nämnde den.

Följd: eventId-filtret i läsvägen har inget att filtrera på förrän denna skiva emitterar extensionen. Återanvänd 201.5:s konstant — inför ALDRIG en egen definition av samma IRI.

2. HERMETIK-VAKTEN FÄLLER VARJE OMOCKAT log-activity-ANROP

Mätt i CI 2026-08-12 (run 31620566991, PR #1216 på SHA 7f8e22a9): 201.3:s tre instrumenterade pilotmutationer fällde SJU acceptance-sviter, samtliga med samma fel verbatim — "OmockadRequestError: Hermetik-vakten stoppade ett omockat anrop i fixturvärlden." Deterministiskt, inte flake: flera föll även i sina två retries. Utfall 7 failed / 189 passed.

Orsaken är strukturell, inte en bugg: recordActivity är fire-and-forget men gör fortfarande ett nätverksanrop mot log-activity-EF:en, och acceptance-sviten kör i en hermetisk fixturvärld där varje utgående anrop måste vara mockat. Vakten är designad att fälla precis detta.

KRITISKT FÖR DENNA SKIVA: 201.3 instrumenterade TRE mutationer och fällde sju sviter. Denna skiva instrumenterar HELA den återstående mutationsytan (förväntat: skapa anmälan, boende, kvitto, uppdatera event, person-flagga, event-anteckning, person-anteckning skapa+uppdatera). Utan en CENTRAL mock i fixturvärldens gemensamma uppsättning faller acceptance-klassen brett. Lappa aldrig per test.

201.3 lägger den centrala mocken som del av sin röd-fix — verifiera att den finns och täcker din utökade yta innan du instrumenterar, i stället för att upptäcka det i CI.

Värt att överväga här: ett negativt fall som bevisar att en FELANDE log-activity inte stjälper mutationen (mocka 500, mutationen ska ändå lyckas). 201.3 bevisade fire-and-forget på enhetsnivå (AC #1); i den sammansatta vyn är egenskapen billig att bevisa när mocken väl finns.

3. Bonus-observation ur 201.3:s slutrapport, ej åtgärdad: readDisplayNameFromJwt-hjälparen finns nu i FYRA EF:er (var redan i tre före 201.3:s fjärde). ADR-026-tröskeln var alltså bruten redan innan. Ingen refaktor gjord av 201.3 eftersom den hade rört orelaterade filer. Om din skiva ändå rör EF-ytan brett: bedöm om extraheringen hör hemma här eller i eget kort — förkasta explicit om inte.
<!-- SECTION:NOTES:END -->
