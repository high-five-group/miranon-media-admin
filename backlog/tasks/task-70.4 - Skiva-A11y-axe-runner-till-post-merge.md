---
id: TASK-70.4
title: 'Skiva: A11y (axe-runner) till post-merge'
status: To Do
assignee: []
created_date: '2026-07-28 16:33'
updated_date: '2026-07-28 16:34'
labels:
  - ready-for-agent
dependencies:
  - TASK-70.2
  - TASK-70.5
parent_task_id: TASK-70
ordinal: 147000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Samma rörelse som A7:5, mindre yta. A11y (axe-runner) bär 103 s mätt (run 30369011230) och kör i dag i den blockerande PR-grinden (ci-suite.yml rad 238-280).

KRÄVER A7:4 OCH A7:7 av samma skäl som A7:5: lagret måste finnas att flytta TILL, och vägen tillbaka måste vara skriven och övad.

### VAD SOM FAKTISKT VINNS — RÄKNA INTE 103 s PÅ VÄGGKLOCKAN

Åtgärdsplanen skriver minus 103 s. Det talet är JOBBETS EGEN TID, inte kritisk väg. A11y kör parallellt med Acceptance (hermetisk), som bär 404-452 s (ci-suite.yml rad 137-139). A11y ligger alltså inte i den kritiska vägen vare sig före eller efter A7:5, och flytten ger noll sekunder på väggklockan för en kod-PR.

Vinsten är runner-minuter och en smalare blockerande grind — inte snabbare svar. Redovisa den i den enheten. Ett kort som lovar 103 sparade sekunder och levererar noll ser ut att ha misslyckats trots att det gjort exakt rätt sak.

### ATT VETA OM JOBBET

A11y rör ALDRIG staging: egen alltid-färsk dev-server på dedikerad port (ADR-045 beslut 1+3), därför ingen mutex. Flytten tar alltså inte bort någon kö-tid — till skillnad från A7:5, där mutexen var hela poängen.

Jobbet har ett dependabot-skip på jobbnivå (ci-suite.yml rad 240) och läser secrets TEST_SUPABASE_URL och TEST_SUPABASE_ANON_KEY. Båda måste följa med till post-merge-ytan, annars faller jobbet tyst eller rött av fel skäl.

### ÄNDRAR BETEENDE

Tillgänglighetsregressioner fångas EFTER merge i stället för före. Repots kvalitetsribba säger att tillgänglighet alltid är 11 utan undantag — den ribban ändras INTE av denna skiva, bara tidpunkten då den mäts. Skillnaden är värd att hålla isär, särskilt om någon senare läser kortet och tror att ribban sänkts.

VID FÖRSTA SKARPA LANDNINGEN EFTERÅT, OBSERVERA:

- att a11y-jobbet faktiskt KÖRDES i post-merge och inte tyst föll bort på en saknad secret,
- att ett rött a11y post-merge öppnar ärende på samma väg som övriga post-merge-fel,
- att nattnätet fortfarande kör a11y.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A11y (axe-runner) förekommer INTE i jobblistan för en kod-PR:s ci.yml-körning — gh run view --json jobs, run-ID redovisat
- [ ] #2 A11y körs i post-merge-lagret OCH i nightly.yml — ett grönt run-ID per yta redovisat
- [ ] #3 Secrets och dependabot-villkoret följde med: post-merge-körningen visar a11y-STEGET kört, inte skippat och inte rött på saknad secret
- [ ] #4 Kod-PR:ens kritiska väg mätt före och efter — förväntat OFÖRÄNDRAD eftersom Acceptance dominerar. Avvikelse från det förklaras i stället för att bokföras som vinst
- [ ] #5 Vinsten redovisad i rätt enhet: sparade runner-minuter per kod-PR, inte sparad väggklocka
- [ ] #6 CI Passed or Skipped är fortfarande enda required check i ruleset 19627609, och gate-proof.yml körd grön efter ci.yml-ändringen
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

Samma form som A7:5 men lägre insats: jobbet håller ingen mutex, blockerar inget annat jobb och rör inte staging. Verifieringen är jobblistor och run-ID, alltså mekanisk rakt igenom.

Den enda punkt som kunde motivera human-etikett är att tillgänglighet är repots enda kvalitetsaxel utan undantag — men det gäller RIBBAN, inte MÄTPUNKTEN. Ribban ändras inte här. Att flytta mätpunkten är samma beslut Marcus redan godkänt i åtgärdsplanen, och utförandet kräver inget omdöme utöver det.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
