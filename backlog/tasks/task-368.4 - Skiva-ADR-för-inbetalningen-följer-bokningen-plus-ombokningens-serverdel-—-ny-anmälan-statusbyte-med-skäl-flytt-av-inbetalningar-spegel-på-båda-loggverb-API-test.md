---
id: TASK-368.4
title: >-
  Skiva: ADR för inbetalningen-följer-bokningen plus ombokningens serverdel — ny
  anmälan, statusbyte med skäl, flytt av inbetalningar, spegel på båda,
  loggverb, API-test
status: Done
assignee: []
created_date: '2026-09-03 07:57'
updated_date: '2026-09-03 11:43'
labels:
  - ready-for-agent
dependencies:
  - TASK-368.2
parent_task_id: TASK-368
ordinal: 670000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: servern kan boka om en person från ett event till ett annat i en operation: den gamla anmälan blir avbokad med skälet ifyllt, en ny anmälan skapas, personens pengar följer med så att hon inte ser ut som obetald, kvittot står kvar som verifikation, och basens spegel stämmer på båda anmälningar. Beslutet att pengarna följer bokningen når ADR-baren (svårt att återställa i bokföringens koherens, överraskande utan kontext, verklig avvägning) och mintas här, aldrig inline. Täcker användarberättelser: 13, 14, 15, 17, 18.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ADR mintad (nästa lediga nummer, README-raden i docs/decisions uppdaterad): inbetalningen följer bokningen vid ombokning; kvittot rörs aldrig (kvitton kan strukturellt inte pekas om); flytten är en rättelse av bokföringspost (BFL 5 kap. 5 §) med spårbarhet i aktivitetsloggen; prisskillnad bokförs som mellanskillnad via befintlig tilläggs-/kreditmekanik; alternativen kreditera-allt-och-nytt samt ersättande kvitto förkastade med skäl ur docs/research/kvitto-vid-ombokning-2026-09-03.md
- [ ] #2 Ombokningsoperationen: skapar ny anmälan på valt event via befintlig skapa-anmälan (källa Manuell, samma person), sätter den gamla till Avbokad/Ombokad med Notering-rad '[Ombokad ÅÅÅÅ-MM-DD av <aktör>] till <event, datum>', flyttar alla AKTIVA inbetalningar till den nya anmälan (raden byter anmälan, ögonblicksbild av event och eventdatum uppdateras på raden, kvitto_id och kvittoraden orörda), räknar om spegeln på BÅDA anmälningar, och loggar 'bokade om anmälan' med båda anmälningarna i statementet
- [ ] #3 Svaret bär prisskillnaden (nytt pris minus flyttad summa, eller null när pris saknas) så klienten kan visa den; makulerade inbetalningar flyttas inte
- [ ] #4 Fel halvvägs lämnar inget halvt läge: ordningen är ny anmälan, flytt i Postgres, statusbyte, spegel; misslyckas ett steg rapporteras exakt vilket, och ett omanrop är idempotent (ingen dubbel anmälan, ingen dubbel flytt)
- [ ] #5 API-test mot staging-funktionen prövar flytten med en och flera inbetalningar, spegel på båda anmälningar, prisskillnad positiv/negativ/null, att makulerade rader inte flyttas, idempotens och loggverbet; allowlist-vakten och DoD-grindarna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S115 stängning (orkestrerare): landad via PR #2247 (merge 292af681, 2026-09-03) efter två review-rundor, risk hög, Marcus hög-risk-GO. Review runda 2 bedömde AC #5 som felställd i bokstaven (prisskillnadens tre tecken bevisas hermetiskt, inte i staging, eftersom ingen EF kan sätta mål-eventets pris) men uppfyllt i sak över de två testfilerna (52 hermetiska + 9 staging-fall, räknade). Det nya 409-fallet redan_anmald_pa_malet kördes INTE lokalt av byggaren (staging-semaforen höll basen); skarpbeviset kom i kö-körningen (merge_group pr-2247, ci.yml completed success). Sidofyndet purge-sentinelns blanksteg bärs av TASK-378.
<!-- SECTION:NOTES:END -->
