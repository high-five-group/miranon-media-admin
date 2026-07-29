---
id: TASK-80
title: >-
  Fynd: videoinspelningen är mätbar egenlast som förvärrar just den mättnad den
  ska diagnostisera
status: To Do
assignee: []
created_date: '2026-07-29 00:56'
labels:
  - ready-for-agent
dependencies: []
ordinal: 160000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
playwright.config.ts sätter video: 'retain-on-failure' på två ställen (rad 341 och rad 374). Playwright startar då EN ffmpeg-process per test, oavsett om testet sedan faller eller inte — 'retain' betyder att inspelningen KASTAS vid grönt, inte att den aldrig gjordes.

Mätt av TASK-74:s agent 2026-07-29: åtta ffmpeg-processer låg på 39-47 % CPU samtidigt, alltså ungefär TRE av 16 kärnor, för artefakter som kastades i 153 av 153 gröna fall.

### DET ÄR INTE BARA SLÖSERI — DET ÄR MISSTÄNKT SOM BIDRAGANDE ORSAK

TASK-74:s mekanism B3 är 'test-budgeten vid mättnad': tester faller när maskinen är mättad, och agentens skarpaste arm-A-utfall kom vid loadavg 125. Videoinspelningen är egenlast som pågår under HELA sviten och därmed höjer just den mättnad som fäller testerna.

Vi betalar alltså CPU för diagnostik av ett fel som betalningen bidrar till att orsaka. Det gör posten till en kandidat-FIX för flakigheten, inte enbart en hygien-fråga.

### VAD SOM SKA VÄGAS — INGEN VALD

(a) video: 'on-first-retry'. Playwright spelar då in enbart vid omkörning, alltså exakt när något föll och diagnostik behövs. Noll egenlast i normalfallet. Kostnaden: den FÖRSTA fällningen har ingen video, bara omkörningen — och för en flake som inte reproducerar vid retry förlorar vi bilden av den enda gången den föll.
(b) Behåll retain-on-failure men sänk workers. Löser mättnaden men sänker genomströmningen, alltså fel växel.
(c) Behåll som är, dokumentera kostnaden. Kräver att B3 kan stängas på annat sätt.

Alternativ (a) är rekommendationen men den ska PRÖVAS mot vad vi faktiskt förlorar, inte antas. Den avgörande frågan är hur ofta en klass-B-flake reproducerar vid retry: gör den inte det, är (a) ett byte av diagnostik mot hastighet och inte en ren vinst.

Notera att self-test-grenen redan bär video: 'off' (rad 374, isHermetikSjalvtest) — precedensen för villkorad inspelning finns alltså i filen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CPU-lasten från inspelningen mätt före och efter ändringen under identisk workerlast — båda talen redovisade, loadavg angiven
- [ ] #2 Reproducerar en känd klass-B-flake vid retry eller inte — mätt, inte antaget; svaret avgör om (a) är en ren vinst eller ett byte
- [ ] #3 Valet motiverat mot alla tre formerna; de förkastade bär sina skäl
- [ ] #4 Diagnostik-förlusten explicit redovisad: vilken artefakt som INTE längre finns vid en första fällning, och varför det är acceptabelt
- [ ] #5 Fällningsraten mätt före och efter — om egenlasten bidrog till B3 ska den sjunka; om den inte gör det är det ett resultat som ska rapporteras, inte tystas
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
