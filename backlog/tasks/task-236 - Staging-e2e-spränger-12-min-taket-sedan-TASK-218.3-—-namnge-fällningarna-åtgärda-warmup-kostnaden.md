---
id: TASK-236
title: >-
  Staging-e2e spränger 12-min-taket sedan TASK-218.3 — namnge fällningarna,
  åtgärda warmup-kostnaden
status: To Do
assignee: []
created_date: '2026-08-16 07:06'
labels:
  - ready-for-agent
dependencies: []
ordinal: 436000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-16 (R2): 5/5 körningar som körde sviten på träd med 817979a8 (TASK-218.3, warmup-gate i main.tsx) blev cancelled >12 min — noll motexempel. 1F→3F vid exakt 218.3-gränsen + ~+50 % svit-tid (dot-radmätning 2m05s→3m00s per 80 tester). Mekanism: varje e2e-test startar kallt och betalar startvärmningen (11 ensureQueryData, DEFAULT_TIMEOUT_MS 9000) FÖRE router-mount; 3F × 3 försök ovanpå baslasten → taket. PR-CI skickar run_staging: false villkorslöst (ADR-077) — därför osynligt pre-merge. Taket höjs INTE reflexmässigt (ci-suite.yml:s eget förbud). REVERTA INTE 817979a8 (bär ADR-112; 218.2/218.4 ligger ovanpå). Larm #1348/#1351/#1371/#1372 stängda mot detta kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 De 3 fällningarna namngivna via lokal 'npx playwright test --project=chromium-authenticated --retries=0' — läs docs/reference/staging-verifiering-runbook.md först och verifiera att ingen staging-CI-körning är i luften
- [ ] #2 De två 218.3-inducerade fällningarna fixade (kandidat: persist-cache.staging.test.ts — 218.3 ändrade både prod-kod och testfil)
- [ ] #3 Warmup-kostnaden i e2e åtgärdad via befintlig seam (StartvarmningBeroenden) — inte via höjt tak
- [ ] #4 Staging-jobbet når sin sammanfattning < 12 min (post-merge-belägg)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
