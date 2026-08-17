---
id: TASK-249.1
title: 'Skiva: Promoverings-grinden — ariaSnapshot-referenser låsta ur variant d'
status: To Do
assignee: []
created_date: '2026-08-17 00:22'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-249
ordinal: 463000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bevisformen för hela promoveringen: referenserna låses ur den godkända prototypen INNAN någon flipp-ändring sker — efter flippen finns inte före-läget. Sjätte spec-filen i den befintliga promoverings-grind-raden. Täcker användarberättelser: bevisform för 1-13 och 17.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En ny spec-fil i den befintliga aria-grind-klassen fångar referenser för SAMTLIGA sju facit-ytor (segment-listan, tackningsvyn, nytt-segment-mallvyn, verkstaden, segment-detaljvyn, generatorn, utskicksvyn) ur variant d-läget, FÖRE varje flipp-ändring
- [ ] #2 Referenserna är identiska med den körande prototypen i variant d-läge — facit-raderna bär bilder: [], så referenserna ÄR bevisformen (ADR-102 B5); frånvaron av bild sänker aldrig kravet
- [ ] #3 PrototypRigg (utfallslägena) och SkalprovsVaxel står UTANFÖR referensernas scope via testid-avgränsning, per s93-atgardssida-mönstret (riggen, inte ytan)
- [ ] #4 Avgränsningens rött-först-bevis finns i PR:en och spec-filen är grön mot variant d
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s104-segment-divergens/facit.json — varje yta i ytor[] täckt av en referens
- [ ] #6 ariaSnapshot-referenserna låsta ur variant d FÖRE flippen (enkelriktad ordning, ADR-103 B4)
- [ ] #7 check-facit grön genom flipp OCH rivning — referenserna orörda och gröna efteråt
<!-- DOD:END -->
