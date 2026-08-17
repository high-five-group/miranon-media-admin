---
id: TASK-273.2
title: 'Skiva: Genvägarnas hover + etiketten Gå till åtgärder'
status: To Do
assignee: []
created_date: '2026-08-17 14:56'
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
- [ ] #1 Genvägskorten på hem-vyn bär eventdetaljens radhover-grammatik: synlig bakgrundsplatta med mjuk övergång, samma visuella konstruktion som eventsidans åtgärdsrader
- [ ] #2 M3-kommentaren i NavCard är ersatt med trail som bokför Marcus omprövning 2026-08-17 — beslutet rivs öppet, aldrig tyst
- [ ] #3 Genvägsknappen visar exakt 'Gå till åtgärder'; acceptanstestet som låser strängen är uppdaterat i samma landning och grönt
- [ ] #4 Hem-vyn är i övrigt identisk med facit tasks/sessions/bilagor/s102-hem-konvergens/facit.json ytan hem-vyn V1 Lugna morgonen; de två beslutade avvikelserna (hover + etikett) är bokförda i en amenderings-sidofil i samma bilage-katalog, redo för Marcus omstämpling via !-kanalen — agenten rör ALDRIG godkand-fältet (ADR-104)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s102-hem-konvergens/facit.json (ADR-102 R3) — avvikelser utöver de två beslutade: noll
<!-- DOD:END -->
