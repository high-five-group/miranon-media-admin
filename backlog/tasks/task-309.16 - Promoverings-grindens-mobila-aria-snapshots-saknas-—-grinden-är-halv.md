---
id: TASK-309.16
title: Promoverings-grindens mobila aria-snapshots saknas — grinden är halv
status: Done
assignee: []
created_date: '2026-08-24 16:38'
updated_date: '2026-08-24 18:13'
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
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-309.16, bygg-agentens landning 2026-08-24 (gren task-309.10-skiva9-facit). Alla tre AC bockade, var och en mätt.

AC #1 — de fem mobila snapshotarna genererade och granskade. Granskningen gjordes som en MÄTNING, inte som ögonmått: samtliga fem är BYTE-IDENTISKA med sina desktop-motsvarigheter (sha256 via node crypto). Tillgänglighetsträdet för ytan är alltså vyport-oberoende. Det upphäver kortets egen oro ('att checka in dem hade stämplat den mobila ytan åt honom, osedd') — de stämplar ingen form Marcus inte redan sett i desktop-form; de låser att de två förblir lika. De är dessutom deklarerade under 'referenser' i tasks/sessions/bilagor/s108-generering/facit.json, så Marcus stämpel innehållslåser dem (invariant d). De fem BEFINTLIGA desktop-referenserna är ORÖRDA — verifierat med git status efter --update-snapshots: inga M-rader, bara nya filer.

AC #2 — MÄTT VÄRDE 12 passed / 0 failed, inte 10/0. Skillnaden är inte en avvikelse utan en följd av att TASK-309.17 i samma landning lade ett sjätte test (datum-läget) × 2 vyporter. Före landningen: 5 passed / 5 failed, exit 1, samtliga fem fällningar visual-mobile med 'A snapshot doesn't exist'. Efter: 12 passed / 0 failed, exit 0.

AC #3 — MÄTT över samtliga tolv promoverings-grindar under tests/visual/__aria__/. dokument-generering var den ENDA med halv vyport-täckning (5 desktop / 0 mobile). De elva andra har desktop == mobile: anmalningssidan 3/3, appfel 1/1, atgardssida 6/6, dorrlista 6/6, eventsida 6/6, hem-aktivitetsspalt 3/3, hem-bevakningsrad 2/2, messagebox 4/4, persondetalj 2/2, personer 3/3, segment 7/7. Efter denna landning är dokument-generering 6/6. Bokfört durabelt i spec-filens docblock § TÄCKNINGEN, inte bara här.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1961 (skiva 9:s pass, `164190b6`).

Promoverings-grinden bar bara `-desktop`-facit; `npm run test:visual` gav 5 passed / 5 failed där alla fem fällningar var `visual-mobile` med *"snapshot doesn't exist"*. Att det inte fångades beror på att visual-testerna bor i `visual-baselines.yml` (`workflow_dispatch`) och grindar ingenting i CI — `#1889` var grön med luckan på plats.

**Utfall:** fem mobila ariaSnapshots genererade i skiva 9:s pass, samtliga **byte-identiska** med sina desktop-motsvarigheter (sha256-verifierat). Grinden ger nu **12 passed / 0 failed** — inte 10 som AC:t förutsåg, eftersom `309.17` lade ett sjätte test × två vyporter.

**Kontrollmätningen som gav fyndet dess verkliga vikt:** av husets **12** promoverings-grindar bär **11** desktop/mobile i par. Dokument-genereringens var den ENDA halva. Det gör detta till en avvikelse i beståndet, inte en allmän lucka — och därmed till något som borde ha synts.

**Formen på hur luckan INTE stängdes:** Playwright skrev de fem filerna själv vid den första körningen (`writing actual`). De togs medvetet bort igen i stället för att committas — ett facit stämplas av Marcus (`ADR-102`/`ADR-104`), och de genererades dessutom ur ett träd där koden just ändrats. Ett verktyg som fyller i saknat facit ger en grön grind utan att någon granskat innehållet.

DoD #3 är en härledd rad — landnings-pekaren ovan bär den.
<!-- SECTION:FINAL_SUMMARY:END -->
