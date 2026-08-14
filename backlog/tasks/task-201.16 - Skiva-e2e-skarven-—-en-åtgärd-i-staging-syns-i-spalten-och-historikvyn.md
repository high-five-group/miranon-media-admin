---
id: TASK-201.16
title: 'Skiva: e2e-skarven — en åtgärd i staging syns i spalten och historikvyn'
status: To Do
assignee: []
created_date: '2026-08-14 18:30'
labels:
  - ready-for-agent
dependencies:
  - TASK-201.15
parent_task_id: TASK-201
ordinal: 400000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PRD TASK-201 § Testbeslut speccar e2e-skarven verbatim: 'en åtgärd utförs → posten syns i spalten och historikvyn med rätt aktör, språk och tid' (staging-testkonventionen). Byggplanen § Fas 6.5 (docs/byggplan.md:818) listar tests/e2e/activityLog.spec.ts — ALDRIG byggd (Explore-svepet S105 Del 9: tests/e2e/ har noll aktivitetsloggs-filer; dagens skydd är acceptance-nivå + staging-api). Marcus GO 2026-08-14: inga luckor.

Åtgärdstypen väljs MAIL-FRI (t.ex. betalningsmarkering eller anteckning). ABSOLUT MAILFÖRBUD — appen är i skarp drift; inga mail-vägar utlöses.

Beroendet på TASK-201.15 är mjukt: undvik samtidig redigering av samma testytor; e2e-filen är ny och kolliderar inte i kod, men skivan tas efter för ren sekvens.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ny e2e-fil per staging-testkonventionen: mutex, purge-medvetenhet, fixturdata via etablerade vägar — ALDRIG handbyggd granskningsdata (seed:review-regeln i CLAUDE.md)
- [ ] #2 Flödet bevisat: en mail-fri åtgärd utförs → posten syns i hem-spalten utan omladdning (TASK-210-beteendet) OCH i historikvyn med rätt aktör, svensk sammanfattning och tid
- [ ] #3 Anteckningsfallet: posten visar ATT en anteckning gjordes, ALDRIG innehållet — asserterat mot renderad text
- [ ] #4 Fällningsbevis: assertionen faller bevisat när posten saknas (tvåsidigt, injicerat och återställt bit-identiskt)
- [ ] #5 Ingen ny flake-yta: vänta-strategier per Playwright-praxis (web-first assertions, inga sleeps); sviten grön två körningar i rad lokalt mot staging
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
