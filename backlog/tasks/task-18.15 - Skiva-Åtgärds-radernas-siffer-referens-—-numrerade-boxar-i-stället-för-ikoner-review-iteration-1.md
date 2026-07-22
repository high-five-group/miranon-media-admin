---
id: TASK-18.15
title: >-
  Skiva: Åtgärds-radernas siffer-referens — numrerade boxar i stället för ikoner
  (review-iteration 1)
status: To Do
assignee: []
created_date: '2026-07-22 09:09'
updated_date: '2026-07-22 09:09'
labels: []
dependencies:
  - TASK-18.3
parent_task_id: TASK-18
priority: medium
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg 1 (2026-07-22), fundering lyft till beslut: ersätt åtgärds-radernas ledande lucide-ikoner (Atgarder.tsx: Plus/Mail/BadgeCheck/Printer — kuvert-grammatiken ur 18.3/S73-facit) med RADNUMMER inboxade i en grå ruta med samma hörnradie som kortets ytterram. Motiv: referentbarhet — 'gå till åtgärd 4' i instruktioner och manualer (Gunilla-principen: numrerade steg är entydiga). Detta är en FACIT-REVIDERING mot S73-facitets kuvert-grammatik och rivs i så fall öppet (18.3-precedenten för regelrivning). Beslutsrymd före bygge: nummer ensamt, nummer + ikon, eller avslag. Check-in-kortet och rad-chevronerna berörs ej.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus-beslut bokfört (nummer ensamt / nummer+ikon / avslag) med öppen facit-reviderings-not
- [ ] #2 Vid bifall: åtgärds-raderna renderar numrerade boxar per beslut; AT-paritet (radnamn + aria-disabled-interimen oförändrade) och berörda e2e uppdaterade i samma skiva
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd (per skiva med UI-yta; L220)
- [ ] #6 Renderad verifiering (computed-style/skärmdump) per berörd punkt före granskning (L245/L246)
<!-- DOD:END -->
