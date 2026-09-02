---
id: TASK-361
title: >-
  Button: laddläge ändrar aldrig knappens mått (bredd/höjd) - stapel-fix på
  biblioteksnivå
status: To Do
assignee: []
created_date: '2026-09-02 09:08'
updated_date: '2026-09-02 09:27'
labels: []
dependencies: []
ordinal: 662000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-09-02 (S113 resume 8): en knapp växer i bredd när
den går in i laddläge (isLoading). Rotorsak: Button.tsx bytte hela
`children` MOT spinner+loadingText — två olika bredder, ett hopp.

Fix på biblioteksnivå (Button.tsx): CSS Grid-stapling (inline-grid +
grid-area:1/1 på två alltid-monterade lager, visibility-toggle), så
knappens mått = MAX(bredd/höjd) av de två lagren oavsett vilket som syns.
Migrerar även BetalningsInkorg.tsx:s två handbyggda Förhandsgranska-knappar
(bar inte tidigare Button.isLoading) till samma prop.

Se PR-kroppen för research-citat (RAC/MUI/Chakra/Wes Bos), negativt bevis
och visual-diff-lista.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Button.tsx: isLoading ändrar aldrig knappens bredd/höjd (grid-stack), verifierat med hermetiskt Playwright-test i båda riktningarna (kort och lång loadingText)
- [x] #2 Negativt bevis: samma test kört mot förlagans Button.tsx (origin/main) fäller
- [x] #3 loadingText-annonseringen (role=status, polite) och tillgänglighetskontraktet är oförändrat — verifierat
- [x] #4 DoD (test:api, typecheck, biome, build) + check-langa-streck.mjs gröna; relevanta acceptance-tester för betalningsinkorgen körda
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
