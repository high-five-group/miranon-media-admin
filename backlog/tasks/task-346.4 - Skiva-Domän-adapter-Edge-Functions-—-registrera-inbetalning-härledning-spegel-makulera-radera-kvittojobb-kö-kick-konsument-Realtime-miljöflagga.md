---
id: TASK-346.4
title: >-
  Skiva: Domän + adapter + Edge Functions — registrera inbetalning, härledning,
  spegel, makulera/radera, kvittojobb (kö + kick + konsument), Realtime,
  miljöflagga
status: To Do
assignee: []
created_date: '2026-08-30 18:45'
updated_date: '2026-08-30 23:37'
labels:
  - ready-for-agent
dependencies:
  - TASK-346.2
  - TASK-346.3
parent_task_id: TASK-346
ordinal: 641000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hela kedjan från 'Lotta trycker Enter' till 'kvittot ligger i bucketen och Bengt har mail' — utan UI, bevisad med tester och ett staging-anrop. Täcker användarberättelser: 5, 7, 8, 10, 16, 17, 31, 32.

Modell: Opus@xhigh (ADR-089; avvikelse från agent-default bokförd här). Nattmandat S113 (Marcus 2026-08-30): B4 — orkestreraren får armera risknivå hög när granskningsloopen konvergerat; B3 — skarp form byggs AFK, Marcus justerar vid morgongranskning. Staging: seriell db push/funktionsdeploy av orkestreraren före armering (B5). Rött test:api-fall på main (TASK-343) är känt och orelaterat. Underlag: PRD TASK-346, sessionsdok S113 Del 10–11, docs/research/verifiering-kvittoskivning-afk-natt-2026-08-30.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Domänmodell Inbetalning/Kvitto/Jobb + zod-scheman; DataSourceAdapter får portar (lista öppna betalningar, registrera inbetalning, radera, makulera, lista inbetalningar per anmälan/person, köa kvitton, jobbstatus, visa kvitto (signerad länk), skicka igen) — port-paritet i båda adaptrarna (SupabaseAdapter kastar NOT_IMPLEMENTED där så gäller, ADR-057)
- [x] #2 Funktion registrera-inbetalning: skapar raden i Postgres i en transaktion, härleder facken (avgift klar vid summa ≥ anmälningsavgift, allt vid summa ≥ pris; avtalat pris först; föreläsning = ett pris) och skriver spegeln till Airtable (två valfält, Summa inbetalt, kvittonummer) med omförsök; eftersläpning bokförs på raden; aktivitetsloggen får poster (registrerade/makulerade/raderade)
- [x] #3 Kvittojobbet: enqueue-funktion köar N rad-ID:n, svarar direkt och kickar konsumenten (EdgeRuntime.waitUntil); konsumenten läser batch ur kön, allokerar nummer sekventiellt, renderar PDF med begränsad parallellism, skickar via Resend ett anrop per kvitto med idempotensnyckel per inbetalning, sparar PDF:en i privat bucket, finaliserar ledgern, uppdaterar jobb_rad; fel bär skäl; självläkning: pågår äldre än 5 min → väntar; funktionerna döps INTE send-*
- [x] #4 Hermetiska tester med negativ kontroll för: härledningens fyra fall + avtalat pris + återbetalning + föreläsning; beloppsnormalisering ('2 500,00', '2500,50', 'abc', '1e3'); jobbets tillståndsmaskin inkl. självläkning; dubbelskick fäller på unik nyckel
- [x] #5 Realtime: klienten prenumererar på jobb_rad-ändringar; läser läget vid appöppning
- [x] #6 Miljöflaggan VITE_FEATURE_BETALNINGAR införd (på i .env.development/.env.staging, frånvarande i prod), med rivningsnot
- [ ] #7 Funktioner deployade till staging av ORKESTRERAREN före armering (B5); ände-till-ände i staging: registrera → kvitto → mail till Resend-testadress → PDF i bucket → ledgerrad, bokfört i PR-kroppen
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
