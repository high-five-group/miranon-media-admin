---
id: TASK-126.2
title: 'Skiva: InstallPrompt — bibliotekskomponent + plattformsdetektering'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-02 17:12'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-126
ordinal: 201000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
En återanvändbar bibliotekskomponent med hook som äger install-logiken: fångar Chromiums installationshändelse och exponerar prompt-anrop gated bakom användarklick, detekterar plattform (iOS/iPadOS Safari, macOS Safari, Chromium, redan-installerad) och rapporterar vilken väg som gäller för besökaren. Ren bibliotekskod utan produktspecifik text — byggd för att bära nästa produkt oförändrad.

Täcker användarberättelser: 8, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hooken rapporterar korrekt installationsväg per plattform: chromium-prompt, ios-manuell, macos-safari-dock eller redan-installerad
- [x] #2 Prompt-anropet exponeras endast när plattformshändelsen faktiskt fångats — ingen död knapp kan uppstå
- [x] #3 Redan installerad app (standalone) detekteras och rapporteras som eget läge
- [x] #4 Acceptance- och a11y-sviterna täcker komponentens tillstånd; 11/11/11-ribban bevisad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Marcus-verifikat på riktig enhet per huvudväg (iPad-hemskärm, Mac-Safari Dock, Chromium-prompt) efter Grind 0
- [ ] #6 Install-ytans instruktioner klarar Gunilla-principen: begriplig utan tekniska förkunskaper
<!-- DOD:END -->
