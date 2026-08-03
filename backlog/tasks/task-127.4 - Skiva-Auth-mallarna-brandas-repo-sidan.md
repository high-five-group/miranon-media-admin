---
id: TASK-127.4
title: 'Skiva: Auth-mallarna brandas (repo-sidan)'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-03 11:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.1
parent_task_id: TASK-127
ordinal: 208000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Auth-mailen (inbjudan, återställning) får brandad svensk copy i Miranon-ton med avsändare från den sändande subdomänen. Skivan gör repo-sidan komplett och producerar den exakta panel-checklistan för Marcus-momenten (SMTP-koppling, subdomänverifiering, DMARC) — själva panelhandlingarna är Grind 0-paketet i T46, inte denna skiva.

Täcker användarberättelser: 1, 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Invite- och återställningsmallarna bär svensk brandad copy och korrekt avsändarform från sändande subdomänen
- [ ] #2 Konfigurationen ligger versionerad på repo-sidan där plattformen tillåter det
- [ ] #3 Marcus-momenten (SMTP-värden, subdomänverifiering, DMARC-post) dokumenterade som exakt checklista i T46-kartan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
