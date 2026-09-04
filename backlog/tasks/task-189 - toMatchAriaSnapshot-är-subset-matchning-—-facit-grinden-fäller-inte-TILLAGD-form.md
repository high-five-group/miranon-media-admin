---
id: TASK-189
title: >-
  toMatchAriaSnapshot är subset-matchning — facit-grinden fäller inte TILLAGD
  form
status: To Do
assignee: []
created_date: '2026-08-10 14:13'
updated_date: '2026-08-28 05:08'
labels: []
dependencies: []
ordinal: 355000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (147.10-bygget, S102 2026-08-10, bidirektionellt bevisat av byggaren): Playwrights toMatchAriaSnapshot gör containment-matchning, inte exakt likhet — 147.10:s nya knapp syntes i DOM utan att grinden föll INNAN facit-filerna uppdaterades. Grinden fångar saknad/ändrad form (fel-rad injicerad → RÖD, verifierat) men en TILLAGD DOM-drift passerar tyst. KONSEKVENS: facit-låsningens skydd (ADR-102/103) är ensidigt — omgodkännande-stämpelns förutsättning 'formen är exakt den stämplade' garanteras inte mekaniskt för additioner. FÖRVÄNTAT: utred exakt-matchnings-läge (Playwright-option eller egen diff av aria-yml mot renderad snapshot) och väg kostnaden; branschpraxis-research före design (web-research-disciplinen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En jämförelse av exakt-matchningsalternativ för toMatchAriaSnapshot (Playwright-native läge om det finns, kontra egen diff av aria-yml mot renderad snapshot) är genomförd och källbelagd (branschpraxis-research, web-research-disciplinen)
- [ ] #2 Kostnads-/nyttoavvägningen (prestanda, underhåll, falsk-positiv-risk) är dokumenterad i kortet
- [ ] #3 Baserat på avvägningen: antingen implementeras vald exakt-matchning i facit-grinden med tvåsidigt bevis (fäller på TILLAGD DOM-drift, fäller inte på oförändrad form), eller så dokumenteras källbelagt varför kostnaden inte motiverar ändringen nu
- [ ] #4 Om implementerad: befintlig facit-grind-testsvit och berörda tester gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
