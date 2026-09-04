---
id: TASK-356
title: >-
  Realtime-mockar för betalnings-acceptancen — slå på VITE_FEATURE_BETALNINGAR i
  playwright.config
status: To Do
assignee: []
created_date: '2026-08-31 13:09'
labels:
  - ready-for-agent
dependencies: []
ordinal: 659000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S113-natten lämnade VITE_FEATURE_BETALNINGAR AV i playwright.config för acceptance-klassen: betalningsytornas Realtime-prenumerationer (jobbstatus) saknar mockar i den hermetiska fixturvärlden, så sviten skulle hänga/flaka. Bygg Realtime-mockarna (samma EF-mock-mönster som tests/visual/support) och slå på flaggan så betalningsytorna får acceptance-täckning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Realtime-/jobbstatus-mockar i den hermetiska fixturvärlden
- [ ] #2 VITE_FEATURE_BETALNINGAR på i acceptance-config utan flak (mätt med metrics:flake-riggen, interfolierad A/B)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
