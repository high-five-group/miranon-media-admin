---
id: TASK-299.9
title: 'Skiva: Promovering av sidram till maillogg och installera-appen'
status: To Do
assignee: []
created_date: '2026-08-22 19:35'
updated_date: '2026-08-22 23:50'
labels:
  - ready-for-agent
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 549000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
De två sista Mer-sidorna får husets sidram, så hela familjen har samma tillbaka-knapp och samma sidhuvud. INGEN initialcirkel: mailloggens rad är ett utskick med ett mottagarantal, inte en person, och installera-appen är ingen lista alls. Innehållet på båda sidorna rörs inte. Maillogg har en acceptance-skarv; installera-appen saknar helt skarv och får sin första. Täcker användarberättelser: 11, 12, 18, 21.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Maillogg och installera-appen bär den delade sidramen; gamla textlänken och dubblerade sidmarginalen borta på båda
- [x] #2 Ingen initialcirkel på någon av de två sidorna
- [x] #3 Innehållet på båda sidorna oförändrat
- [x] #4 Båda sidorna har visuell spec med baslinje för desktop och mobil
- [x] #5 Installera-appen har fått sin första acceptance-skarv; mailloggs befintliga är utvidgad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BEROENDE OMSATT 2026-08-22: TASK-299.5 → TASK-299.1.

Marcus order i klartext: "Bygg det globalt bara med sidkromet." Det ursprungliga beroendet på 299.5 antog att sidramens form måste vinnas på anmälningssidan innan den kan promoveras till systersidorna. Det antagandet håller inte längre:

- Kant-i-kant är avgjort i S111:s grillning, inte i konvergenspasset.
- SidRam- och InitialAvatar-primitiverna LANDADE i TASK-299.1 (merge-SHA 24238b1c) och finns att importera i dag.
- Omfattningen är låst av Marcus 2026-08-22: full omfattning på ytaxeln, bara sidkromet på ägandeskapsaxeln. Se TASK-299 § OMFATTNINGEN LÅST.

Vad denna skiva faktiskt behöver är alltså primitiverna, inte anmälningssidans LISTA. Beroendet pekar nu på det som verkligen krävs. TASK-299.5 förblir låst bakom 299.4 (Marcus konvergensgranskning) — den kedjan rörs inte.

MARCUS UNDANTAGSREGEL, samma beslut: "Ser vi något som inte funkar sedan så är det ju bara att göra ett undantag på den sidan, men jag tror det är helt lungt." Ett lokalt avsteg på en enskild sida är alltså tillåtet och ska INTE läsas som att den delade formen ska rivas. Stöter du på en yta där sidkromet inte fungerar: bygg undantaget lokalt, bokför skälet, riv inte formen.
<!-- SECTION:NOTES:END -->
