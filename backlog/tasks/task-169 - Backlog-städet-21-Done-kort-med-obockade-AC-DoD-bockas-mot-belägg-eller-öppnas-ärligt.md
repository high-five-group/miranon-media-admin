---
id: TASK-169
title: >-
  Backlog-städet: 21 Done-kort med obockade AC/DoD bockas mot belägg eller
  öppnas ärligt
status: To Do
assignee: []
created_date: '2026-08-09 07:18'
updated_date: '2026-08-09 08:28'
labels:
  - ready-for-agent
dependencies: []
ordinal: 312000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Nattgrindens stående fynd (senast run 31291660374, 2026-08-09: 21 kort — 145.1, 145.2, 146.1–146.3, 148.1–148.4, 149.1 m.fl., fullständig lista i körningens logg). Klassen: kort som flippats Done i tidigare sessioner utan att AC-/DoD-rutorna bockades via CLI. Uppgiften per kort: läs kortets AC/DoD, pröva varje ruta mot faktiskt belägg (mergad PR, CI-körning, bokförd verifiering i sessionsdok/BUILD-LOG) — bocka de som ÄR betalda med beläggs-referens i notes; en ruta utan belägg lämnas obockad och kortet flippas ÄRLIGT tillbaka till To Do/In Progress med notering (aldrig bocka på antagande — grinden finns för att skydda Done-betydelsen). Relaterat men EJ samma: 145.3/145.5 står ej Done och väntar DoD #5-bedömning (design-review — Marcus 162.5-QA + baslinje-välsignelsen är trolig täckning, prövas) + DoD #6 (baslinjen NU omtagen: #1027) — ta dem i samma svep. Nattärendet #1028 stängt med detta kort som ägare; grinden går grön när svepet är klart.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Samtliga 21 kort genomgångna: varje ruta bockad MED beläggs-referens eller kortet ärligt återöppnat
- [x] #2 145.3/145.5 prövade och stängda eller öppet bokförda
- [ ] #3 Backlog-stängnings-grinden grön i nästa nattkörning eller dispatch
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
[TASK-169, 2026-08-09] AC #2 bockad: 145.3 och 145.5 prövade och stängda. Båda saknade endast DoD#5 (design-review mot S93-facit) + DoD#6 (baslinje omtagen EFTER godkänd promovering, ADR-103 B4) — bockade mot belägg (TASK-162.5/PR #1022 Marcus-godkännande + PR #1027 baseline-omtagning, timestamps verifierade i git log: godkännande 2026-08-08T19:24:59Z föregår baseline-commit cfd76b79 2026-08-08T21:29:17Z). Full källkedja i respektive korts implementation notes. Båda korten satta status Done.

[TASK-169, 2026-08-09] STÄD-SVEPET SLUTFÖRT — 25 kort rörda (21 ur nattgrindens lista + 145.3/145.5 (AC#2) + TASK-167, ett 22:a kort UTANFÖR den ursprungliga listan, se nedan). Lokal check-backlog-closure.sh-körning (efter svepet): 5 inkonsistenta kort av 322 prövade — NER FRÅN 21. 16 av 21 originalkort HELT rena (samtliga AC+DoD bockade mot verkligt belägg: mergade PR:er, gh pr view/statusCheckRollup, git log, grep mot faktisk kod). 5 kort (TASK-146.1, 146.2, 146.3, 158.1, 158.2) har VARDERA EXAKT EN kvarstående DoD-ruta som GENUINT saknar belägg — inte en glömd bock utan en väntande syskon-leverans (TASK-146.4 respektive TASK-158.4, båda status To Do). Marcus egna stängnings-commits (bbdb6971 för 146.1, motsvarande mönster för övriga) dokumenterar EXPLICIT och MEDVETET att dessa rutor lämnades obockade trots Done-status ('Ej tyst avbockade'). Jag har VALT ATT INTE flippa dessa 5 korts status: (1) det vore att ensidigt riva en redan fattad, dokumenterad Marcus-bedömning utan ny information, (2) det är strukturellt KONTRAPRODUKTIVT — TASK-146.4 deklarerar dependencies på TASK-146.2+146.3, TASK-158.4 på TASK-158.2+158.3; att flippa dessa till icke-Done hade blockerat exakt de syskonkort som skulle lösa gapet, ett dödläge. GENUINT FYND, ej löst av mig: check-backlog-closure.sh invariant 2 (Done+obockat) saknar en motsvarighet till invariant 1/3s 'intentionally-open'-etikett — det finns ingen mekanism för ett kort som är Done MED ett dokumenterat, avsiktligt, syskon-blockerat undantag. Rekommendation till orkestreraren/Marcus: antingen (a) vänta in TASK-146.4/158.4 och bocka då, eller (b) ett policybeslut om hur denna klass ska hanteras mekaniskt (t.ex. en etikett-variant för invariant 2). AC#1 och AC#3 lämnas därför OBOCKADE (ärligt — de 5 kortens rutor är varken bockade med belägg eller kortet ärligt återöppnat, per bokstaven i AC#1; grinden är INTE grön, exit 1, per AC#3). AC#2 (145.3/145.5) FULLT bockad tidigare i detta svep. TASK-167-fyndet: hittades av min egen lokala grindkörning (INTE i run 31291660374s logg — kortet stängdes Done EFTER den nattkörningen, i samma commit 1696dec8 som mintade task-169 självt). Hanterat som enabling-detour (blockerar AC#3 direkt) — full motivering i kortets egna notes. KORRIGERING bokförd: TASK-149.2 DoD#4 missades av forskningsagenten men fångades av min egen filverifiering före CLI-ändring; TASK-145.3 DoD#7 missades av MIG i första passet men fångades av den faktiska lokala grindkörningen — bägge exempel på varför 'kör den riktiga grinden, lita inte på sammanfattningar' höll även inom detta uppdrag.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
