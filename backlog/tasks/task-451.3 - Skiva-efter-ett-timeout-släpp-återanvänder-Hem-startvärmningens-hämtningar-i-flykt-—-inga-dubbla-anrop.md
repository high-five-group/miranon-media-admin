---
id: TASK-451.3
title: >-
  Skiva: efter ett timeout-släpp återanvänder Hem startvärmningens hämtningar i
  flykt — inga dubbla anrop
status: Done
assignee: []
created_date: '2026-09-18 10:39'
updated_date: '2026-09-19 12:39'
labels:
  - ready-for-agent
dependencies:
  - TASK-451.2
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: high
ordinal: 787000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Startvärmningen hämtar under `queryKeys.events.list` / `queryKeys.registrations.all` och seedar `queryKeys.dashboard.*` först EFTER resolve (`startvarmningen.ts:246–263`). Hem läser `dashboard.*` (`src/components/hem/useDashboardData.ts`). Släpper tidsgränsen in användaren medan batch 1 fortfarande är i flykt är Hems nycklar tomma, och Hem startar en ANDRA `fetchEvents()`/`fetchRegistrations()` mot samma tröga Edge Function — TanStack Query deduplicerar per nyckel. Verifierat mot kod av S127-orkestreraren (underlaget § 10).

Designa mot TanStack Querys egna mönster (context7/källkod FÖRST): t.ex. att Hems queryFn delar löftet via `ensureQueryData` på list-nyckeln, eller att nycklarna slås ihop med `select`. Välj det som håller ADR-112 beslut 4 ("hämta en gång, dela") sant även på timeout-vägen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rött-först: scenario A (batch 1 fördröjd förbi tidsgränsen) räknar anrop mot get-events och get-registrations — i dag 2 vardera, efter fix 1 vardera
- [x] #2 När den i-flykt-varande hämtningen landar får Hem datan utan egen omhämtning; Hems 60 s-polling fungerar som förut (hem.acceptance grön)
- [x] #3 Samma kontroll gjord för activityLog.latest (redan nyckelparitet enligt underlaget § 1.10 — bekräfta eller rätta)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat: PR #2543, merge ab6b2127 (2026-09-18T12:42:55Z, main). Ny delaMedListan()-hjalpfunktion (hamtaDashboardData.ts) delegerar till qc.ensureQueryData pa list-nyckeln ENDAST nar den nyckeln har en hamtning i flykt utan cachad data (fetchStatus fetching, data undefined) - stoppar Hems andra, dubbla natverksanrop efter ett timeout-slapp. Rott-forst (AC1): scenario A gav 2 anrop vardera mot get-events/get-registrations fore fix, 1 vardera efter (bevisat via temporar reversion + omkorning). Grindar (matt): typecheck exit 0; biome (rorda filer) exit 0; check-langa-streck exit 0 (329 filer); build exit 0; playwright api-pure 1795/1795 grona (inkl 5 nya); test:acceptance hem.acceptance.test.ts 48/48 grona; test:api (full inkl api-staging) blockerad av staging-preflight-laset (TASK-77, samtidig post-merge-korning holl staging) - ingen del av diffen ror staging/EF. AC3 (activityLog.latest-nyckelparitet) bekraftad. Granskning: risk LAG, runda 1, 2 info-fynd (auto-fix-klass).
<!-- SECTION:FINAL_SUMMARY:END -->
