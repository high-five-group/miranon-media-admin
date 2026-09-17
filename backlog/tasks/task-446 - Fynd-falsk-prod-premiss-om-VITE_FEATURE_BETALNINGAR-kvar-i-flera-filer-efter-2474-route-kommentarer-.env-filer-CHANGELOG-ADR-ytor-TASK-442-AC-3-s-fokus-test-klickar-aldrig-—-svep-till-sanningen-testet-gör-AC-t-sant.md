---
id: TASK-446
title: >-
  Fynd: falsk prod-premiss om VITE_FEATURE_BETALNINGAR kvar i flera filer efter
  #2474 (route-kommentarer, .env-filer, CHANGELOG/ADR-ytor) + TASK-442 AC #3:s
  fokus-test klickar aldrig — svep till sanningen, testet gör AC:t sant
status: Done
assignee: []
created_date: '2026-09-17 09:51'
updated_date: '2026-09-17 12:29'
labels: []
dependencies: []
priority: medium
ordinal: 771000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: PR #2474 runda 3 (fynd 1+2 i Riskbedömnings-sektionen) rättade fem platser (funktionsflaggor.ts, env.ts, betalningar_.registrera.tsx, mer-index.staging.test.ts, playwright.config.ts) men lämnade minst fyra kvar: mer/index.tsx:93-94, betalningar.tsx:39-52, Genvagar.tsx:44-52, JobbLyssnare.tsx:28-33, samt mekanism-felet i .env.development:6/.env.staging:6/.env.example:30-36 och docs/reference/prod-driftsattning-betalningsflodet-runbook.md (steg 14). Rotorsak: Vite 8.2.2 loadEnv() låter byggmiljöns process.env (Vercels miljövariabler i prod) skriva över mode-filens värde sist — .env.production är därför inte auktoritativ för vad prod-bundeln bär. Samtidigt: TASK-442 AC #3 lovar 'hover ELLER fokus... 0 nya vid klicket' men fokus-testet (tests/e2e/mark-paid.staging.test.ts ~rad 839) slutade vid två svar utan att klicka — AC:t var därmed osant för fokus-varianten.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Noll kvarvarande falska nulägespåståenden om VITE_FEATURE_BETALNINGAR i src/tests/env-filer/CHANGELOG (grep-bevis och läsning i sammanhang, dokumenterat i PR-kroppen)
- [x] #2 Historiska/citat-träffar (CHANGELOG, dated sessionsdok, ADR-129 § Negativa och skuld, backlog-kort, PRD-text, review-instrumentering.jsonl) listade i PR-kroppen med skäl och medvetet orörda
- [x] #3 Fokus-testet i mark-paid.staging.test.ts klickar efter förvärmningen och bevisar 0 nya anrop; både hover- och fokus-varianten gröna i hermetisk körning
- [x] #4 DoD gröna (typecheck, biome, build, check-langa-streck, tsconfig.tests, check:docs, hermetisk e2e-svit, test:api)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done av S125-orkestreraren 2026-09-17: landad via #2497 (main 319be9d7), review-grinden konvergerad (r1 + två omstämplingar), DoD mot PR-kroppens grind-tabell. Rest: funktionsflaggor.ts § VAD FLAGGAN ÄR TILL FÖR bär ännu en mening om 'tre saker i prod' (info-fynd r1, utanför diffen) — bokförd i S125 Del 3 handoff.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Svepte med grep (mönster ur uppdraget) plus kompletterande mönster (mekanism-fraser som inte matchade exakt regex, t.ex. .env.example rad 30-33 och JobbLyssnare.tsx). Rättade sju filer med falska nulägespåståenden (mer/index.tsx, betalningar.tsx, Genvagar.tsx, JobbLyssnare.tsx, .env.development, .env.staging, .env.example) plus en mekanism-korrigering i prod-driftsattning-betalningsflodet-runbook.md (steg 14) — alla i samma TASK-446-tagg-stil som TASK-442s egna r3-fixar, med källa src/lib/funktionsflaggor.ts paragraf KONSEKVENSEN FOR PROD. Beslöt att INTE amendera ADR-129: useBetalningar.ts rad 75-80 (redan TASK-442-fixad) etablerar precedenten att ADR-129 paragraf Negativa och skuld är HISTORIK, rättelsen hör hemma i konsumentens docblock. Historiska/citat-träffar lämnade orörda (CHANGELOG.md rad 48 dated S113, task-346 PRD-text, task-346.4/346.7/346.10 dated closing-notes, ADR-132s dated mätning, review-instrumentering.jsonl append-only-logg, tasks/lessons.d två redan-korrekta upptäcktslektioner) — full tabell i PR-kroppen. Fokus-testet (mark-paid.staging.test.ts rad ca 839) fick klick plus noll-nya-anrop-assertion speglad från hover-testet; båda varianterna gröna (48 av 48 i hermetisk e2e-svit). DoD: typecheck, biome, build, langa-streck-grinden, tsconfig.tests, check:docs alla exit 0; test:api 2312 passed, 3 failed - de tre är kända staging-timeouts mot get-registrations med eventId reci2UQEPBMl3ebNl (TASK-14s dokumenterade vag-D-langsamhet under staging-belastning), orörda av denna diff.
<!-- SECTION:FINAL_SUMMARY:END -->
