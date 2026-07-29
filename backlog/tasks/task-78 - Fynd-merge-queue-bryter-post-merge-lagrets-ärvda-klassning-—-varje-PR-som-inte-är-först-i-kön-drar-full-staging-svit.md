---
id: TASK-78
title: >-
  Fynd: merge queue bryter post-merge-lagrets ärvda klassning — varje PR som
  inte är först i kön drar full staging-svit I POST-MERGE
status: To Do
assignee: []
created_date: '2026-07-29 00:30'
updated_date: '2026-07-29 00:32'
labels:
  - ready-for-agent
dependencies: []
ordinal: 158000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-73 gav post-merge-lagret ärvd klassning: en docs-only landning ska INTE dra staging. TASK-70.1 (merge queue) bröt den samma dag, för PR:er som inte är först i sin kögrupp.

### MEKANISMEN — MÄTT, INTE ANTAGEN

scripts/classify-post-merge.sh kräver TRÄD-IDENTITET mellan merge-commiten och PR-headen (rad 189: 'träd-avvikelse … landad diff är inte PR:ens diff') och letar efter en grön körning med event=pull_request på PR-headen (rad 198, 208).

Merge queue bygger post N ovanpå posterna före den. Merge-commitens träd bär därmed MER än PR:ens egen diff så snart PR:en inte är först i kön.

Mätt 2026-07-29 på kvällens två första kö-landningar:

  d9f095b (#404, FÖRST i kön)   merge-träd 373455a == head-träd 373455a  -> klassning ärvd, Verifierande svit SKIPPED
  934188e (#405, ANDRA i kön)   merge-träd 89000ee != head-träd ce04838  -> fail-closed, FULL SVIT inkl. Staging

#405 rörde EN backlog-kortfil. Den drog ändå hela staging-sviten i post-merge.

### VARFÖR DET INTE ÄR OFARLIGT

Fail-closed betyder att utfallet är SÄKERT — aldrig otestad kod. Men:

1. TASK-73:s vinst (2 -> 0 mutex-takers per docs-landning) går förlorad så fort två PR:er köar ihop, vilket är precis vad kön är till för.
2. Fler post-merge-körningar med staging = fler purge-jobb = fler tillfällen för TASK-76:s race. De två fynden förstärker varandra.
3. Effekten är osynlig i normalfallet: en ensam PR är alltid först i kön och klassas rätt. Felet visar sig bara under parallellitet — alltså exakt när A7:s målbild uppnås.

### AVGRÄNSNING OCH VÄGVAL

Detta är INTE ett fel i TASK-70.1 eller TASK-73; det är en interaktion mellan två korrekta skivor som landade samma dag. Ingen av dem kunde se den ensam.

Former att väga, ingen vald:
(a) Klassa på merge_group-körningen i stället för PR-körningen — kön kör ju ci.yml med full klassning på det kombinerade trädet, så beslutet finns redan, på rätt träd. Kräver att skriptet accepterar event=merge_group som källa.
(b) Klassa om från grunden i post-merge mot merge-commitens egen diff mot sin första förälder, utan att ärva alls.
(c) Acceptera kostnaden och dokumentera den.

Form (a) ser starkast ut vid första anblick — merge_group-körningens klassning gäller exakt det träd som landar — men ska prövas mot att kö-körningen kan ha skippats av dedup, och mot vad som händer när en kögrupp innehåller både docs och kod. Rekommendationen ska motiveras mot alla tre och den förkastade bära sitt skäl.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En docs-only PR som landar som post 2 eller senare i en kögrupp drar INTE staging i post-merge — bevisat med två run-ID från samma kögrupp, positionerna redovisade
- [ ] #2 En kod-PR i samma läge drar FORTFARANDE full svit — kontrollen är fixad, inte borttagen; run-ID redovisat
- [ ] #3 En kögrupp som blandar docs och kod klassas som KOD — det säkra utfallet; bevisat skarpt eller, om det inte går att framkalla, härlett ur källan med radhänvisning
- [ ] #4 Valet mellan formerna (a)/(b)/(c) motiverat i PR:n; de förkastade bär sina skäl
- [ ] #5 Fail-closed-egenskapen bevarad: varje API-avvikelse eller oväntad form ger fortfarande full svit — negativt self-test redovisat
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PRECISERING 2026-07-29, efter Marcus fångst. Den första formuleringen sade att #405 'drog full svit' utan att ange VAR, vilket läser som om PR-grinden påverkades. Den gör den inte.

TRE YTOR, OCH BARA DEN TREDJE ÄR DRABBAD — mätt på #405:

  PR-grinden    run 30410841005  event=pull_request  Test suite SKIPPED   ✅ korrekt
  Merge queue   run 30410912068  event=merge_group   Test suite SKIPPED   ✅ korrekt
  Post-merge    run 30410980946  event=push          Staging (API + E2E) SUCCESS  ← fyndet

VAD SOM ALLTSÅ INTE PÅVERKAS: PR-grindens hastighet är orörd. Klassningen fungerar på både pull_request- och merge_group-ytan; en docs-PR får sitt snabba svar precis som förut, och kön klassar rätt. Hela TASK-70.3:s vinst står kvar.

VAD SOM PÅVERKAS: enbart efterkontrollen på main. Den blir dyrare än den behöver vara för PR:er som inte är först i kön, och varje sådan extra staging-körning är ett nytt tillfälle för TASK-76:s purge-race. Det är kostnaden — inte en trasig grind.

Distinktionen är inte kosmetisk: en läsare som tror att PR-grinden är trasig prioriterar kortet som akut och letar i fel fil.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
