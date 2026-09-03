---
id: TASK-374.2
title: >-
  Skiva: Flippen — konvergensformen blir den enda Intresserade-vyn, rename med
  git-historik, acceptance-sviten omskriven, ariaSnapshot EFTER grön
status: To Do
assignee: []
created_date: '2026-09-03 09:20'
labels:
  - ready-for-agent
dependencies:
  - TASK-374.1
parent_task_id: TASK-374
ordinal: 677000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: Lotta öppnar Intresserade i appen och ser den stämplade formen utan någon URL-parameter — sök, sortering, primär/sekundär rad, aktivitetsrad, jämnbred pill och exakt lika höga rader — med samma verkliga data som förut (alla intresserade via cursorloopen). Den gamla K0-vyn finns inte längre; den gamla komponentens namn och plats bärs nu av den promoverade formen. Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 21
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Utan query-parametrar renderar /mer/intresserade den promoverade formen; ariaSnapshot EFTER flippen är identisk med referenserna FÖRE (B4-paret grönt i båda vyporterna, lägena fylld och tom)
- [ ] #2 Filflytten är en git-rename till den skarpa komponentens namn och plats så historiken följer formen; datavägen är oförändrad (samma query-nyckel, cursorloopen över get-leads, retry-predikatet som inte retryar 4xx, startvärmningens prefetch) — API- och cursorloop-testerna gröna utan ändring
- [ ] #3 Acceptance-sviten för Intresserade omskriven till den nya anatomin: primär och sekundär rad, aktivitetsrad, hämtnings-pill, sökning, sortering, namnlös med e-post ger e-posten som primär rad och 'Namnlös intresserad' som sekundär, tom lista, 4xx ger alert utan retry, laddläge med aria-busy; axe noll fynd på tom, fylld och fel-läge
- [ ] #4 Stale-URL-testet grönt: ?variant=a renderar identiskt med ingen parameter
- [ ] #5 Dataläget ?data=fyll finns kvar enbart bakom import.meta.env.DEV fram till rivningen (för Marcus granskning i 374.3) och är strukturellt onåbart i produktionsbygget
- [ ] #6 Ytan är identisk med facit tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista i läge fylld och tom
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Facit-granskning utförd och bokförd mot tasks/sessions/bilagor/s114-intresserade-konvergens/facit.json ytan intresserade-lista (bild facit-intresserade-lista.png) — formen i bilden slår varje prosa (ADR-102 B1)
- [ ] #5 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [ ] #6 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->
