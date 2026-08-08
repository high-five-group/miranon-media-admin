---
id: TASK-161.6
title: 'Skiva: C — verify:ci-parity-sektionen till handlingsregel + pekare'
status: To Do
assignee: []
created_date: '2026-08-07 19:09'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.5
parent_task_id: TASK-161
ordinal: 296000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: näst största auto-load-sektionen (6 976 tecken) blir regel-tät utan förlorad handlingskraft. Täcker användarberättelser: 2, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CLAUDE.md § verify:ci-parity omformad i samma form som 161.5: handlingsregeln (kör INTE före varje push + de tre lägena) bevaras ordagrant; mätserierna, härlednings-mekaniken och diff-klassnings-detaljerna flyttar till research-filen/skriptets huvud med pekare; dubbletten av mättalen (två kopior i samma fil, 73 rader isär) elimineras till EN
- [ ] #2 Samma prövnings- och bevarande-regler som 161.5 (i-ögonblicket-kriteriet, varför-block orörda utan prövning, lychee på pekare)
- [ ] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön; tecken-tal före/efter i PR-texten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
