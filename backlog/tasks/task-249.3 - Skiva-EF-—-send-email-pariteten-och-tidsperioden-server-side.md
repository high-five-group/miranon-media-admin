---
id: TASK-249.3
title: 'Skiva: EF — send-email-pariteten och tidsperioden server-side'
status: To Do
assignee: []
created_date: '2026-08-17 00:29'
labels:
  - ready-for-agent
dependencies:
  - TASK-249.2
parent_task_id: TASK-249
ordinal: 465000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EF-krav 4 (send-email-halvan) och 5 samt 2 ur facitets pass-nivå: utskicksvägen delar motorns regelspråk och perioden blir verkställbar. Täcker användarberättelser: 12, 13, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 send-email löser mottagare ur SAMMA motor med AND-stödet: en regel med konjunkt-grupper ger identisk mottagarmängd som compute-segment (T50 lager b — servern äger sanningen om vilka som nås)
- [ ] #2 Villkorets tidsperiod verkställs server-side: deltagandets datum följer med i källfrågan och tidsfönstret filtrerar medlemskapet; api-testfall med datumspann, tomt spann och spann utan träffar
- [ ] #3 Räkne-ärligheten flyttar till servern: antalet som visas ÄR det tidsfiltrerade antalet — klientens öppna markering om ofiltrerad räkning behövs inte längre
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #6 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->
