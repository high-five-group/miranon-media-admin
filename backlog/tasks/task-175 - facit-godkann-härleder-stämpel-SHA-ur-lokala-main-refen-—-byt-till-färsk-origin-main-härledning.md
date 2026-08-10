---
id: TASK-175
title: >-
  facit-godkann härleder stämpel-SHA ur lokala main-refen — byt till färsk
  origin/main-härledning
status: To Do
assignee: []
created_date: '2026-08-10 04:15'
updated_date: '2026-08-10 10:41'
labels:
  - ready-for-agent
dependencies: []
ordinal: 332000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt skarpt 2026-08-10 (S93 stängningen): Marcus första omgodkännande-stämpel bokförde sha f7360100 — lokala main-refens läge, dagar efter origin/main — medan granskningen skedde mot e25efd05-trädet (post-15-strecks). resolveMainSha (scripts/facit-godkann.mjs rad ~374) läser lokala main; i en orkestrerar-checkout står den refen stilla tills någon manuellt fast-forwardar. Stämpelns SHA är dess dokumentationsvärde (ADR-104 beslut 4: SHA dokumenterar) — fel träd i kvittot är exakt den dokumentations-klass mekaniken byggdes mot. Rättades i stunden via ref-synk + omstämpling (--ersatt), fragment i tasks/lessons.d/. FIX: härled ur origin/main efter färsk fetch (eller fäll med tydligt fel om lokala main ≠ origin/main och låt användaren välja), uppdatera den tvåsidiga testsviten (scripts/test-facit-godkann.mjs) med fallet. OBS kanalseparationen (ADR-104): skriptet körs av Marcus via !-kanalen — ändringen testas via testsviten + manuell körning, agenten stämplar ALDRIG skarpt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Stämpel-SHA:t härleds ur färsk origin/main (eller fäller tydligt vid divergens mot lokala main) — tvåsidigt bevisat i testsviten
- [x] #2 Befintliga testfall gröna — ingen försvagning av valideringen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
