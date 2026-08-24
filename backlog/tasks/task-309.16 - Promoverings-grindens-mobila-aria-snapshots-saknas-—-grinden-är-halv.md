---
id: TASK-309.16
title: Promoverings-grindens mobila aria-snapshots saknas — grinden är halv
status: To Do
assignee: []
created_date: '2026-08-24 16:38'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 579000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
AVTÄCKT 2026-08-24 vid verifiering av fynd-fixarna.

npm run test:visual -- dokument-generering-promoverings-grind ger 5 passed / 5 failed. Samtliga fem fällningar är visual-MOBILE, och felet är 'A snapshot doesn't exist at ...-visual-mobile.aria.yml, writing actual' — snapshotarna har aldrig genererats. tests/visual/__aria__/dokument-generering-promoverings-grind.spec.ts/ innehåller bara -desktop-filer.

Grinden kör alltså i båda vyportarna men har facit för bara den ena. Att det inte fångades beror på att visual-testerna bor i en egen workflow (visual-baselines.yml, workflow_dispatch) och grindar ingenting — #1889 var grön i CI med luckan på plats.

VIKTIGT OM VÄGEN: Playwright SKREV de fem mobil-filerna vid körningen. De togs medvetet BORT igen i stället för att committas. Ett facit stämplas av Marcus (ADR-102/ADR-104), och de genererades dessutom ur ett träd där koden redan ändrats — att checka in dem hade stämplat den mobila ytan åt honom, osedd. Snapshotarna ska genereras och granskas som en del av skiva 9 (TASK-309.10), tillsammans med den nya visuella baslinjen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 De fem mobila aria-snapshotarna genererade och granskade i samma pass som skiva 9:s visuella baslinje
- [ ] #2 npm run test:visual -- dokument-generering-promoverings-grind ger 10 passed / 0 failed
- [ ] #3 Klarlagt och bokfört om andra promoverings-grindar har samma halva täckning (bara -desktop-facit)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
