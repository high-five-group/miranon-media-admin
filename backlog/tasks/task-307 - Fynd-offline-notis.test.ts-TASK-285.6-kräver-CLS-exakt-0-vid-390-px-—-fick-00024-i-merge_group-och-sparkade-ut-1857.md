---
id: TASK-307
title: >-
  Fynd: offline-notis.test.ts (TASK-285.6) kräver CLS exakt 0 vid 390 px — fick
  0,0024 i merge_group och sparkade ut #1857
status: To Do
assignee: []
created_date: '2026-08-23 12:01'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 559000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur S108 resume 7 (2026-08-23 11:17Z): merge_group-körning `32636138454` för `#1857` (kvittots rättelsevarv — rör enbart `supabase/functions/`, `docs/mallar/`, `tests/api/`) föll på `Test suite / Webblasarbeteende`: `tests/webblasarbeteende/offline-notis.test.ts:207` › "TASK-285.6 — layoutförskjutningen vid offline är 0 (AC #2) › 390 px (mobil)" — `expect(cls).toBe(0)`, received `0.002406863042591828`. Tre försök (`×·×··F`), 104 övriga gröna. PR:en sparkades ur kön med konsumerad armering (fjärde läget, CLAUDE.md § Landning); omarmerad 11:59Z. KORTET SKAPAS, LÖSES INTE HÄR — ägs av notis-spåret.

## Bedömning

Ett exakt-noll-krav på ett flyttal mätt i webbläsaren är en flake-magnet: 0,0024 CLS är under varje mänsklig tröskel (Googles "good" är < 0,1) men faller `toBe(0)`. Antingen är testets tröskel fel (ska vara `toBeLessThan(ε)` med ε bokförd mot AC #2:s avsikt), eller så finns en verklig subpixel-förskjutning vid 390 px som AC:t vill fånga — det avgör ägaren, med riggen i `npm run metrics:flake` (CLAUDE.md § Flakighet), inte med ögat.

## Att göra

1. Kör `npm run metrics:flake` mot testet (interfolierad A/B, `--retries=0`) och läs ut n innan något ändras.
2. Om flake: sätt en bokförd tolerans (t.ex. `toBeLessThan(0.01)`) med hänvisning till AC #2 och mätningen; om äkta: hitta källan till förskjutningen vid 390 px.
3. Bokför i `TASK-285.6`/`ADR-121` § Updates vilket.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Flake-riggen körd mot offline-notis.test.ts 390 px, n och utfall bokförda
- [ ] #2 Testets tröskel eller förskjutningens källa åtgärdad med hänvisning till mätningen; merge_group grön på en oberoende PR efteråt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
