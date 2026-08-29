---
id: TASK-338.4
title: >-
  Skiva: Ändra räckvidd — EF update-attachment-scope och åtgärden i
  räckviddsläget
status: To Do
assignee: []
created_date: '2026-08-29 08:04'
labels:
  - ready-for-agent
dependencies:
  - TASK-338.2
  - TASK-338.3
parent_task_id: TASK-338
ordinal: 614000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan kan Lotta i räckviddsläget (Delade dokument) välja 'Ändra räckvidd' på en delad bilaga: samma RackviddsDialog öppnas förifylld med bilagans axlar, hon ändrar och sparar, raden uppdateras med ny badge utan att filen laddas om. Ny EF update-attachment-scope (operation registrerad i field-allowlists med deny/allow-test enligt sub-fas-mönstret) tar attachmentId + samma räckviddsparametrar som skrivvägen, med vakter: endast rader med Räckvidd ≠ Event, endast uppladdade filer (Dokumentklass), Plats existenskontrollerad. Ur ett events kontext förblir delade bilagor oredigerbara (ADR-118 beslut 3). De två dokument Marcus laddade upp 2026-08-29 som 'Alla event' omklassas via denna åtgärd i TASK-338.6/7 — inte via basen. Täcker användarberättelser: 8, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 EF update-attachment-scope deployad i staging; staging-test bevisar: ändra Alla event → Plats Rönninge (raden bär ny länk), ändra tillbaka, avvisa Event-egen rad (403/4xx), avvisa okänt plats-ID, 401/404/405/CORS-baslinjen
- [ ] #2 Operationen registrerad i field-allowlists; deny/allow-testet grönt i båda riktningar (bevis att ett fält utanför allowlisten fälls)
- [ ] #3 UI: 'Ändra räckvidd' finns bara på delade rader i räckviddsläget, öppnar dialogen förifylld, sparar optimistiskt enligt husets mutation-mönster, felväg i notistrappans form; acceptance-test med MSW + axe grönt; inte synlig i eventläget (testat)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
- [ ] #7 Facit-granskning mot tasks/sessions/bilagor/s108-dokumentytan/facit.json ytan 'Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren': avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje tas först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->
