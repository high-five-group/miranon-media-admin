---
id: TASK-365
title: >-
  Post-merge-verifieringen kan aldrig fånga en kod-landning som följs av en
  docs-push — sviten avbryts av nästa push och skippas för docs-only
status: To Do
assignee: []
created_date: '2026-09-02 10:49'
updated_date: '2026-09-18 22:50'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 663000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (S113 resume 8, 2026-09-02): tests/e2e/persondetalj-betalningar-fellage.staging.test.ts var RÖTT från födseln (PR #2175, 2026-08-31, strict-mode: h2 'Betalningar' + h3 'Senaste inbetalningar' matchar samma getByRole utan exact) och kördes aldrig grönt post-merge förrän 2026-09-02 08:00 (run på e99ed65b) — sedan ytterligare två röda (fc91f0be 09:03 avbruten på 12-min-taket, 56ae3c46 09:25).

ROTORSAK — RÄTTAD 2026-09-19 (N8, ur S126:s CI-djupgranskning § N3): kortets tidigare rotorsaksbeskrivning var FEL och är nu ersatt av den MÄTTA mekanismen. Den faktiska felklassen har ingenting med concurrency-avbrott att göra (den delen — PR #2193:s körning 9dca0e56 avbruten av docs-pushen 2d3647f2 — var korrekt beskriven och står kvar som en verklig, men SEPARAT, instans). Den bärande rotorsaken är: `post-merge.yml` skickade bara toppcommiten i en push (`github.sha`) till `scripts/classify-post-merge.sh`, som därmed aldrig såg resten av spannet. Landar merge-kön flera PR:er i EN push (`max_entries_to_merge: 3`) och toppen råkar vara en textändring, klassar skriptet hela pushen som docs-only och hoppar `Staging (API + E2E)`, `A11y (axe-runner)` och de två städjobben — trots att riktig kod låg under. Mätt av KG1 över 601 pushar: 73 pushar bar mer än en landning, och i 60 av dem var toppen text medan spannet bar kod — ett verifierat hål (15 av 15 stickprov "skipped" med grön körning; kontrollgrupp 6 av 6 med kodtopp körde sviten). Exponeringen stängdes alltid av nästa kodlandning (median 0,57 h, längst 33,2 h).

Repot hade redan rätt diagnos, i en ANNAN källa: tråden `tasks/threads/T166-post-merge-klassningen-laser-sista-pr-en-i-ko-batchen.md` beskrev exakt denna mekanism 2026-08-21, med tre namngivna vägval. De två (detta kort och T166) pekade tidigare inte på varandra.

LÖST: vägval 2 ur T166 (billigast, ligger närmast mekanismens egen fail-closed-princip) är BYGGT i TASK-450.2 (N3), landat via PR #2526. `post-merge.yml` skickar nu `BEFORE` (`github.event.before`) vid sidan av `SHA`; `classify-post-merge.sh` räknar stegen från toppcommiten bakåt via första föräldern till `BEFORE` — fler än ETT steg (flera landningar i samma push) ⇒ `docs_only=false` direkt, full svit, fail-closed på varje kant (BEFORE tomt/noll-SHA, tak på tio steg, API-fel). Skarpt bevisat mot en verklig KG1-instans (269f6d476a, PR #2448, topp docs / spann kod) och en enkelpost-landning (484ca305). T166 är stängd på denna grund (2026-09-18).

Kvarvarande, INTE täckt av N3 (bokfört öppet, inte löst av denna rättelse): (3) nattnätets rött nådde tidigare ingen larmväg till orkestreraren utöver ci-natt-ärendet — se kortets egna AC #3/notering om heartbeat-svepet och 'Larm vid rött post-merge' som avslutade success i minst sex röda körningar utan att någon agerade. Detta kort (TASK-365) förblir öppet för den delen; se implementation notes för r1-rättelsens fulla utredning av larmkedjan.

Se T166 för fullständig mekanik, mätserie och stängningsnot. Kopplat: TASK-239 (acceptance-tak), TASK-364 (testfixen), ADR-077 (klassning/dedup), TASK-450.2/N3 (den byggda fixen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Post-merge-körningen för en kod-landning avbryts inte av en efterföljande docs-only-push (mätt: två pushar inom 2 min, den första kod, sviten fullföljs)
- [ ] #2 En docs-only-push efter en overifierad kod-landning kör (eller ärver) verifieringen i stället för att skippa — bevisat med ett kontrastpar
- [ ] #3 Heartbeat-svepet rapporterar senaste nightly-körningens rött som RÖTT-rad
- [ ] #4 Paritetspolicyn och verify:ci-parity gröna efter ändringen; workflow-lintarna gröna med repots ignore-form
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RÄTTELSE 2026-09-02 (review r1 PR #2218): premissen 'post-merge-körningen avbröts/skippades efter #2175' är FALSIFIERAD — Post-merge körde direkt efter #2175:s merge (53681e08, 2026-08-31 10:50Z) och föll 11:05 (run 33384227389) med samma strict-mode-fel. Concurrency-avbrottet gällde #2193:s körning (9dca0e56, cancelled av docs-pushen 2d3647f2) — den delen står. Den PRIMÄRA luckan är larmkedjan: jobbet 'Larm vid rött post-merge' avslutades success i minst sex röda körningar (~47 h) utan att en människa eller orkestreraren agerade. AC (c) 'nattnätets rött når heartbeat-svepet' ska breddas till: post-merge-rött OCH nightly-rött rapporteras som RÖTT-rad i svepet, och larm-jobbets faktiska mottagare kartläggs.
<!-- SECTION:NOTES:END -->
