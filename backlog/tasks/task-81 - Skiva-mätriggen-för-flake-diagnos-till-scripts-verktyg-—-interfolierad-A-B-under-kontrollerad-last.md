---
id: TASK-81
title: >-
  Skiva: mätriggen för flake-diagnos till scripts/-verktyg — interfolierad A/B
  under kontrollerad last
status: To Do
assignee: []
created_date: '2026-07-29 00:57'
updated_date: '2026-07-29 08:43'
labels:
  - ready-for-agent
dependencies: []
ordinal: 161000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-74:s agent byggde en mätrigg för att skilja äkta flakighet från maskinlast: interfolierad A/B (5+5 körningar, armarna varvade i stället för blockade), --workers=8 --retries=0, och loadavg loggad per körning. Riggen är ~150 rader och lämnades AVSIKTLIGT ur kortets PR, eftersom den hade dominerat en diff vars fix är två filer.

Beslutet 2026-07-29: den blir ett scripts/-verktyg, inte protokoll i ett kort.

### VARFÖR VERKTYG OCH INTE PROTOKOLL

Precedenten finns: scripts/ci-metrics.mjs blev ett verktyg av samma skäl — en mätning som ska upprepas av flera aktörer får inte bo i prosa.

Behovet är konkret och redan känt, inte hypotetiskt:
- TASK-79 (hem:1097) kräver fällningsrat före/efter under kontrollerad last, med loadavg angiven
- TASK-80 (videoinspelningen) kräver samma sak, plus CPU-mätning
- TASK-77 och TASK-78 rör båda mätningar där maskinlast kan förorena utfallet

Fyra kort behöver alltså riggen inom kort. Utan verktyg bygger var och en sin egen variant, och då är talen inte jämförbara mellan korten — vilket är precis det fel riggen finns för att undvika.

### VAD RIGGEN MÅSTE BEVARA FRÅN ORIGINALET

1. INTERFOLIERING, inte blockning. Kör A,B,A,B,… inte AAAAA,BBBBB. Blockade armar mäter tidsfönstret lika mycket som ändringen — det var så TASK-74:s agent kunde upptäcka att 12 av 13 fällningar kom ur EN körning vid loadavg 125.
2. LOADAVG per körning, loggad. Utan den kan ett utfall inte deflateras i efterhand, och deflateringen var det som gjorde TASK-74:s rapport ärlig.
3. --retries=0. Retries döljer flaken inuti ett grönt jobb (L-klassen från TASK-64).
4. RÅDATA sparad, inte bara sammanfattning. TASK-74:s slutsats 'skillnaden ligger i formen, inte i antalet' gick bara att dra för att de enskilda utfallen fanns kvar.

### AVGRÄNSNING

Verktyget MÄTER, det fixar inte och det dömer inte. Det ska inte innehålla trösklar för vad som är 'acceptabel' flakighet — den bedömningen hör till korten som använder det.

Riggen finns i TASK-74:s agents arbete; hämta den därifrån i stället för att skriva om från minnet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Verktyget kör interfolierad A/B med godtyckligt antal varv, och blockad körning är INTE möjlig — formen är kodad, inte en instruktion att följa
- [x] #2 loadavg loggas per körning och finns i rådatan; en körning utan loadavg-värde rapporteras som OKÄND, aldrig som noll
- [x] #3 Rådata sparas per testresultat, inte bara aggregat — en efterhandsdeflatering av typen TASK-74 gjorde ska vara möjlig utan omkörning
- [ ] #4 Verkligt bruk bevisat: verktyget kört skarpt på ETT av TASK-79/80 och talen redovisade i det kortets PR
- [x] #5 Ingen tröskel för 'acceptabel flakighet' kodad i verktyget — bedömningen hör till korten som använder det, och det ska stå i filhuvudet
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
