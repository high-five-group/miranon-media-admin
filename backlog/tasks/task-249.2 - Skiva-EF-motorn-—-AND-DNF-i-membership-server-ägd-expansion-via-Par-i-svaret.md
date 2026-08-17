---
id: TASK-249.2
title: >-
  Skiva: EF-motorn — AND/DNF i membership, server-ägd expansion, via: Par[] i
  svaret
status: To Do
assignee: []
created_date: '2026-08-17 00:24'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-249
ordinal: 464000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Serversidan lär sig ADR-115:s regelspråk: och-kombinationer räknas i motorn, aldrig i klienten. Detta är EF-krav 1, 3 och 4 ur facitets pass-nivå. Täcker användarberättelser: 4, 5, 16, 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Membership-motorn accepterar regelformen med konjunkt-grupper i med (DNF) och platt utan; ett predikat utan flerledade grupper ger IDENTISK medlemsmängd som dagens par-lista (ingen regression, befintliga api-tester gröna)
- [ ] #2 De fjorton Skool-gruppernas regler är uttryckbara och ger korrekta, disjunkta medlemsmängder i api-testerna — inklusive de 10 fall som var outtryckbara i ren OR
- [ ] #3 compute-segment tar den nya regelformen och ÄGER expansionen predikat till par server-side; svaret bär via: Par[] per medlem (fördelningen kräver ingen andra fråga)
- [ ] #4 Medlemskapsgolvet Närvaropoäng=1 är ORÖRT (ADR-064 beslut 1) — inga golvlättnader
- [ ] #5 Testfallen landar som utökningar av de BEFINTLIGA api-sviterna för membership och compute-segment, inte nya klasser
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
