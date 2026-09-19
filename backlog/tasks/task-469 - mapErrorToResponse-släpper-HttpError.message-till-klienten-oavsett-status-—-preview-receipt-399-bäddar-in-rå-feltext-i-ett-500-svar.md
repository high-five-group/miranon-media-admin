---
id: TASK-469
title: >-
  mapErrorToResponse släpper HttpError.message till klienten oavsett status —
  preview-receipt:399 bäddar in rå feltext i ett 500-svar
status: To Do
assignee: []
created_date: '2026-09-18 23:24'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 810000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sidofynd ur TASK-461 (PR #2556), bekräftat av granskaren mot origin/main: supabase/functions/_shared/errors.ts mapErrorToResponse returnerar error.message för varje HttpError, inte bara 4xx. Mönstret är avsiktligt för användarriktade 4xx-texter (t.ex. Storage-retry-meddelanden), men preview-receipt/index.ts ~rad 399 kastar HttpError(status 500, '<vem>: kvittot kunde inte skapas — <rå exception-text>'), så en intern feltext kan nå klienten. Samma klass som js/stack-trace-exposure som #2556 stängde i betalningshjälparen. Bygg-agentens korttext med ~15 anropsplatser att gå igenom står i PR #2556:s kropp — börja där.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Genomgång av samtliga HttpError-kast med status >= 500 i supabase/functions/: tabell i PR-kroppen över vilka som bär rå exception-text
- [ ] #2 Ingen 5xx-väg returnerar intern feltext till klienten; detaljerna når serverloggen med requestId som korrelation — rött-först-test per åtgärdad väg, CI-wirat
- [ ] #3 4xx-vägarnas användarriktade texter är oförändrade (klientens felvisning bryts inte) — bevisat mot src/ och tests/api/
- [ ] #4 Prod-deploy-skulden (vilka EF:er) står i kortet som Marcus steg
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
