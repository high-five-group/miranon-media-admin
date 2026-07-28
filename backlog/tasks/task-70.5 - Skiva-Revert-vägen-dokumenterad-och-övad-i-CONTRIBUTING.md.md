---
id: TASK-70.5
title: 'Skiva: Revert-vägen dokumenterad och övad i CONTRIBUTING.md'
status: To Do
assignee: []
created_date: '2026-07-28 16:33'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-70
ordinal: 148000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FÖRKRAV FÖR A7:5 OCH A7:6, tillsammans med A7:4. Att flytta kontroller ur den blockerande grinden förutsätter att ett fel kan backas snabbt. Den vägen är i dag oskriven — granskningen listar den som lucka UTAN evidenskolumn, eftersom det inte finns någon evidens att peka på.

### DEN DETALJ SOM AVGÖR KOMMANDOT

Rulesetet 19627609 tillåter exakt EN merge-metod: allowed_merge_methods = merge (verifierat mot gh api 2026-07-28). Varje landning blir alltså en MERGE-COMMIT, och en merge-commit kan inte revertas utan att man anger vilken förälder som är huvudlinjen: git revert -m 1.

Ett revert-recept skrivet för squash-landningar är fel recept för detta repo. Skriv det mot den metod rulesetet faktiskt tillåter, och citera inställningen som skäl så att receptet inte tyst blir fel den dag metoden ändras.

Direktpush till main avvisas (ADR-076), så även reverten går via PR och genom samma grind. Required-checken är strict, vilket betyder att revert-PR:en måste vara up-to-date mot main när den landar.

### SKA ÖVAS, INTE BARA BESKRIVAS

En skriven väg som aldrig gåtts är en hypotes. Övningen sker mot en AVSIKTLIGT INFÖRD NO-OP — en kommentarsrad eller motsvarande utan funktionell verkan — som landas och sedan revertas hela vägen. Aldrig mot en verklig ändring, och aldrig som torrkörning.

Mät tiden. Hur lång tid reverten faktiskt tar är det tal A7:5 och A7:6 lutar sig mot: det är hur länge ett fel kan ligga i main innan det är borta igen.

### SKARV MOT LANDNINGS-ORDNINGEN

CONTRIBUTING.md § Landnings-ordningen (rad 155-212) beskriver hur PR:er sekvenseras. Revert-vägen hör hemma i samma dokument men som EGEN sektion: sekvensering handlar om att förebygga BEHIND, revert om att backa något som redan landat. Blanda inte ihop dem — de utlöses av olika lägen och har olika åtgärd.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CONTRIBUTING.md har en egen sektion för revert-vägen, skild från § Landnings-ordningen
- [ ] #2 Receptet använder git revert -m 1 mot merge-commits och motiverar varför — rulesetets allowed_merge_methods = merge citeras som skäl
- [ ] #3 Vägen går via PR, inte direktpush: receptet är förenligt med ADR-076 och med att required-checken är strict
- [ ] #4 Reverten är ÖVAD skarpt mot en avsiktligt införd no-op — PR-nummer för landningen, PR-nummer för reverten och båda SHA:na redovisade
- [ ] #5 Tiden från beslut till landad revert är MÄTT i den övningen och skriven i sektionen — det talet är exponeringsfönstret A7:5 och A7:6 lutar sig mot
- [ ] #6 Sektionen säger vad som INTE går att backa lika enkelt, om något sådant finns — exempelvis en landad datamigrering eller en ändrad GitHub-inställning
- [ ] #7 npm run check:docs grön efter ändringen (nio grindar; CONTRIBUTING.md ligger innanför både markdownlint- och vale-scopet)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

Övningen är det enda som kunde ha krävt mänsklig hand, och den är avväpnad av kravet i beskrivningen: reverten görs mot en avsiktligt införd no-op, aldrig mot en verklig ändring. Därmed finns inget val som kräver omdöme om vad som är säkert att backa — objektet är konstruerat för att vara ofarligt.

Allt övrigt är text plus mätning: en sektion i CONTRIBUTING.md, två PR-nummer, två SHA:n, ett tidtal och check:docs grön.

Skivan rör inga GitHub-inställningar och tar inte bort någon kontroll. Den ADDERAR den kontroll som gör A7:5 och A7:6 försvarbara.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
