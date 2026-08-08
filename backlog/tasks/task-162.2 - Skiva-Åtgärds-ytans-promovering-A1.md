---
id: TASK-162.2
title: 'Skiva: Åtgärds-ytans promovering (A1)'
status: Done
assignee: []
created_date: '2026-08-08 07:40'
updated_date: '2026-08-08 17:35'
labels:
  - ready-for-agent
dependencies:
  - TASK-162.1
parent_task_id: TASK-162
ordinal: 302000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Första flippen per ADR-103 B2: åtgärds-ytans variant-form (kortet i check-in-kortets form + fristående utskriftsknapp) blir den ovillkorliga formen. Kortets utfällnings-beteende består tills åtgärds-sidans hopkoppling (eget kort efter S100). Den produktions-nåbara variant-grenen på eventsidan försvinner i och med flippen. Bevis-loopen körs mot skiva 1:s referenser. Täcker användarberättelser: 1, 2, 14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Åtgärds-ytan renderar ovillkorligt kortformen: Gå till åtgärder-kortet + fristående Skriv ut-knapp; den gamla rubricerade gruppens gren borttagen (git bevarar)
- [x] #2 Variant-villkoret, växlaren och variant-maskineriet orörda — rivning sker först i rivningskortet efter Marcus godkännande
- [x] #3 ariaSnapshot-grinden grön för åtgärds-ytan (referens == promoverad)
- [x] #4 Berörda e2e- och acceptance-tester uppdaterade till promoverad form i SAMMA ändring; sviterna gröna
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd och mergad som PR #991 (c64b16ec). Stängd 2026-08-08 efter per-jobb-verifikat: kö-CI grön per jobb vid merge (staging skippas i kön by design; post-merge-nätet är grinden) · staging-beviset post-merge run 31269265089 på c493827a — event-deltagare-filens tester GRÖNA efter test-scope-korrigeringarna #999/#1000 (162.3:s omskrivning hade breddat ren översyn-assertionerna utöver spec; produktkoden var korrekt) · DoD #4 path-scope verifierad mot PR-fillistan · DoD #6 bevis-spår i PR-body · DoD #7 protoDataMode: 0 träffar i mergad diff. Stängning per AC #6-tolkningen Marcus kvitterade 2026-08-08 (promoverings-ytornas egna tester gröna; främmande röda på egna ägda kort task-163/164 + tråd T139) — se sessionsdok S93 Del 13.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: inga protoDataMode-grenar flippade
<!-- DOD:END -->
