---
id: TASK-244
title: >-
  Staging-sviten helt grön: de fyra kvarvarande fällningarna efter R2-varv-2
  (varv 3)
status: To Do
assignee: []
created_date: '2026-08-16 13:20'
labels:
  - ready-for-agent
dependencies: []
ordinal: 446000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur AC4-beviset (post-merge run 31947844163 på 8214ef2f, 2026-08-16): taket är fixat (8m34s, sammanfattning nådd) men 4 fällningar kvarstår, alla namngivna: (1) aktivitetslogg-skarv.staging.test.ts:231 (anteckning i hem-spalten utan omladdning) · (2) event-detail.staging.test.ts:473 (lugnt laddläge skeleton — sannolikt ny baseline mot varv 2:s snabb-gate, 50ms-default ändrar när skeleton syns) · (3) persist-cache.staging.test.ts:260 (Kallstart-testet — behöver varv 2:s sessionStorage-opt-in, lasVarmningTimeoutOverride, inkopplad så Förberedelseskärmen faktiskt visas i testet) · (4) strict-mode-dubbletter på Fjärrskådning-event i staging-datan (flera länkar matchar samma namn — data-städning eller testselektor-skärpning). Läs task-236:s Implementation Notes (varv 1+2-forensiken) + kortets kvarstående race-fynd (TASK-227 kall enhet) före design. Larm-ärendet #1403 hålls öppet som arbetssignal och stängs när post-merge-staging är HELT grön.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Alla fyra fällningarna rotorsakade och åtgärdade (fix eller motiverad baseline-uppdatering per fall — aldrig blind timeout-bump)
- [ ] #2 Post-merge-staging HELT grön (run-ID-belägg) och #1403 stängd mot beviset
- [ ] #3 TASK-227-racet (kall enhet, förexisterande) triagerat: fixat här eller eget kort med motivering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
