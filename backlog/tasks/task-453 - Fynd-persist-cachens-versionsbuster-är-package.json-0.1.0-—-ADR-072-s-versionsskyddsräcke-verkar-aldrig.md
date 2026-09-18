---
id: TASK-453
title: >-
  Fynd: persist-cachens versionsbuster är package.json 0.1.0 — ADR-072:s
  versionsskyddsräcke verkar aldrig
status: To Do
assignee: []
created_date: '2026-09-18 10:42'
labels:
  - fynd
  - ready-for-agent
dependencies: []
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
priority: medium
ordinal: 794000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`src/queries/persist.ts:41` sätter `buster: __APP_VERSION__`, som `vite.config.ts:37` definierar ur `package.json` `version` = "0.1.0" — ett fält som aldrig rör sig. Cache skriven av en äldre app-version kastas därför aldrig av bustern; bara 24 h-gränsen städar. Prod deployades sex gånger 17–18 sep med samma buster. Underlag § H-H.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Bustern byter värde när den levererade appens cache-form kan ha ändrats (t.ex. build-/commit-härledd) — valet motiverat mot TanStack persist-dokumentationen
- [ ] #2 Rött-först: test som visar att två byggen med olika kod i dag får samma buster
- [ ] #3 Versionsraden på Hem påverkas inte oavsiktligt; ADR-072 § Updates bokför ändringen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
