---
id: TASK-381
title: >-
  Fynd: ombokningsskälet i ombokningssteget är inte redigerbart —
  rebook-registration saknar skäl-fält
status: To Do
assignee: []
created_date: '2026-09-03 12:43'
labels:
  - ready-for-human
dependencies: []
ordinal: 683000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Symptom: 368.5 AC #2 kräver att det förifyllda skälet 'Ombokad till <event, datum>' är redigerbart. Byggaren (PR #2267) lämnade AC:t obockat: RebookRegistrationInput bär inget skäl-fält, medvetet i 368.4/ADR-130 — Notering-raden '[Ombokad ÅÅÅÅ-MM-DD av <aktör>] till <event, datum>' byggs av servern (byggOmbokningsmal) och används dessutom av barOmbokningsradMot för att känna igen en omkörning (ADR-130 beslut 7). Ett redigerbart fält hade tagit emot text och kastat den. Beslut som väntar på Marcus: (A) stryk '(redigerbart)' ur 368.5 AC #2 — skälet är per definition 'ombokad till X' och står redan i Notering; eller (B) ge rebook-registration ett valfritt skäl-fält som servern lägger EFTER den kanoniska raden (så barOmbokningsradMot fortfarande matchar), med test i både hermetisk och staging-svit. Orkestrerarens rekommendation: A, tills ett verkligt behov av fritext vid ombokning har visat sig hos Lotta. Källa: byggarens slutrapport 2026-09-03, S115.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
