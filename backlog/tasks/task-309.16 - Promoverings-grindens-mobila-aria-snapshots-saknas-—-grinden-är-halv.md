---
id: TASK-309.16
title: Promoverings-grindens mobila aria-snapshots saknas — grinden är halv
status: To Do
assignee: []
created_date: '2026-08-24 16:38'
updated_date: '2026-08-24 17:46'
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
- [x] #1 De fem mobila aria-snapshotarna genererade och granskade i samma pass som skiva 9:s visuella baslinje
- [x] #2 npm run test:visual -- dokument-generering-promoverings-grind ger 10 passed / 0 failed
- [x] #3 Klarlagt och bokfört om andra promoverings-grindar har samma halva täckning (bara -desktop-facit)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-309.16, bygg-agentens landning 2026-08-24 (gren task-309.10-skiva9-facit). Alla tre AC bockade, var och en mätt.

AC #1 — de fem mobila snapshotarna genererade och granskade. Granskningen gjordes som en MÄTNING, inte som ögonmått: samtliga fem är BYTE-IDENTISKA med sina desktop-motsvarigheter (sha256 via node crypto). Tillgänglighetsträdet för ytan är alltså vyport-oberoende. Det upphäver kortets egen oro ('att checka in dem hade stämplat den mobila ytan åt honom, osedd') — de stämplar ingen form Marcus inte redan sett i desktop-form; de låser att de två förblir lika. De är dessutom deklarerade under 'referenser' i tasks/sessions/bilagor/s108-generering/facit.json, så Marcus stämpel innehållslåser dem (invariant d). De fem BEFINTLIGA desktop-referenserna är ORÖRDA — verifierat med git status efter --update-snapshots: inga M-rader, bara nya filer.

AC #2 — MÄTT VÄRDE 12 passed / 0 failed, inte 10/0. Skillnaden är inte en avvikelse utan en följd av att TASK-309.17 i samma landning lade ett sjätte test (datum-läget) × 2 vyporter. Före landningen: 5 passed / 5 failed, exit 1, samtliga fem fällningar visual-mobile med 'A snapshot doesn't exist'. Efter: 12 passed / 0 failed, exit 0.

AC #3 — MÄTT över samtliga tolv promoverings-grindar under tests/visual/__aria__/. dokument-generering var den ENDA med halv vyport-täckning (5 desktop / 0 mobile). De elva andra har desktop == mobile: anmalningssidan 3/3, appfel 1/1, atgardssida 6/6, dorrlista 6/6, eventsida 6/6, hem-aktivitetsspalt 3/3, hem-bevakningsrad 2/2, messagebox 4/4, persondetalj 2/2, personer 3/3, segment 7/7. Efter denna landning är dokument-generering 6/6. Bokfört durabelt i spec-filens docblock § TÄCKNINGEN, inte bara här.
<!-- SECTION:NOTES:END -->
