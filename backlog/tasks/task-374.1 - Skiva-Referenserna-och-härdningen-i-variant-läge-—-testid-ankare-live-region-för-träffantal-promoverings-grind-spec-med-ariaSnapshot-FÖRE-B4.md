---
id: TASK-374.1
title: >-
  Skiva: Referenserna och härdningen i variant-läge — testid-ankare, live-region
  för träffantal, promoverings-grind-spec med ariaSnapshot FÖRE (B4)
status: To Do
assignee: []
created_date: '2026-09-03 09:20'
updated_date: '2026-09-03 09:59'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-374
ordinal: 676000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: den stämplade B3-formen står kvar bakom DEV-växeln, men härdas formneutralt och får sina regressionsreferenser innan den flippas. En utvecklare öppnar /mer/intresserade?variant=a&data=fyll och ser exakt facit-formen; en skärmläsare hör träffantalet när en sökning görs; grind-specen bär referenserna FÖRE flippen så att flippen (374.2) kan bevisa identitet. Prototyp-railen rörs inte (stående dev-komponent som B2 använder). Täcker användarberättelser: 10, 11, 12, 18, 20
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ytan intresserade-listan i variant-läge (?variant=a, lägena fylld via ?data=fyll och tom) är identisk med facit tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista — härdningen ändrar inte formen (ariaSnapshot före/efter härdningen identisk, bilagd i Final Summary)
- [x] #2 Ett testid-ankare finns på ytans alla tre render-grenar (laddar, fel, lista) och används av grind-specen
- [x] #3 Träffantalet vid sökning annonseras i en artig live-region; acceptance-sviten hävdar annonseringen
- [x] #4 Ny promoverings-grind-spec efter anmälningssidans mall: ariaSnapshot-referenser tagna FÖRE flippen ur variant-läget i egen commit, båda vyporterna, lägena fylld och tom; grinden tvåsidigt bevisad — grön på identisk yta, RÖD på avsiktligt muterad (bevis i Final Summary)
- [x] #5 Fyllnadsradernas typomvandling (as unknown as Intresserad) borta ur prototypen utan att formen ändras
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Facit-granskning utförd och bokförd mot tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista (bild facit-intresserade-lista.png) — formen i bilden slår varje prosa (ADR-102 B1)
- [x] #5 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [x] #6 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->
