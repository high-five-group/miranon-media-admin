---
id: TASK-17.7
title: 'Skiva: Filtervyn på event-listan + skriv ut (review-iteration 1)'
status: To Do
assignee: []
created_date: '2026-07-22 09:09'
updated_date: '2026-07-24 14:13'
labels:
  - ready-for-agent
dependencies:
  - TASK-17.2
parent_task_id: TASK-17
priority: medium
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg 1 (2026-07-22, design-review av S75-leveransen): event-listan får en filtrerings-ingång i period-toggel-raden (filterikon eller expander-pil per Marcus-skiss) som expanderar baren nedåt och öppnar en filtervy; i filtervyn även en Skriv ut-knapp för listan. ÖPPNA SPEC-FRÅGOR före ready-for-agent: (1) filterdimensionerna (kurs/eventtyp? ort? status? fritext?), (2) interaktionsformen (disclosure-expansion av baren — FK-/branschmönster researchas per web-research-disciplinen före design), (3) utskriftens omfång (filtrerad lista; print-kravet ur komponent-ribban). Bygger på 17.1:s ToggleButtonGroup-rad + 17.2:s listvy; blir filtren delbara ska URL-state in i URL-STATE-SPEC (nuqs) i samma skiva. Grillnings-kandidat före implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Filterdimensionerna + interaktionsformen Marcus-kvitterade före implementation (research-underlag citerat)
- [ ] #2 Filter + utskrift levererade per beslutad spec med e2e + axe-0; URL-STATE-SPEC uppdaterad om URL-state införs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
URL-BESLUTET AVGJORT (Marcus 2026-07-24, på Code-rek med förtroende-kvittens): JA — filtervalen URL-delbara via nuqs (?typ/?ort/?status i listans befintliga URL-grammatik, clearOnDefault för ren URL utan filter); URL-STATE-SPEC §Event uppdateras i samma skiva (kortets villkor). Byggkrav 6 därmed stängt — skivan komplett speccad.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd (per skiva med UI-yta; L220)
- [ ] #6 Renderad verifiering (computed-style/skärmdump) per berörd punkt före granskning (L245/L246)
<!-- DOD:END -->
