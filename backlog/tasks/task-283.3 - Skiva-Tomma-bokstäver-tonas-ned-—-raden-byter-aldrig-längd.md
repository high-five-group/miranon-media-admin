---
id: TASK-283.3
title: 'Skiva: Tomma bokstäver tonas ned — raden byter aldrig längd'
status: To Do
assignee: []
created_date: '2026-08-21 08:53'
updated_date: '2026-08-22 13:47'
labels:
  - ready-for-agent
dependencies:
  - TASK-283.2
parent_task_id: TASK-283
ordinal: 512000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bokstäver utan personer tonas ned, och raden slutar aldrig byta längd.

ÄNDE TILL ÄNDE: Lotta ser samma 30 knappar varje gång hon öppnar listan, på samma platser. De bokstäver som ingen i registret börjar på är synligt nedtonade och går inte att trycka på. En skärmläsare får veta att de är otillgängliga i stället för att de saknas. Raden byter aldrig längd, varken när hon skriver i sökrutan eller när hon byter bokstav — så inget under den flyttar sig.

NEDTONINGEN BINDS TILL HELA REGISTRET, aldrig till aktuell sökterm. Det är avsiktligt och icke förhandlingsbart: bunden till söktermen hade nästan alla knappar slocknat medan Lotta skriver, och raden hade flimrat.

Detta är ren klientlogik. Fördelningen kom i EF-svaret redan i första skivan; ingen serverändring och ingen ny deploy behövs.

Idag är detta konkret för minst två knappar: noll personer i registret börjar på Ä eller Ö. Fixturen måste bära minst en bokstav utan personer, annars bevisar sviten ingenting.

Täcker användarberättelser: 6 (och skärper 17)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bokstäver som ingen i registret börjar på renderas nedtonade och går inte att aktivera
- [x] #2 Nedtoningen binds till HELA registret, aldrig till aktuell sökterm — raden flimrar inte när Lotta skriver
- [x] #3 Raden byter aldrig längd vid något tillståndsbyte; mätt i renderad yta, inte antaget
- [x] #4 Skärmläsare får veta att en nedtonad knapp är otillgänglig — den försvinner inte ur trädet
- [x] #5 Fixturen bär minst en bokstav utan personer, annars bevisar sviten ingenting
- [x] #6 Personlistans rad- och listform är fortsatt identisk med facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Personlistans rad- och listform granskad mot facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — bokstavsraden är ett TILLÄGG ovanför listan och rör inget låst formbeslut
- [ ] #6 Varje bokstavsknapp minst 24x24 CSS-px — mätt i renderad yta, aldrig läst ur en klass (WCAG 2.5.8 AA)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-21 11:34
---
AMENDERING 2026-08-21 (S109, ADR-123 — väg B): meningen 'Fördelningen kom i EF-svaret redan i första skivan; ingen serverändring' gäller inte längre — fördelningen är en reduce över den laddade klientarrayen (bunden till HELA registret precis som tidigare, eftersom arrayen ÄR hela registret). Fortsatt ren klientlogik; ingen deploy. AC oförändrade.
---
<!-- COMMENTS:END -->
