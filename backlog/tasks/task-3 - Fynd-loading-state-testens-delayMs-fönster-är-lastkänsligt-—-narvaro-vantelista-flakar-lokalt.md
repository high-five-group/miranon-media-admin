---
id: TASK-3
title: >-
  Fynd: loading-state-testens delayMs-fönster är lastkänsligt — narvaro +
  vantelista flakar lokalt
status: To Do
assignee: []
created_date: '2026-07-06 10:42'
updated_date: '2026-07-06 12:43'
labels: []
dependencies: []
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S52, task-1.3-körningen 2026-07-06): 'loading-state är tillgängligt (aria-busy + status)' i event-narvaro.staging.test.ts:155 och mer-vantelista.staging.test.ts:142 faller intermittent lokalt — stash-belagt PRE-EXISTING på oförändrad main (repeat-each=3: narvaro 2/3 röd, vantelista 1/3 röd; task-1.3-diffen orörd av ytorna). Mekanism: mocken fördröjer EF-svaret delayMs=500 och testet assertar att 'Laddar …'-texten hinner SES — under maskinlast missas fönstret (T26-klassen: tids-beroende assertions är sköra). CI absorberar via retries:2, men flaket är strukturellt. FÖRVÄNTAT BETEENDE: loading-state-assertions är deterministiska utan tidsfönster — samma härdningsklass som S31 Landning B: hål mocken öppen tills assertionen sett loading-ytan och släpp svaret manuellt (route-release-mönstret i event-anmalda.staging.test.ts), applicerat på narvaro- + vantelista-testen (och ev. övriga delayMs-loading-tester som grep avtäcker).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TREDJE FIL-INSTANSEN (S52, task-1.2-körningen 2026-07-06): person-detail.staging.test.ts:166 samma delayMs-loading-klass — stash-belagd pre-existing på oförändrad main (repeat-each=3: 3/3 röd under maskinlast; task-1.2-diffen [TabBar] orörd av ytan). Härdnings-scopet bör täcka alla tre filerna + grep-svepet.
<!-- SECTION:NOTES:END -->
