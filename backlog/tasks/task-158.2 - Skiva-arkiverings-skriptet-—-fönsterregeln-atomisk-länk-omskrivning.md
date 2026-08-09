---
id: TASK-158.2
title: 'Skiva: arkiverings-skriptet — fönsterregeln + atomisk länk-omskrivning'
status: Done
assignee: []
created_date: '2026-08-07 12:26'
updated_date: '2026-08-09 08:09'
labels:
  - ready-for-agent
dependencies:
  - TASK-158.1
parent_task_id: TASK-158
ordinal: 273000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en körning av skriptet mot en rot som överskrider fönstret flyttar exakt de äldsta stängda doken till arkivets månadsmapp, skriver om varje inkommande länk i samma körning, och lämnar en rot som matchar fönsterregeln — körd mot en rot inom fönstret gör den ingenting. Täcker användarberättelser: 3, 4, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass mot live: rotens faktiska bestånd per lifecycle, arkivets månadsmappsform och de inkommande länkarnas form (77 filer länkar in) verifierade FÖRE implementation
- [x] #2 Skript i scripts/ med universell logik; fönstertalet + undantag i egen policy-konfig; idempotent; torrkörnings-läge som default-säkring (gren-städarens mönster)
- [x] #3 Flytt + omskrivning av ALLA inkommande länkar sker atomiskt i samma körning — ingen transient bruten länk i något commit-bart mellanläge
- [x] #4 paused/active-dok flyttas ALDRIG oavsett ålder; fail-closed på oparsbart lifecycle-fält
- [x] #5 Tvåsidig testsvit i test-familjens form: fäller/släpper/fail-closed; shellcheck-strict grön
- [x] #6 PR armerad, per-jobb-grön
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
[TASK-169, backlog-städet, 2026-08-09] DoD#5 (serie-ordningen ADR→migration→grind bindande) GENUINT UTAN BELÄGG ännu och lämnas OBOCKAD med avsikt — samma skäl som task-158.1: TASK-158.4 (drift-grinden) är fortfarande To Do. Flippar INTE status. Se task-169s slutrapport för fullständig motivering. Kortet fortsätter trigga check-backlog-closure.sh invariant 2 tills 158.4 landar eller ett policybeslut fattas.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängning i S99-resume 1 (2026-08-07): #913 mergad 57f8d143, per-jobb-grön. Skript + policy-konfig (N=10) + testsvit 30/30; fail-closed på no-lifecycle-doken bevisad mot skarp rot (torrkörning, inget rört); ci.yml shellcheck-scope 20→21. Divergenser öppet bokförda: länkyte-talet (operativt 26 unika filer vid N=10) + staging-502 = lokal concurrency-artefakt (194/194 vid 2 workers). Skarp migration är 158.3.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Ordningen ADR → migration → grind är bindande: ADR-099 landad före migrations- och grind-skivorna exekveras
<!-- DOD:END -->
