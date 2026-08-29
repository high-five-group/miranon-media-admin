---
id: TASK-309.40
title: >-
  Fynd: typfiltret ?typ= överlever byte av räckvidd (delade ↔ event) —
  nollställs till 'alla' vid varje byte
status: Done
assignee: []
created_date: '2026-08-29 08:38'
updated_date: '2026-08-29 11:00'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 625000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur TASK-309.39:s diagnos (S113, 2026-08-29): typfiltret ?typ= (Alla/Bilagor/Mallar/Generatorer) överlever ett räckviddsbyte (Delade dokument ↔ ett event) eftersom nuqs-nyckeln inte nollställs av setEventId och räckviddsläget saknar en filterrad som avslöjar det. Följd: Lotta byter från Delade till ett event och får ett "Bilagor"-filter från förra sammanhanget utan att se varför listan är smalare. Review-agenten klassade det som ask-user (produktfråga); orkestreraren avgjorde på Marcus mandat: JA — filtret nollställs (default 'alla') vid varje byte av räckvidd, i BÅDA riktningarna. Höjdlåset (309.39) är korrekt oavsett; detta kort är produktregeln. Verifierat: DokumentYta.tsx § DokumentLista useQueryState('typ') (rad ~1644 på main 6ba99066), räckviddsväxlingen i routen src/routes/_authenticated/mer/dokument.tsx. Hänger ihop med T176 (listans form) — kortet ändrar inte filterradens form, bara dess livslängd. Om 340.2:s "Till dokumenten" sätter ?typ=bilaga medvetet ska det fortsatt fungera (nollställningen gäller räckviddsbyte, inte navigering in i vyn).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Byte delade → event och event → delade nollställer ?typ (URL saknar typ-nyckeln, listan visar 'alla'); byte event → annat event nollställer också; direktlänk med ?typ=bilaga in i vyn fungerar fortfarande — acceptance-test i dokument-rackviddsval-sviten för alla fyra fallen
- [x] #2 Nollställningen sker i EN kodväg (räckviddsväxlingens hanterare), inte i flera komponenter; docblock förklarar regeln; 309.24/309.39-sviterna fortsatt gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #2090 (mergad 2026-08-29 10:58:50Z, main 8c266b72). Typfiltret ?typ= nollställs (nyckeln tas bort) vid varje räckviddsbyte via EN handler (handleRackviddsByte) kopplad till EventValjares båda vägar; direktlänk in i vyn fungerar. Kö-utsparkning runda 1 → rotorsak PRE-EXISTERANDE flake: oskopat getByText i dokument-lista-hojdlas matchade både listraden och alertScreenReaders SR-nod ('… har laddats upp/raderats', 100–1100 ms); nollhypotes bevisad mot rent main (1/10), skopad fix 20/20. Review-grinden: r1 låg → r2 konvergerad låg.
<!-- SECTION:FINAL_SUMMARY:END -->
