---
id: TASK-395
title: 'CI: audit-ci som eget jobb med nätverksdegradering vid oförändrat beroendeträd'
status: In Progress
assignee: []
created_date: '2026-09-04 10:57'
updated_date: '2026-09-04 11:14'
labels:
  - ready-for-agent
dependencies: []
ordinal: 687000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Bakgrund (mätt 2026-09-04, källa per påstående)

npm:s advisory-bulk-endpoint (`POST /-/npm/v1/security/advisories/bulk`) flappade
under förmiddagen och blockerade varje PR, eftersom audit-steget var obligatoriskt
i jobbet `Lint + Audit + TypeCheck` — trots att de blockerade PR:erna inte rörde
beroendeträdet.

**Mätningar (verifierade av denna skivas agent, inte avskrivna):**

- `gh api .../runs/33862945280/jobs` (PR #2285, event `pull_request`):
  `Install dependencies` 10:23:06→10:28:07 = **5 min 01 s**;
  `Audit dependencies (audit-ci with allowlist)` 10:28:07→10:37:42 = **9 min 35 s**
  = 575 s = exakt 5×90 s fetch-timeout + 4×30 s paus. Jobbet `failure`, alla
  efterföljande steg `skipped`.
- Lokal mätning 2026-09-04 10:51 UTC, `npm audit --json` mot samma träd, exit 1:
  `{"message":"network timeout at: https://registry.npmjs.org/-/npm/v1/security/advisories/bulk","error":{"summary":"","detail":""}}`
- Lokal mätning, `npx audit-ci --config audit-ci.jsonc`, exit 1, utdata verbatim
  (ANSI-koder borttagna): `code undefined: ` respektive `Exiting...`
- Källverifierat i `node_modules/audit-ci/dist/chunk-FA3SOWIW.js` (v7.1.0):
  formen `code undefined:` uppstår i `auditWithFullConfig` när `npm audit --json`
  returnerar ett `error`-objekt utan `code`; en RIKTIG sårbarhet ger i stället
  `Failed security audit due to <nivå> vulnerabilities.` plus `Vulnerable advisories are:`
  plus advisory-URL:er.
- npm retryar aldrig POST (`make-fetch-happen` `lib/remote.js`) — källverifierat i
  `#2288`, bokfört i ci.yml:s egen kommentar; `NPM_CONFIG_FETCH_RETRIES` är därför
  verkningslös för detta anrop.

**DIVERGENS mot uppdragets premiss:** uppdraget påstod att run `33862989013`
mätte "npm ci ~5 min + loop 8 min 05 s + resten → 15-taket sprack". Mätt
2026-09-04: den körningens jobb `Lint + Audit + TypeCheck` var **SUCCESS**,
3 min 53 s totalt — `npm ci` 15 s (cache-träff) och `audit-ci` 3 s GRÖNT
(10:41:18→10:41:21). Endpointen FLAPPADE alltså (grön 10:41, timeout 10:51),
den var inte oavbrutet nere. Designen är oförändrad av detta: degraderingen
riktar sig mot felklassen, inte mot ett visst avbrott.

**DIVERGENS 2:** uppdraget bad om "samma `needs`/`if`-villkor som lint har mot
`changed`". `lint` har VARKEN `needs:` eller `if:` — det står utskrivet som en
bärande egenskap i ci.yml (raden "Lint-jobbet har varken `if:` eller `needs:`
och kör alltså alltid"). `audit` byggs därför likadant: villkorslöst.

## Marcus beslut

Marcus i klartext 2026-09-04: "Bygg degraderingen då."

## Vad som byggs

1. Nytt jobb `audit` i `ci.yml`, parallellt med `lint`, `timeout-minutes: 20`,
   egen checkout/Setup Node/`npm ci`. Audit-loopen flyttas hit ur `lint`;
   `lint` byter namn till `Lint + TypeCheck`. `audit` läggs i aggregatorns
   `needs` och är därmed required precis som förut.
2. Logiken bor i `scripts/audit-ci-med-degradering.sh` (inte som inline
   run-block) — så shellcheck-strict `scripts/*.sh` täcker den och testsviten
   kan pröva EXAKT den kod CI kör, utan en andra handhållen kopia.
3. Degradering EFTER fem fallna försök, endast om BÅDA villkoren håller:
   nätverksklass (varje försöks utdata matchar ett källbelagt nätverksmönster
   OCH inget försök bär en sårbarhetsmarkör) OCH oförändrat beroendeträd
   (`git diff --quiet <bas-sha> HEAD -- package.json package-lock.json`).
   Då `::warning::` och exit 0. Annars exit 1 med skäl.
4. `scripts/test-audit-degradering.sh` — hermetisk tvåsidig svit (stubbad
   `npx` via PATH, `git`-fixtur i mktemp), wirad i gatekeeper-steget.

## Bokförd, ej gjord i denna skiva

`lint`s `timeout-minutes: 15` (satt i `#2288` när audit-steget bodde där) kan
sannolikt gå tillbaka till 10 nu när audit-loopen flyttat till eget jobb —
npm ci ~5 min + resten ~3 min. Gjordes MEDVETET INTE här (uppdragets
instruktion): en taksänkning ska mätas mot faktiska körningar utan audit-steget,
inte projiceras.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 audit-ci kör i ett EGET ci.yml-jobb (audit), parallellt med lint; lint bär inget audit-steg längre; audit står i aggregatorns (ci-passed) needs och är därmed required precis som förut
- [x] #2 Degraderingen slapper igenom ENBART när BADA villkoren haller: samtliga fem forsok ar natverksklassade (kallbelagt monster, ingen sarbarhetsmarkor) OCH git diff --quiet <bas-sha> HEAD -- package.json package-lock.json ar tyst; utfallet ar da en ::warning::-rad och exit 0
- [x] #3 En sarbarhetsmarkor i nagot forsoks utdata faller ALLTID (exit 1) oavsett lockfilen; ett andrat beroendetrad faller ocksa (exit 1); saknad bas-SHA (push mot main) faller (exit 1) — var och en med egen loggrad om vilket villkor som foll
- [x] #4 Grindarna grona: paritets-preflighten (node scripts/verify-ci-parity.mjs --list), actionlint med CI:s egen -ignore-flagga, yamllint .github/, shellcheck --severity=style --enable=all pa de nya skripten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
