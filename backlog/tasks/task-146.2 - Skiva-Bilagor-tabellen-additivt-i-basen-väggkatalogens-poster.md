---
id: TASK-146.2
title: 'Skiva: Bilagor-tabellen additivt i basen + väggkatalogens poster'
status: To Do
assignee: []
created_date: '2026-08-07 09:04'
updated_date: '2026-08-07 13:15'
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
- [ ] #1 Metadata- och eventkopplings-tabellen finns i staging, skapad av ett INCHECKAT, idempotent skript — inte av konsolklick
- [ ] #2 Skriptet är omkörbart utan sidoeffekt och dokumenterar sin egen fältuppsättning
- [ ] #3 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [ ] #4 Prod-körningen bokförd som Marcus-moment, EJ utförd av agenten
- [ ] #5 Väggkatalogens två attachment-poster (P28 + P29, sektion G) är VERIFIERADE som redan landade av TASK-146.1 (#855) — inga dubletter skapas, ingen omräkning av CLAUDE.md görs
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [ ] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [ ] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [ ] #8 Väggkatalogens två attachment-poster landade
<!-- DOD:END -->
