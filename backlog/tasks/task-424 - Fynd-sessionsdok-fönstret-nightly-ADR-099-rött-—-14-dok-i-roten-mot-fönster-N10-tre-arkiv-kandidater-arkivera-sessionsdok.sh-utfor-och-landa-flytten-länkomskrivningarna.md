---
id: TASK-424
title: >-
  Fynd: sessionsdok-fönstret (nightly, ADR-099) rött — 14 dok i roten mot
  fönster N=10, tre arkiv-kandidater; arkivera-sessionsdok.sh --utfor och landa
  flytten + länkomskrivningarna
status: To Do
assignee: []
created_date: '2026-09-07 15:30'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 754000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: Nightly-körning 34088565869 på a29d8192:s föregångare d99db0ec (2026-09-07 05:54 UTC), jobbet 'Sessionsdok-fönstret (natt-grind, ADR-099)' rött; reproducerat lokalt 2026-09-07 (S123 resume 1): 'bash scripts/check-sessionsdok-fonster.sh' exit 1 med 'DRIFT: roten bär 3 arkiv-kandidat(er) — fönstret (N=10) är överskridet', torrkörningen rapporterar Kvar 14, Flaggade (fail-closed) 3, Skulle arkiveras 3, Länkreferenser som skulle omskrivas 31 (Pass A 31, Pass B 0). Grinden har varit röd sedan 2026-09-05 (S123 Del 1 § Ingångstillstånd). Åtgärd: kör 'scripts/arkivera-sessionsdok.sh --utfor' enligt grindens egen anvisning, landa flytten och länkomskrivningarna som D0-PR. De tre FLAGGADE dokumenten hanteras enligt skriptets egen fail-closed-anvisning — aldrig genom att kringgå den. Dok med lifecycle paused eller active får aldrig flyttas (S112, S118, S122 pausade; S123 aktiv).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 scripts/check-sessionsdok-fonster.sh exit 0 lokalt efter flytten, utdatan bokförd i notes
- [ ] #2 Samtliga omskrivna länkreferenser verifierade: npm run check:docs 14/14 gröna (länkkontrollen ingår)
- [ ] #3 Inget dok med lifecycle paused eller active flyttat; de tre flaggade dokumenten bokförda med skriptets skäl och vald hantering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
