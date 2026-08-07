---
id: TASK-157.1
title: 'Skiva: ADR-098 — registrets tunna radform + växt-vägen'
status: To Do
assignee: []
created_date: '2026-08-07 11:32'
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
- [ ] #1 Premiss-pass: nästa lediga ADR-nummer disk-verifierat vid byggtillfället; registrets aktuella mått ommätta (wc -l, wc -c, radlängds-fördelning); besläktad-deklarationernas nuvarande validering läst i check-thread-index.sh
- [ ] #2 ADR-098 författad: tunna radformen med radlängds-tak, narrativ-i-kort-principen, migrations-beslutet, växt-vägen med explicit trigger (steg B genererat index), rotation avrådd med decline-rationale, besläktad-hemvisten avgjord mot ADR-095
- [ ] #3 README-rad + rot-README-räkning; docs-grindarna gröna; PR armerad, per-jobb-grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
