---
id: TASK-63
title: >-
  Fynd: acceptance-fixturernas rader är typade mot Record<string, unknown> —
  schema-glidning fångas först av nattvakten
status: To Do
assignee: []
created_date: '2026-07-28 12:47'
labels: []
dependencies: []
ordinal: 136000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (TASK-59.8 steg 2, verifierat mot disk 2026-07-28): sömmen tests/acceptance/support/acceptance-bas.ts rad 15-19 hävdar att fogen mellan klasserna bevakas av att 'samma zod-scheman parsar fixturens svar som parsar skarpa svar'. Det håller i RUNTIME — adaptern parsar, så en trasig fixtur ger rött. Men fixturraderna är typade mot Record<string, unknown>, inte mot schemat.

RÄKNAT MOT DISK: 0 av 18 acceptance-filer typar sina fixturrader med z.infer. 17 av 18 deklarerar en lokal 'type Row = Record<string, unknown>'.

FÖLJD: en fixtur som glider isär från schemat — fält som byter namn, försvinner eller får fel typ — fångas inte av npm run typecheck. Den fångas av kontraktsvakten, men den kör NATTLIGT och är avsiktligt icke-blockerande (ADR-080 beslut 3). Fångsten ligger alltså timmar efter att felet landade, i stället för i presubmit.

FÖRVÄNTAT BETEENDE: Row härleds ur z.infer<typeof XSchema> så att en glidning fälls av typcheckaren i samma PR som orsakar den.

AVGRÄNSNING: detta ersätter INTE kontraktsvakten. Typningen binder fixtur->schema; vakten binder schema->verkligheten. Två olika fogar, båda behövs.

UPPTÄCKT AV: färsk läsare utan tillgång till CONTRIBUTING/ADR, som noterade att garantin är enkelriktad. Bekräftat och breddat vid räkning mot disk.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fixturradernas typ är härledd ur respektive zod-schema, ej Record<string, unknown>
- [ ] #2 En medvetet felaktig fixturrad fälls av npm run typecheck — bevisat i båda riktningar
- [ ] #3 Kontraktsvakten orörd i omfattning och utfall
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
