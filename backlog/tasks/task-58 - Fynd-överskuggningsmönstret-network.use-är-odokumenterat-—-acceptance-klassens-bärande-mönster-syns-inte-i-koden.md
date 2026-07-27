---
id: TASK-58
title: >-
  Fynd: överskuggningsmönstret network.use() är odokumenterat —
  acceptance-klassens bärande mönster syns inte i koden
status: To Do
assignee: []
created_date: '2026-07-27 18:07'
labels: []
dependencies: []
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Upptäckt i TASK-54.3:s QA steg 5 (läs koden som en ny agent skulle).

SYMPTOM: För att låta ETT test returnera ett annat svar än den delade handlern används network.use(handler) via den exponerade network-fixturen. Mönstret fungerar — verifierat i QA steg 3: överskuggningen gav status 500 i sitt eget test och läckte INTE till nästa (som fick 200 med tre event). Men det står ingenstans i fixturmodulerna.

En ny agent som öppnar tests/visual/support/ hittar: var handlers bor (handlers.ts), vad kontraktet är (EF-protokollet), vad vakten gör (hermetik-vakt.ts) och varför optionerna är satta. Den hittar INTE hur man överskuggar lokalt, och inte att network-fixturen är den yta ett test ska nå. Kunskapen finns bara i MSW:s egen dokumentation och i den här sessionens huvud.

VARFÖR DET ÄR MER ÄN EN TRIVIALITET: TASK-54:s PRD-användarberättelse 5 är uttryckligen 'som utvecklare vill jag kunna överskugga en delad handler lokalt i ett test, så att specialfall inte tvingar fram en egen fixturvärld'. TASK-54.2:s kort säger om samma mönster: 'Detta är mönstret acceptance-klassens filer kommer luta sig mot, så det ska vara bekvämt, inte klurigt.' Nitton acceptance-filer ska skrivas mot ett mönster som inte är nedskrivet.

FÖRVÄNTAT BETEENDE: fixturmodulen dokumenterar hur ett test överskuggar en handler lokalt och att överskuggningen är per test — helst med ett kort exempel i docblocken där handlers eller fixturen definieras, så att den som ska skriva en acceptance-fil hittar det utan att läsa bibliotekets dokumentation eller git-historik.

Detta är dokumentationsskuld, inte en defekt: mekanismen fungerar och är bevisad. QA-kortet föreskriver att sådan skuld bokförs som fynd.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
