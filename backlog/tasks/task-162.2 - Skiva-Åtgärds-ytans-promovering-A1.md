---
id: TASK-162.2
title: 'Skiva: Åtgärds-ytans promovering (A1)'
status: To Do
assignee: []
created_date: '2026-08-08 07:40'
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
- [ ] #1 Åtgärds-ytan renderar ovillkorligt kortformen: Gå till åtgärder-kortet + fristående Skriv ut-knapp; den gamla rubricerade gruppens gren borttagen (git bevarar)
- [ ] #2 Variant-villkoret, växlaren och variant-maskineriet orörda — rivning sker först i rivningskortet efter Marcus godkännande
- [ ] #3 ariaSnapshot-grinden grön för åtgärds-ytan (referens == promoverad)
- [ ] #4 Berörda e2e- och acceptance-tester uppdaterade till promoverad form i SAMMA ändring; sviterna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: inga protoDataMode-grenar flippade
<!-- DOD:END -->
