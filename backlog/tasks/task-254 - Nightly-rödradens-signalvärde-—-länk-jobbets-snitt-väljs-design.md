---
id: TASK-254
title: Nightly-rödradens signalvärde — länk-jobbets snitt väljs (design)
status: To Do
assignee: []
created_date: '2026-08-17 06:45'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 473000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-17 (22 nätters run-loggar): Nightly röd 19 raka nätter; Länkkontrollen fällde 15/19 och är per ADR-082 MEDVETET nattens hem för extern länkröta — rödraden är därmed strukturellt röd och har tappat signalvärde, medan nattvakten redan filtrerar länk-only-nätter (nightly-watchdog.yml ~rad 165). Options-rymd (öppen): (a) länk-jobbet till eget schemalagt workflow med egen larmkedja, (b) continue-on-error + eget larmsnitt i Nightly, (c) medvetet behålla som är. Rör ADR-082:s implementation, inte dess beslut — ADR-baren prövas vid val. Grillnings-kandidat: Marcus startar.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Options-rymden kartlagd med kostnad/vinst per val (inkl. hur larmkedjan och nattvakten påverkas)
- [ ] #2 Marcus-beslut taget (grillning); ADR-baren prövad öppet
- [ ] #3 Vald form mekaniserad + ADR-082 § Updates amenderad vid behov
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
