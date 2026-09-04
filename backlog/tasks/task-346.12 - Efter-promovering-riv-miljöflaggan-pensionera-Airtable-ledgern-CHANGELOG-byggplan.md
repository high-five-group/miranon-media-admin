---
id: TASK-346.12
title: >-
  Efter promovering: riv miljöflaggan, pensionera Airtable-ledgern,
  CHANGELOG/byggplan
status: To Do
assignee: []
created_date: '2026-08-30 18:46'
labels:
  - ready-for-human
dependencies:
  - TASK-346.7
  - TASK-346.8
  - TASK-346.9
  - TASK-346.10
  - TASK-346.11
parent_task_id: TASK-346
ordinal: 649000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Städning som bara kan ske efter prod. HITL: kräver Marcus prod-steg först. Täcker användarberättelser: 35, 36.

Modell: Sonnet@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Miljöflaggan riven i kod efter att Marcus slagit på funktionen i prod (ADR-103: flaggor rivs efter godkännande)
- [ ] #2 Airtable-tabellen Kvitton pensionerad: data-model.md markerar den som ersatt av Postgres-ledgern; raderingen i prod är Marcus handling (bokföringsdata) och sker efter att backfill och första skarpa kvitton verifierats
- [ ] #3 CHANGELOG [Unreleased] och docs/byggplan.md § 2 bär spåret; lessons skördade
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
