---
id: TASK-82
title: >-
  Fynd: två guard-testsviter körs av inget CI-jobb — TASK-76:s fail-open-vakt
  bor i en av dem
status: Done
assignee: []
created_date: '2026-07-29 09:02'
updated_date: '2026-07-29 11:01'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 162000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Repot har 15 guard-testsviter i `scripts/test-*`. **13 av dem är wirade i CI.** Exakt två är det inte:

- `scripts/test-purge-staging-sentinels.mjs` — INGEN referens i `.github/workflows/**` eller `package.json`
- `scripts/test-seed-review-fixture.mjs` — dito

Verifierat 2026-07-29 genom att korsa varje `scripts/test-*`-fil mot workflows + `package.json`.

### VARFÖR DET BLEV BÄRANDE JUST NU

`TASK-76` (purge-idempotensen) landar sin fail-open-vakt — AC #3: "404 som beror på fel bas eller fel tabell fäller FORTFARANDE" — som negativa testfall i `test-purge-staging-sentinels.mjs`. Vakten som skiljer en riktig fix från ett tyst hål bor alltså **helt och hållet i en svit som ingen kör automatiskt.**

Samtidigt gäller: `ci.yml` skickar sedan `TASK-70.3` `run_staging: false` villkorslöst, så purge-jobbet kör inte ens på PR-ytan. Purge-koden har därmed **noll automatisk täckning på PR-nivå** — varken sitt jobb eller sin testsvit.

### PRE-EXISTERANDE, MEN INTE DÄRFÖR OK

`TASK-50` bokförde frånvaron två gånger, medvetet. Det som ändrats är inte formen utan LASTEN: sviten bar tidigare beskrivande tester, den bär nu en fail-open-vakt. Ett medvetet designval fattat under andra förutsättningar är inte automatiskt giltigt under de nya.

### MÖNSTRET FINNS REDAN — DET ÄR INTE NY ARKITEKTUR

`nightly.yml:246` kör `node scripts/test-ci-metrics.mjs` — exakt formen som saknas här. `test-classify-post-merge.sh` är dessutom wirad i TVÅ workflows. Det finns alltså ingen designfråga att avgöra, bara en utelämnad rad.

### FORMFRÅGA SOM KORTET SKA AVGÖRA

Var hör de hemma? `ci.yml` (som de tretton andra), `nightly.yml` (som `test-ci-metrics.mjs`), eller båda? Väg mot: `test-purge-staging-sentinels.mjs` är hermetisk (mockat API, inga secrets) och kan därför köras i den billiga klassen; `test-seed-review-fixture.mjs` bör kontrolleras separat — kräver den staging-secrets hör den inte i PR-grinden.

**Avgränsning:** kortet wirar befintliga sviter. Det skriver INGA nya tester och ändrar inte purge-koden.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Båda sviterna körs av minst ett CI-jobb — jobbnamn och run-ID redovisat per svit
- [x] #2 Placeringen motiverad per svit mot deras faktiska krav (hermetisk vs secrets-beroende); en svit som kräver staging-secrets hamnar INTE i PR-grinden
- [x] #3 Tvåsidigt bevis: en medvetet bruten assertion i vardera sviten gör CI-jobbet RÖTT — run-ID per svit, sedan återställt
- [x] #4 Ingen ny testfil och ingen ändring i purge-koden eller seed-skriptet — diffen rör wiring, inget annat
- [x] #5 Kontroll att inga FLER scripts/test-*-sviter saknar hemvist efter ändringen — korsningen körd om och redovisad
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
DONE 2026-07-29 (femtonde resumen). PR #432 (`dada5c5`), landad via kön.

BÅDA SVITERNA WIRADE I `ci.yml` / `lint`, eget steg var — insatta mellan `Test prod-deploy allowlist` och `Install shellcheck`. `+53 rader, −0`. `scripts/` byte-identiskt med `main`; `package.json` orörd (ingen kollision med `TASK-77`).

HEMVISTEN MÄTTES, ANTOGS INTE. Kortets villkor var att en secrets-beroende svit inte hör i PR-grinden. Agenten körde varje svit (a) utan `STAGING_AIRTABLE_TOKEN` i miljön och (b) med `globalThis.fetch` överskriven till `throw` via `node --import`. Exit 0 i samtliga fyra körningar — inga secrets, noll nätverkstrafik. `test-seed-review-fixture.mjs` föll inte ut som secrets-beroende eftersom seed-skriptets enda `process.env`-läsning ligger INUTI `main()`, som bara körs som CLI; testet importerar de pura funktionerna.

INTE `nightly.yml`: nattjobbet bär MÄTARE (`test-ci-metrics.mjs`, `test-flake-matserie.mjs`); dessa två är GRINDAR, och båda validerar `.purge-staging-policy.json` PÅ DISK — vilket bara är meningsfullt före landning. `TASK-50`:s tidigare beslut revs ÖPPET i både commit-meddelande och `ci.yml`-kommentar, inte tyst.

AC #3 — TVÅSIDIGT BEVIS MED RUN-ID PER SVIT, verifierat av orkestreraren:

  bas  3ed4623  inget brutet                          30442166453  GRÖNT
  A    c9b774b  purge: TASK-76:s fail-open-vakt inverterad  30442765425  RÖTT
  B    f250dc2  seed: bas-guarden inverterad               30443253072  RÖTT
  slut dada5c5  inget brutet                          30443850689  GRÖNT

Bevis B kördes med purge redan återställd — `lint` stannar på första felande steg och purge ligger först, så seed-steget hade annars aldrig fällt något. Stegvisa utfall verifierade med `gh run view --job`, inte bara jobbets rollup.

CI-MÄTT KOSTNAD ur `30443850689`: purge-steget 4,07 s, seed-steget 0,05 s, summa ≈4,1 s. Jobbet gick på 1 min 1 s mot `timeout-minutes: 5`. CI-mätt, inte projicerat från de lokala talen.

AC #5: korsningen omkörd — 17 av 17 sviter har hemvist, 0 saknar.

DoD #3 stängd av orkestreraren efter landning: alla instansierade jobb pass på `#432`; A11y/Staging/purge SKIPPED per `run_staging`/`run_a11y: false`.

═══ KORTET SJÄLVT BAR ETT FEL, OCH AGENTEN FÅNGADE DET ═══

Kortet (mintat av orkestreraren) påstod att `test-classify-post-merge.sh` är "wirad i TVÅ workflows". FEL. Verifierat: `ci.yml:628` kör den; `post-merge.yml:101` är en KOMMENTAR.

Orsaken är värd att bära vidare: orkestreraren använde `grep -rl <skriptnamn>` och räknade OMNÄMNANDEN som wiring. Det är samma felklass som restlistans kontroll hade i morse — ett mönster som matchar fel sak och vars gröna svar därför inte betyder det man tror. Begången av orkestreraren fyra timmar efter att den lagat exakt den klassen hos någon annan.

Agenten byggde sin egen AC #5-korsning på faktiska körrader (`bash`/`node`/`sh` + skriptnamn) med kommentar-rader filtrerade, och noterade att en ren namn-grep ger tre falska träffar bara på `test-vale-regression.sh`. Den korsningen ligger i scratchpad, inte i repot (AC #4 förbjuder nya filer) — **kandidat för eget kort om den ska bli stående grind.**
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
