---
id: TASK-346.10
title: >-
  Skiva: Swish-import — transaktionstyp, kolumnmappning per bank, matchning,
  dubbletter, bekräftelselista
status: To Do
assignee: []
created_date: '2026-08-30 18:46'
labels:
  - ready-for-agent
dependencies:
  - TASK-346.6
parent_task_id: TASK-346
ordinal: 647000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Från 'åtta rader i banken' till 'åtta bekräftelser' — samma inkorg, ingen ny yta. Täcker användarberättelser: 19, 20, 21, 22.

Modell: Opus@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Intern typ transaktion (datum, belopp, namn, telefon, meddelande, bankreferens); parser läser CSV/txt med kolumnmappning; Handelsbankens exempelfiler (docs/research/swish-rapport-exempel/) är fixtur för komma- och semikolon-varianterna; mappningen sparas per bank (lokalt + i basen) efter första importen; okänt format ger mappningsdialog, aldrig gissning
- [ ] #2 Matchning: telefon (normaliserat +46) mot anmälans Mobilnummer → säker; annars namn + belopp mot öppna betalningar → osäker med kandidater; annars omatchad; hermetiska tester + negativ kontroll per steg
- [ ] #3 Dubbletter: bankreferens som redan finns på en inbetalning hoppas över och räknas synligt ('3 rader redan registrerade'); omimport av samma fil skapar 0 nya (bevisat)
- [ ] #4 Bekräftelselistan är inkorgen: säkra rader förbockade, osäkra visar kandidater, omatchade får sökfältet; bekräftelse skapar inbetalningarna (kvittorutan per rad) och visar 'Skicka N kvitton'
- [ ] #5 Matchning mot Lottas verkliga bankfil är HITL (bank okänd) — bokfört som öppet AC för Marcus; acceptanstest med Handelsbankens exempelfil mot staging-fixturen (telefonnummer i fixturen anpassade i staging, aldrig prod)
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
