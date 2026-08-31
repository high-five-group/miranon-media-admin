---
id: TASK-355
title: >-
  Per-inbetalnings-originalreferens i kreditkvittoflödet — migration bortom
  entydighets-guarden
status: To Do
assignee: []
created_date: '2026-08-31 13:09'
labels: []
dependencies: []
ordinal: 658000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppföljning till 346.9:s entydighets-guard (orkestrerar-beslut under mandat, S113): i dag används originalkvittot ENDAST när exakt en levande kandidat finns (OriginalKvittoUppslag entydigt); vid flertydighet fail-loud med Gunilla-skäl utan bränt kvittonummer. Full lösning är en per-inbetalnings-referens (kvitton.inbetalning_id-kedjan hela vägen in i kreditflödet) så hänvisningen alltid är exakt — en schemamigration + EF-ändring. KRÄVER MARCUS GO (arkitekturbeslut; grillnings-kandidat).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus GO inhämtat på migrationsformen innan bygge
- [ ] #2 Kreditkvitto refererar rätt original även vid flera inbetalningar på samma anmälan
- [ ] #3 Entydighets-guardens fail-loud-väg kvarstår som skyddsnät
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
