---
id: TASK-480
title: >-
  SE-kön: våg 2–4 — to-prd vid respektive vågstart (produktskyddet → läsbörda →
  återanvändning)
status: To Do
assignee: []
created_date: '2026-09-19 10:53'
updated_date: '2026-09-19 10:57'
labels: []
dependencies: []
priority: medium
ordinal: 835000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Durabel kö för resten av SE-högen, i den ordning Marcus godkände 2026-09-19 (S126 Del 17 beslut 10). Varje våg får sitt PRD-kort FÖRST när den startar — to-prd kräver att syntesen står på utforskad disk, och det görs då, inte nu. VÅG 2 — produktskyddet: SE5 (kuratera 5–15 realistiska flöden, utskickskedjan överst), SE6 (bind fler av de elva obundna låtsassvaren till nattens kontraktsvakt), SE8 (skrivvägen mot datakällan får samma 429-omförsök som läsvägen), SE3 (vakt på att main faktiskt når användaren), SE7 (flytta de hermetiska filerna ur tests/e2e/, tak på acceptance-klassen). VÅG 3 — läsbörda: SE17 (förfallodatum för obeslutade grenar; hör ihop med TASK-310), SE19 (vilket konto äger vilken nyckel mot datakällan). VÅG 4 — återanvändning, först när CI:n här är stabil: SE4 (villkoret för en delad CI-modul), SE10 (parametrisera layouten i de fjorton skripten), SE11 (de fem mogna hookarna till pluginet), SE12 (organisations-ruleset — läs fällan i åtgärdsplanen först), SE15 (Denos egna verktyg för serverfunktionerna). UTANFÖR vågorna: SE9 stäms av mot TASK-465 (troligen redan gjord — HYPOTES, kortet nämner inte SE9); SE14 (Månad/år som formel) är Marcus handgrepp i produktionsbasen. Källa för varje åtgärd: docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md. Våg 1 bärs av TASK-464 (minutbudgeten) och CI-hygien-PRD:t.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Våg 2 har ett PRD-kort med skivor när våg 1:s QA är godkänd
- [ ] #2 SE9 är avstämd mot TASK-465 och utfallet bokfört här
- [ ] #3 Våg 3 och 4 har PRD-kort vid sina vågstarter; detta kort stängs när våg 4:s PRD finns
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tillägg 2026-09-19 (beslut 6b): bisektion av ett rött multi-landningsspann (researchens väg 4, docs/research/efterkontroll-pa-klocka-2026-09-19.md § Rekommendation punkt 4) ligger här som SENARE post — byggs först när efterkontrollens larm fyrar på ett spann > 1 landning oftare än sällan. Låg prioritet; mät först.
<!-- SECTION:NOTES:END -->
