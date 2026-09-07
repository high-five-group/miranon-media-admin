---
id: TASK-422
title: >-
  Fynd: tests/e2e/atgarder-kvitto.staging.test.ts:482 fäller sedan TASK-402.8
  tog bort Obekräftad-pillen — testet uppdaterades aldrig
status: Done
assignee: []
created_date: '2026-09-06 19:17'
updated_date: '2026-09-07 16:48'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 752000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: bygg-agenten för TASK-367 (PR #2416, S123 2026-09-06) vid full betalnings-e2e-svep, bekräftat av review-runda 2 (Opus) som verifierade att PR:en inte rör filen. tests/e2e/atgarder-kvitto.staging.test.ts:482 asserterar toBeChecked() på en checkbox namngiven /Erik Holm Obekräftad Markerad/ som inte längre finns: VariantC.tsx:s docblock (rad ~868) bokför att Obekräftad-pillen togs bort från bekräftelsestegets kort i TASK-402.8 (PR #2378 → 6c999f2f, 2026-09-06). Testet fäller konsekvent i staging-sviten men syns inte i PR-CI (staging-jobben skippas på PR-ytan, run_staging: false) — det syns först i nightly/post-merge staging. Åtgärd: uppdatera assertionens tillgängliga namn till den form kortet har efter 402.8 (läs VariantC.tsx och promoverings-grindens ariaSnapshot), kör filen mot staging (mutex), bokför att ingen annan assertion i filen bygger på pillen. Triage ADR-053: blockerar ej, värdefullt — registrerat.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Testet asserterar kortets tillgängliga namn i formen efter TASK-402.8; filen grön mot staging
- [x] #2 Grep i tests/e2e efter 'Obekräftad' bekräftar att ingen annan assertion bygger på den borttagna pillen (eller de rättas i samma PR)
- [ ] #3 Post-merge staging-körningen grön för filen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Assertionens tillgängliga namn uppdaterat (rad ~539): /Erik Holm Obekräftad Markerad/ → /Erik Holm Markerad/. Källa för nya formen: VariantC.tsx:s KortHuvud (rad ~893-905) renderar bara InitialAvatar (aria-hidden) + namn + sr-only "Markerad"/"Inte markerad" sedan TASK-402.8 (PR #2378 → 6c999f2f) tog bort pillen — verifierat mot promoverings-grindens facit (tests/e2e/__aria__/bekraftelsesteget-promoverings-grind.staging.test.ts/bekraftelsesteget-utgangslage-desktop-chromium-authenticated.aria.yml rad 23: checkbox "Erik Holm Markerad").

AC #2 (grep): grep -rn "Obekräftad" tests/e2e/ visar inga andra assertioner som bygger på den borttagna pillen. Träffarna är antingen (a) fixturens status-fält ("Obekräftad" som domändata, orört av 402.8) eller (b) redan-korrekta toHaveCount(0)-assertioner i andra filer (bekraftelsesteget-formen-fore-stampeln, event-bekraftelse, event-detail) som verifierar pillens FRÅNVARO — de rördes redan av 402.8:s egen PR. Endast denna fils rad 539 asserterade pillens NÄRVARO i ett tillgängligt namn.

Filen körd mot staging (npx playwright test --project=chromium-authenticated tests/e2e/atgarder-kvitto.staging.test.ts): 2 passed, 2 skipped (SKIPPAD: dialogen riven med miljöflaggan på, TASK-346.7 — förväntat, orört av denna ändring), exit 0. Inga medKvitto-fällningar: filen mockar registrera-inbetalning OCH hamta-oppna-betalningar via page.route (rad 402, 411) — den träffar aldrig de skarpa staging-EF:erna som TASK-367/PR #2416 (fortfarande OPEN vid denna körning, kollat med gh pr view 2416) kräver medKvitto på. Staging-driften i uppdragstexten materialiserades alltså inte i denna fils körning.

AC #3 (post-merge staging-körningen grön) kan INTE verifieras av mig — den kräver en post-merge/nightly-körning som inte existerar förrän PR:en landat. Lämnad avbockad med avsikt; orkestreraren/CI äger den signalen.

STÄNGNING (S123 resume 1, 2026-09-07): PR #2438 → 56d71536; post-merge 56d71536 röd ENBART på get-person.staging.test.ts:173 (sentinel-driften L599, orelaterad, städad i staging 2026-09-07), täckt av nästa gröna post-merge fb814734. Review runda 1 (Sonnet): 0 fynd, risk låg, konvergerad. AC #3 (post-merge grön) uppfylld via fb814734. Done-flipp av orkestreraren.
<!-- SECTION:NOTES:END -->
