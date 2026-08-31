---
id: TASK-353
title: Anmälans detaljvy kraschar till felgräns för viss anmälningsdata (Elin-fallet)
status: To Do
assignee: []
created_date: '2026-08-31 12:28'
labels:
  - ready-for-agent
dependencies: []
ordinal: 656000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fångat under S113:s design-slutdom 2026-08-31: /event/recSahYCeTbEzFFe6/anmalan/recqDFWD9ug3RPP5c (Elin Vikström, staging) fäller hela detaljvyn till route-boundaryn (Den här delen kunde inte visas) medan syskonanmälningar (Fredrik recA8zSkz0GOhcHog m.fl.) laddar felfritt. DIFFERENTIALMÄTT: felar identiskt på main (2ce83460) och design-grenen — PRE-EXISTERANDE, datadrivet, INTE TASK-346.14:s fel. TanStack loggar 'Error in route match' som warning; felet når varken pageerror, unhandledrejection eller console.error (sväljs på suspense-nivå), och router-matcherna rapporterar status success — felet sitter i en komponents render/data för Elins specifika data (hon har delbetalning 1000 av 1500, obekräftad + förfallen). Reprosteg och mätmetod: sessionsdok S113 Del 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rotorsaken identifierad med differentialbevis (vilken komponent/fält, vilken dataform kastar)
- [ ] #2 Fix så Elins anmälan renderar; felgränsen kvarstår som skydd men triggas inte av legitim data
- [ ] #3 Regressionstest som fångar dataformen (utan att bero på staging-fixturens specifika record)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
