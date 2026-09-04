---
id: TASK-386
title: >-
  CI: lint/docs-jobbens 5-minuterstak fällde fyra körningar på npm-latens
  2026-09-04 — höjt till 10
status: Done
assignee: []
created_date: '2026-09-04 08:15'
updated_date: '2026-09-04 09:44'
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
- [x] #2 audit-steget omförsöks upp till 5 gånger på stegnivå med 90 s fetch-timeout per försök, källmärkt
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

## Fjärde mätningen och åtgärden: retries flyttade till stegnivå (2026-09-04)

Föregående fix (env NPM_CONFIG_FETCH_TIMEOUT=90000 + NPM_CONFIG_FETCH_RETRIES=4)
räckte inte: merge_group-run 33858911410 (job 100978552048), MED env-
variablerna explicit satta (bekräftat i job-loggen: "NPM_CONFIG_FETCH_TIMEOUT:
90000" / "NPM_CONFIG_FETCH_RETRIES: 4"), föll ändå EFTER BARA ETT FÖRSÖK —
09:37:36→09:39:07, exakt 91s (timeouten på 90s slog igenom), men INGEN retry
skedde trots FETCH_RETRIES=4.

Källkodsläsning (curl+Read av RÅ filen, inte AI-summering, för att undvika
felciterad kod): npm/make-fetch-happen lib/remote.js (main-branch,
2026-09-04):
- HTTP-svar-grenen: `// do not retry POST requests, or requests with a
  streaming body` + `const isRetriable = req.method !== 'POST' && !isStream
  && (...)`.
- CATCH-grenen (thrown/timeout-fel — den relevanta här, ingen HTTP-status i
  loggen): `if (req.method === 'POST' || isRetryError) { throw err }` — för
  en POST är villkoret sant OAVSETT isRetryError, så retryHandler() nås
  ALDRIG.
- Bekräftat att advisory-anropet ÄR en POST (audit-report.js:
  `method: 'POST'`).

SLUTSATS: NPM_CONFIG_FETCH_RETRIES är principiellt VERKNINGSLÖS för detta
anrop — make-fetch-happen retryar aldrig POST, oavsett satt retry-antal.
Bekräftat både i källkoden och empiriskt (run 33858911410: exakt ett
försök trots FETCH_RETRIES=4). NPM_CONFIG_FETCH_RETRIES togs därför BORT
ur env-blocket (ADR-083 — en config som källäsningen visar är inert ska
inte stå kvar och påstå en mekanism). NPM_CONFIG_FETCH_TIMEOUT behölls
(fungerar, bekräftat: 91s ≈ 90s+marginal).

Åtgärd: omförsöken flyttade till STEG-nivå — en bash-loop runt hela
`npx audit-ci`-anropet, upp till 5 försök, 30s sleep mellan, exit 0 vid
första gröna, exit 1 om alla fem föll. Loggrad per försök
("audit-ci försök N/5"). ALDRIG continue-on-error. Varje försök bundet av
NPM_CONFIG_FETCH_TIMEOUT=90000.

Uträkning: 5×90s (fetch-timeout) + 4×30s (sleep) = 450+120 = 570s ≈
9,5 min. Under lint-jobbets 15 min med ~5,5 min marginal om audit-ci är
det ENDA som drar ut — men ryms INTE med marginal om install (~4-5min) +
resten (~1-3,5min) OCKSÅ är på sin långsammaste samtidigt. Känd,
öppet bokförd kvarstående risk, nu en EXAKT siffra (ingen bibliotekslogik
kvar att gissa på) i stället för en pessimistisk uppskattning.

Shellcheck-strict (samma flaggor som CI:s scripts/*.sh-grind, --severity=
style --enable=all): 0 findings på loopen efter [ ] → [[ ]] (SC2292).
CI:s shellcheck-strict-steg scannar INTE .github/workflows/ci.yml (endast
scripts/*.sh + .githooks/* + en fast lista .conf-filer, verifierat via
grep) — loopen görs ändå shellcheck-ren som god sed, inte för att en grind
kräver det.

Paritetsgrinden: exit 0, "Paritets-preflight ... matchar policyn." Ingen
.ci-parity-policy.json-ändring krävdes — grindens egen § PARITETSGRIND
säger att verbatim-körning stänger drift INOM ett känt jobb/steg; policyn
behöver bara uppdateras för (a) ett HELT NYTT jobb, (b) ändrade suite-
input-invarianter, eller (c) ett okänt ${{ }}-uttryck i steget. Steget
"Audit dependencies" är oförändrat till namn/jobb, och loopen innehåller
noll GH Actions-uttryck. Bekräftat med grep: "audit" förekommer INTE i
.ci-parity-policy.json eller verify-ci-parity.mjs — steget klassas
generiskt som [härleds+körs].

Armerar INTE — orkestreraren gör det efter omgranskning.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
FYRA ändringar samma dag på PR #2288 (gren ci/lint-docs-timeout-10):

1. timeout-minutes 5→10 för lint+docs (fyra körningar föll på 5-min-taket
   på npm-latens). Commit e2d4468a.

2. lint-jobbets timeout-minutes 10→15 (run 33852769123 föll på det nya
   taket, audit-ci självt också långsamt ~5min). docs orörd. Commit
   87ac2e23.

3. Rotorsak: ett JOBB-tak löser inte att EN registry-POST kan hänga upp
   till npm:s default fetch-timeout (300s) själv. Env-block på audit-ci-
   steget (NPM_CONFIG_FETCH_TIMEOUT=90000, NPM_CONFIG_FETCH_RETRIES=4),
   källmärkt (npm CLI v11-docs + källkodsläsning av @npmcli/arborist).
   audit-ci:s eget --retry-count undersökt i KÄLLKODEN och funnet
   irrelevant (triggas bara av "not support audit"-meddelanden) — lades
   inte till. Commit 349d8ae4.

4. Run 33858911410 bevisade att FETCH_RETRIES=4 var VERKNINGSLÖS: timeouten
   (90s) slog igenom exakt (91s), men INGEN retry skedde. Källkodsläsning
   (RÅ fil, npm/make-fetch-happen lib/remote.js) bekräftade varför:
   `if (req.method === 'POST' || isRetryError) { throw err }` — retries
   nås ALDRIG för en POST, och advisory-anropet ÄR en POST
   (audit-report.js: method: 'POST'). NPM_CONFIG_FETCH_RETRIES borttagen
   (ADR-083, verkningslös config). Omförsöken flyttade till STEG-nivå: en
   shellcheck-ren bash-loop (5 försök, 30s sleep mellan, exit 0 vid grönt,
   exit 1 om alla fem föll, loggrad per försök, aldrig continue-on-error).
   Exakt värsta fall 5×90s+4×30s=570s≈9,5min, under lint-jobbets 15min.
   Denna commit.

review-backstopp (5), changed (3), ci-passed (1) orörda genom hela
kortet. Allowlisten (audit-ci.jsonc) orörd i alla fyra omgångar.
.ci-parity-policy.json bär inga referenser till "audit" alls (grep-
verifierat) — grindens § PARITETSGRIND bekräftar att ingen policy-
uppdatering krävs så länge jobbet/steget redan är känt och run:-blocket
saknar okända GH Actions-uttryck (loopen har noll ${{ }}), vilket gäller
i alla fyra omgångar.

Verifierat i ALLA FYRA omgångarna: actionlint (pinnad 1.7.12, CI:s exakta
-ignore-flagga) grönt exit 0; yamllint (CI:s exakta form) grönt exit 0;
paritetsgrinden (node scripts/verify-ci-parity.mjs --list) grön exit 0.
Omgång 4 dessutom shellcheck-strict (--severity=style --enable=all,
samma flaggor som CI:s scripts/*.sh-grind — vilken INTE scannar
ci.yml:s inline-bash, men loopen görs ändå ren): 0 findings.

PR #2288: armerad av Marcus 08:25:26 efter omgång 1-2; armeringen
konsumerades av kön (failed_checks) efter omgång 3:s underliggande
körning (run 33857044952). Ingen av omgång 3 eller 4 armerar om —
orkestreraren gör det efter omgranskning, per uppdrag. Gren
ci/lint-docs-timeout-10.
<!-- SECTION:FINAL_SUMMARY:END -->
