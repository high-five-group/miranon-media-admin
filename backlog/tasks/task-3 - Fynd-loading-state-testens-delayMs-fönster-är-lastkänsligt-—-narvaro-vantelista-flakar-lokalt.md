---
id: TASK-3
title: >-
  Fynd: loading-state-testens delayMs-fönster är lastkänsligt — narvaro +
  vantelista flakar lokalt
status: Done
assignee: []
created_date: '2026-07-06 10:42'
updated_date: '2026-07-11 08:36'
labels:
  - ready-for-agent
dependencies: []
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S52, task-1.3-körningen 2026-07-06): 'loading-state är tillgängligt (aria-busy + status)' i event-narvaro.staging.test.ts:155 och mer-vantelista.staging.test.ts:142 faller intermittent lokalt — stash-belagt PRE-EXISTING på oförändrad main (repeat-each=3: narvaro 2/3 röd, vantelista 1/3 röd; task-1.3-diffen orörd av ytorna). Mekanism: mocken fördröjer EF-svaret delayMs=500 och testet assertar att 'Laddar …'-texten hinner SES — under maskinlast missas fönstret (T26-klassen: tids-beroende assertions är sköra). CI absorberar via retries:2, men flaket är strukturellt. FÖRVÄNTAT BETEENDE: loading-state-assertions är deterministiska utan tidsfönster — samma härdningsklass som S31 Landning B: hål mocken öppen tills assertionen sett loading-ytan och släpp svaret manuellt (route-release-mönstret i event-anmalda.staging.test.ts), applicerat på narvaro- + vantelista-testen (och ev. övriga delayMs-loading-tester som grep avtäcker).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 De tre kända loading-testen (event-narvaro.staging.test.ts, mer-vantelista.staging.test.ts, person-detail.staging.test.ts) härdade med route-release-mönstret ur event-anmalda.staging.test.ts — ingen delayMs-tidsfönster-assertion kvar i loading-flödena
- [x] #2 Grep-svep över test-sviten redovisat: samtliga ytterligare delayMs-loading-instanser funna och härdade i samma mönster (noll kvarvarande)
- [x] #3 Determinism bevisad: --repeat-each=5 lokalt grönt på samtliga härdade testfiler (baseline-repro per kortet: repeat-each=3 → 2/3, 1/3 resp. 3/3 röda under last)
- [x] #4 Diffen rör endast testfiler (ingen produktkod)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TREDJE FIL-INSTANSEN (S52, task-1.2-körningen 2026-07-06): person-detail.staging.test.ts:166 samma delayMs-loading-klass — stash-belagd pre-existing på oförändrad main (repeat-each=3: 3/3 röd under maskinlast; task-1.2-diffen [TabBar] orörd av ytan). Härdnings-scopet bör täcka alla tre filerna + grep-svepet.

LEVERANS (S61 AFK-batch, do-work): TDD-bevis — flaket ÄR röda slingan, repro FRAMKALLAD lokalt före härdning: repeat-each=3 på loading-testen gav 5 failed/8 passed (narvaro 2/3 röd, vantelista 1/3 röd, person-detail 2/3 röd, event-detail 0/3 — kortets baseline-klass bekräftad). Härdning: route-release-mönstret ur event-anmalda.staging.test.ts speglat exakt i alla fyra filerna (opt-in manualRelease-gate som håller EF-svaret öppet tills loading-assertionen sett ytan; delayMs-optionen kvar i mock-signaturerna per referensen, noll callers). Grep-svep (AC#2): 1 ytterligare instans avtäckt — event-detail.staging.test.ts:136 — härdad i samma mönster; 'delayMs: '-call-sites i tests/ = 0 kvarvarande. Determinism (AC#3): repeat-each=5 på HELA de fyra filerna = 151/151 grönt (1,3 min; retries=0 lokalt). Grindar (DoD#2): typecheck 0 fel · biome exit 0 (4 pre-existing warnings, ingen i rörda filer) · test:api 290 passed + 6 fel av EXAKT kända CI-secrets-klassen (TEST_REGISTRATION_RECORD_ID saknas lokalt — bärs av CI per DoD#3) · build grön. Diffen test-only (AC#4). CI-bock + final-summary i stängningen per task-2-precedenten (13bb905/c0aa615).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit dae3f1f · CI-run 29146238378 grön per jobb (Lint+Audit+TypeCheck success · Detect changed files success · Test+Build success · Docs link check skipped by design · CI Passed or Skipped success) · CI-grön-första-pass: ja (attempt 1, inga re-runs) · defekter under körning: 0 (de 6 lokala test:api-felen = förhandsdeklarerade CI-secrets-klassen TEST_REGISTRATION_RECORD_ID, gröna i CI:s Test+Build) · TDD: flaket var röda slingan — repro framkallad lokalt (repeat-each=3: 5/12 röda; narvaro 2/3, vantelista 1/3, person-detail 2/3, event-detail 0/3) → route-release-härdning i 4 filer (3 kända + grep-fyndet event-detail.staging.test.ts:136) → repeat-each=5: 151/151 grönt; 'delayMs: '-call-sites i tests/ = 0
<!-- SECTION:FINAL_SUMMARY:END -->
