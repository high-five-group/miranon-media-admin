---
id: TASK-198
title: >-
  nightly.yml: backlog-stängningens felrad beskriver invariant 1 men fynden är
  invariant 2 — åtgärdstexten leder mottagaren fel
status: To Do
assignee: []
created_date: '2026-08-11 18:30'
updated_date: '2026-08-26 02:58'
labels: []
dependencies: []
priority: low
ordinal: 363000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Belägg (rödklassningen 2026-08-11, run 31454392944 job 93665096973): grinden fann 14 inkonsistenta kort — SAMTLIGA invariant 2 ('Done + obockad DoD', check-backlog-closure.sh rad 167, medvetet utan karens; rätt åtgärd = bocka DoD mot belägg eller öppna ärligt). Men jobbets ##[error]-rad lyder 'kort vars arbete är bevisat klart står öppna bortom karensen. Åtgärd: stäng korten' — det är invariant 1:s text och MOTSATT åtgärd. Texten sitter i .github/workflows/nightly.yml (steget kring rad 428–445) och återges ordagrant i natt-issuen varje natt. Fix: låt felraden skilja invarianterna (eller återge skriptets egen per-invariant-summering). Kosmetisk men vilseledande — samma klass som task-180 (larmtext som pekar fel).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FIXAT 2026-08-26 (S112 fix-våg 4, bunt A). Premiss verifierad mot origin/main (fetch 2026-08-26, HEAD 2fda2d78): felraden fanns på TVÅ ställen, inte bara det kortet nämner (rad ~428-445 i den ursprungliga beskrivningen) — filen har vuxit sedan kortets skapande 2026-08-11:
  1. .github/workflows/nightly.yml rad 446: ::error::-annotationen i backlog-closure-jobbet.
  2. .github/workflows/nightly.yml rad 798 (bekräftat NYTT fynd, ej i kortets ursprungliga beskrivning): samma felaktiga text återges ordagrant i alarm-jobbets backlog_sektion — den byggs in i själva GitHub-issuen varje natt, så bara rad 446 hade lämnat den vilseledande texten kvar i det faktiska ärendet.

Rotorsak: scripts/check-backlog-closure.sh sätter EXIT_CODE=1 för invariant 1 (öppet men bevisat klart), invariant 2 (stängt men obockat) OCH invariant 3 (barn klara, förälder ej stängd) samt blankocheck-spärren — samma exitkod för fyra olika situationer med olika rätt åtgärd. nightly.yml:s hårdkodade text beskrev bara invariant 1:s symptom+åtgärd ("stäng korten") oavsett vilken invariant som faktiskt trigga.

Fix (vald form): raderna beskriver nu INTE en specifik invariant/åtgärd längre — de pekar till loggens egna ❌-rader (som redan skiljer invarianterna per kort, se check-backlog-closure.sh rad ~725/771) och sammanfattar båda möjliga åtgärderna explicit ("invariant 1/3 ⇒ stäng korten; invariant 2 ⇒ bocka DoD/AC mot belägg eller öppna ärligt"). Detta är den lättviktiga formen av kortets alternativ "återge skriptets egen per-invariant-summering" — utan att plumba en ny strukturerad output ur skriptet, eftersom skriptets nuvarande outputs (utfall=gron/drift/anropsfel) inte differentierar invarianter och en sådan ändring hade varit en större, riskablare yta för ett Low-prio kosmetiskt fynd.

Grindar: actionlint 1.7.12 (-ignore 'unexpected key "queue"...') exit 0, yamllint 1.38.0 .github/ exit 0, npm run typecheck exit 0, npx @biomejs/biome check . exit 0, npm run build exit 0, npm run test:api exit 0 (1169 passed). Inga AC definierade på kortet ("No acceptance criteria defined") — inget att bocka.
<!-- SECTION:NOTES:END -->
