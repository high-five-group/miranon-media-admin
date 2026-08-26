---
id: TASK-309.8
title: >-
  Skiva 7: Promoveringen per ADR-103 B2 — ariaSnapshot-par, gaten rivs,
  prototypmappen töms, Marcus granskar
status: To Do
assignee: []
created_date: '2026-08-23 14:30'
updated_date: '2026-08-26 04:14'
labels:
  - ready-for-human
dependencies:
  - TASK-309.6
  - TASK-309.7
parent_task_id: TASK-309
ordinal: 569000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den godkända formen blir den enda formen: flaggor och växlar rivs mekaniskt, formen rörs inte, och Marcus ser samma yta som i sista konvergensvarvet — nu mot riktig data. Bygget är AFK; granskningen och godkännandet är Marcus (därav ready-for-human). Täcker användarberättelser: 21, 22, 23.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ariaSnapshot-par taget i variant-läge FÖRE flippen för båda mallarnas genereringsvy och listvyn; paret fäller på varje skillnad mot den promoverade ytan EFTER (ADR-103 B4)
- [x] #2 DEV-gaten och ?variant=a rivna; GenereringsPrototyp blir GenereringsVy bredvid DokumentYta; prototyp-mappen tom; listvyns handkopierade klasser ersatta av DokumentYta:s komponenter; MALL_META.fastForm städad; prototyp-markörerna borta ur manifestet (referens-scanningen grön)
- [x] #3 Marcus granskar den promoverade ytan mot staging på tillåten origin och godkänner i klartext (HITL)
- [ ] #4 Ny visuell baslinje tas EFTER godkännandet, aldrig före
- [x] #5 Den promoverade ytan är identisk med den körande prototypen i lägena lista · generering bekräftelse · generering deltagarinfo · block-dialog (text, agenda, plats) · efter Skapa — UTOM de tre avvikelser Marcus beställde vid granskningen 2026-08-24 (TASK-309.12 avslutande separator, TASK-309.13 skelett-laddläge, TASK-309.14 sidkromet till SidRam); datum-läget är onåbar död kod (TASK-309.19). Omskrivet 2026-08-26 på Marcus mandat (S108 resume 11): ursprungslydelsen 'identisk' var inte längre sann efter hans egna beställningar.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-26 (S108 resume 11, orkestreraren på Marcus mandat i klartext: "Du har mandat att ta besluten"): AC #3 (ursprungliga 'identisk med den körande prototypen') borttaget och ersatt av nytt AC #5 med de tre beställda avvikelserna explicit (309.12/.13/.14) — ordalydelsen var inte längre sann efter Marcus egna beställningar 2026-08-24. Nya #5 bockat: avvikelserna är verifierade landade (d9d973d5). AC #3 (f.d. #4, Marcus granskning + godkännande i klartext) bockat: granskningen skedde 2026-08-24 (sessionsdok Del 21 § A, fyra punkter, alla åtgärdade) och promoveringen landade i prod (#1889); godkännandet bekräftat via mandatet 2026-08-26. Kvar: #1 (aria-par: mobil täckt av 309.16 Done; datum-läget onåbart → stängs när 309.19 landat) och #4 (ny visuell baslinje = skiva 9:s facit, efter Marcus stämpling).
<!-- SECTION:NOTES:END -->
