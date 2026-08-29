---
id: TASK-338.6
title: >-
  Skiva: prod-migrationen — schema, EF-deploy och radmigrering med Marcus GO per
  tabell (HITL)
status: To Do
assignee: []
created_date: '2026-08-29 08:04'
labels:
  - ready-for-human
dependencies:
  - TASK-338.1
  - TASK-338.2
  - TASK-338.3
  - TASK-338.4
  - TASK-338.5
parent_task_id: TASK-338
ordinal: 616000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-moment i tre steg, i denna ordning: (i) Bilagor i PROD får option 'Gemensam', länken Plats → Platser (tblPeNLeeQ1IduGTK) och lookup Platsnamn — additivt, efter Marcus GO i klartext för tabellen Bilagor (ADR-125 § 8); (ii) EF-deploy till prod via bash scripts/fas4-prod-deploy.sh --deploya <prod-ref> i EGET terminalfönster (aldrig via !-prefixet, CLAUDE.md § Prod-EF-deploy), verifierat på UPDATED_AT; (iii) radmigrering Kurstyp/Alla event → Gemensam i prod med räkneverifiering före/efter, efter Marcus GO. Ordningen är säker oavsett tack vare läsvägens legacy-tolerans (338.2). Orkestreraren förbereder ett skript med --kontrollera (läser, ändrar inget) och --utfor för steg (i) och (iii) med prod-ref som argument (deny-prod-ref-låset bevaras). data-model.md § Bilagor får prod-ID:n. Täcker användarberättelser: 10, 14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Prod: option, länk och lookup finns (fält-ID:n bokförda); Marcus GO citerat i Implementation Notes
- [ ] #2 Prod-EF:erna get-event-attachments, upload-attachment, finalize-attachment-upload, update-attachment-scope deployade — UPDATED_AT-tider bokförda
- [ ] #3 Prod: 0 rader kvar med Kurstyp/Alla event; antal Gemensam = summan före; de två dokument Marcus laddade upp 2026-08-29 finns kvar och är läsbara i räckviddsläget
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->
