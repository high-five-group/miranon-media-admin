---
id: TASK-451
title: >-
  PRD: Kallstarten — laddningsskärmen visar liv, tidsgränsen säger sanningen,
  Hem hoppar inte
status: To Do
assignee: []
created_date: '2026-09-18 10:37'
labels:
  - prd
dependencies: []
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
  - tasks/sessions/2026-09-18-session-127.md
priority: high
ordinal: 784000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problemet (Marcus, prod, 2026-09-18, ordagrant)

"Jag tryckte på appen, fönstret öppnade sig och laddningsskärmen visades. Laddningsfönstret stod kvar i kanske 4-5 sek och ingen loadingbar kördes, dessutom släpptes jag in på hemvyn även fast den inte laddat klart (vilket ska vara hela anledningen till laddningsskärmen), så jag såg skeleton som laddades i ytterligare 3 sek ungefär. [...] layouten rörde sig liksom när skeleton övergick till data." Datorn hade varit avstängd en vecka.

## Vad som är mätt

- Sentry bär händelsen "Startvärmningen nådde hård timeout innan alla datamängder klara" (Marcus, 2026-09-18). Det var alltså tidsgränsen (9 s, `startvarmningen.ts:112`) som släppte in honom — ADR-112 beslut 3:s dokumenterade fallback.
- Baren står på 0 % under hela auth-fasen (`main.tsx:439`) och tills första av sju hämtningar settlar (`startvarmningen.ts:414–417`); stall-signalen vid 3 s landar på en nollbred div och i sr-only-text (`Forberedelseskarm.tsx:382/385/405/410`).
- Efter släppet startar Hem EGNA hämtningar: startvärmningen hämtar under `events.list`/`registrations.all` och seedar `dashboard.*` först efter resolve (`startvarmningen.ts:246–263`); Hem läser `dashboard.*` (`useDashboardData.ts`). Dubbla anrop mot samma tröga EF.
- CLS-grinden (TASK-416.14) täcker inte Hem; hem-laddläges-testet stryper Y-axeln (`utanY()`).
- Ingen fetch-timeout finns; dubbel retry 4 x 4 på warmup-vägen; 0 preconnect i prod-index.html.

Full mekanismkarta, hypoteser, reproduktionsslinga (§ 5) och golv/spekulation (§ 6): docs/research/kallstarten-diagnoskarta-2026-09-18.md.

## Beslut

Marcus 2026-09-18: "Punkt 1: Vi kör på dina rekommendationer." = golv-åtgärderna i underlagets § 6, var och en med rött-först-test ur § 5. ADR-112:s blockerande gate BEHÅLLS; byte till app-skal-mönstret är uttryckligen utanför omfattningen (eget beslut).

## Utanför omfattningen

Ändrad timeout-längd (mät först) · "förvärm allt" (avvisat, docs/research/forvarma-allt-branschmonster-2026-09-06.md) · egen PWA-splash · `immediate: true` på registerSW.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje skiva landad genom review-loopen med rött-först-bevis i PR-kroppen
- [ ] #2 QA-kortet avbockat av Marcus efter kallstart i prod
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
