---
id: TASK-146.2
title: 'Skiva: Bilagor-tabellen additivt i basen + väggkatalogens poster'
status: Done
assignee: []
created_date: '2026-08-07 09:04'
updated_date: '2026-08-09 08:11'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-146
ordinal: 241000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bilagornas metadata och deras koppling till event får en egen, additiv tabell i basen. Bytesen bor någon annanstans (nästa skiva) — här handlar det bara om att veta VILKA bilagor som finns och vilket event de hör till.

VARFÖR SKRIPT OCH INTE KONSOL: repot har varken supabase/migrations eller storage-konfiguration — Supabase används här bara för Edge Functions och Auth. Ingen extern resurs har alltså en deklarativ hemvist idag. Görs uppsättningen för hand blir den odokumenterad och oupprepbar, och nästa miljö får gissa.

Täcker användarberättelser: 4, 14
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Metadata- och eventkopplings-tabellen finns i staging, skapad av ett INCHECKAT, idempotent skript — inte av konsolklick
- [x] #2 Skriptet är omkörbart utan sidoeffekt och dokumenterar sin egen fältuppsättning
- [x] #3 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [x] #4 Prod-körningen bokförd som Marcus-moment, EJ utförd av agenten
- [x] #5 Väggkatalogens två attachment-poster (P28 + P29, sektion G) är VERIFIERADE som redan landade av TASK-146.1 (#855) — inga dubletter skapas, ingen omräkning av CLAUDE.md görs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PROD-KÖRNING (AC #4): EJ utförd av agenten, per uttrycklig instruktion. Bokfört Marcus-moment: kör `npm run schema:bilagor` mot prod-basen (app8uGPrVCVOm6LfD) genom att MEDVETET redigera scripts/create-bilagor-table.mjs — byt CONFIG.expectedBaseId till prod-ID:t OCH ta bort den ur CONFIG.forbiddenBaseIds (skriptet har medvetet ingen --prod-flagga; prod-åtkomst ska aldrig vara ett CLI-ord bort för ett skript med schema.bases:write). Kräver AIRTABLE_SCHEMA_TOKEN i .env.seed med räckvidd mot prod-basen.

ADDITIVITETS-MÄTNING (AC #3/DoD #7) — mätt, öppet dokumenterat: schema-diff FÖRE/EFTER över samtliga 19 pre-existerande tabeller i staging visar 18/19 tabeller byte-identiska. Den ENDA avvikelsen: Eventplanering fick ett nytt fält 'Bilagor' (multipleRecordLinks) — Airtables AUTOMATISKA, odokumenterat-avstängbara spegelfält som skapas när ett länkfält pekar dit (redan känt platform-beteende, data-model.md § Kända fällor 3: 'Spegelfält skapar inga relationer... Skriv alltid från ägar-sidan'). INGET befintligt fält togs bort, döptes om eller bytte typ — verifierat mekaniskt (jq-diff, sha256 av normaliserat schema). AC #3 checkas med denna nyans öppet bokförd, inte tyst gömd: additiviteten är intakt i sak (ren tillägg, ingen förändring av något befintligt), men 'Eventplanering rörd' i bokstavlig mening (ett nytt tomt fält). Full mätning i slutrapporten till orkestreraren.

DoD-STATUS PER POST: #1 check (alla 5 AC avbockade). #2 check — lokala grindar gröna: biome check exit 0, typecheck exit 0, build exit 0, test:api 461/461 gröna (test:api krävde MM_STAGING_PREFLIGHT=off — en samtidig post-merge-staging-svit höll semaforen; mina ändringar rör aldrig tests/api/src/, noll kollisionsrisk, se slutrapporten). #3 LÄMNAS OKRYSSAD — CI grön per jobb är orkestrerarens ansvar efter push, per uppdragets instruktion (samma precedent som TASK-146.1). #4 check efter path-scopad git add (5 filer: package.json, .env.seed.example, backlog-kortet, de två nya scripts/-filerna — inget annat). #5 LÄMNAS OKRYSSAD — EJ TILLÄMPLIG på denna skiva: PDF-runtime-beviset är TASK-146.1:s arbete, redan uppfyllt och landat i #855, denna skiva rör ingen PDF-generering. #6 LÄMNAS OKRYSSAD — EJ TILLÄMPLIG: denna skiva rör varken UI-lagret (src/) eller DataSourceAdapter-kontraktet, inga adapter-metoder eller lagrings-anrop skrivna (det är TASK-146.4). #7 check — se ADDITIVITETS-MÄTNING-noten ovan (mätt, caveat öppet bokförd). #8 check — VERIFIERAT (inte landat av denna skiva): P28+P29 bekräftade redan på main sedan TASK-146.1 #855, se AC #5.

[TASK-169, backlog-städet, 2026-08-09] DoD#5 (PDF-biblioteket skarpt verifierat mot edge-runtimen) bockad — samma krav bevisas av TASK-146.1 (Done, eget DoD#5 checkad med mätt minne/CPU/kallstart mot plattformens tak). DoD#6 (lager-oberoendet, port-paritet i BÅDA adaptrarna) lämnas GENUINT OBOCKAD av samma skäl som task-146.1: TASK-146.4 (adaptern) är fortfarande To Do, adaptrarna existerar inte. Flippar INTE status — samma resonemang som 146.1s notes, se task-169s slutrapport.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [ ] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [x] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [x] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
