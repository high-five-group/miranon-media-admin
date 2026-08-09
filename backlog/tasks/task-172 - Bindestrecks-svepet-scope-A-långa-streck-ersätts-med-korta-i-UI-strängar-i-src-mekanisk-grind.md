---
id: TASK-172
title: >-
  Bindestrecks-svepet scope A: långa streck ersätts med korta i UI-strängar i
  src/ + mekanisk grind
status: To Do
assignee: []
created_date: '2026-08-09 08:08'
labels:
  - ready-for-agent
dependencies: []
ordinal: 315000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-beslut 2026-08-09 (S93-resumen, ur S100:s blockerande fråga; S100 sessionsdok § PAUSLÄGE fjärde pausen + § Del 7): scope A — UI-strängar i hela src/, det Lotta och Marcus ser i appen. Marcus ord: 'Ta bort alla långa bindestreck överallt, jag gillar de korta bindestrecken (-)'. Långa streck (tankstreck — och en-dash –) i användar-synlig text ersätts med kort bindestreck (-) eller omformuleras. Kodkommentarer (scope B) och dokumentation (scope C) ingår INTE — C avråddes som svep (docs-typografin är etablerad stil; ev. rivning är ett redaktionellt beslut av BYGGPLAN-LÄTTLÄST-klassen). Följdbeslut samma dag: commit-meddelanden/sessionsdok behåller etablerad form; tom-markören '—' (symbol för inget värde, t.ex. 'Ämne: —' i AtgardsSida) BEHÅLLS och undantas explicit. Grinden: mekanisk vakt som fäller NYA långa streck i UI-strängar — att skilja strängliteral/JSX-text från kommentarer kräver AST-läsning, implementationsvalet är utförarens (research först: finns etablerad lint-regel/plugin innan egen byggs); värden (undantagslistan: tom-markören m.fl.) bor i config-fil per CLAUDE.md-regeln om config-drivna grindvakter. SEKVENS-VILLKOR mot task-171: åtgärds-/granskningsytans filer (AtgardsSida.tsx + dess routes) är redan kortstreckade i synlig text (S100 varv 23); ändrar svepet ändå dem måste det ske FÖRE promoverings-PRD:ns referenstagning eller EFTER rivningen — aldrig mitt i kedjan, ariaSnapshot-referenserna fäller på varje textskillnad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Inga långa streck (— eller –) i användar-synliga strängar i src/, utom config-listade undantag (tom-markören)
- [ ] #2 Mekanisk grind fäller nya förekomster — tvåsidigt bevis: seedat fel fälls, ren kod passerar
- [ ] #3 Undantagen bor i config-fil, inte hårdkodade i skriptet
- [ ] #4 Sekvens-villkoret mot task-171:s referenser efterlevt och bokfört i notes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
