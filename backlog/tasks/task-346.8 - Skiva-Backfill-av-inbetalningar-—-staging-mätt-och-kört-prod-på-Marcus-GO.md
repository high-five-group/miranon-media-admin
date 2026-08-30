---
id: TASK-346.8
title: 'Skiva: Backfill av inbetalningar — staging mätt och kört; prod på Marcus GO'
status: To Do
assignee: []
created_date: '2026-08-30 18:46'
labels:
  - ready-for-agent
dependencies:
  - TASK-346.4
parent_task_id: TASK-346
ordinal: 645000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Härledningen blir sann för alla anmälningar, inte bara nya. Efter denna skiva visar inkorgen rätt saknas-belopp i staging. Täcker användarberättelser: 5, 32, 35.

Modell: Opus@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skript (dry-run default, --utfor) som per anmälan skapar historiska inbetalningar: Närvarande-deltagande ⇒ betalt hela dåvarande priset; Mottagen-fack ⇒ belopp = fackets dåvarande pris; betalsätt Historik, betalningsdatum tomt, källa bokförd per rad; skriver spegeln; idempotent (omkörning skapar inga dubbletter — bevisat)
- [ ] #2 Priset per historiskt event × typ hämtas ur numeriska fält om ifyllda, annars ur fritexten med tolkning bokförd ('2.500' → 2500) och rader som inte kan tolkas listade för Marcus — aldrig gissade
- [ ] #3 Staging: körd, mätt före/efter (antal anmälningar, antal inbetalningar, summa, andel som blir 'allt betalt'), avvikelselista bokförd i kortets notes; formen för 'Lottas lista' som facit dokumenterad (kolumner, hur avvikelser rättas)
- [ ] #4 Prod: ÖPPET AC för Marcus GO med exakt kommando och förväntade tal; agenten kör aldrig prod
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
<!-- DOD:END -->
