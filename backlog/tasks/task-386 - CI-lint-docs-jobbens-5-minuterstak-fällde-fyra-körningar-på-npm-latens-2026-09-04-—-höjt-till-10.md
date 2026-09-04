---
id: TASK-386
title: >-
  CI: lint/docs-jobbens 5-minuterstak fällde fyra körningar på npm-latens
  2026-09-04 — höjt till 10
status: Done
assignee: []
created_date: '2026-09-04 08:15'
updated_date: '2026-09-04 09:32'
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
- [x] #1 timeout-minutes 15 för lint, 10 för docs, actionlint grönt, paritetsgrinden grön
- [x] #2 audit-steget bär fetch-timeout 90 s och 4 omförsök, källmärkt i kommentaren
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Andra mätningen, samma dag (2026-09-04)

Efter första höjningen (5→10) föll lint-jobbet en femte gång: run
`33852769123`, job `100964013950` (omkörning sedan npm börjat svara igen).
Startade 08:37:28. Install dependencies 08:37:37→08:41:56 (~4m19s).
Audit dependencies (audit-ci) gick GRÖNT denna gång men tog ~5 min
(08:41:56→08:46:02) — npms fetch-timeout är 300 s, så detta var inte
längre bara en långsam `npm ci` utan genomgående npm-latens. Biome,
TypeScript ×2, actionlint, yamllint och de nio check:docs-grindarna gick
alla gröna (08:46:02→08:46:22). Jobbet kancellerades kl 08:47:39/08:47:40
(10 min 12 s totalt) mitt i steget "Test gatekeeper script suites
(frontmatter / checklists / hook / ci-wait)" — 10-minuterstaket (från
första höjningen) räckte inte.

Docs-jobbet i SAMMA run (job `100964016212`, Docs link check) gick grönt
på 5 min 45 s (08:19:18→08:25:03) — gott och väl inom det befintliga
10-minuterstaket.

Åtgärd: `timeout-minutes` för `lint` höjt 10→15 — dagens uppmätta värsta
fall (~12 min: ~4-5 min npm ci + ~5 min audit-ci + resten av jobbet) plus
marginal, INTE en projektion mot framtida latens. `docs` orörd (kvar på
10) med hänvisning till samma runs gröna 5m45s-mätning.

Verifierat efter ändringen: actionlint (pinnad 1.7.12) grönt exit 0,
yamllint (pinnad 1.38.0) grönt exit 0, paritetsgrinden
(`node scripts/verify-ci-parity.mjs --list`) grönt exit 0 — "Paritets-
preflight ... matchar policyn."

Ny commit på samma PR (#2288, redan armerad av Marcus — orörd av detta
kort). Grenen: ci/lint-docs-timeout-10.

## Tredje mätningen och åtgärden: audit-ci env-tuning (2026-09-04)

Ett höjt jobb-tak (10 min) räckte inte heller: merge_group-run 33857044952
(job 100972648049) föll med conclusion `failure` (inte cancelled) — `npm ci`
gick igenom, men "Audit dependencies (audit-ci with allowlist)" hängde
09:16:00→09:21:01 (5m01s, matchar npm:s default fetch-timeout 300000ms
exakt) och kraschade med "code undefined: / Exiting... / exit code 1"
(verbatim ur job-loggen). Samma dags flapping-mönster bekräftat via tre
andra körningars audit-ci-steg: 33852769123 grönt 08:41:56-08:46:02
(~4m06s), 33855429327 grönt 08:54:37-08:55:24 (~47s, snabbt fönster).

Research (web-research-disciplinen, källor citerade i ci.yml-kommentaren
vid audit-ci-steget):
- docs.npmjs.com/cli/v11/using-npm/config: fetch-timeout default 300000ms,
  fetch-retries default 2 ("retry idempotent read requests ... network
  failures or 5xx HTTP errors"), fetch-retry-mintimeout 10000ms,
  fetch-retry-maxtimeout 60000ms. Env-form NPM_CONFIG_<KEY>, case-
  insensitive, bekräftad.
- Källkodsläsning (npm/cli -> @npmcli/arborist lib/audit-report.js):
  `npm audit` går via `npm-registry-fetch` (samma klient npm ci/install
  använder) mot /-/npm/v1/security/advisories/bulk — bekräftar att
  NPM_CONFIG_FETCH_TIMEOUT/FETCH_RETRIES faktiskt honoreras.
- npm/npm-registry-fetch README: opts.timeout default 300000 "Time before
  a hanging request times out"; opts.fetchRetries default 2, mappar från
  npm:s fetch-retries.
- github.com/IBM/audit-ci lib/audit.ts (KÄLLKOD, inte bara README):
  `PARTIAL_RETRY_ERROR_MSG = { npm: ["not support audit"], yarn: ["503
  Service Unavailable"], pnpm: [] }` — audit-ci:s EGEN --retry-count
  triggas för npm BARA av felmeddelanden som innehåller "not support
  audit". Loggens "code undefined: / Exiting..." matchar inte den
  strängen. SLUTSATS: --retry-count lades INTE till — det hade inte
  hjälpt mot denna felklass (dokumenterat i ci.yml-kommentaren, ADR-083).
- tim-kos/node-retry README (biblioteket npm-registry-fetch bygger sin
  retry-logik på): retries=4 ger 1+4=5 TOTALA försök, inte 4.

Åtgärd: env-block på audit-ci-steget (rad ~529):
  NPM_CONFIG_FETCH_TIMEOUT: "90000"
  NPM_CONFIG_FETCH_RETRIES: "4"

Uträkning (dokumenterad i sin helhet i ci.yml-kommentaren): pessimistiskt
värsta fall = 5 försök × 90s + backoff (10+60+60+60=190s, ORÖRDA
fetch-retry-mintimeout/maxtimeout-defaults) = 640s ≈ 10m40s. DETTA ÄR
STÖRRE än uppdragets grova "~8 min"-riktvärde — registrerad divergens
(ADR-086), inte tystad. Jämfört med FÖRE ändringen (300s × 3 default-
försök + backoff ≈ 970s ≈ 16min) är 640s ändå en sänkning av det
teoretiska taket. Det normala fallet (install ~5min + audit-ci snabbt
fönster + resten ~3,5min) ryms gott inom lint-jobbets 15 min; det absoluta
matematiska värsta fallet gör det INTE med marginal — öppet bokförd
kvarstående risk.

Steget är INTE continue-on-error, allowlisten (audit-ci.jsonc) är orörd.

Verifierat: actionlint grönt exit 0, yamllint (CI:s exakta form,
`yamllint .github/`, auto-discoverar .yamllint.yml) grönt exit 0,
paritetsgrinden (node scripts/verify-ci-parity.mjs --list) grönt exit 0.

Armerar INTE denna gång — armeringen konsumerades när kön sparkade ut
PR:en (failed_checks-utsparkning, se CLAUDE.md § Landning fjärde läget).
Orkestreraren armerar om efter omgranskning.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
TRE ändringar samma dag på PR #2288 (gren ci/lint-docs-timeout-10):

1. timeout-minutes 5→10 för BÅDE lint och docs, grundat i fyra
   2026-09-04-körningar som föll på 5-minuterstaket på npm-latens
   (npm ci-hastighet). Commit e2d4468a.

2. lint-jobbets timeout-minutes höjt ytterligare 10→15 sedan run
   33852769123 föll på det nya taket mitt i gatekeeper-testsviterna —
   denna gång var även audit-ci långsamt (~5 min, grönt men nära
   npms 300s-fetch-timeout). docs rördes inte (dess audit-oberoende
   grindar gick grönt på 5m45s). Commit 87ac2e23.

3. Rotorsak identifierad och åtgärdad direkt: ett högre JOBB-tak löser
   inte problemet när npm:s EGEN fetch-timeout (default 300s) gör att en
   enskild registry-förfrågan självständigt kan hänga i 5 min. Run
   33857044952 bevisade detta — audit-ci föll med `failure` (inte
   `cancelled`) efter exakt 5m01s, oberoende av jobb-taket. Fix: env-block
   på audit-ci-steget (NPM_CONFIG_FETCH_TIMEOUT=90000,
   NPM_CONFIG_FETCH_RETRIES=4), källmärkt mot npm CLI v11-dokumentationen
   och verifierat via källkodsläsning att npm audit går genom
   npm-registry-fetch (samma klient som npm ci/install) och därför
   honorerar dessa env-variabler. audit-ci:s EGET --retry-count
   undersöktes i KÄLLKODEN (inte bara README) och visade sig INTE vara
   relevant för denna felklass (triggas för npm bara av "not support
   audit"-meddelanden) — lades därför INTE till. Pessimistiskt värsta
   fall beräknat till ~640s (10m40s), större än uppdragets grova
   "~8 min"-riktvärde men lägre än det gamla taket (~970s/16min) —
   divergensen registrerad öppet i kommentaren och notes, inte tystad.
   Commit (denna, tredje).

review-backstopp (5), changed (3), ci-passed (1) orörda genom hela
kortet. .ci-parity-policy.json bär inga timeout-minutes-värden — ingen
ändring krävdes där i någon av de tre omgångarna. Steget audit-ci är
INTE continue-on-error, allowlisten (audit-ci.jsonc) är orörd —
supply-chain-grinden försvagas inte, den blir bara tåligare mot
enskilda långsamma registry-anrop.

Verifierat i ALLA TRE omgångarna: actionlint (pinnad 1.7.12, CI:s exakta
-ignore-flagga) grönt exit 0; yamllint (CI:s exakta form) grönt exit 0;
paritetsgrinden (node scripts/verify-ci-parity.mjs --list) grön exit 0.
Första omgången kördes även npm run typecheck/biome/build gröna.

PR #2288: armerad av Marcus 08:25:26 efter omgång 1-2; armeringen
konsumerades när kön sparkade ut PR:en pga run 33857044952:s
failed_checks (§ Landning fjärde läget i CLAUDE.md). Denna tredje
commit ARMERAR INTE om — orkestreraren gör det efter omgranskning, per
uppdrag. Gren ci/lint-docs-timeout-10.
<!-- SECTION:FINAL_SUMMARY:END -->
