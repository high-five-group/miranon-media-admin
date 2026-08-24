---
id: TASK-273.2
title: 'Skiva: Genvägarnas hover + etiketten Gå till åtgärder'
status: Done
assignee: []
created_date: '2026-08-17 14:56'
updated_date: '2026-08-24 13:05'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-273
ordinal: 490000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta hovrar över genvägarna på hem-vyn och får samma synliga återkoppling som på eventsidans åtgärdslistor, och knappen säger 'Gå till åtgärder'. Ände-till-ände: hover-plattan renderas, etiketten uppdaterad i UI och test, facit-amenderingen skriven som sidofil. Täcker användarberättelser: 3, 4, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Genvägskorten på hem-vyn bär eventdetaljens radhover-grammatik: synlig bakgrundsplatta med mjuk övergång, samma visuella konstruktion som eventsidans åtgärdsrader
- [x] #2 M3-kommentaren i NavCard är ersatt med trail som bokför Marcus omprövning 2026-08-17 — beslutet rivs öppet, aldrig tyst
- [x] #3 Genvägsknappen visar exakt 'Gå till åtgärder'; acceptanstestet som låser strängen är uppdaterat i samma landning och grönt
- [x] #4 Hem-vyn är i övrigt identisk med facit tasks/sessions/bilagor/s102-hem-konvergens/facit.json ytan hem-vyn V1 Lugna morgonen; de två beslutade avvikelserna (hover + etikett) är bokförda i en amenderings-sidofil i samma bilage-katalog, redo för Marcus omstämpling via !-kanalen — agenten rör ALDRIG godkand-fältet (ADR-104)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s102-hem-konvergens/facit.json (ADR-102 R3) — avvikelser utöver de två beslutade: noll
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): PR #1566 (feat/task-273-2-genvagar-hover-etikett) MERGED 2026-08-17T15:33:35Z. Root-orsaken som höll kortet öppet (1b842cbd 2026-08-20: äkta trädregression i tests/a11y/NavCard.spec.ts, focus-ring-färg + reduced-motion, fångad av nattnätets A11y-jobb tre nätter i rad) är FIXAD samma dag (ef75c781, 'NavCard-testerna mäter färgövergångens SLUTvärde') och verifierat grönt i nightly A11y-jobbet sedan dess (kontrollerat 2026-08-24: senaste tre nightly-körningarna visar 'A11y (axe-runner)' SUCCESS). Facit-amendering AMENDERING-2026-08-17-hover-och-etikett.md finns på disk. Samtliga 5 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
