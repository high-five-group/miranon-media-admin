---
id: TASK-18.16
title: >-
  Skiva: Grön-knapp-regeln globalt — når-utomstående ⇒ success-grön, annars
  mörkgrå (review-iteration 2)
status: To Do
assignee: []
created_date: '2026-07-23 08:55'
labels: []
dependencies: []
parent_task_id: TASK-18
ordinal: 84000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus review-våg 2 (2026-07-23), lyft vid 18.6-granskningen: global semantisk knapp-regel — handlingar som NÅR UTOMSTÅENDE (mail/SMS till deltagare o.dyl.) bär intent success (grön); handlingar som stannar i appen bär mörkgrå standard (primary). 'Bekräfta alla' är redan grön och blir regelns första instans. Kodifieras i DESIGN-SYSTEM-SPEC (§Button-intents) + app-bred intent-audit (känd avvikare: personkortets 'Skicka bekräftelse'-knapp i kortbotten är idag omarkerad och blir grön under regeln). KONFLIKT att avgöra FÖRE bygge: 'Skapa event' är success-grön per S73-facit K77 (svärtan läste för tungt) men når INTE utomstående — (A) regeln vinner, Skapa event flippas mörkgrå (K77 rivs öppet) · (B) Skapa event undantas öppet i regeltexten · (C) annat. Beslutsrymden är Marcus designbeslut (grillning vid behov).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus-beslut bokfört: regelformuleringen + K77-konflikten (A/B/C) — ev. facit-revidering rivs öppet
- [ ] #2 Vid bifall: regeln kodifierad i DESIGN-SYSTEM-SPEC + intent-audit över appens samtliga knappytor utförd och bokförd; avvikare flippade per regeln; berörda e2e uppdaterade i samma skiva
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
