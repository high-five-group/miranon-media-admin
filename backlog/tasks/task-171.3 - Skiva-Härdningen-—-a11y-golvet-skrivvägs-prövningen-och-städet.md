---
id: TASK-171.3
title: 'Skiva: Härdningen — a11y-golvet, skrivvägs-prövningen och städet'
status: To Do
assignee: []
created_date: '2026-08-09 08:23'
labels:
  - ready-for-agent
dependencies:
  - TASK-171.2
parent_task_id: TASK-171
ordinal: 318000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den promoverade ytan härdas till kvalitetsribban — axe-pass grönt och prefers-contrast: more / prefers-reduced-motion / print prövade (tillgänglighet 11, inga undantag). Skrivvägarna prövas explicit: S100 rev read-only-invarianten öppet (betalningsytan skriver mot staging) — härdningen bokför vad som skriver vart och bevisar att prod inte nås. DEV-grind-städ: inga prototyp-grenar produktions-nåbara utom via railen. Referenserna får INTE ändras — identiteten består genom härdningen. Täcker användarberättelser: 8, 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Axe-pass grönt + kvalitetsribbans lägen (prefers-contrast: more, prefers-reduced-motion, print) prövade
- [ ] #2 Skrivvägarna explicit prövade och bokförda (staging-skrivningen; prod nås bevisligen inte)
- [ ] #3 ariaSnapshot-referenserna OFÖRÄNDRADE genom härdningen
- [ ] #4 Inga prototyp-grenar produktions-nåbara utom via railen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [ ] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [ ] #7 Datavägs-invarianten verifierad: inga datakälla-grenar flippade
- [ ] #8 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
<!-- DOD:END -->
