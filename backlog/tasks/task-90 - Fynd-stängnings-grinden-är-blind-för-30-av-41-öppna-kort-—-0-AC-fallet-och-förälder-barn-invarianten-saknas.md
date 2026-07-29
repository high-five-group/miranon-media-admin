---
id: TASK-90
title: >-
  Fynd: stängnings-grinden är blind för 30 av 41 öppna kort — 0-AC-fallet och
  förälder/barn-invarianten saknas
status: To Do
assignee: []
created_date: '2026-07-29 17:36'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`scripts/check-backlog-closure.sh` invariant 1 kräver `ac_totalt > 0`. Ett kort UTAN egna acceptanskriterier hoppas därför över helt.

**MÄTT 2026-07-29: 30 av 41 öppna kort har noll AC.** Grinden utvärderar alltså elva. Utskriften säger *"160 kort prövade, 1 inkonsistent"*, vilket läses som full täckning. Det är den inte.

**Beviset att fläcken kostar:** fyra föräldrakort hittades med samtliga skivor Done men själva `To Do` — `TASK-17` (6/6), `TASK-19` (4/4), `TASK-54` (3/3), `TASK-59` (8/8). Grinden var tyst om alla fyra. Två av dem (`54`, `59`) är dokumenterat avsiktliga; `17` och `19` var det inte, och stängdes på Marcus besked samma dag.

**Två invarianter saknas:**

1. **0-AC-fallet.** Ett öppet kort utan AC kan aldrig fällas. Vad som ska gälla i stället är en designfråga skivan ska svara på — DoD-bockarna är en kandidat, men de bockas först vid stängning, så formen måste tänkas igenom.
2. **Förälder/barn.** Ett föräldrakort vars samtliga barn är Done men som själv är öppet är internt inkonsistent, på samma sätt som ett kort med alla AC bockade och status To Do. Grinden ser inte relationen alls.

**Krav på formen:** samma tvåsidiga testdisciplin som originalet — `scripts/test-check-backlog-closure.sh` har tio testfall i PAR (ett som ska fälla, ett som inte ska). Nya invarianter ska bära samma.

**Falskt rött är dyrare än tyst grönt här.** Grinden ska köras i natten, inte i PR-grinden, och ett falskt larm devalverar nästa. Kort som är avsiktligt öppna (som `TASK-54`/`59`) måste kunna deklarera det.

Källa: sessionsdok S91 Del 27 § 27.2 punkt 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 0-AC-fallet: öppna kort utan AC utvärderas — formen VALD och motiverad, inte antagen; alternativ som förkastas bär sina skäl
- [ ] #2 Förälder/barn-invarianten: ett föräldrakort vars alla barn är Done men som själv är öppet fälls
- [ ] #3 Avsiktligt öppna kort kan deklarera det och fälls INTE — TASK-54 och TASK-59 är testfallen
- [ ] #4 Tvåsidiga testfall i PAR för varje ny invariant, i scripts/test-check-backlog-closure.sh — samma disciplin som de tio befintliga
- [ ] #5 Skarp körning före och efter redovisad med siffror: hur många kort utvärderas nu mot 11 av 41
- [ ] #6 Fail-closed bevarat: noll kort ur CLI:t ⇒ exit 2, saknad policy ⇒ exit 2
- [ ] #7 shellcheck rent på ändrade skript
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
