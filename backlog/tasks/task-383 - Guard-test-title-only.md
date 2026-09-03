---
id: TASK-383
title: >-
  Fynd: acceptance-hermetik-självtestet nådde 12-minuterstaket — mät per fil och
  dela upp
status: To Do
assignee: []
created_date: '2026-09-03 14:33'
updated_date: '2026-09-03 14:34'
labels:
  - ready-for-agent
dependencies: []
ordinal: 685000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Bakgrund

CI-jobbet `Acceptance — tvåsidigt bevis (hermetik-självtest)`
(`.github/workflows/ci-suite.yml`, jobb `acceptance-sjalvtest`, steget kör
`npm run test:acceptance:sjalvtest` → `scripts/hermetik-sjalvtest.mjs`, EN
fullständig körning av acceptance-sviten med `HERMETIK_SJALVTEST=1` och
`--retries=0`, inte två) nådde sitt 12-minuterstak fyra gånger 2026-09-03 —
verifierat mot GitHub Actions attempt-API, inte bara mot mätserien i den
ursprungliga uppdragstexten:

- PR-run `33758913155` attempt 1 (#2267): cancelled, 13:04:32→13:16:41 = 12m09s
- PR-run `33763097230` attempt 1 (#2267): cancelled, 13:47:40→13:59:59 = 12m19s
- PR-run `33760261291` attempt 1 (#2272): cancelled, 13:17:47→13:29:48 = 12m01s
- Kö-run `33765539135` attempt 1 (#2267, merge_group): cancelled, 14:13:13→14:25:31 = 12m18s

(Not: tre av de fyra runsen visar i dag "success" i gh run view eftersom
attempt 2 — en omkörning efter cancellationen — lyckades; attempt 1s
jobb-nivå-cancellation är ändå den mätta timeout-händelsen ovan.)

Gröna körningar samma dag (attempt 2 av samma tre PR-runs): 11m55s
(33758913155), 9m56s (33763097230), 11m21s (33760261291).

Acceptance-klassen växte i S115 med tests/acceptance/anmalan-avbokning.acceptance.test.ts
(+9 tester) och tests/acceptance/anmalan-ombokning.acceptance.test.ts
(+18 tester), och självtestet kör HELA klassen som sitt tvåsidiga bevis —
varje ny fil i klassen förlänger alltså även självtestets körtid, inte bara
acceptance-jobbets.

Taket höjdes 12→20 min som enabling-detour i samma PR som denna kortmintning
(S115, orkestrerare Fable) — ren headroom-höjning, ingen delning eller
per-fil-optimering. Se .github/workflows/ci-suite.yml rad ~524 för
kommentaren med mätserien.

## Vad detta kort ska göra

Mät körtiden PER FIL i acceptance-klassen (inte bara jobbets totalsumma) och
lägg ett konkret uppdelningsförslag — shardning (samma mönster som
acceptance-jobbets Acceptance (hermetisk) (1/2/3)-shards) eller ett riktat
urval via ACCEPTANCE_URVAL/acceptance_selection — med uppskattad tidsvinst.
Ompröva sedan om 20 min är rätt tak givet den uppmätta per-fil-fördelningen,
eller om uppdelningen gör ett lägre tak möjligt igen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Körtid per acceptance-fil i självtestets HERMETIK_SJALVTEST=1-körning är mätt och bokförd i kortet
- [ ] #2 Ett konkret förslag på uppdelning (shard eller urval via ACCEPTANCE_URVAL) finns, med uppskattad tidsvinst mot dagens helsviträkning
- [ ] #3 20-minuterstaket är omprövat mot mätningen — bekräftat som rätt nivå eller sänkt med ett motiverat nytt värde
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
