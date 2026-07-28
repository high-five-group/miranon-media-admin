---
id: TASK-74
title: >-
  Fynd: klass B-flakigheten är bredare än TASK-64 antog — sju tester, minst två
  mekanismer, ingen delar klass A:s kodform
status: To Do
assignee: []
created_date: '2026-07-28 20:33'
labels:
  - ready-for-agent
dependencies: []
ordinal: 154000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-64 lagade klass A: tre rader med mönstret "icke-auto-väntande query följd av icke-retrying assertion", mätt från 3/8 fällningar till 0/8. Klass B är en ANNAN mekanism och står kvar — den föll inte med klass A:s fix, och den är bredare än TASK-64:s beskrivning påstod.

### VAD SOM ÄR MÄTT, INTE ANTAGET

TASK-64:s efter-serie (n=8, workers=8, retries=0, körd 2026-07-28 av bygg-agenten):

  person-detail:137        2/8 före, 2/8 efter — OFÖRÄNDRAD av klass A:s fix
  hem:423                  föll inte alls i 16 körningar
  mer-intresserade:95      föll inte alls i 16 körningar

Efter-serien exponerade dessutom FYRA tester som inte står i TASK-64 alls:

  mer-segment-send:110
  persons-list:95
  event-narvaro:193       (axe)
  event-anteckningar:333  (axe)

Klass B omfattar därmed minst sju tester, inte de tre TASK-64 listade.

### VARNING FRÅN MÄTNINGEN — LÄS FÖRE DU JÄMFÖR TAL

Bygg-agenten rapporterade att svitens körtid drev 107 -> 173 s genom efter-serien. Klass B-raten i den serien kan alltså vara uppblåst av stigande maskinlast snarare än av ett verkligt mönster. Talen ovan får INTE jämföras rakt av mot en ny mätning som körs på en vilande maskin. Första steget i detta kort är att etablera en mätform där lasten är kontrollerad, annars mäts maskinen och inte testerna.

### VAD SOM SKILJER KLASS B FRÅN KLASS A

Klass A var en identifierbar kodform som gick att grepa fram: allTextContents(), getAttribute() och count() följda av assertions som inte retryar. Klass B-testerna bär INTE det mönstret — sökningen över hela tests/acceptance/ gav bara klass A:s förekomster.

Gemensamt för de ursprungliga tre är att de är fokus-tester (fokus -> <h1>), vilket pekar mot assertion-timeout under last snarare än mot en ögonblicksbild-query. Två av de fyra nya är axe-körningar, vilket är en tredje form igen. Klass B kan därför vara flera mekanismer som delar symptom, och det är kortets första fråga att avgöra.

### AVGRÄNSNING MOT T106 — ÄRVD FRÅN TASK-64, GÄLLER FORTFARANDE

T106 (hermetik-självtestets race) kräver självtestläget: onUnhandledRequest-kastet mot toBeFocused-timeouten. Den mekanismen finns inte i normalläge. Orsaken är alltså inte gemensam — men symptomklassen (fokus-assertion med fast timeout under last) delas, och trådarna bör läsas ihop. Slå INTE ihop dem utan att först pröva om orsaken är gemensam.

### VARFÖR KORTET FINNS I STÄLLET FÖR ATT STÄNGAS IN I TASK-64

TASK-64 stängdes för klass A med mätning som håller. Att låta klass B följa med in i den stängningen hade dolt fyra tester som mätningen just avtäckt, bakom ett kort som säger sig vara klart. Registrera, förkasta aldrig tyst — och stäng aldrig något som inte är löst.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Mätform med KONTROLLERAD last etablerad först — körtidsdriften 107 till 173 s i TASK-64:s efter-serie får inte upprepas som mätfel; formen redovisad
- [ ] #2 Baslinje mätt per test över minst 8 körningar med retries av: vilka av de sju som faktiskt faller och med vilken rat
- [ ] #3 Antalet mekanismer avgjort med belägg — är fokus-testerna, axe-körningarna och de övriga samma orsak eller olika? Slutsatsen får inte vara en gissning
- [ ] #4 T106-avgränsningen omprövad mot de nya datapunkterna: gemensam orsak eller inte, med belägg
- [ ] #5 Åtgärd bevisad med före/efter-mätning i samma kontrollerade form, inte med en grön CI-körning
- [ ] #6 Kvarvarande rat redovisad ärligt — om något inte gick att laga står det, med vad som skulle krävas
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
