---
id: TASK-291
title: >-
  Fynd: åtgärdskö-raden på Hem är visuellt identisk med eventinfo-raden —
  särskiljning inom bevakningsrads-familjen (design)
status: To Do
assignee: []
created_date: '2026-08-22 10:54'
updated_date: '2026-08-22 21:14'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 533000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA-fynd 284.5 (Marcus, 2026-08-22, staging): raden '12 anmälningar kunde inte kopplas till rätt event' bär NOLL visuell särskiljning mot eventinfo-raden — samma tokens (--mm-navcard-*), samma chevron, ingen ikon (src/components/hem/Bevakningsrad.tsx:232-248 mot :191). Två radtyper med olika betydelse (eventinfo = 'det finns info att skicka'; åtgärdskö = 'något är fel, lös det') ser identiska ut. PLACERINGEN bland bevakningsraderna är LÅST (ADR-122 beslut 7, 284.4 AC #1/#2) och rörs inte. GRÄNS: notisfamiljens varningsfärg/ikon är FEL verktyg — ADR-122 beslut 8 + DESIGN-SYSTEM-SPEC §22 drar familjegränsen arbetsobjekt (tillståndsbundet) kontra notis (händelsebundet); särskiljningen ska leva INOM bevakningsrads-familjen, t.ex. en ledande 'kräver åtgärd'-ikon. Golv: 284.4 AC #5 — aldrig betydelse enbart genom färg. Form: litet divergenspass (2–3 varianter av raden på /dev/hem), Marcus väljer. BLOCKERAR 284.4 DoD #6 (facit-amenderingen av hem-facit) — facit stämplas inte förrän formen är vald. Registrerat per 284.5 AC #2 (nytt kort, ej retuschering).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 2–3 varianter av åtgärdskö-raden växlingsbara på /dev/hem, var och en inom bevakningsrads-familjens tokens — ingen lånar notistrappans varningsfärg/ikon
- [ ] #2 Marcus väljer EN variant i visuell granskning (desktop + mobil); valet citeras daterat på kortet
- [ ] #3 Vald form promoverad till Bevakningsrad.tsx; raden bär aldrig betydelse enbart genom färg (axe 0, 284.4 AC #5 håller)
- [ ] #4 Hem-facit (tasks/sessions/bilagor/s102-hem-konvergens/facit.json) amenderas FÖRST därefter, i egen commit med Marcus citat — det stänger 284.4 DoD #6
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
