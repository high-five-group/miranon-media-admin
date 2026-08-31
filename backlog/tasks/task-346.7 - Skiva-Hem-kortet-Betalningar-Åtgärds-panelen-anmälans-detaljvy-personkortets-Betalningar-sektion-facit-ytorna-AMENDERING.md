---
id: TASK-346.7
title: >-
  Skiva: Hem-kortet Betalningar, Åtgärds-panelen, anmälans detaljvy,
  personkortets Betalningar-sektion (facit-ytorna, AMENDERING)
status: Done
assignee: []
created_date: '2026-08-30 18:45'
updated_date: '2026-08-31 13:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-346.6
parent_task_id: TASK-346
ordinal: 644000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fem ingångar, ett formulär. De tre stämplade ytorna ändras under B3-mandatet med sidofiler; Marcus stämplar om på morgonen. Täcker användarberättelser: 11, 23, 24, 25, 28, 29.

Modell: Opus@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hem: kortet Betalningar ERSÄTTER kortet Förfallna betalningar (inte ovanpå): N öppna · M förfallna · K kvitton att skicka; knappar Registrera betalning (→ inkorgen) och Skicka påminnelse till alla (befintlig); AMENDERING-sidofil i tasks/sessions/bilagor/s102-hem-konvergens/ klass ny form, förhandsmandat S113 Del 11; promoverings-grinden grön via sidofilen
- [x] #2 Åtgärds-sidans panel 'Pricka av och notera': per person saknas-belopp, knappen Registrera betalning (samma formulär, förvald person), inbetalningsrader med kvittostatus + Visa/Skicka igen; kryssen är läsande (härledda) och kan inte flippas; noteringsfälten kvar; betalningspåminnelsen läser den härledda statusen; gamla Skicka kvitto-dialogen riven; AMENDERING-sidofil i tasks/sessions/bilagor/s93-atgardssida-promovering/
- [x] #3 Anmälans detaljvy: Betalningar-sektion med saknas, inbetalningar, kvitton, Registrera betalning
- [x] #4 Personkortet: ny Betalningar-sektion (öppna över alla event + senaste inbetalningar + Registrera betalning); AMENDERING-sidofil i tasks/sessions/bilagor/s103-persondetalj-konvergens/
- [x] #5 Eventsidans 'Öppna detaljer' visar samma härledda läge läsande
- [x] #6 Alla ytor bakom miljöflaggan; acceptanstest: registrera från panel, anmälan och personkort ger samma resultat som inkorgen; axe 0; skärmdumpar desktop + iPad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 ADR-128 och ADR-129 är Accepted och landade FÖRE första kodskiva armeras
- [ ] #5 Pengalogikens regler (härledning, sekvens, unik kvittonyckel, matchning, dubbletter, jobbets tillstånd) har var sin negativ kontroll bokförd — testet fäller en trasig implementation
- [ ] #6 Orkestrerarens egen vandring av Lottas lördag mot staging (fixtur ZZ-GRANSKNING-S113) är bokförd med skärmdumpar i tasks/sessions/bilagor/ före session-paus, och en oberoende granskningsagent har gått samma vandring
- [ ] #7 Nya ytor ligger bakom miljöflaggan och är avstängda i prod tills Marcus slår på den
- [ ] #8 Facit-stämplade ytor (Hem, Åtgärds-sidan, persondetalj) bär AMENDERING-sidofil per yta med klassen ny form, förhandsmandat S113 Del 11
- [ ] #9 Facit-granskning: tasks/sessions/bilagor/s102-hem-konvergens/facit.json, tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json, tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json — AMENDERING-sidofil per manifest, klass ny form, förhandsmandat S113 Del 11
<!-- DOD:END -->
