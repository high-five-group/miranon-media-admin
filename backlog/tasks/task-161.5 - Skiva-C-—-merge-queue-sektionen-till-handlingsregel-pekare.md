---
id: TASK-161.5
title: 'Skiva: C — merge-queue-sektionen till handlingsregel + pekare'
status: To Do
assignee: []
created_date: '2026-08-07 19:07'
labels:
  - ready-for-agent
dependencies:
  - TASK-161.2
parent_task_id: TASK-161
ordinal: 295000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: auto-load-ytans största sektion (11 660 tecken) krymper till regel-tät form utan att någon handlingsregel förloras — underlaget bor hemma och pekas. Täcker användarberättelser: 2, 6
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CLAUDE.md § Landning sker via MERGE QUEUE omformad: handlingsreglerna bevaras ORDAGRANT (armera med --auto · armera aldrig under bygg-agent · draft-eller-armera-regeln · disambiguerings-receptet · autoMergeRequest-tabellen · svep-regeln) — underlaget (strict-historiken, mäthistorikerna, dequeue-mätningen, Temporal-namngivningen) flyttar till sin utpekade hemvist (CONTRIBUTING § Landnings-ordningen / ADR-076 / ADR-096 / research-filer) med pekare
- [ ] #2 Varje flytt prövad mot i-ögonblicket-kriteriet (regeln gäller där ingen slår upp en ADR) och de befintliga varför-raden-står-här-blocken RÖRS INTE utan explicit prövning bokförd i PR-texten; ingen kunskap raderas — allt flyttat är lychee-verifierat nåbart
- [ ] #3 Docs-grindarna gröna lokalt; PR armerad, per-jobb-grön; diffen visar sektionens tecken-tal före/efter i PR-texten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
