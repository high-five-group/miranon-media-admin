---
id: TASK-19.2
title: 'Skiva: Skapa-ingången + hemvist-flytten + Mer-rivningen'
status: To Do
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-21 23:25'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.2
parent_task_id: TASK-19
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Skapa nytt event-kapseln läggs vänster på listans vy-väljarrad i väljarnas stil och leder till skapa-sidan; skarpa sidans hemvist flyttar till event-familjens skapa-route (Marcus-kvitterat 2026-07-21) och Mer-ingången rivs öppet — berörda Mer-/list-e2e uppdateras i samma skiva. Täcker användarberättelser: 1 (TASK-19).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ingången renderar per facit-lista-skapa-ingången och leder till skapa-sidan
- [ ] #2 Mer-ingången borta och gamla routen hanterad öppet; berörda e2e uppdaterade i samma skiva
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AFK-drain (S75-batch v2.1): kortet är BYGGT + pushat på origin/task/19.2 (2021465, skapa-ingången + hemvist-flytten + Mer-rivningen) — merge drainad av 18.8-halten (extern audit-advisory + 18.8-egna e2e-fel), INTE av fel i denna leverans. PLOCKA INTE OM: nästa steg är merge av branchen via ordinarie kedja i ny batch-order.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT-UTÖKNINGEN: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
