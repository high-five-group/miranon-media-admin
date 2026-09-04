---
id: TASK-386
title: >-
  CI: lint/docs-jobbens 5-minuterstak fällde fyra körningar på npm-latens
  2026-09-04 — höjt till 10
status: To Do
assignee: []
created_date: '2026-09-04 08:15'
updated_date: '2026-09-04 08:15'
labels:
  - ready-for-agent
dependencies: []
ordinal: 686000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Bakgrund

`.github/workflows/ci.yml`-jobben `lint` (Lint + Audit + TypeCheck) och
`docs` (Docs link check) bar `timeout-minutes: 5` sedan TASK-82:s ursprungliga
CI-mätning (~1 min jobbtid före det sista steget). Fyra körningar 2026-09-04
mellan 07:50 och 08:10 föll på exakt det taket, samtliga `cancelled` på
npm-latens under `npm ci`/`audit-ci`, inte en trädregression:

- merge_group-run `33850613813` (PR #2264): Lint dog i steget "Install
  dependencies" (`npm ci`), kancellerad 07:56:12, jobbet startade 07:51:45
  (~4m27s in).
- PR-run `33850992570` (PR #2284): Lint dog i "Audit dependencies (audit-ci
  with allowlist)"; Docs link check dog i "Install dependencies".
- Dess rerun `33851503642` (PR #2284): Lint dog igen i "Audit dependencies"
  — kancellerad 08:08:06, jobbstart 08:02:53 (5:13). Docs link check
  lyckades denna gång (08:07:02) — ojämnt utfall mellan försöken, samma
  bakomliggande orsak (npm-latens, inte en trädregression).
- PR-run `33851282508` (PR #2269): samma mönster — Lint dog i "Audit
  dependencies" (kancellerad 08:05:04, start 07:59:51, ~5:13), Docs dog i
  "Install dependencies" (kancellerad 08:05:20, start 08:00:07, ~5:13).

Verbatim ur run `33851503642`, job `100955216172` (Lint), rad 204-235:

```
2026-09-04T08:03:02.7190285Z Cache hit for: node-cache-Linux-x64-npm-5d7049bd73d53c1388d60c9acad63edd3e7e4a7217a6df07b0ad5c6d0d3e08fe
2026-09-04T08:03:05.7070954Z Cache restored successfully
2026-09-04T08:03:05.7347661Z ##[group]Run npm ci
2026-09-04T08:07:34.6460927Z added 643 packages in 4m
2026-09-04T08:08:06.8360099Z ##[error]The operation was canceled.
```

`npm ci` tog alltså 4 min TROTS cache-träff, mot ~1 min i TASK-82:s
ursprungsmätning — resten av jobbet (audit-ci, biome, typecheck, m.m.) fick
under 1 min kvar av taket innan kancellering. Senaste gröna Lint-körning
(main-push `33778799749`, 2026-09-03 16:28) tog 3 min 22 s totalt (16:28:13→
16:31:35) — 5-minuterstaket var alltså redan tunn marginal mot en enda
långsam `npm ci`, inte bara mot en trädregression.

GitHub Status och status.npmjs.org rapporterade "operational" runt tiden för
incidenten enligt uppdragets underlag (ej egenverifierat i detta kort) — det
läses som npm-registry-latens, inte ett fullständigt avbrott.

## Åtgärd

`timeout-minutes` höjt 5→10 för BÅDE `lint` och `docs` i `ci.yml`
(rad ~506 och ~2033). Valt som 2× det tidigare taket — ett golv som
absorberar npm-latens av den mätta storleksordningen, INTE en projicerad
garanti mot framtida latens. Kommentaren vid rad ~1692-1694 (som tidigare
bar TASK-82:s ursprungsmätning) uppdaterad med dagens avläsning: datum,
run-ID:n, "npm ci 4 min med cache-träff", "audit-ci killad vid 5:00-taket".

`review-backstopp` (5 min) och `changed`/`ci-passed` rördes INTE — de kör
inga npm-beroende steg (review-backstopp har medvetet inget `npm ci`,
`changed` har egna korta steg).

## Syskon-kort

TASK-383 (To Do) rör samma dags CI-timeout-problematik men i test-sviten
(test-fast/acceptance-jobben, 12→20 min) — separat kort, separat jobbmängd,
samma bakomliggande npm/nätverks-latensklass men inte samma jobb.

## Verifiering

- `actionlint -color -ignore 'unexpected key "queue" for "concurrency" section'` — grönt, exit 0.
- `yamllint .github/workflows/ci.yml` — grönt, exit 0.
- `node scripts/verify-ci-parity.mjs --list` (paritetsgrinden, preflight) —
  "✅ Paritets-preflight: jobbmängden + suite-input-invarianterna +
  diff-klassningens koppling matchar policyn." exit 0. `.ci-parity-policy.json`
  bär inga `timeout-minutes`-värden (verifierat med grep) och behövde därför
  ingen ändring.
- `npm run typecheck`, `npx @biomejs/biome check .`, `npm run build` — alla
  gröna (irrelevanta för en ren YAML-ändring men körda enligt uppdrag).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 timeout-minutes 10 för lint och docs, actionlint grönt, paritetsgrinden grön
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
