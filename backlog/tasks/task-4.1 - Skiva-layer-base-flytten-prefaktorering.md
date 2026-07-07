---
id: TASK-4.1
title: 'Skiva: @layer base-flytten (prefaktorering)'
status: To Do
assignee: []
created_date: '2026-07-07 08:55'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-4
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den olagrade globala h1–h6-basregeln flyttas in i @layer base så att komponent- och utility-klasser vinner CSS-kaskaden (B-NYTT; rotorsaken bakom S55:s tre varv "ingen färgskillnad", L246). Ände-till-ände: en rubrik med färg-utility renderar utility-färgen (computed-style-bevis), och HELA den befintliga e2e-/axe-sviten är grön — ingen vy får ändras synligt. Prefaktorering: gör ändringen enkel för kortrubriks-facitet i skivorna efter (gör sedan den enkla ändringen).

Täcker användarberättelser: inga egna (möjliggörare för 4, 8–10, 14 via kortrubriks-facitet).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 h1–h6-basregeln ligger i @layer base och en färg-utility på en rubrik vinner RENDERAT (computed-style-assertion, inte källkodsläsning)
- [ ] #2 Hela befintliga e2e- och axe-sviten grön utan baseline-ändringar
- [ ] #3 Ingen synlig diff på befintliga vyer (renderad stickprovs-verifiering på Hem + en eventvy)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT K10-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-/byggkravspunkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
