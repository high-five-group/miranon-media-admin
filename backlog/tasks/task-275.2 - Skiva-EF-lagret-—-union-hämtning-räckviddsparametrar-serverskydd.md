---
id: TASK-275.2
title: 'Skiva: EF-lagret — union-hämtning + räckviddsparametrar + serverskydd'
status: To Do
assignee: []
created_date: '2026-08-17 15:36'
updated_date: '2026-08-17 16:56'
labels:
  - ready-for-agent
dependencies:
  - TASK-275.1
parent_task_id: TASK-275
ordinal: 497000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Serverlagret bär räckviddsmodellen ände-till-ände (ADR-118 beslut 1-4): union-hämtning, räckviddsmedvetna skrivvägar, server-sidigt olycksskydd. Täcker användarberättelser: 1, 2, 5 (servergolvet).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hämtningen av ett events bilagor returnerar unionen av tre mängder (eventets egna + kurstyps-match på eventets Kursfamilj/Kursnivå inkl. tom-nivå-regeln + alla-event) med räckviddsfältet i svaret — API-testad per mängd och i kombination
- [x] #2 Båda upload-vägarna (små filer + ticket/finalize) tar räckviddsparametrar (+ kursfält vid Kurstyp), validerar strikt via Zod och skriver rätt bas-fält; allowlist-registreringen uppdaterad per DoD-disciplinen med deny/allow-testbevis
- [x] #3 Radera/ersätt av en gemensam bilaga NEKAS server-side när anropet kommer ur eventkontext — golvet är servern, inte gömda knappar; testbevisat i båda riktningarna (nekas ur eventkontext, tillåts i räckviddsläget)
- [x] #4 Staging-API-sviten grön; noll prod-anrop (prod-ref-låset respekteras)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
