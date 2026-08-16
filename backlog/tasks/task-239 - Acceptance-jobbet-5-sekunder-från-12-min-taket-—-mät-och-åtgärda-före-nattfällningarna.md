---
id: TASK-239
title: >-
  Acceptance-jobbet 5 sekunder från 12-min-taket — mät och åtgärda före
  nattfällningarna
status: To Do
assignee: []
created_date: '2026-08-16 07:07'
updated_date: '2026-08-16 07:55'
labels:
  - ready-for-agent
dependencies: []
ordinal: 439000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-16 (R5, nyupptäckt obokförd rot): acceptance-väggklockan växer monotont 8m47s (08-12) → 8m17s → 9m39s → 10m43s → 11m55s (08-16) = 5 SEKUNDERS marginal till timeout-minutes: 12. Första fällningen redan skedd: job 95091539477 (#1372, 2026-08-16 00:31) cancelled 12m03s mitt i hermetik-självtestet, EFTER 'BEVISET HÅLLER … 231 tester · 231 fällda'. Hypotes: warmup-gaten fires även i fixturvärlden (varje acceptance-test startar med tom localStorage; 218.3:s egen kodkommentar bokför 30/36 fällningar i hem.acceptance under bygget) — men tillväxten började FÖRE 218.3 (08-13→08-14: +82 s), så mät innan åtgärd. Prognos: nattliga cancelled inom 1–2 landningar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tillväxtens orsak identifierad med mätning (Acceptance-steget på 817979a8^1 vs 817979a8, eller metrics:ci-serien) — inte antagen
- [ ] #2 Åtgärd som återtar marginalen (>2 min till taket) utan reflexmässig takhöjning
- [ ] #3 Acceptance grön i nattnätet tre nätter i rad efter åtgärd (belägg: run-ID:n)
- [ ] #4 Webblasarbeteende-jobbets artefaktsteg (ci-suite.yml ~rad 433) får samma failure() || cancelled()-villkor — fynd ur task-237 2026-08-16: identiskt mönster, timeout-minutes: 8, samma blindhet vid takfällning
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
