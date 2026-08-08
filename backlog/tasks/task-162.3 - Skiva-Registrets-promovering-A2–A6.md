---
id: TASK-162.3
title: 'Skiva: Registrets promovering (A2–A6)'
status: Done
assignee: []
created_date: '2026-08-08 07:42'
updated_date: '2026-08-08 17:36'
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
- [x] #1 Filterpanelen renderar ovillkorligt: Visa-dropdown (åtta val) + Väg in-dropdown (fem val) kombinerbara, räkneraden Visar N av M med avbokade-tillägg, Rensa filter med räknebadge, Skriv ut i panelens fot; flik-grenens kod borttagen (git bevarar)
- [x] #2 Registrets bas inkluderar avbokade: grå-märkta, sist i ordningen
- [x] #3 Avdelaren under registret riven ovillkorligt; batch-baren med Markera står kvar vid noll träffar; Bor över-kryssläget behåller filterpanelen som ram
- [x] #4 Variant-villkoret, växlaren och variant-maskineriet orörda
- [x] #5 ariaSnapshot-grinden grön i alla fyra lägen (default, aktivt filter, Bor över-kryss, noll träffar)
- [x] #6 Berörda e2e- och acceptance-tester uppdaterade till promoverad form i SAMMA ändring; sviterna gröna
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd och mergad som PR #992 (a53195de). Stängd 2026-08-08 efter per-jobb-verifikat: kö-CI grön per jobb vid merge (staging skippas i kön by design) · AC #6 betald via staging-beviset post-merge run 31269265089 på c493827a — event-deltagare-filens tester GRÖNA sedan skivans testomskrivning korrigerats i två steg (#999 återställde ren översyn-assertionernas per-yta-scope som breddats utöver spec och svept in Anteckningar-composern; #1000 disambiguerade summeringsrads-lokatorn mot Visa-dropdownens tillgängliga namn med aria-pressed-intersektion). Produktkoden behövde aldrig röras. DoD #6 bevis-spår i PR-body. Stängning per AC #6-tolkningen Marcus kvitterade 2026-08-08 (promoverings-ytornas egna tester gröna; kvarvarande främmande röda äger task-163/164 + tråd T139) — se sessionsdok S93 Del 13. Dropdown-namnets form ('Väntar på bekräftelse Visa') bokförd som 162.4-/QA-input.
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
