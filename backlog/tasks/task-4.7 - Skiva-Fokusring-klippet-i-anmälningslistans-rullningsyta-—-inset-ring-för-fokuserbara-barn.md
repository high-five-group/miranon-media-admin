---
id: TASK-4.7
title: >-
  Skiva: Fokusring-klippet i anmälningslistans rullningsyta — inset-ring för
  fokuserbara barn
status: To Do
assignee: []
created_date: '2026-07-18 16:26'
labels: []
dependencies: []
parent_task_id: TASK-4
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA-FYND (S67, Marcus browser-QA under 4.6-vågen; tre bevisbilder i tasks/sessions/bilagor/s67-fokusring-klipp/): fokusringen på RADLÄNKARNA inuti Nya anmälningar-kortets rullningsyta klipps — vänsterkanten alltid (raderna ligger dikt an containerns 0-paddade vänsterkant), toppen vid scrollkanten; kvar blir lösa ring-fragment ('klipps konstigt på raderna'). Containerns EGEN ring (bild 1) är hel och korrekt. Marcus explicit: färgen är INTE problemet. ROTORSAK (verifierad): globala *:focus-visible ritar ringen 4px UTANFÖR elementets box (offset 2px + bredd 2px); ul:ens overflow-y:auto klipper allt utanför — pr-3 förklarar varför högerdelen syns (12px utrymme) men vänster aldrig. FIX (etablerad standard i vår stack-familj — React Aria/Spectrum-mönstret för rader i rullningsytor): inset-ring — ny token --mm-focus-ring-offset-inset (-2px) + base.css-klassen .focus-ring-inset på SCROLLCONTAINERN (descendant-selektor → barnen inset, containerns egen ring förblir utanpåliggande). SVEPET övriga interna rullningsytor: Modal (fokuserbara barn ryms via inner-padding — bedömd OK, klassen finns att sätta vid framtida behov) · SegmentMailCompose förhandsvisning (inga fokuserbara barn — N/A) · Select-listbox (bg-baserad fokus, ej ring — N/A). E2E-BEVISFORM: 5173 bär Marcus levande dev-server (repo-kontraktets hårda vägran) → regressionstestet körs i CI:s Test+Build på main-pushen (8.4-prejudikatet).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Radlänkens fokusring i rullningsytan är inset (outline-offset -2px) — helt synlig, kan aldrig klippas; computed-verifierad
- [ ] #2 Rullningsytans egen container-ring oförändrat utanpåliggande (offset 2px)
- [ ] #3 Regressionstest i hem-sviten asserterar BÅDA offseten (rad -2px, container +2px) — röd-kapabel åt båda hållen
- [ ] #4 Mekanismen dokumenterad (base.css-kommentar + spec-token-listan) och svepet över övriga interna rullningsytor bokfört med utfall
- [ ] #5 Marcus omtitt i preview (4173) godkänd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
