---
id: TASK-4.7
title: >-
  Skiva: Fokusring-klippet i anmälningslistans rullningsyta — inset-ring för
  fokuserbara barn
status: Done
assignee: []
created_date: '2026-07-18 16:26'
updated_date: '2026-07-18 16:36'
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
- [x] #1 Radlänkens fokusring i rullningsytan är inset (outline-offset -2px) — helt synlig, kan aldrig klippas; computed-verifierad
- [x] #2 Rullningsytans egen container-ring oförändrat utanpåliggande (offset 2px)
- [x] #3 Regressionstest i hem-sviten asserterar BÅDA offseten (rad -2px, container +2px) — röd-kapabel åt båda hållen
- [x] #4 Mekanismen dokumenterad (base.css-kommentar + spec-token-listan) och svepet över övriga interna rullningsytor bokfört med utfall
- [x] #5 Marcus omtitt i preview (4173) godkänd
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad + Marcus-granskad inom S67 QA-vågen (fyndets hela livscykel i sessionen) · commit 01b4031 · CI-run 29652045523 grön per jobb — Test+Build = e2e-beviset: nya regressionstestet (rad inset -2px, container +2px) körde grönt i CI:s e2e-steg (5173 bar Marcus dev-server; 8.4-prejudikatets bevisform, öppet bokförd i kortet) · CI-grön-första-pass: ja · Lokala grindar: typecheck 0 fel, biome 0 fel, a11y 31/31, bundelgrind OK + .focus-ring-inset verifierad i byggd CSS · Fix: ny token --mm-focus-ring-offset-inset + .focus-ring-inset på scrollcontainern (React Aria/Spectrum-mönstret för rader i rullningsytor); descendant-selektorn bevarar containerns utanpåliggande ring (bevisbild 1-formen) · Svepet bokfört i beskrivningen: Modal ryms via inner-padding · SegmentMailCompose inga fokuserbara barn · Select bg-fokus · 3 bevisbilder incheckade i tasks/sessions/bilagor/s67-fokusring-klipp/ · Marcus omtitt: 'Mycket bra.' följt av helhetsgodkännandet.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
