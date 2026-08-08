---
id: TASK-162.3
title: 'Skiva: Registrets promovering (A2–A6)'
status: To Do
assignee: []
created_date: '2026-08-08 07:42'
labels:
  - ready-for-agent
dependencies:
  - TASK-162.1
parent_task_id: TASK-162
ordinal: 303000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Registrets fem avvikelser (A2 navigering, A3 basen, A4 avdelaren, A5 Bor över-ramen, A6 noll träffar) promoveras som EN skiva — de delar kod och tillstånd, och att dela dem vore R9-felet igen. Den yta Marcus itererade mest (vågorna 5/6/8/9). Parallellbar med A1-skivan (disjunkta komponent- och testfiler, båda beror endast på grinden). Täcker användarberättelser: 3, 4, 5, 6, 7, 8, 9, 10, 11, 14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Filterpanelen renderar ovillkorligt: Visa-dropdown (åtta val) + Väg in-dropdown (fem val) kombinerbara, räkneraden Visar N av M med avbokade-tillägg, Rensa filter med räknebadge, Skriv ut i panelens fot; flik-grenens kod borttagen (git bevarar)
- [ ] #2 Registrets bas inkluderar avbokade: grå-märkta, sist i ordningen
- [ ] #3 Avdelaren under registret riven ovillkorligt; batch-baren med Markera står kvar vid noll träffar; Bor över-kryssläget behåller filterpanelen som ram
- [ ] #4 Variant-villkoret, växlaren och variant-maskineriet orörda
- [ ] #5 ariaSnapshot-grinden grön i alla fyra lägen (default, aktivt filter, Bor över-kryss, noll träffar)
- [ ] #6 Berörda e2e- och acceptance-tester uppdaterade till promoverad form i SAMMA ändring; sviterna gröna
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
