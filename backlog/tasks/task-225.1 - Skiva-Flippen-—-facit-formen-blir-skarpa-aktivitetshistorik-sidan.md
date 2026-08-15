---
id: TASK-225.1
title: 'Skiva: Flippen — facit-formen blir skarpa aktivitetshistorik-sidan'
status: Done
assignee: []
created_date: '2026-08-15 09:18'
updated_date: '2026-08-15 10:48'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-225
ordinal: 413000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Promoveringens kärna (ADR-103 B2a): prototypens form blir den skarpa komponentens — formen byggs ALDRIG om, den flyttas. Skarpa datavägar behålls oförändrade. Efter skivan renderar skarpa routen (utan variant-parameter) exakt facit-formen, och ?variant=a visar samma sak. Acceptance-sviterna uppdateras i samma landning (DoD: gröna tester); task-215-flaket beaktas — uppdaterad svit får inte ärva flakmönstret. Täcker användarberättelser: 1, 2, 3, 4, 6.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Skarpa /mer/aktivitetshistorik (utan ?variant) är identisk med facit tasks/sessions/bilagor/s106-aktivitetslogg/facit.json ytan 'aktivitetshistorik-sidan' i laddat läge, desktop + mobil
- [ ] #2 Tomläge, felläge och laddläge bär samma sidkrom (rund chevron + text-3xl-rubrik i ALLA tillstånd, per manifestets not)
- [ ] #3 Bägge acceptance-sviterna för routen är uppdaterade mot nya formen och gröna — externt beteende (rubrik, filterflöden inkl. datumval och dess exklusivitet mot tidsperioden, statusradens copy, radernas länkmål), aldrig klassnamn
- [ ] #4 Prototyp-växeln, prototypfilen och snapshot-riggen står KVAR orörda — rivning sker först efter Marcus stämpel
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i PR #1335 (merge b924fb1b). Formen flyttad verbatim ur prototypen (ADR-103 B1/B2); acceptance 19/19 inkl nytt verbCopy-fall; facit-granskning utförd mot tasks/sessions/bilagor/s106-aktivitetslogg/facit.json; Marcus godkand-stämpel satt 2026-08-15; substratet rivet EFTER stämpeln (check-facit 0 ogodkända).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s106-aktivitetslogg/facit.json utförd och rapporterad
- [ ] #6 check-facit.sh grön genom hela kedjan — rivning omöjlig medan godkand är null
- [ ] #7 Marcus godkand-stämpel via facit-godkännande FÖRE all rivning av prototyp-substrat
<!-- DOD:END -->
