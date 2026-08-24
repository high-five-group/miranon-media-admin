---
id: TASK-313
title: >-
  Fynd: create-eventinnehall-modell.mjs --dry-run kan inte planera hela kedjan
  mot en tom bas — kommentar och kod sager emot varandra
status: To Do
assignee: []
created_date: '2026-08-24 13:36'
updated_date: '2026-08-24 15:59'
labels:
  - ready-for-agent
dependencies: []
ordinal: 576000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-08-24 (S108 Del 17) vid prod-schemats skapande.

SYMPTOM: 'node scripts/create-eventinnehall-modell.mjs --bas <bas> --dry-run' mot en bas dar tabellerna INTE redan finns planerar de tva forsta tabellerna och faller sedan:

  Guard: lankad tabell "Eventinnehall" hittades inte (ordningsfel i operations?)

ORSAK (last i kallan): dry-run-grenen for op.kind === 'createTable' (ca rad 838-845) skriver ut planen och gor 'continue' UTAN att satta tableIdByName. Nasta operation (Agendapunkter, som lankar till Eventinnehall) anropar resolveLinkedTableId() -> saknas i mappen -> GuardError (ca rad 775). Skarpa vagen ar OPAVERKAD: createTable-grenen satter tableIdByName.set(op.name, created.id) (ca rad 849).

DEFEKTEN AR ATT KOMMENTAREN LJUGER: koden bar kommentaren 'Dry-run kan inte threada ett riktigt ID vidare — efterfoljande operationer som lankar hit rapporteras SEPARAT i dry-run-laget'. Nagon sadan separat rapportering finns inte — koden kastar i stallet. Samma ADR-083-felklass (prosa som pastar mekanism) som repot stadat bort tva ganger.

KONSEKVENS: en operator som kor --dry-run mot en tom bas far ett felmeddelande som ser ut som ett DATAFEL ('ordningsfel i operations?') nar det i sjalva verket ar en KAND begransning i dry-run-vagen. Vid prod-korningen 2026-08-24 kravde det kallkodslasning for att avgora att skarpa korningen var saker.

VAL AV LOSNING AR OPPET: antingen (a) lat dry-run threada ett SYNTETISKT ID sa hela kedjan kan planeras, eller (b) implementera den 'separata rapportering' kommentaren redan pastar, eller (c) rätta kommentaren till sanningen och ge ett begripligt felmeddelande. (a) ger mest varde — en dry-run som inte kan planera hela kedjan mot en TOM bas ar oanvandbar precis nar den behovs mest.

TRIAGE (ADR-053): blockerar ej, vardefullt -> registrerat. Bokfort aven i docs/reference/data-model.md § Prod-ID:n.

KALLA: S108 Del 17 § D.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En --dry-run mot en bas utan de tre tabellerna planerar HELA kedjan utan att kasta, ELLER faller med ett meddelande som sager att det ar en dry-run-begransning och inte ett datafel
- [x] #2 Kommentaren vid createTable-grenens dry-run beskriver vad koden FAKTISKT gor (ADR-083)
- [x] #3 Tvasidigt test: dry-run mot tom bas och mot fylld bas, bada med forvantat utfall
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
