---
id: TASK-165
title: 'Länkröta-ärendet #464 — nattliga fynden triageras och släcks'
status: To Do
assignee: []
created_date: '2026-08-08 17:11'
labels:
  - ready-for-agent
dependencies: []
ordinal: 308000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Stående ärende #464 (öppnat 2026-07-30, icke-blockerande per ADR-082 beslut 4) är rött; senaste fynd-kommentaren 2026-08-08 pekar på körning 31236116308 (HEAD b39ffa3c). Nattliga länkkontrollen täcker BÅDE intern och extern yta — PR-grinden ser sedan ADR-082 bara den interna. Uppgiften: läs den senaste röda körningens faktiska fynd, klassa varje träff (extern röta ⇒ .lycheeignore-post med motivering, precedent digg.se/gitlab-429 i L-historiken; intern ruttnad pekare ⇒ fixa pekaren), landa fixen, verifiera att nightly-links går grön, och stäng #464 enligt ärendets egen stängningsregel ('stäng när körningen är grön igen').
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Varje fynd i senaste röda körningen klassat extern/intern med motivering i kortet
- [ ] #2 Fix landad (.lycheeignore och/eller pekar-fixar)
- [ ] #3 nightly-links-körning grön efter fixen (dispatch eller nästa natt)
- [ ] #4 Ärendet #464 stängt med motivering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
