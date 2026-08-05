---
id: TASK-126.2
title: 'Skiva: InstallPrompt — bibliotekskomponent + plattformsdetektering'
status: Done
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-05 11:08'
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
- [x] #4 Komponentens tillstånd är täckta av automatiserade tester i den klass som gäller för datalös UI-kod; 11/11/11-ribban bevisad
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGD 2026-08-05 (S96, fjärde resumen) på Marcus kvittens av AC #4-omformuleringen.

AC #4 OMFORMULERAD (spec-ändring, Marcus-domän — bygg-agenten flaggade drivningen i TASK-131 och rättade den medvetet inte). Gammal text: 'Acceptance- och a11y-sviterna täcker komponentens tillstånd; 11/11/11-ribban bevisad.' Den namngav en CI-yta som TASK-131/ADR-094 flyttade bort under den — acceptance-klassen rör inte längre InstallPrompt alls. Ny text namnger AVSIKTEN, inte adressen (task-76-mönstret, samma lärdom som TASK-130 bokförde för 126.4 AC#3).

SUBSTANSEN VERIFIERAD MOT MAIN 2026-08-05: src/components/primitives/InstallPrompt.tsx + useInstallPrompt.ts landade via #651 (TASK-131, MERGED 2026-08-03 13:04, required checks gröna). Täckningen är tests/a11y/InstallPrompt.spec.ts (3 tester) + tests/webblasarbeteende/install-prompt.test.ts (11 tester) — båda närvarande på main. DoD #3 (CI grön per jobb) uppfylld av #651.

HISTORIK: PR #628 stängdes utan merge 2026-08-03 (kortfilskonflikt mot main); koden togs oförändrad ur commit 5b28b6ca och landade via #651. Grenen task-126.2-install-prompt-bibliotekskomponent är därmed konsumerad och kan städas.

AVBLOCKERAR: TASK-126.3 (dep 126.2).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
