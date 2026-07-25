---
id: TASK-49
title: >-
  Fynd: visual-tröskeln gör desktop-vyerna systematiskt okänsligare än mobil —
  maxDiffPixelRatio mot 4,26x större yta
status: To Do
assignee: []
created_date: '2026-07-25 18:56'
updated_date: '2026-07-25 20:22'
labels:
  - ready-for-agent
dependencies: []
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SYMPTOM (QA-36.8 punkt 11, 2026-07-25): en app-bred ändring av brödtextfärgen (--mm-text → #c0392b) fångades av 4 av 6 MOBILA vyer men av NOLL desktop-vyer. Alla 6 desktop passerade grönt trots att all text bytt färg.

GRUNDORSAK (bevisad, ej hypotes): playwright.config.ts:136 sätter maxDiffPixelRatio: 0.01 globalt. Trösklarna är ANDELAR, och vyportarna har mycket olika yta:
- visual-desktop: 1440x900 @2x = 5 184 000 px → 51 840 px får avvika
- visual-mobile:   375x812 @2x = 1 218 000 px → 12 180 px får avvika

Desktop-layouten har mer whitespace, så textpixlarna utgör en MINDRE andel av ytan. Samma absoluta ändring hamnar därför under tröskeln på desktop och över den på mobil.

BEVIS: med maxDiffPixelRatio sänkt till 0.001 failade ALLA 12 (inklusive samtliga 6 desktop). Med 0.01 failade bara 4 mobila. Tröskeln är alltså den enda skillnaden.

Kommentaren på playwright.config.ts:142 säger 'Ratio-trösklarna ovan är skala-neutrala'. Det stämmer för deviceScaleFactor (2x ändrar täljare och nämnare proportionellt) men INTE mellan vyportar med olika innehållstäthet. Antagandet i kommentaren är alltså för brett.

FÖRVÄNTAT BETEENDE: en app-bred visuell regression ska fångas oavsett vyport. Kandidater: per-projekt-tröskel (striktare på desktop), maxDiffPixels (absolut) i stället för ratio, eller element-scopade snapshots på de täta ytorna. Val kräver research — Playwrights egen dokumentation och hur andra projekt hanterar vyport-asymmetrin.

BÄRARE: fyndet gör T87:s grind-aktivering mindre värd än den ser ut — en aktiv grind hade släppt igenom desktop-regressioner. Bör lösas FÖRE T87 aktiveras.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Grundorsaken bekräftad mot Playwrights dokumentation om maxDiffPixelRatio vs maxDiffPixels
- [ ] #2 Vald form research-belagd mot minst två branschprojekt, inte vald på magkänsla
- [ ] #3 Rött-först: samma app-breda textfärgsändring fångas av BÅDE desktop och mobil efter fixen
- [ ] #4 Falsklarms-kontroll: 12/12 gröna på oförändrad kod efter fixen
- [ ] #5 T87-kortet noterar att fyndet är löst, eftersom grindens värde hängde på det
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
