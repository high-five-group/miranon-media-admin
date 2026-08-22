---
id: TASK-283.3
title: 'Skiva: Tomma bokstäver tonas ned — raden byter aldrig längd'
status: Done
assignee: []
created_date: '2026-08-21 08:53'
updated_date: '2026-08-22 15:20'
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
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Personlistans rad- och listform granskad mot facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — bokstavsraden är ett TILLÄGG ovanför listan och rör inget låst formbeslut
- [x] #6 Varje bokstavsknapp minst 24x24 CSS-px — mätt i renderad yta, aldrig läst ur en klass (WCAG 2.5.8 AA)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGNING (orkestrerare, 2026-08-22) — PR #1798 MERGED (feat/task-283-3-nedtonade-bokstaver), CI verifierad radvis: 12 pass, 3 skip (Staging sentinel purge, A11y axe-runner, Staging API+E2E), 0 fail (11 CheckRun SUCCESS + 1 StatusContext/Vercel SUCCESS via gh pr view 1798 --json statusCheckRollup).

DoD #1, #2, #3, #4, #6 bockade mot uppmätt värde:
- #1: samtliga AC #1-#6 redan avbockade av bygg-agenten.
- #2: L147-grindarna gröna både i PR-kroppens redovisning (biome 0, typecheck 0, typecheck:tests 0, check-langa-streck 0, test:api:pure 0/656, build 0, check:docs 0/14, check-facit.sh 0, acceptance 44/44 x2) och bekräftat oberoende via CI-jobben Lint+Audit+TypeCheck / Pure+Build / Acceptance (hermetisk) / Acceptance tvåsidigt bevis / Webblasarbeteende — samtliga SUCCESS.
- #3: se ovan, radvis verifierat, inte aggregerad rollup.
- #4: "gh pr diff 1798 --name-only" — fem rörda filer, samtliga i scope (task-kortet, PersonsList.tsx, person-sok.ts, AMENDERING-sidofilen, acceptance-test, api-test). Inga orelaterade filer.
- #6: bygg-agenten mätte 28x28 px över fem viewports, byte-för-byte identiskt med TASK-283.2:s mätning FÖRE nedtoningen (PR-kroppens tabell "Mätningar"). Träffytan är opåverkad av nedtonings-ändringen.

DoD #5 (facit-granskning) LÄMNAS OBOCKAD — motiverad, inte avklarad. Promoverings-grinden mättes av bygg-agenten till 10/6, exakt samma sex fall som TASK-283.2 bokförde före denna skiva; referenserna är gröna men beskriver INTE den nya nedtonings-formen. Ändringen är klassad (c) i ADR-102 § Updates 2026-08-22 ("formen ändras faktiskt och är prod-synlig") — sidofilen tasks/sessions/bilagor/s90-personlistan-konvergens/AMENDERING-2026-08-22-tomma-bokstaver-nedtonade.md dokumenterar ändringen, men omstämplingen är EXPLICIT reserverad för Marcus egen kanal och görs i TASK-283.4 (labels: ready-for-human, spärrad bakom Marcus visuella godkännande — får inte plockas som vanlig kö-post). Att bocka DoD #5 här hade föregripit den reservationen.

Status sätts till Done: fem av sex DoD-punkter avklarade och belagda, den sjätte (#5) motiverad med explicit hänvisning till uppföljande kort och styrande ADR — inte en tyst lucka.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-21 11:34
---
AMENDERING 2026-08-21 (S109, ADR-123 — väg B): meningen 'Fördelningen kom i EF-svaret redan i första skivan; ingen serverändring' gäller inte längre — fördelningen är en reduce över den laddade klientarrayen (bunden till HELA registret precis som tidigare, eftersom arrayen ÄR hela registret). Fortsatt ren klientlogik; ingen deploy. AC oförändrade.
---
<!-- COMMENTS:END -->
