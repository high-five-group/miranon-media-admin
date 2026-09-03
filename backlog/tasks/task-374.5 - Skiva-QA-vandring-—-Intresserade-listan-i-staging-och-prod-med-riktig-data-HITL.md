---
id: TASK-374.5
title: >-
  Skiva: QA-vandring — Intresserade-listan i staging och prod med riktig data
  (HITL)
status: To Do
assignee: []
created_date: '2026-09-03 09:21'
labels:
  - ready-for-human
dependencies:
  - TASK-374.1
  - TASK-374.2
  - TASK-374.3
  - TASK-374.4
parent_task_id: TASK-374
ordinal: 680000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan, körs i webbläsaren efter att 374.1–374.4 landat och prod deployats:
1. Prod: öppna Mer → Intresserade. Räknaren visar alla intresserade (2026-09-03 var talet 112; jämför mot Airtable-vyn samma dag). Ingen rad saknas efter rullning till slutet.
2. Prod: minst tre namnlösa rader visar e-posten som primär rad och 'Namnlös intresserad' dämpat som sekundär; ingen rad visar initialer byggda ur en platshållare; den neutrala ikonen är lika stor som initialavataren.
3. Prod: alla rader är exakt lika höga — kontrollera med webbläsarens mätverktyg på minst fem rader, varav minst en namnlös och en med lång e-post (trunkeras, radbryts inte).
4. Prod: pillen 'N hämtningar' har samma bredd på alla rader med en- och tvåsiffriga tal; texten är centrerad.
5. Sök: skriv en del av ett namn respektive en e-post; listan filtreras, räknaren visar 'N träffar av M'; tom sökning återställer; sökning utan träff ger 'Inga träffar på sökningen.'
6. Sortering: växla till 'Namn A till Ö' — namnlösa sorteras på sin e-post, inte i en klump; växla tillbaka till 'Senaste interaktion'.
7. Tangentbord: Tab från sidans topp når sökfältet, sorteringen (öppnas med Enter/Space, piltangenter, Escape stänger) och vidare; synligt fokus hela vägen.
8. Skärmläsare (VoiceOver-stickprov): sorteringen läses som listbox med tillgängligt namn; efter en sökning annonseras träffantalet; rubriken får fokus vid sidladdning.
9. Stale URL: öppna /mer/intresserade?variant=a — identisk vy med /mer/intresserade.
10. Utskrift och hög kontrast: förhandsgranska utskrift (rader bryts inte mitt itu), aktivera 'öka kontrast' i systemet (radavgränsare synliga).
11. Sidofynd att pröva: logga ut, öppna /mer/intresserade direkt — förväntat: omdirigering till inloggning. Bokför utfallet oavsett; blev listan synlig utan inloggning är det ett nytt kort (S114 Del 5 sidofynd).
12. Staging: samma punkter 2–10 mot staging (2 intresserade); notera att fyllnadsläget inte längre finns.
Täcker användarberättelser: 22
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Testplanen nedan genomgången i staging och prod; varje punkt bokförd med utfall i kortets Final Summary; fynd blir nya kort med exakt symptom och förväntat beteende, aldrig retuscherade planer
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [ ] #5 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->
