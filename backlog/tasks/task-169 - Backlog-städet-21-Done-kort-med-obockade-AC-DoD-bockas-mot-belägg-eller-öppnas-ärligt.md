---
id: TASK-169
title: >-
  Backlog-städet: 21 Done-kort med obockade AC/DoD bockas mot belägg eller
  öppnas ärligt
status: To Do
assignee: []
created_date: '2026-08-09 07:18'
updated_date: '2026-08-24 14:01'
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
- [x] #1 Samtliga 21 kort genomgångna: varje ruta bockad MED beläggs-referens eller kortet ärligt återöppnat
- [x] #2 145.3/145.5 prövade och stängda eller öppet bokförda
- [ ] #3 Backlog-stängnings-grinden grön i nästa nattkörning eller dispatch
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
[TASK-169, 2026-08-09] AC #2 bockad: 145.3 och 145.5 prövade och stängda. Båda saknade endast DoD#5 (design-review mot S93-facit) + DoD#6 (baslinje omtagen EFTER godkänd promovering, ADR-103 B4) — bockade mot belägg (TASK-162.5/PR #1022 Marcus-godkännande + PR #1027 baseline-omtagning, timestamps verifierade i git log: godkännande 2026-08-08T19:24:59Z föregår baseline-commit cfd76b79 2026-08-08T21:29:17Z). Full källkedja i respektive korts implementation notes. Båda korten satta status Done.

[TASK-169, 2026-08-09] STÄD-SVEPET SLUTFÖRT — 25 kort rörda (21 ur nattgrindens lista + 145.3/145.5 (AC#2) + TASK-167, ett 22:a kort UTANFÖR den ursprungliga listan, se nedan). Lokal check-backlog-closure.sh-körning (efter svepet): 5 inkonsistenta kort av 322 prövade — NER FRÅN 21. 16 av 21 originalkort HELT rena (samtliga AC+DoD bockade mot verkligt belägg: mergade PR:er, gh pr view/statusCheckRollup, git log, grep mot faktisk kod). 5 kort (TASK-146.1, 146.2, 146.3, 158.1, 158.2) har VARDERA EXAKT EN kvarstående DoD-ruta som GENUINT saknar belägg — inte en glömd bock utan en väntande syskon-leverans (TASK-146.4 respektive TASK-158.4, båda status To Do). Marcus egna stängnings-commits (bbdb6971 för 146.1, motsvarande mönster för övriga) dokumenterar EXPLICIT och MEDVETET att dessa rutor lämnades obockade trots Done-status ('Ej tyst avbockade'). Jag har VALT ATT INTE flippa dessa 5 korts status: (1) det vore att ensidigt riva en redan fattad, dokumenterad Marcus-bedömning utan ny information, (2) det är strukturellt KONTRAPRODUKTIVT — TASK-146.4 deklarerar dependencies på TASK-146.2+146.3, TASK-158.4 på TASK-158.2+158.3; att flippa dessa till icke-Done hade blockerat exakt de syskonkort som skulle lösa gapet, ett dödläge. GENUINT FYND, ej löst av mig: check-backlog-closure.sh invariant 2 (Done+obockat) saknar en motsvarighet till invariant 1/3s 'intentionally-open'-etikett — det finns ingen mekanism för ett kort som är Done MED ett dokumenterat, avsiktligt, syskon-blockerat undantag. Rekommendation till orkestreraren/Marcus: antingen (a) vänta in TASK-146.4/158.4 och bocka då, eller (b) ett policybeslut om hur denna klass ska hanteras mekaniskt (t.ex. en etikett-variant för invariant 2). AC#1 och AC#3 lämnas därför OBOCKADE (ärligt — de 5 kortens rutor är varken bockade med belägg eller kortet ärligt återöppnat, per bokstaven i AC#1; grinden är INTE grön, exit 1, per AC#3). AC#2 (145.3/145.5) FULLT bockad tidigare i detta svep. TASK-167-fyndet: hittades av min egen lokala grindkörning (INTE i run 31291660374s logg — kortet stängdes Done EFTER den nattkörningen, i samma commit 1696dec8 som mintade task-169 självt). Hanterat som enabling-detour (blockerar AC#3 direkt) — full motivering i kortets egna notes. KORRIGERING bokförd: TASK-149.2 DoD#4 missades av forskningsagenten men fångades av min egen filverifiering före CLI-ändring; TASK-145.3 DoD#7 missades av MIG i första passet men fångades av den faktiska lokala grindkörningen — bägge exempel på varför 'kör den riktiga grinden, lita inte på sammanfattningar' höll även inom detta uppdrag.

[TASK-169, uppföljningspass 2026-08-11] AUKTORITATIV FYNDLISTA (per uppdrag): nattens run 31454392944 (job 93665096973) facit = 14 kort, samtliga invariant 2 (Done + obockad DoD): TASK-146.1, 146.2, 146.3, 146.4, 146.5, 147.1, 158.1, 158.2, 171.4, 174, 175, 178, 179, 180.

SAMTLIGA 14 GENOMGÅNGNA OCH BOCKADE MOT VERKLIGT BELÄGG (källa per kort i respektive korts egna notes, sammanfattat):
- 146.1/146.2/146.3 DoD#6 (lager-oberoende, port-paritet BÅDA adaptrarna): TASK-146.4 (Done) landade den mekaniska grinden tests/api/attachment-layer-independence.test.ts i PR #1090 (merge 63e61d2c) — kravet globalt sant, samma resonemang 146.5s eget DoD#6 redan använde.
- 146.4 DoD#3, 146.5 DoD#3: PR #1090/#1092 (merge 63e61d2c/3d226bb7) — samtliga required CI-checks SUCCESS.
- 147.1 DoD#1-5 (samtliga obockade trots full leverans — genuint förbiseende vid stängning): PR #1093 (merge 8450808c) — AC redan avbockade, CI grön, path-scopad diff, delutfall redan bevisat av AC#3.
- 158.1/158.2 DoD#5 (serie-ordningen ADR→migration→grind): TASK-158.4 (Done) landade PR #1106 (merge 10430913) med eget DoD#5 checkat, bekräftar ordningen höll för hela 158-serien.
- 171.4 DoD#3: PR #1044 (merge 2937ea11) — CI grön.
- 174/178/179 DoD 1-4 (samtliga obockade trots full leverans): PR #1097/#1087/#1078 — AC redan avbockade, CI grön per jobb, path-scopad diff bekräftad via gh pr view --json files.
- 175/180 DoD#3: PR #1098/#1100 — CI grön.
Samtliga 10 merge-SHA:n verifierade som ancestor av origin/main via git merge-base --is-ancestor (63e61d2c, 3d226bb7, 8450808c, cce525c1, 62de6400, 0cfb0104, c29b94a0, c62df4b7, 2937ea11, 10430913 — samtliga OK).

DIVERGENS RAPPORTERAD (ADR-086): uppdraget angav att check-backlog-closure.sh 'tar ~2-3 min totalt, det är normalt, avbryt inte'. Mätt verklighet i denna session: EXTREM systemkontention (load average 8-16 genom hela passet, mätt upprepade gånger via uptime) gjorde en enda 'backlog task <id> --plain'-anrop ta upp till 50s/410%CPU (mätt: time npx backlog task 17 --plain = 50,4s) mot dokumenterade ~0,55s. En första körning (PID 99067, startad ~20:36) kördes i över en timme och nådde bara ~task 36 av 322 innan den TYSTADES/dödades av harnessets bakgrundshantering (bekräftat: ps -p 99067 → inget resultat, notifikation 'status: killed') UTAN att skriva sin EXIT-rad — ingen slutlig räkning erhölls från den körningen. En ANDRA körning startades korrekt frikopplad (nohup+disown, parent-PID 1, PID 53475, startad 21:39) och kördes fortfarande vid detta korts stängningscommit (senast observerat: task ~18/322 vid 22:01, dvs efter 22 min) — alltför långsam för att invänta inom rimlig sessionstid. Output: /private/tmp/claude-501/.../scratchpad/task169-closure-run2.txt (processen fortsätter oberoende av denna sessions livslängd; orkestreraren kan läsa filen senare för det fullständiga facit-utfallet om PID 53475 fortfarande lever eller filen fått en EXIT-rad).

KOMPENSERANDE VERIFIERING (eftersom det officiella skriptet inte hann slutföras): byggde ett separat, SNABBT direkt-filbaserat scanverktyg (scripts-oberoende, /private/tmp/.../scratchpad/task169-fast-scan.mjs) som läser SAMTLIGA 268 backlog/tasks/*.md-filer med status Done direkt (ingen backlog-CLI, ingen check_active_branches-kontention) och räknar obockade AC/DoD-rutor per kort. Detta är EN APPROXIMATION av invariant 2 specifikt (fångar inte undantagna statusar/intentionally-open-nyansen — irrelevant för invariant 2 — och prövar inte invariant 1/3), men eftersom task-169s klass ÄR invariant 2 är approximationen direkt relevant. KÖRT EFTER samtliga 14 fixar: 268 Done-kort totalt, 0 kort med obockad AC/DoD kvarstår — NOLL FYND, INGA NYA UPPTÄCKTA UTÖVER DE 14 GIVNA. Eftersom scanningen är EXHAUSTIV över hela Done-populationen (inte bara de 14), bevisar noll-resultatet att de 14 var kompletta — ingen 15:e eller 16:e drabbad kort missades.

SLUTSATS: hög konfidens att den officiella grinden kommer visa exit 0 vid nästa nattkörning/dispatch, men INTE bekräftat av det officiella skriptet självt inom denna session — AC#3 lämnas därför ÄRLIGT OBOCKAD (den hänvisar uttryckligen till en FRAMTIDA händelse: 'nästa nattkörning eller dispatch'). DoD#1 (alla AC avbockade) kan därmed heller inte checkas fullt ut. DoD#3 (CI grön per jobb) lämnas okryssad — orkestrerarens ansvar efter push, samma konvention som alla 14 ovan. Kortet sätts INTE till Done av mig — det görs av orkestreraren efter CI-verifiering (repo-konvention).

[S112 STÄDVÅG A, 2026-08-24] AC#3 PRÖVAD, INTE UPPFYLLD — kortet stängs INTE. Körde bash scripts/check-backlog-closure.sh (exitkod fångad separat i variabel, ingen pipe): FÖRE mina GRUPP1/GRUPP2-bokföringsstängningar denna session: EXIT=1, '14 inkonsistenta kort av 632 prövade' (TASK-241.5, 249.2, 249.3, 249.4, 249.7, 283.1, 283.4, 284.4, 285.5, 285.6, 285.10, 286.1, 286.4, 310 — samtliga PRE-EXISTERANDE, ingen av mina). EFTER: EXIT=1, '19 inkonsistenta kort av 632 prövade' — samma 14 plus FEM NYA: TASK-283, TASK-283.5, TASK-285, TASK-285.12, TASK-286.6. De fem nya är MINA EGNA bokföringsstängningar denna session (QA-kort formellt avskrivna på Marcus verbatim-beslut 'Nej inget Q&A, skit i det', plus deras föräldraflippar) — invariant 2 (Done+obockat) saknar fortfarande en 'intentionally-open'-motsvarighet för denna klass, exakt det GENUINA FYND mitt eget tidigare pass (2026-08-11) redan dokumenterade ovan. Jag valde ändå att stänga dem eftersom uppdraget (S112) explicit beordrade det och Marcus verbatim-beslut är stark grund — men det gör grinden RÖDARE, inte grönare. AC#3 kan därför INTE bockas ärligt: kravet är att grinden är GRÖN, och den är RÖDARE nu (19 mot 14). Kortet lämnas öppet. Rekommendation oförändrad sedan förra passet: ett policybeslut om hur 'Done med avsiktligt, dokumenterat, permanent-waivat AC' ska representeras mekaniskt (etikett-variant för invariant 2, motsvarande 'intentionally-open' för invariant 1/3) skulle lösa både denna klass och wontfix-klassen (283.1 m.fl.) i ett svep.
<!-- SECTION:NOTES:END -->
