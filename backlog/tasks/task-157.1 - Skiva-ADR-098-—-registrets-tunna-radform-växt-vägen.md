---
id: TASK-157.1
title: 'Skiva: ADR-098 — registrets tunna radform + växt-vägen'
status: Done
assignee: []
created_date: '2026-08-07 11:32'
updated_date: '2026-08-07 13:43'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-157
ordinal: 267000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en framtida läsare förstår ur EN ADR varför indexraden är tunn, var narrativ bor, hur formen skyddas och exakt när/hur registret evolverar till genererat index. Täcker användarberättelser: 3, 5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Premiss-pass: nästa lediga ADR-nummer disk-verifierat vid byggtillfället; registrets aktuella mått ommätta (wc -l, wc -c, radlängds-fördelning); besläktad-deklarationernas nuvarande validering läst i check-thread-index.sh
- [x] #2 ADR-098 författad: tunna radformen med radlängds-tak, narrativ-i-kort-principen, migrations-beslutet, växt-vägen med explicit trigger (steg B genererat index), rotation avrådd med decline-rationale, besläktad-hemvisten avgjord mot ADR-095
- [x] #3 README-rad + rot-README-räkning; docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängning i S99-resume 1 (2026-08-07): #889 mergad f1e730a6, per-jobb-grön (9 pass + D0-gatad Test suite-skip). ADR-098 landad med disk-verifierat nummer (099-reservationen respekterad); mått-driften mot Del 4-hypotesen (269/132 vs 268/131) öppet bokförd i ADR:ns kontext. Agentens scope-externa fynd — check-thread-index.sh >2 min vid 132 trådar (O(n²)-karaktär) — triageras till 157.3-bygget (samma skript-familj; grind-designen ska inte ärva kvadratisk kostnad).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
