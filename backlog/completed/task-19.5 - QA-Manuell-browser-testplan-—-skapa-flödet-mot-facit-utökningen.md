---
id: TASK-19.5
title: 'QA: Manuell browser-testplan — skapa-flödet mot facit-utökningen'
status: Done
assignee: []
created_date: '2026-07-21 08:22'
updated_date: '2026-07-23 14:56'
labels:
  - ready-for-human
dependencies:
  - TASK-19.1
  - TASK-19.2
  - TASK-19.3
  - TASK-19.4
parent_task_id: TASK-19
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan efter skiv-kedjan (körs i browsern mot staging):
1. Jämför ingången mot FACIT-lista-skapa-ingången (kapseln vänster på vy-raden) och sidan mot FACIT-skapa-sidan; verifiera att Mer-ingången är BORTA.
2. Fyll i ett testevent (Event, Eventtyp, Ort, datum, max platser, format 2 dagar) — verifiera språket och att inga obligatorisk-markeringar syns.
3. Armera handtaget med MUS-drag: bock + Publiceras på miranon.se i monotext + plinget; jämför mot FACIT-skapa-handtag-armad.
4. Avarmera, armera igen med enbart TANGENTBORD; verifiera annonseringen med skärmläsare.
5. Skapa eventet oarmerat — verifiera att flaggan INTE sätts i staging-basen; skapa ett till armerat — flaggan satt; städa båda test-eventen efteråt.
6. Tryck Skapa två gånger snabbt/simulera osäker sändning — verifiera ETT event (idempotensen).
7. Reducerad rörelse + ljud av: plinget respekterar preferensen; förhöjd kontrast på hela sidan.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
