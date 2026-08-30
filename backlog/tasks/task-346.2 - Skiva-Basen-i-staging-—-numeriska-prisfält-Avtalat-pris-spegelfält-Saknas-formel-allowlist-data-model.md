---
id: TASK-346.2
title: >-
  Skiva: Basen i staging — numeriska prisfält, Avtalat pris, spegelfält,
  Saknas-formel, allowlist, data-model
status: To Do
assignee: []
created_date: '2026-08-30 18:45'
updated_date: '2026-08-30 20:14'
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
- [x] #1 Staging-basen bär nya fält: Eventinnehåll Pris (kr) + Anmälningsavgift (kr) (number), Eventplanering Pris (kr) + Anmälningsavgift (kr) (number, per-event-override), Anmälningar Avtalat pris (kr) (number), Summa inbetalt (kr) (number, app-skrivet), Saknas (kr) (formula: avtalat pris eller eventets pris minus summa), Kvittonummer (singleLineText, app-skrivet) — fritextfälten Pris/Anmälningsavgift/Resterande belopp är ORÖRDA (bilagemallarna läser dem)
- [x] #2 Fälten skapade via deklarativt skript i scripts/ (samma form som create-kvitton-table.mjs), fält-ID:n bokförda i docs/reference/data-model.md (staging-kolumn; prod-ID:n som öppet AC för Marcus) och i kortets notes
- [x] #3 field-allowlists.ts bär de app-skrivna fälten (Summa inbetalt, Kvittonummer, de två valfälten, Avtalat pris) — deny-by-default kvar
- [x] #4 Priser ifyllda i staging för fixtur-eventet ZZ-GRANSKNING-S113 (2 500 / 1 000) och för kommande staging-event, med källa (fritexten) bokförd
- [x] #5 Prod-fälten är ett öppet AC med exakt fältlista för Marcus (agenten rör aldrig prod)
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Staging-fält skapade LIVE via Airtable MCP 2026-08-30 (AIRTABLE_SCHEMA_TOKEN saknas lokalt, samma lucka som TASK-147.12/TASK-309.2). Deklarativ hemvist: scripts/create-betalningsfalt.mjs (npm run schema:betalningsfalt), samma form som create-kvitton-table.mjs. Fullt bokfört i docs/reference/data-model.md paragraf Stagingbasens additiva tillskott 2026-08-30.

STAGING-fält (apphjj8Q7lkXCMsL4): Eventinnehall (tblwqaBrkm6hJPITd): Pris (kr) = fldyFLfa0RhzY1qH1 (number precision 2); Anmalningsavgift (kr) = fldvMVViBjpXW9Abe (number precision 2). Eventplanering (tblVE3UKWl1CKrphV): Pris (kr) = fldCGsGP3QDtaAoho (number precision 2, per-event override); Anmalningsavgift (kr) = fldQL5eNuGNHwQ7tq (number precision 2, per-event override).

Anmalningar (tbloOcrppVoyrHbrq): Avtalat pris (kr) = fldZHwxOXOQqkFx33 (number precision 2); Summa inbetalt (kr) = fldI73u3UYN5vGsN6 (number precision 2, app-skrivet); Kvittonummer = fldkqFkqL3N5nopAL (singleLineText, app-skrivet, INGEN options-nyckel vid skapelse); Pris (kr) (from Event) = fldtZSeHg3ubwStzK (multipleLookupValues, additivt hjalpfalt, lookup av Eventplanering.Pris (kr) via lanken Event fldi3enUaMdbuGSlm); Saknas (kr) = fldSJCJwXnqwBIX2b (formula).

Saknas (kr)-formeln (verbatim): IF(OR({Avtalat pris (kr)}, {Pris (kr) (from Event)}), IF({Avtalat pris (kr)}, {Avtalat pris (kr)}, {Pris (kr) (from Event)}) - {Summa inbetalt (kr)}, BLANK()) — empiriskt fyrfallstestad live: inget pris->BLANK, eventpris-fallback, avtalat pris vinner, genuin overbetalning ger tillatet negativt varde. Testet kordes pa rec0houPcRjsPBGVz och atterstalldes till blankt tillstand efterat.

AC 4: priser satta for ZZ-GRANSKNING-S113 (Event-14061, recSahYCeTbEzFFe6): Pris (kr)=2500, Anmalningsavgift (kr)=1000. PREMISS-DIVERGENS bokford oppet: eventets egen fritext OCH dess Eventinnehall-standard (Fjarrskadning . Utbildning) ar BADA blanka, sa ingen fritext-kalla fanns pa just detta event; talen matchar i stallet det enda verkliga fritext-exemplet i basen: Eventinnehall Resor i medvetandet 1 . Utbildning (rec2MZrLMKWAzxarB), som fick SIN numeriska mirror parsad direkt ur sin EGEN fritext (Pris=2.500, Anmalningsavgift=1000:-). Kommande staging-event: 0 icke-ZZ Planerat-event med startdatum efter 2026-08-30 finns i staging (matt) - tolkat som tackt av Eventinnehall-standarden ovan; full events-backfill hor till TASK-346.8.

AC 3: field-allowlists.ts fick ny operation write-registration-payment-mirror (tableId Anmalningar, falten Summa inbetalt (kr) / Kvittonummer / Anmalningsavgift / Slutbetalning / Avtalat pris (kr)) - deny-by-default kvar, EF byggs TASK-346.4.

AC 5 OPPET for Marcus (agenten ror aldrig prod, app8uGPrVCVOm6LfD forbjuden). Skapa EXAKT samma NIO falt i prod-basen, samma typer/precision/ordning (Eventinnehall/Eventplanering FORE lookupen, lookupen FORE formeln): 1) Eventinnehall (tblfwqsNPSYd6o44L): Pris (kr) - number precision 2. 2) Eventinnehall (tblfwqsNPSYd6o44L): Anmalningsavgift (kr) - number precision 2. 3) Eventplanering (tblVE3UKWl1CKrphV): Pris (kr) - number precision 2. 4) Eventplanering (tblVE3UKWl1CKrphV): Anmalningsavgift (kr) - number precision 2. 5) Anmalningar (tbloOcrppVoyrHbrq): Avtalat pris (kr) - number precision 2. 6) Anmalningar: Summa inbetalt (kr) - number precision 2. 7) Anmalningar: Kvittonummer - singleLineText (INGEN options-nyckel). 8) Anmalningar: Pris (kr) (from Event) - multipleLookupValues, recordLinkFieldId = prodens Event-falt-ID, fieldIdInLinkedTable = prodens Eventplanering.Pris (kr)-falt-ID (las efter steg 3). 9) Anmalningar: Saknas (kr) - formula, EXAKT samma formeltext som ovan (faltnamnen ar identiska i prod). Fullt recept: docs/reference/data-model.md paragraf Stagingbasens additiva tillskott 2026-08-30, prod-tabellen.
<!-- SECTION:NOTES:END -->
