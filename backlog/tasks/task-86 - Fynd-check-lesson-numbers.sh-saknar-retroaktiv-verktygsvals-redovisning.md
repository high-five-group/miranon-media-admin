---
id: TASK-86
title: 'Fynd: check-lesson-numbers.sh saknar retroaktiv verktygsvals-redovisning'
status: Done
assignee: []
created_date: '2026-07-29 17:35'
updated_date: '2026-07-30 19:49'
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
- [x] #1 ADR-081 bär en redovisning av varför towncrier valdes bort som VERKTYG, skild från att dess mönster lånades
- [x] #2 Redovisningen är märkt som RESONEMANG, inte som mätning — den fejkar ingen prövning som inte gjordes
- [x] #3 Ingen annan del av ADR-081 ändras — detta är en tillägg, inte en omskrivning
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
ADR-081 bär nu en retroaktiv redovisning av varför towncrier valdes bort som VERKTYG, skild från att dess mönster lånades. Ren addition: 41 rader tillagda, 0 borttagna (git show --numstat), så AC #3 är mekaniskt bevisat och inte bedömt. Redovisningen är märkt som RESONEMANG, inte mätning, och attribuerar öppet att den tredje punkten fick empiriskt stöd först två dagar senare av nummerallokerings-passet — utan att därför kalla sig mätning. PR #474, merge e6fa6e6-kedjan, CI grön per jobb. Agenten fann att ADR-081:s precedent-anspråk om towncriers +-form bara håller för halva formen och deklarerade det öppet i stället för att tiga, men fick inte röra sektionen — registrerat som TASK-97.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
