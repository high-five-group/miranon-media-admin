---
id: TASK-330
title: >-
  Beslut: review-utlåtandets kortId är singulär — bunt-PR:er tappar
  AC-prövningen
status: To Do
assignee: []
created_date: '2026-08-26 07:13'
labels:
  - ready-for-human
  - beslut
dependencies: []
ordinal: 603000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fem mätta instanser 2026-08-26 (#1978, #1982, #1986, #1987, #1988) där en PR rör flera kort samtidigt (bunt-landning) — review-utlåtandets schema bär ett singulärt kortId-fält, så AC-prövningen (utlåtandet hämtar kortets AC verbatim och prövar dem, ADR-105 beslut 5) kan bara ske mot ETT av korten en bunt-PR faktiskt rör. 173.5-agentens kartlagda options-rymd: (A) en PR per kort — river bunt-landningsformen som redan är etablerad praxis; (B) kortIdn: string[] med .default([]) + kortId kvar på AcProvning för bakåtkompatibilitet, mönster hämtat från 173.2:s .default()-migrering, kräver en superRefine-omskrivning i schemat + ett tillägg i ADR-105; (C) låt ligga — bunt-PR:er fortsätter sakna AC-prövning på alla kort utom ett. Rekommendation: B.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus väljer väg A, B eller C
- [ ] #2 Vid val B: en skiva myntas under TASK-173 (t.ex. TASK-173.7) och ADR-105 § Updates får ett tillägg som dokumenterar beslutet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
