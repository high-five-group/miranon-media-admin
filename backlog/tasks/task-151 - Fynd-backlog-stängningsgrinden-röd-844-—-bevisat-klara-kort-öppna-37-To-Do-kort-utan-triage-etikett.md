---
id: TASK-151
title: >-
  Fynd: backlog-stängningsgrinden röd (#844) — bevisat klara kort öppna + 37 To
  Do-kort utan triage-etikett
status: To Do
assignee: []
created_date: '2026-08-07 10:50'
updated_date: '2026-08-07 11:30'
labels:
  - ready-for-agent
dependencies: []
ordinal: 263000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Symptom: nattgrinden Backlog-stängning fäller (#844, 2026-08-07): kort vars arbete är bevisat klart står öppna bortom karensen; separat mätt: 37 av 79 To Do-kort (47 %) saknar ready-for-*-etikett och är därmed strukturellt oplockbara för do-work-mekanismen — inklusive fyra HIGH-prioriterade produktionsbuggfynd från 2026-07-21/22. Förväntat: backlog där status speglar bevisläge och varje To Do-kort är plockbart eller medvetet HITL-märkt. Funnet i S99 uppdrag 3-svepet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: #844:s drift-lista hämtad ur nattkörningen; varje utpekat kort verifierat mot faktiskt bevisläge (commit/PR) före stängning
- [x] #2 Bevisat klara kort stängda via backlog-CLI med final-summary + belägg; tveksamma fall listade i slutrapporten i stället för gissad stängning
- [x] #3 Etikett-luckan stängd: alla To Do-kort utan ready-for-*-etikett triagerade och etiketterade (ready-for-agent när specen räcker, annars ready-for-human) — särskilt HIGH-buggarna TASK-24/25/27/28
- [x] #4 #844 kommenterat med åtgärden; PR armerad, per-jobb-grön
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS (ADR-086): #844:s body pekade på nattkörningen (run 31145756912) utan att lista kort — hämtade den FAKTISKA listan ur gh run view --log, filtrerat på jobbet 'Backlog-stängning (natt-grind)'. Enda utpekade kortet: TASK-136 (ej flera, som uppdragets '37 av 79'-formulering kunde antyda en bredare drift-lista). TASK-136 verifierat: PR #796 MERGED (mergeCommit 1d4700b4, 2026-08-05T15:43:04Z), commit 21759afc ancestor av origin/main, SECURITY-SPEC.md rad 469 läst live == admin.miranon.dev, CI grön per jobb på PR:en. Stängt.

OPPORTUNISTISKT FYND under Del 2 (etikett-triagen): TASK-142 hade IDENTISKT symptom (PR #762 MERGED 2026-08-05T08:03:53Z, samtliga 8 AC verifierade mot faktisk källkod i scripts/verify-ci-parity.mjs, CI grön) men stod ÄVEN den kvar To Do — med AC-rutor OBOCKADE. Detta är en STRUKTURELLT OSYNLIG variant av #844:s symptomklass: check-backlog-closure.sh:s invariant 1 kräver AVBOCKADE AC för att flagga inkonsekvens, så ett kort med obockade AC på färdigt+CI-grönt arbete ger INGEN signal alls till nattgrinden — TASK-142 hade aldrig synts i #844 oavsett hur många nätter som gått. Stängt separat, ej del av #844:s utpekade lista; bokfört öppet här och i #844-kommentaren.

ETIKETT-LUCKAN (Del 2): mätte 40 To Do-kort utan ready-for-*-etikett (frontmatter-parsning, YAML-listform — INTE samma tal som kortets '37 av 79'; skillnaden är förväntad drift sedan fyndet 2026-08-07 10:50 och räknas inte som avvikelse). Efter TASK-142:s stängning (nu Done, ur To Do-poolen) triagerades resterande 39: 16 ready-for-agent, 23 ready-for-human. HIGH-buggarna TASK-24/25/27/28 klassade INDIVIDUELLT (ej som grupp): TASK-24 (404-kontraktsfix, deny-sviten har mönstret) + TASK-27 (redan diagnostiserat till exakt 1 assert + delad hjälpare) + TASK-28 (precedent-fix redan tillämpad på syskoninstanser) = ready-for-agent, spec räcker utan att någon behöver svara mitt i. TASK-25 = ready-for-human: kortet self-flaggar 'design-review-vågen' + två ovägda tekniska alternativ (border-radius: inherit ELLER radie-neutral ring-teknik) på MERGADE granskningsfärdiga ytor — en genuin design-fork, samma klass ADR-071 § beslut 3 pekar mot Marcus.

Klassningsprincip (konsekvent tillämpad, ej gissad per kort): PRD-kort → ready-for-human (TASK-70-precedentet, redan labelat så). Kort med AC-inbäddad STOPP-grind som förbjuder bygge före ett ofattat Marcus-beslut → ready-for-human (TASK-18.20/TASK-70.7, EXPLICIT precedent i TASK-70.7:s egen kommentar 2026-07-29: 'Ett kort vars eget AC förbjuder bygge före ett ännu ofattat Marcus-beslut är per definition inte fullt specificerat'). Kort gated på 'Marcus GO'/go-live → ready-for-human (TASK-120). Genuin olöst design-fork i prosan (flera vägar, ingen rekommendation, produktionspåverkan) → ready-for-human. Övriga: agentens spec+prosa gav ETT entydigt förväntat utfall utan värderingsbeslut → ready-for-agent, trots att AC-boxar saknas på samtliga (etablerat mönster i repot — TASK-14/98/136/142 hade alla tom AC-sektion vid fyndet och fick AC skrivna vid klassnings-akten; jag skriver INTE ny AC här, bara etikett, per uppdragets scope).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
