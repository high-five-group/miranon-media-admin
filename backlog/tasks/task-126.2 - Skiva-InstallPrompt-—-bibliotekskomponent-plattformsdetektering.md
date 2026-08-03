---
id: TASK-126.2
title: 'Skiva: InstallPrompt — bibliotekskomponent + plattformsdetektering'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-03 12:28'
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
- [ ] #4 Acceptance- och a11y-sviterna täcker komponentens tillstånd; 11/11/11-ribban bevisad
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PARKERAD I CI (S96-natten 2026-08-02, orkestreraren). Bygget är GJORT och håller kvalitetsmässigt — 11 acceptance-tester + 5 a11y-tester, fyra röd→grön-rundor dokumenterade, ett självfångat falskt-positivt test, ett review-pass som fann en äkta cross-instance-bugg. Men PR #628 kan inte landa.

BLOCKERARE: scripts/hermetik-sjalvtest.mjs fäller alla 11 nya acceptance-tester — 'Testet överlever utan fixturens svar och bevisar därför inget om appens databeteende.' 164 tester passerade; inget påstående fallerade. Acceptance-klassen är definierad av fixtur-beroende (ADR-080 beslut 3, vakten är VILLKOR), och InstallPrompt har inget databeteende. Vakten gör rätt; placeringen är fel, och PRD task-126 § Testbeslut styrde dit.

KLASSAT SOM BLOCKERANDE + UTANFÖR SCOPE → eskalerat till Marcus, ej löst av orkestreraren. Ingen undantagsväg finns i vakten (ingen scope-conf, .hermetik/ tom). Alternativen A/B/C och rekommendationen: TASK-131.

PR #628 lämnad ÖPPEN, RÖD och ARMERAD (autoMerge=true) — den kan inte landa röd, och armeringen behöver inte återställas när felet är löst. Grenen: task-126.2-install-prompt-bibliotekskomponent, commit 5b28b6ca.

Kortet står kvar To Do på main: agentens AC/DoD-bockningar lever bara i den olandade grenen.

AVGJORT (TASK-131, orkestrerarens agent, 2026-08-03). PR #628 STÄNGS UTAN MERGE — kortfilskonflikten (grenen bar dessa AC/DoD-bockningar, main bar parkerings-noten) löstes genom att INTE rebasa/merga #628 utan grena färskt från main och plocka över kod- och testfilerna ur commit 5b28b6ca (Marcus rekommendation i TASK-131-uppdraget). Koden (InstallPrompt.tsx, useInstallPrompt.ts, index.ts, dev/primitives.tsx, tests/a11y/InstallPrompt.spec.ts + primitives.spec.ts) landar ORÖRD via TASK-131:s PR. AC #1-#3 ovan checkade: sant oavsett testklass-hemvist. AC #4 LÄMNAD OUKRYSSAD MED AVSIKT: dess ordalydelse ('Acceptance- och a11y-sviterna täcker...') är nu delvis fel efter TASK-131/ADR-094 — acceptance-klassen rör inte längre InstallPrompt alls. Substansen (11/11/11 bevisad via testtäckning) håller: täckningen är i dag a11y (tests/a11y/InstallPrompt.spec.ts, 3 tester) + webbläsarbeteende-klassen (tests/webblasarbeteende/install-prompt.test.ts, 11 tester, TASK-131/ADR-094). AC-textens ADRESS åldrades med den CI-yta den namngav — samma lästa lärdom som TASK-130 bokförde för 126.4 AC#3 (task-76-mönstret: 'skriv avsikten, inte adressen'). AC-textkorrigering är spec-ändring (Marcus-domän); denna agent rättar den inte här, bara flaggar drivningen. DoD #1 därför oavbockad (ej alla AC checkade), DoD #3 oavbockad (CI-verifiering sker i orkestrerarens svep, inte av bygg-agenten). Status kvarstår To Do — Done sätts av orkestreraren efter CI-verifiering av TASK-131:s PR.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
