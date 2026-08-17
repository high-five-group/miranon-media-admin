---
id: TASK-262
title: >-
  Fynd: seed-ankarets värden sammanfaller med betalnings-testernas skrivvärden —
  tre assertioner tautologiska
status: To Do
assignee: []
created_date: '2026-08-17 09:54'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 479000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-256-agentens läsfynd (2026-08-17): staging-seed-ankaret bär exakt de värden betalnings-testerna i tests/api/update-record.staging.test.ts skriver (slutbetalning='Mottagen', noteringarna 'ZZ-18.8-*', påminnelse-timestamp). Mönstret mutera→assertera→restaurera är tillståndsbevarande, så 'original' == skrivvärdet → tre läs-tillbaka-assertioner kan ALDRIG fälla (falsk täckning). Att ändra delad staging-fixturdata är ett beslut om basen som förstklassig leverabel (ADR-063) — Marcus/orkestrerar-beslut, ej agentens. Full detalj: task-256 § Implementation Notes + Oväntat fynd.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus-beslut: seed-ankarets värden byts till icke-sammanfallande sentinels (och vilka), eller tautologin accepteras öppet med motivering
- [ ] #2 Vid byte: assertionerna verifierat fällbara (negativt bevis) + purge-/seed-policyn opåverkad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
