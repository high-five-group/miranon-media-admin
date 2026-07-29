---
id: TASK-86
title: 'Fynd: check-lesson-numbers.sh saknar retroaktiv verktygsvals-redovisning'
status: To Do
assignee: []
created_date: '2026-07-29 17:35'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 166000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A3b gjorde verktygsvals-prövningen till ett STÅENDE krav: innan ett nytt skript byggs ska prövningen göras och **utfallet redovisas** — även när domen blir "bygg eget".

`scripts/check-lesson-numbers.sh` byggdes i ADR-081 innan kravet fanns. Prövningen gjordes delvis — towncrier, MADR #28 och Rust RFC 0002 lästes, och MÖNSTRET lånades — men ADR:n redovisar inte explicit varför towncrier inte togs som VERKTYG.

De ärliga skälen finns och är rimliga: Python-verktyg i ett Node-projekt · genererar changelogs vid release, medan `lessons.md` inte har releaser · löser inte kollisionen utan undviker nummer helt, vilket ÄR mönstret vi lånade.

Men det är ett **resonemang, inte en mätning** — och skivan ska skriva ned det som det är, inte klä det som en prövning som gjordes.

Källa: restlistans § A3b, posten "Retroaktiv redovisning för check-lesson-numbers.sh".
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ADR-081 bär en redovisning av varför towncrier valdes bort som VERKTYG, skild från att dess mönster lånades
- [ ] #2 Redovisningen är märkt som RESONEMANG, inte som mätning — den fejkar ingen prövning som inte gjordes
- [ ] #3 Ingen annan del av ADR-081 ändras — detta är en tillägg, inte en omskrivning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
