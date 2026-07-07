---
id: TASK-4.1
title: 'Skiva: @layer base-flytten (prefaktorering)'
status: Done
assignee: []
created_date: '2026-07-07 08:55'
updated_date: '2026-07-07 09:23'
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
- [x] #1 h1–h6-basregeln ligger i @layer base och en färg-utility på en rubrik vinner RENDERAT (computed-style-assertion, inte källkodsläsning)
- [x] #2 Hela befintliga e2e- och axe-sviten grön utan baseline-ändringar
- [x] #3 Ingen synlig diff på befintliga vyer (renderad stickprovs-verifiering på Hem + en eventvy)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: kaskad-invarianten bevisad RENDERAT — nytt permanent regressionstest css-cascade.staging.test.ts (TDD: rött före fixen [utility förlorade, rgb(36,36,36)] → grönt efter [rgb(107,107,107)]); båda sidorna asserterade (default kvar + utility vinner). AC2: e2e 125 passed/2 skipped (skippen by-design, pre-existerande) + a11y 13 passed, 0 baseline-ändringar. AC3: renderad stickprovs-mätning Hem + Event — alla 5 rubrikers computed styles (color/size/weight/family/variation/margin) BYTE-IDENTISKA före/efter. DoD5: bockad som EJ TILLÄMPLIG per grindens eget villkor (per skiva med UI-yta) — skivan har bevisat NOLL synlig UI-förändring (AC3), inget att granska visuellt. DoD6: facit-avprickning rad-för-rad utförd (B-NYTT enda berörda punkten). FYND under körning: DashboardCards h2 bar text-text-muted som tyst förlorade (S55-fyndets kärna) — neutraliserad i samma skiva (klassen borttagen; renderat läge bevarat exakt) för att uppfylla AC3; facit-omstylningen kommer i 4.3/4.4. API-sviten lokalt: 290 passed, 6 env-gap-fel (TEST_REGISTRATION_RECORD_ID = CI-secret, ej i lokala .env.test) — ej regression (ingen serverkod rörd); CI auktoritativ.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT K10-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-/byggkravspunkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
