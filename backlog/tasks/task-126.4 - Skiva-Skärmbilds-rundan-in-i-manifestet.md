---
id: TASK-126.4
title: 'Skiva: Skärmbilds-rundan in i manifestet'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
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
- [ ] #1 Minst en stående och en liggande skärmbild i manifestet med korrekt form_factor-märkning och identisk aspect ratio inom respektive format
- [ ] #2 Skärmbilderna genereras reproducerbart ur verkliga vyer via skript — inte handbeskurna engångsbilder
- [ ] #3 Preview-skarven verifierar screenshots-fälten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Marcus-verifikat på riktig enhet per huvudväg (iPad-hemskärm, Mac-Safari Dock, Chromium-prompt) efter Grind 0
- [ ] #6 Install-ytans instruktioner klarar Gunilla-principen: begriplig utan tekniska förkunskaper
<!-- DOD:END -->
