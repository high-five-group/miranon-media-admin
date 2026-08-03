---
id: TASK-126.4
title: 'Skiva: Skärmbilds-rundan in i manifestet'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-03 12:16'
labels:
  - ready-for-agent
dependencies:
  - TASK-126.1
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

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
