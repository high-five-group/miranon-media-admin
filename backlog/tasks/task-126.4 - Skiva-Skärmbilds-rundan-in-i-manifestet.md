---
id: TASK-126.4
title: 'Skiva: Skärmbilds-rundan in i manifestet'
status: Done
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-04 10:41'
labels:
  - ready-for-agent
dependencies:
  - TASK-126.1
modified_files:
  - .github/workflows/ci-suite.yml
  - .staging-preflight-wiring-policy.json
  - package.json
  - playwright.config.ts
  - public/screenshots/narrow-hem.png
  - public/screenshots/wide-event-lista.png
  - scripts/check-manifest-fields.mjs
  - scripts/test-check-manifest-fields.mjs
  - scripts/test-check-staging-preflight-wiring.mjs
  - tests/manifest-screenshots/narrow/hem.spec.ts
  - tests/manifest-screenshots/wide/event-lista.spec.ts
  - vite.config.ts
parent_task_id: TASK-126
ordinal: 203000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manifestet får skärmbilder i stående och liggande format tagna ur appens verkliga vyer, så att installationsdialogen visar app-butiks-känsla med riktigt innehåll. Skivan ligger sist i spåret: den tas när UI-ytan är stabil, och genereringen är reproducerbar så rundan kan göras om efter större UI-ändringar utan handarbete.

Täcker användarberättelse: 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Minst en stående och en liggande skärmbild i manifestet med korrekt form_factor-märkning och identisk aspect ratio inom respektive format
- [x] #2 Skärmbilderna genereras reproducerbart ur verkliga vyer via skript — inte handbeskurna engångsbilder
- [x] #3 Manifest-fältgrinden (ci-suite.yml Pure+Build, scripts/check-manifest-fields.mjs — stående hemvist för mekaniska manifest-/bundle-grindar per TASK-130) verifierar screenshots-fälten mekaniskt: minst en narrow + en wide, sizes matchat mot den byggda PNG-filens faktiska dimensioner, identisk aspect ratio inom respektive format
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #648 (gren task-126.4-skarmbilds-runda), merge-SHA 52ba500e60c5be279733e9a2f801731a275936a9, mergad till main 2026-08-03T13:27:23Z. Skärmbilds-genereringsskript (scripts/check-manifest-fields.mjs + Playwright-specarna under tests/manifest-screenshots/) producerar narrow-hem.png och wide-event-lista.png reproducerbart och manifest-fältgrinden verifierar dem mekaniskt i ci-suite.yml Pure+Build. CI-verifikat (gh pr checks 648, hygien-uppdrag 2026-08-04): samtliga jobb pass/skip, ingen fail — Pure+Build, Webblasarbeteende, Acceptance (hermetisk), Lint+Audit+TypeCheck, CodeQL, Docs link check, Analyze(actions/js-ts), CI Passed or Skipped. Staging/A11y-jobb skipping (path-villkorat, väntat för denna filklass).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
