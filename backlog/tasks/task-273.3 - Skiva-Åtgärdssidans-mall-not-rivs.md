---
id: TASK-273.3
title: 'Skiva: Åtgärdssidans mall-not rivs'
status: Done
assignee: []
created_date: '2026-08-17 14:56'
updated_date: '2026-08-20 07:13'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-273
ordinal: 491000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lotta ser åtgärdssidan utan den tekniska metatexten om mallar. Notens sakpåstående var verifierat SANT (fasta standardmallar; Ändra-knappen redigerar bara det enskilda utskicket) — borttagningen är Marcus medvetna val 2026-08-17, inte en rättelse. Täcker användarberättelser: 5, 8.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mallar-noten (PrototypNot) är borta ur åtgärdssidans renderade yta; ingen annan synlig förändring på sidan
- [x] #2 Åtgärdsytorna är i övrigt identiska med den körande promoverade formen — facitets tre ytor (atgarder-tomt-lage, atgarder-mottagarurval, atgarder-granskning) saknar låsta bilder, vilket ALDRIG sänker kravet: identisk med körande ytan i alla lägen utom notens frånvaro (ADR-102 B5)
- [x] #3 Avvikelsen (notens rivning) är bokförd i amenderings-sidofil i s93-bilage-katalogen, redo för Marcus omstämpling; död kod efter rivningen borttagen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning utförd mot tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json (ADR-102 R3) — avvikelser utöver den beslutade: noll
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Åtgärdssidans mall-not (PrototypNot) riven på Marcus medvetna beslut, död kod borttagen — PR #1567 (b6df1d12), CI grön per jobb (två infra-transienta 429-fel på Analyze(actions)/Docs link check, ej kodrelaterade, ingen post-merge-regression).
<!-- SECTION:FINAL_SUMMARY:END -->
