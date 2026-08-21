---
id: TASK-285.6
title: >-
  Skiva: Offline-beskedet som överlagrad notis — samma primitiv, ingen knapp,
  stapling definierad
status: To Do
assignee: []
created_date: '2026-08-21 11:08'
labels:
  - ready-for-agent
dependencies:
  - TASK-285.1
parent_task_id: TASK-285
ordinal: 521000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: när Lotta tappar nätet visas 'Du är offline' som samma lilla överlagrade notis nere till höger som uppdateringsnotisen — inte längre en orange helbreddsrad som trycker ner sidan. Den har ingen knapp, en mening om vad som fungerar och inte, och försvinner av sig själv när anslutningen är tillbaka (det är den enda notisen som får stängas utan användarens val — orsaken är borta). Skärmläsaren får beskedet artigt. Finns både en ny version och offline samtidigt staplas de i samma region, offline överst, utan att någon av dem trycks utanför skärmen på 390 px.

FORMEN: Notis-primitiven ur 285.1, låst i facit tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json ytan uppdateringsnotis — återanvänd, inte ny. Formen är Marcus-låst för uppdateringsnotisen; offline-beskedet är en ny konsument av samma form och granskas som egen yta av Marcus i stämplings-skivan. Mekanismen (online/offline-lyssnaren och role=status-regionen) är oförändrad ur OfflineIndicator; bara renderingen byter. Helbreddsraden rivs ur skalet.

Täcker användarberättelser: 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Offline-beskedet renderas av Notis-primitiven och är identisk med facit tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json ytan uppdateringsnotis i form (samma kort, samma placering), med innehållet 'Du är offline' + en mening och utan knapp
- [ ] #2 Helbreddsraden i skalet är borta; layoutförskjutningen vid offline-övergång är 0 mätt med layout-shift i testmiljön
- [ ] #3 Beskedet försvinner när anslutningen är tillbaka; region role=status alltid monterad, aria-live=polite, fokus flyttas aldrig
- [ ] #4 Offline + ny version samtidigt staplas i regionen (offline överst) och båda är helt synliga vid 390 px ovanför TabBar-pillen — skärmdump bilagd
- [ ] #5 Befintliga e2e-/webbläsarbeteende-tester som läser offline-läget är uppdaterade i samma commit och gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [ ] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [ ] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [ ] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->
