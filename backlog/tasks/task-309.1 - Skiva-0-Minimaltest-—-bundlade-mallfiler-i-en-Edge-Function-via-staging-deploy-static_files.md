---
id: TASK-309.1
title: >-
  Skiva 0: Minimaltest — bundlade mallfiler i en Edge Function via
  staging-deploy (static_files)
status: To Do
assignee: []
created_date: '2026-08-23 13:56'
updated_date: '2026-08-23 14:42'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 562000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Repots disciplin: nytt approach testas minimalt innan full implementation. ADR-125 § 4 sätter static_files som primär bundlingsväg men maskinen saknar Docker, så deployen går via CLI:ts API-bundling där static_files-stödet är obelagt. Skivan deployar en kastbar EF till staging som läser en delad mallfil och ett typsnitt ur _shared/mallar-katalogen och returnerar byte-längder; mäter skarpt; bokför utfallet. Faller primärvägen prövas fallback-stegen i ADR-125 § 4 i ordning. Täcker användarberättelser: 25, 32.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 En minimal staging-EF deployad med static_files-glob mot en delad _shared-katalog läser en HTML- och en TTF-fil skarpt (bytes + storlek verifierade i svaret), via samma deploy-väg som repot använder (CLI utan Docker = API-bundling)
- [x] #2 Utfallet (fungerar / fungerar inte, verbatim CLI-utdata) bokfört i ADR-125 § Updates; om det fallerar: fallback (b) text-import prövad på samma sätt, och vald väg bokförd
- [x] #3 Minimaltestets EF rivs efter mätningen eller bokförs som staging-only testharness i allowlist-policyn — aldrig kvar omärkt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->
