---
id: TASK-346.2
title: >-
  Skiva: Basen i staging — numeriska prisfält, Avtalat pris, spegelfält,
  Saknas-formel, allowlist, data-model
status: To Do
assignee: []
created_date: '2026-08-30 18:45'
labels:
  - ready-for-agent
dependencies:
  - TASK-346.1
parent_task_id: TASK-346
ordinal: 639000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Basen får veta vad någon ska betala. Lotta ser inget nytt ännu; appen kan efter denna skiva läsa pris per event och skriva spegeln. Täcker användarberättelser: 5, 14, 35.

Modell: Sonnet@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Staging-basen bär nya fält: Eventinnehåll Pris (kr) + Anmälningsavgift (kr) (number), Eventplanering Pris (kr) + Anmälningsavgift (kr) (number, per-event-override), Anmälningar Avtalat pris (kr) (number), Summa inbetalt (kr) (number, app-skrivet), Saknas (kr) (formula: avtalat pris eller eventets pris minus summa), Kvittonummer (singleLineText, app-skrivet) — fritextfälten Pris/Anmälningsavgift/Resterande belopp är ORÖRDA (bilagemallarna läser dem)
- [ ] #2 Fälten skapade via deklarativt skript i scripts/ (samma form som create-kvitton-table.mjs), fält-ID:n bokförda i docs/reference/data-model.md (staging-kolumn; prod-ID:n som öppet AC för Marcus) och i kortets notes
- [ ] #3 field-allowlists.ts bär de app-skrivna fälten (Summa inbetalt, Kvittonummer, de två valfälten, Avtalat pris) — deny-by-default kvar
- [ ] #4 Priser ifyllda i staging för fixtur-eventet ZZ-GRANSKNING-S113 (2 500 / 1 000) och för kommande staging-event, med källa (fritexten) bokförd
- [ ] #5 Prod-fälten är ett öppet AC med exakt fältlista för Marcus (agenten rör aldrig prod)
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
