---
id: TASK-395
title: 'CI: audit-ci som eget jobb med nätverksdegradering vid oförändrat beroendeträd'
status: Done
assignee: []
created_date: '2026-09-04 10:57'
updated_date: '2026-09-04 13:44'
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
- [x] #2 Degraderingen slapper igenom ENBART när BADA villkoren haller: samtliga forsok ar natverksklassade (kallbelagt monster, ingen sarbarhetsmarkor) OCH git diff --quiet <effektiv bas> HEAD -- package.json package-lock.json ar tyst, dar effektiv bas ar MERGE-COMMITENS FORSTA FORALDER nar HEAD ar en merge-ref (annars eventets bas, fail-closed); utfallet ar da en ::warning::-rad och exit 0
- [x] #3 En sarbarhetsmarkor i nagot forsoks utdata faller ALLTID (exit 1) oavsett lockfilen; ett andrat beroendetrad faller ocksa (exit 1); saknad bas-SHA (push mot main) faller (exit 1) — var och en med egen loggrad om vilket villkor som foll
- [x] #4 Grindarna grona: paritets-preflighten (node scripts/verify-ci-parity.mjs --list), actionlint med CI:s egen -ignore-flagga, yamllint .github/, shellcheck --severity=style --enable=all pa de nya skripten
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Final summary (2026-09-04)

**Landning:** gren `ci/audit-eget-jobb-degradering`, commit `a13bfc92`,
**PR #2316 — DRAFT, OARMERAD** (uppdraget: parkerad för granskning; draft är en
sann utsaga om PR:en, inte en tystning — `CLAUDE.md` § Landning).

**Sju filer, samtliga inom skivans scope:**

| Fil | Varför |
|---|---|
| `.github/workflows/ci.yml` | nytt jobb `audit`; audit-steget borttaget ur `lint`; `lint` omdöpt till `Lint + TypeCheck`; `audit` i aggregatorns `needs`; testsviten wirad i gatekeeper-steget |
| `scripts/audit-ci-med-degradering.sh` | loopen + klassningen + degraderingen (NY) |
| `scripts/test-audit-degradering.sh` | tvåsidig hermetisk svit, 41 assertions (NY) |
| `.ci-parity-policy.json` | `knownJobs.ci.audit`, `derivedJobs.ci`, exprSubstitution för bas-SHA-uttrycket |
| `docs/decisions/ADR-028-supply-chain-incident-respons.md` | § Updates 2026-09-04 — beslutet, de två villkoren, Marcus citat |
| `CONTRIBUTING.md` | jobbnamns-referensen `Lint + Audit + TypeCheck` → `Lint + TypeCheck` |
| `backlog/tasks/task-395 …` | detta kort |

**AC-status med uppmätt värde:**

- **#1 GRÖN.** Strukturellt mätt via `js-yaml` mot `ci.yml`: jobbmängden är
  `changed, lint, audit, suite, docs, review-backstopp, ci-passed`;
  `lint.name = "Lint + TypeCheck"`; `lint` bär inget steg med "audit" i namnet;
  `audit.needs = null`, `audit.if = null` (villkorslöst, samma form som `lint`);
  `ci-passed.needs = ["changed","lint","audit","docs","suite","review-backstopp"]`.
  Rulesetets enda required check är `CI Passed or Skipped` (mätt via
  `gh api repos/…/rulesets/19627609`), så namnbytet bryter inget skydd och
  aggregator-posten är det som gör `audit` required.
- **#2 GRÖN.** Fristående bevis, skriptets råa utdata: fall (a) simulerat
  nätverksfel + oförändrad lockfile gav
  `::warning::audit-ci: npm:s advisory-endpoint onåbar efter 5 försök;
  beroendeträdet oförändrat mot bas (<sha>) — släpps med varning, TASK-395`
  och **EXITKOD=0**. Sviten täcker dessutom `ENOAUDIT`-formen, audit-ci:s
  verkligt uppmätta utdata verbatim, och fetch-grenen när bas-commiten saknas.
- **#3 GRÖN.** Fall (b) nätverksfel + ändrad lockfile → `::error::… beroendeträdet
  är ÄNDRAT mot bas (<sha>) …`, **EXITKOD=1**. Fall (c) sårbarhetstabell →
  `::error::… sårbarhetsmarkören "Failed security audit due to" står i försök 1:s
  utdata …`, **EXITKOD=1**. Saknad bas-SHA (T10) → exit 1 med
  `bär ingen bas-SHA att jämföra mot`. Fail-closed vid okänd felklass bevisad i
  T8/T9.
- **#4 GRÖN.** `node scripts/verify-ci-parity.mjs --list` exit 0 med
  `✅ Paritets-preflight`; `node scripts/test-verify-ci-parity.mjs` 69 gröna /
  0 röda, exit 0; `actionlint -color -ignore '…'` exit 0 (lokal 1.7.12 = CI:s
  pin); `yamllint .github/` exit 0 (1.38.0 = CI:s pin);
  `shellcheck --severity=style --enable=all` med CI:s hela fil-lista verbatim
  exit 0.

**Övriga grindar, mätta:** `check-fetch-depth-invariant.sh` exit 0 (5 bärare == 0,
`ci×3` — det nya jobbets checkout bär MEDVETET ingen `fetch-depth:`-nyckel, en
fjärde bärare hade fällt grinden) · `check-listparitet.sh` exit 0 (6 par i synk) ·
`check:docs` 14/14 gröna exit 0 · `typecheck` / `biome check .` / `build` exit 0 ·
`test-audit-degradering.sh` 41/41 PASS exit 0.

**Divergenser mot uppdraget, bokförda:**

1. Uppdragets påstående om run `33862989013` ("npm ci ~5 min + loop 8 min 05 s →
   15-taket sprack") är **falsifierat**: jobbet var SUCCESS på 3 min 53 s med
   `audit-ci` grönt på 3 s. Endpointen flappade i stället för att vara
   oavbrutet nere. Designen påverkas inte.
2. Uppdraget bad om "samma `needs`/`if`-villkor som lint har mot `changed`".
   `lint` har varken `needs:` eller `if:`; `audit` byggdes likadant.
3. Nästa fria kortnummer var 395, inte ~390.
4. Uppdraget föreslog att testet skulle "extrahera run-blocket till en skalfil".
   Logiken lades i stället DIREKT i en skalfil som `ci.yml` anropar — samma
   intention, men utan en andra handhållen kopia, och med shellcheck-täckning
   som ett inline-block inte hade fått.

**Obetald skuld / orkestrerarens moment:** `gate-proof.yml` bör köras efter denna
`ci.yml`-ändring (T85). Lint-jobbets `timeout-minutes: 15` står kvar medvetet och
bör mätas om mot körningar utan audit-steget innan det sänks till 10.

## Review-grinden runda 1 (granskad SHA `af980dca`) — åtgärder

**Fynd 1 (warning/auto-fix) — ÅTGÄRDAT med kodändring.**
`.claude/agents/bygg-agent.md` rad 139 pekade fortfarande på jobbnamnet
`Lint + Audit + TypeCheck` som platsen där `scripts/check-langa-streck.mjs` är
wirat. Referensen rättad till `Lint + TypeCheck` med en historisk parentes som
namnger bytet och `TASK-395`, plus det som saknades i granskarens beskrivning
men är det bärande: **grinden bor kvar i lint-jobbet — bara jobbets namn bytte**
(verifierat mot `ci.yml`: steget "Check for long dashes in UI strings (TASK-172
gate, scope A)" ligger oförändrat i `lint`).

Hela repot genomsökt med `git grep -l 'Lint + Audit + TypeCheck'` (69 filer).
Klassning av de kvarvarande träffarna, var och en med skäl:

- `.github/workflows/ci.yml` rad 504 · `CONTRIBUTING.md` rad 261 ·
  `docs/decisions/ADR-028-…md` rad 317 — **LÄMNADE ORÖRDA MED AVSIKT.** Alla tre
  är denna PR:s EGNA historiska noter om namnbytet ("hette … fram till
  TASK-395", "Audit-steget bodde då i jobbet …"). Att rätta dem hade gjort dem
  falska.
- `scripts/test-ci-metrics.mjs` rad 103/117 — **LÄMNAD ORÖRD.** Strängen är
  syntetisk fixturdata i ett enhetstest; jobbnamnet är godtyckligt och
  assertionen gäller `'Staging (API + E2E)'`, inte detta namn. Inget
  funktionellt beroende av det verkliga jobbnamnet finns.
- `tasks/sessions/**`, `tasks/lessons/**`, `tasks/lessons.d/**`,
  `docs/archive/**`, `docs/research/**`,
  `docs/reference/review-instrumentering.jsonl` och 42 `backlog/tasks/*`-kort —
  **LÄMNADE ORÖRDA.** Historiska protokoll och frysta underlag; de beskriver
  korrekt vad jobbet hette när de skrevs.

Inga fler stale referenser i levande kontrakt/README/CONTRIBUTING-klassen.

**Fynd 2 (info/ask-user) — AVGJORT AV ORKESTRERAREN PÅ MARCUS MANDAT, ingen
kodändring.** Granskaren noterade att villkor B (`git diff --quiet <bas-sha>
HEAD -- package.json package-lock.json`) täcker enbart dessa två filer och inte
hypotetiska `.npmrc` eller `npm-shrinkwrap.json`. Avgörandet: **medveten gräns.**
De två filerna är exakt de Marcus beslut och `ADR-028` § Updates 2026-09-04
namnger, och **ingen av de hypotetiska filerna finns i repot**. Gränsen omprövas
om någon av dem tillkommer. Att bredda villkoret nu hade varit spekulativ
komplexitet ovanför golvet — och en bredare fil-lista i skriptet än den ADR:n
namnger hade dessutom skapat exakt den prosa/mekanism-divergens `ADR-083` städar
bort.

**Landning av rundan:** ny commit på samma gren, PR #2316 förblir **draft** —
orkestreraren gör ready + armering efter runda 2.

## Första skarpa fyrningen — och den rättade basen (2026-09-04)

Degraderingen fyrade skarpt redan i denna PR, run `33869798369`, job
`101012813108`, head `2d6f1a6e`. Två saker följde av det.

**Nätverkssidan är nu SKARPBEVISAD, inte bara lokalt bevisad.** Loggen verbatim:
`audit-ci föll alla 5 försök — klassar utfallet` följt av
`audit-ci försök 1..5: nätverksklassat ("code undefined")`, samt
`bas-commiten 21a76d6b… saknas i checkouten — hämtar den grunt`. Klassningen och
den grunda hämtningen fungerade exakt som byggda i skarp CI-miljö.

**Villkor B föll på ett LATENT basvalsfel — rättat i samma PR.** Eventets
`pull_request.base.sha` = `21a76d6b` är main NÄR EVENTET SKAPADES. Checkouten är
merge-refen `refs/pull/2316/merge` = `1b3c3157` med föräldrarna `72bbeb80`
(main vid CHECKOUT) och `2d6f1a6e` (PR-head) — verifierat via
`gh api repos/…/commits/1b3c3157`. Däremellan landade `c3008757` (`#2306`,
label-policyn) som la EN rad i `package.json` (`git show --stat c3008757`:
`package.json | 1 +`). Två-punktsdiffen mot eventets bas blev därför icke-tom
trots att PR:ens egen diff mot sin merge-base är tom — jobbet föll på en ANNAN
PR:s ändring. `base.sha` är stale mot merge-refens faktiska bas så snart main
rör sig mellan event och checkout, vilket i en fleet är normalfallet.

**Rättelsen:** skriptet härleder en EFFEKTIV bas. Är HEAD en merge-commit med
två föräldrar OCH (p2 == `AUDIT_HEAD_SHA` [pull_request] ELLER p1 ==
`AUDIT_BAS_SHA` [merge_group]) ⇒ effektiv bas = p1. Annars eventets bas,
fail-closed. Tom `AUDIT_BAS_SHA` fäller fortfarande FÖRE all härledning — push
mot main degraderar aldrig. Loggen skriver alltid ut eventbas, effektiv bas och
vilken klausul som gällde, plus en explicit rad när de skiljer sig.

### DIVERGENS mot uppdragets föreskrivna mekanism — mätt, inte antagen

Uppdraget föreskrev `git rev-list --parents -n1 HEAD` och bad uttryckligen att
påståendet skulle **verifieras, inte antas**. Det var rätt att kräva:
**mekanismen fungerar INTE i jobbets miljö.** Checkouten är grund (djup 1), så
merge-commiten ÄR shallow-boundary och git graftar bort dess föräldrar. Mätt i
en `--depth=1`-fixtur mot ett lokalt origin:

| Form | Utfall i grund klon |
|---|---|
| `git rev-list --parents -n1 HEAD` | **bara commitens egen SHA — inga föräldrar** |
| `git log -1 --format=%P` | **tom rad** |
| `git cat-file commit HEAD` | **båda parent-raderna, korrekt** |
| `git cat-file -e <p1>` / `<p2>` | objekten SAKNAS (därav den grunda hämtningen) |

`.git/shallow` innehöll merge-commiten själv. Implementationen läser därför
**`git cat-file commit HEAD`** (rå objekt-läsning går förbi graftningen) och
klipper huvudet vid första tomraden så en commit-meddelanderad som råkar börja
med `parent ` aldrig kan läsas som en förälder. Hade härledningen byggts på
`rev-list --parents` vore den en **no-op i exakt den miljö den finns för** —
den hade tyst fallit tillbaka på den stale basen varje gång, och grinden hade
sett rättad ut utan att vara det.

### Bevis

`scripts/test-audit-degradering.sh` växte **41 → 66 assertions**, sviten körd
(inte avskriven): `RESULT: 66/66 PASS, 0 FAIL`, exit 0. Nya fall:

- **T16** merge-HEAD, stale eventbas, PR rör inga beroenden ⇒ **exit 0** +
  `::warning::` mot p1 — dagens exakta instans, som mot eventets bas hade fällt.
- **T17** samma form men PR-headen ändrar låsfilen ⇒ exit 1.
- **T18** varken klausul matchar ⇒ fallback till eventets bas ⇒ exit 1 när main
  flyttat beroendefilen (fail-closed bevarad).
- **T19** merge_group-formen (p1 == eventets bas) ⇒ p1 väljs, exit 0, och loggen
  namnger kö-klausulen i stället för att se ut som fallback.
- **T20** icke-merge-HEAD ⇒ gamla vägen oförändrad.
- **T21** SHALLOW merge-HEAD med graftade föräldrar ⇒ härledningen hittar ändå
  p1/p2 och hämtar p1 grunt, exit 0. Fallet **mäter dessutom** att
  `rev-list --parents` och `log %P` faktiskt är tomma där, så skriptets
  kommentar om saken aldrig blir en obevakad utsaga.

Samtliga 41 tidigare assertions fortsatt gröna.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S119 stangningsbatch 2a (2026-09-04): PR #2316 mergad i origin/main, merge-SHA 38429d77 (verifierat mot origin/main-loggen). Gate-proof.yml positivt bevis: run 33875903794 (Gate Proof - CI Passed or Skipped FAIL-branch) SUCCESS pa main efter landning. OPPEN SKULD kvarstar, obetald: degraderingens grona gren (nätverksfel + oforandrat beroendetrad -> ::warning:: + exit 0) har INTE fyrat skarpt i CI annu -- varje audit-korning efter fixen (inkl. run 33869798369, som fyrade skarpt pa det tidigare bas-valsfelet och verifierade natverkssidan + den rattade effektiva-bas-logiken) har fatt korrekt/riktigt svar fran npm:s advisory-endpoint. Denna agent har INTE sjalv sokt efter en sadan korning -- pastaendet ar overtaget fran uppdraget, kallmarkt dit, och forblir HYPOTES tills nagon faktiskt hittar en gron degraderings-korning i CI-loggarna.
<!-- SECTION:FINAL_SUMMARY:END -->
