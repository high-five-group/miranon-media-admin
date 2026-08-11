---
id: TASK-201.4
title: 'Skiva: Instrumentering — resterande mutationer'
status: To Do
assignee: []
created_date: '2026-08-11 20:23'
updated_date: '2026-08-11 20:32'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
ABSOLUT MAILFÖRBUD — samma order och form som 201.3:s notes: e2e-stickprov som rör mail-typer använder ENDAST den etablerade @example.com-fixturformen; inga befintliga staging-personer som mottagare. Vid osäkerhet: STOPPA.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Zod-schemat validerar varje statement runtime — ogiltigt statement når aldrig activity_log
- [ ] #6 requestId propageras klient → EF → activity_log-rad, läsbar i devtools (byggplanens DoD 3–4)
<!-- DOD:END -->
