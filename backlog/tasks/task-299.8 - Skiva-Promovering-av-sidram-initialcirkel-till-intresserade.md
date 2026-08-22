---
id: TASK-299.8
title: 'Skiva: Promovering av sidram + initialcirkel till intresserade'
status: To Do
assignee: []
created_date: '2026-08-22 19:32'
updated_date: '2026-08-22 22:40'
labels:
  - ready-for-agent
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 548000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Intresserade får husets sidram och initialcirkeln, på samma villkor som väntelistan. RADINNEHÅLLET RÖRS INTE (Marcus beslut 2026-08-22, alternativ B). Sidan har i dag en acceptance-skarv men ingen visuell; den får en när den landar. Täcker användarberättelser: 11, 12, 13, 18, 21.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Intresserade bär den delade sidramen; den gamla textlänken och den dubblerade sidmarginalen är borta
- [ ] #2 Varje rad bär initialcirkeln ur personens namn, med primitiv-komponenten — ingen ny inline-kopia
- [ ] #3 Radens fält och deras inbördes ordning är OFÖRÄNDRADE
- [ ] #4 Sidan har en visuell spec med baslinje för desktop och mobil
- [ ] #5 Befintliga acceptance-skarven utvidgad, inte omskriven
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
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
