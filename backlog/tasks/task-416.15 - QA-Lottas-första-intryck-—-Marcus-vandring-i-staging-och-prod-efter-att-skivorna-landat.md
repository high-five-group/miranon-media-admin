---
id: TASK-416.15
title: >-
  QA: Lottas första intryck — Marcus vandring i staging och prod efter att
  skivorna landat
status: To Do
assignee: []
created_date: '2026-09-06 13:24'
updated_date: '2026-09-07 17:59'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-416
priority: high
ordinal: 741000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: PRD (S123). Ände-till-ände-vandring med rensad site data (skeleton måste visas för att kunna bedömas): logga in, gå till Hem, Event, ett event, Check-in, Åtgärder (fäll ut en rad — bilagorna ska synas direkt), Personer, Mer → Anmälningar, Aktivitetshistorik, Betalningar, Platser, Eventinnehåll, Intresserade. På varje sida: (1) visas skeleton alls? (2) hoppar innehållet när det landar? (3) hur lång är väntan? Gör vandringen på desktop och iPad. Bokför avvikelser som fynd-kort. Prod-deploy av get-event-attachments (skiva 12) via fas4-prod-deploy.sh före prod-vandringen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Vandringen gjord i staging på desktop och iPad; avvikelser bokförda som fynd-kort
- [ ] #2 get-event-attachments deployad till prod (fas4) och bilagorna syns direkt på åtgärder i prod
- [ ] #3 Vandringen gjord i prod; Marcus stämpel i kortet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S123 resume 1 (2026-09-07): fas4-deployen körd (get-event-attachments v21 i prod 16:57Z, mätt) — AC #2:s första halva uppfylld; andra halvan ('bilagorna syns direkt på åtgärder i prod') och AC #1/#3 är Marcus vandring. Bilagenamns-regressionen (TASK-431, PR #2452 → 790650d5) är landad före vandringen.
<!-- SECTION:NOTES:END -->
