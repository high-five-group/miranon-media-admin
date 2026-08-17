---
id: TASK-225.5
title: 'QA: Marcus granskar promoverade aktivitetshistoriken mot facit + stämplar'
status: Done
assignee: []
created_date: '2026-08-15 09:24'
updated_date: '2026-08-17 08:17'
labels:
  - ready-for-human
dependencies:
  - TASK-225.1
  - TASK-225.2
  - TASK-225.3
  - TASK-225.4
parent_task_id: TASK-225
ordinal: 417000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus): (1) Öppna skarpa /mer/aktivitetshistorik UTAN variant-parameter i dev-servern eller staging. (2) Jämför mot facit-bilderna i tasks/sessions/bilagor/s106-aktivitetslogg/ — sidkrom, filterrad (toggle → dropdowns → datum), statusrad, dagsgrupper, radanatomi. (3) Hovra rader — understrykning, ingen bakgrundstint. (4) Välj en specifik dag i kalendern — listan filtreras, tidsperiod-togglen släpper; välj en toggle-flik — datumet rensas. (5) Klicka en eventrad → eventsidan; en flagg-/anteckningsrad → personsidan. (6) Kontrollera att hem-spalten och historiken beskriver samma händelse med samma ord. (7) Stämpla: npm run facit:godkann via !-kanalen. EFTER stämpeln utför agenten rivningen av växel + prototypfil + snapshot-rigg (spärren släpper — rivningen är ingen egen kö-post, per PRD:ns implementationsbeslut).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skarpa ytan granskad mot facit-bilderna (desktop + mobil) och befunnen identisk — eller avvikelser bokförda som nya fynd-kort
- [x] #2 godkand-stämpeln satt av Marcus via facit-godkännande-kommandot genom !-kanalen (ADR-104 — kan inte sättas av agent)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 check-facit.sh grön genom hela kedjan — rivning omöjlig medan godkand är null
- [x] #6 Marcus godkand-stämpel via facit-godkännande FÖRE all rivning av prototyp-substrat
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Marcus genomförde granskningen i dev-servern mot facit-bilderna 2026-08-15 och stämplade via !-kanalen: npm run facit:godkann -- --pass s106-aktivitetslogg --citat 'Godkänd mot facit 2026-08-15' (godkand av marcus, sha 871ae4f4). Rivningen verkställd EFTER stämpeln (PR #1335); manifestets kallor ompekade av Marcus sed-rad (manifestet agent-fruset).
<!-- SECTION:NOTES:END -->
