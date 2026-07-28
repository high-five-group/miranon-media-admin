---
id: TASK-70.5
title: 'Skiva: Revert-vägen dokumenterad och övad i CONTRIBUTING.md'
status: To Do
assignee: []
created_date: '2026-07-28 16:33'
updated_date: '2026-07-28 19:22'
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
- [x] #1 CONTRIBUTING.md har en egen sektion för revert-vägen, skild från § Landnings-ordningen
- [x] #2 Receptet använder git revert -m 1 mot merge-commits och motiverar varför — rulesetets allowed_merge_methods = merge citeras som skäl
- [x] #3 Vägen går via PR, inte direktpush: receptet är förenligt med ADR-076 och med att required-checken är strict
- [ ] #4 Reverten är ÖVAD skarpt mot en avsiktligt införd no-op — PR-nummer för landningen, PR-nummer för reverten och båda SHA:na redovisade
- [ ] #5 Tiden från beslut till landad revert är MÄTT i den övningen och skriven i sektionen — det talet är exponeringsfönstret A7:5 och A7:6 lutar sig mot
- [x] #6 Sektionen säger vad som INTE går att backa lika enkelt, om något sådant finns — exempelvis en landad datamigrering eller en ändrad GitHub-inställning
- [x] #7 npm run check:docs grön efter ändringen (nio grindar; CONTRIBUTING.md ligger innanför både markdownlint- och vale-scopet)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
KLASSNING: ready-for-agent.

Övningen är det enda som kunde ha krävt mänsklig hand, och den är avväpnad av kravet i beskrivningen: reverten görs mot en avsiktligt införd no-op, aldrig mot en verklig ändring. Därmed finns inget val som kräver omdöme om vad som är säkert att backa — objektet är konstruerat för att vara ofarligt.

Allt övrigt är text plus mätning: en sektion i CONTRIBUTING.md, två PR-nummer, två SHA:n, ett tidtal och check:docs grön.

Skivan rör inga GitHub-inställningar och tar inte bort någon kontroll. Den ADDERAR den kontroll som gör A7:5 och A7:6 försvarbara.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
LEVERERAT: CONTRIBUTING.md § Revert-vägen — hur något som redan landat backas ut. H3 under ## Pull Request-flöde, syskon till § Landnings-ordningen. Gren docs/task-70-5-revert-vagen, PR #370.

ÖVNINGEN (skarp, ej torrkörning), 2026-07-28:
- utgångsläge 103e5f2 (main-spets), träd 4944e1d
- no-op 5e6da95 (HTML-kommentar, ingen funktionell verkan)
- merge-commit b9dada7 i GitHubs form: förälder 1 = 103e5f2, förälder 2 = 5e6da95
- revert-commit 31c2146; git diff --stat 103e5f2 HEAD tomt och HEAD-trädet = 4944e1d, identiskt med utgångsläget

BÅDA FELVÄGARNA MÄTTA:
- git revert b9dada7 utan -m  ->  exit 128, is a merge but no -m option was given
- git revert -m 2 --no-commit b9dada7  ->  exit 0, noll rader stagade, no-op kvar i filen (misslyckas TYST)

MÄTT TID, fyra led: git revert -m 1 under 1 s · git push 3 s · gh pr create 3 s · CI grön 59 s (run 30391389399, docs-klass, grön per jobb). Summa 66 s från beslut till landningsklar revert-PR. Talet är summan av de mätta leden, inte en obruten klockad sträcka.

GRINDAR: npm run check:docs exit 0, 9/9 gröna, 0 skippade (vale 3.14.1 + lychee 0.24.2 fanns lokalt). Grind-bevis i BÅDA riktningar: en probe i CONTRIBUTING.md (standalone Miranon + upprepat ord + trasig relativlänk + trailing spaces) fällde lychee + markdownlint + Vale, exit 1 — filen ligger alltså innanför alla tre scopen. Probe borttagen, åter exit 0. npx biome check . exit 0.

AC 4 OCH 5 OBOCKADE — AVVIKELSE MOT KORTET, EJ UTJÄMNAD:
Kortet kräver att no-op:en LANDAS i main via PR och revertas hela vägen, alltså två PR-nummer och en landad revert. Det kräver två merges till main. En bygg-agent mergar inte till main, och två landningar mitt i en parallell körning hade satt de två andra agenternas PR:er i BEHIND — precis den skada § Landnings-ordningen finns för att undvika. Övningen kördes därför på egen gren. Bevisat: hela git-mekaniken i båda riktningar plus fyra av fem tidsled. Omätt: armering -> landad merge-commit.
ÅTERSTÅR för full AC 4/5: orkestreraren kör samma kedja skarpt mot main när PR-kön är tom (no-op-PR landas, revert-PR landas, två PR-nummer och tiden noteras) — eller så faller talet ut första gången vägen används på riktigt, vilket sektionen redan säger.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
