---
id: TASK-126.2
title: 'Skiva: InstallPrompt — bibliotekskomponent + plattformsdetektering'
status: To Do
assignee: []
created_date: '2026-08-02 14:32'
updated_date: '2026-08-03 11:38'
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
- [ ] #1 Hooken rapporterar korrekt installationsväg per plattform: chromium-prompt, ios-manuell, macos-safari-dock eller redan-installerad
- [ ] #2 Prompt-anropet exponeras endast när plattformshändelsen faktiskt fångats — ingen död knapp kan uppstå
- [ ] #3 Redan installerad app (standalone) detekteras och rapporteras som eget läge
- [ ] #4 Acceptance- och a11y-sviterna täcker komponentens tillstånd; 11/11/11-ribban bevisad
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PARKERAD I CI (S96-natten 2026-08-02, orkestreraren). Bygget är GJORT och håller kvalitetsmässigt — 11 acceptance-tester + 5 a11y-tester, fyra röd→grön-rundor dokumenterade, ett självfångat falskt-positivt test, ett review-pass som fann en äkta cross-instance-bugg. Men PR #628 kan inte landa.

BLOCKERARE: scripts/hermetik-sjalvtest.mjs fäller alla 11 nya acceptance-tester — 'Testet överlever utan fixturens svar och bevisar därför inget om appens databeteende.' 164 tester passerade; inget påstående fallerade. Acceptance-klassen är definierad av fixtur-beroende (ADR-080 beslut 3, vakten är VILLKOR), och InstallPrompt har inget databeteende. Vakten gör rätt; placeringen är fel, och PRD task-126 § Testbeslut styrde dit.

KLASSAT SOM BLOCKERANDE + UTANFÖR SCOPE → eskalerat till Marcus, ej löst av orkestreraren. Ingen undantagsväg finns i vakten (ingen scope-conf, .hermetik/ tom). Alternativen A/B/C och rekommendationen: TASK-131.

PR #628 lämnad ÖPPEN, RÖD och ARMERAD (autoMerge=true) — den kan inte landa röd, och armeringen behöver inte återställas när felet är löst. Grenen: task-126.2-install-prompt-bibliotekskomponent, commit 5b28b6ca.

Kortet står kvar To Do på main: agentens AC/DoD-bockningar lever bara i den olandade grenen.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
