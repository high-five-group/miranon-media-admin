# ADR-039: Konsistens-grindar i CI — kadens-principen + lesson→grind-principen

- Status: Accepted (Session 8 K0b 2026-05-27)
- Datum: 2026-05-27
- Fas: Meta (Session 8 K0b — process-retrospektivens åtgärdssteg)

> **Korrigering (Session 9, 2026-05-29):** fetch-depth-invariantens levande värde bumpas `100 → 250` i samtliga 6 bärare ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) × 4 jobb + [`.frontmatter-policy.conf`](../../.frontmatter-policy.conf) + [`scripts/check-frontmatter.sh`](../../scripts/check-frontmatter.sh)-default). Empirisk grund: 5 av 9 styrande docs ackumulerade > 100 commits från senast-rörande commit till HEAD vid Session 9 (värsta avstånd 115 commits; BYGGPLAN-LÄTTLÄST exakt på 100). Rationale: commits-per-session-takt ~55/session på commit-tunga sessioner × marginal-i-sessioner (~2–3) ≈ 250. Mönsterförstärkning av Session 7 K0.S2 (50→100). Tredje upprepning av detta mönster ska lyftas till egen ADR om periodisk invariant-värde-översyn som princip — inte denna gång. ADR-029 + ADR-030 har additiva korrigerings-noter som spårar samma bump inom sina respektive jurisdiktioner.
>
> **Korrigering (Session 22, 2026-06-17 — uppfyller noten ovan, se [ADR-054](ADR-054-fetch-depth-full-historik.md)):** fetch-depth-invariantens levande värde ändras `250 → 0` (full historik) i samtliga 6 bärare. Detta ÄR den egna ADR som noten ovan (och L62) förutsåg vid upprepning: finit djup brast en fjärde gång (Session 22 — en dok-commit sköt fönstret `263 → 264` och fällde tre orörda governing-docs på falsk drift). Slutsatsen är inte "bump till ett större finit tal" utan att finit djup var anti-mönstret; `0` = hela historiken eliminerar boundary-proxy-klassen. Invarianten (denna ADR:s ägarskap) består — alla 6 bärare hålls enhetligt på `0`. Beslutstexten + tidigare erratum nedan bevaras oförändrade.
>
> **Korrigering (Session 77, 2026-07-23 — bärar-mängden 6 → 5, se PR #99):** Test+Build-jobbet splittades i `test-fast`/`a11y`/`test-staging` (processgransknings-landningen, [ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md)-vågen). Inget av de tre nya jobben kör historik-beroende skript → de får shallow default-checkout och står MEDVETET utanför bärar-mängden (purge-jobbets etablerade mönster). Levande bärare är därmed 5: ci.yml × 3 (changed/lint/docs) + `.frontmatter-policy.conf` + `check-frontmatter.sh`-default. `EXPECTED_CI_CARRIERS` 4 → 3 i grind-skriptet + fixturerna i dess 7-falls-testsvit uppdaterade i samma commit (topologi-ändrings-protokollet som grindens felmeddelande föreskriver). Värdet `0` och invariantens ägarskap är oförändrade.

## Kontext

Session 8 K0a (process-retrospektivens kartläggning, registrerad i
[sessionsdoket](../../tasks/sessions/archive/2026-05/2026-05-27-session-8.md)) diagnosticerade
en återkommande klass av tyst dokument-drift och spårade dess rot. Två aktiva
driftar hade ackumulerats mellan fas-avslut:

1. README:s ADR-räkning angav `28` medan repot hade `38` ADR-filer. Den enda
   mekaniska vakten — `phase-end-verify.sh` ADR-räknings-check — körs bara vid
   fas-avslut. Inget fas-avslut hade skett sedan Fas 2 (2026-05-13), medan tio
   ADR:er tillkommit i mellanfas-sessioner. K0b avtäckte dessutom att vakten
   redan var trasig: dess grep matchade en inaktuell `28` på en andra
   README-rad, så den hade larmat drift vid nästa fas-avslut.
2. fetch-depth bumpades `50 → 100` (2026-05-26) men tröskel-parametern följde
   inte med i alla bärare → ett falskt-negativt detektionsfönster på commit-djup
   50–99 ([L50](../../tasks/lessons.md)).

Roten är **kadens-missmatch**: den enda mekaniska doc-drift-vakten körs vid
fas-avslut medan artefakterna ändras varje session. Drift uppstår i fönstret
mellan fas-avslut och är osynlig — inga failande tester — tills någon läser fel
värde. Time-to-detection mäts i veckor.

K0a fann även en strukturell brist (lesson→grind-luckan): lessons fångas som
prosa i `tasks/lessons.md`, men ingen bro finns från en lesson till mekanisk
enforcement. [L50](../../tasks/lessons.md) föreskrev uttryckligen "kodkoppla
eller invariant-not **+ en test**" — men endast noten byggdes; den bevakande
testen byggdes aldrig. En lesson som föreskriver en grind utan att resultera i
en grind är capture utan enforcement.

[ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md) etablerade
CI som den enda mekaniska enforcement-ytan. ADR-039 **motsäger inte** ADR-036
utan **utvidgar** den: ADR-036 fastställde *var* enforcement bor (CI); ADR-039
fastställer *vilken kadens* olika kontroller hör till och *hur* en lesson blir
en grind.

**Etablerat mönster (citerat, inte lokalt uppfunnet):**

- **Deterministisk konsistens-verifiering i CI** ("verify-*"): Kubernetes
  repo-infra `verify-*.sh`, KubeEdge `make verify` (regenerera + diff, faila vid
  skillnad), GitLab `gitlab-agent` `verify-ci`-target, OpenShift. Bygget failar
  vid drift, vid varje commit.
- **Shift-left / fail-fast** (IBM- och Microsoft-DevOps-vägledning): flytta
  kontroller nära där ändringen sker; balansera billigt-per-commit mot
  tyngre-vid-milstolpe.
- **Docs-as-code**: konsistens-validering hör i CI vid varje push; tyst drift
  (inga failande tester) ger oacceptabel time-to-detection.
- **Lesson→grind** (Google SRE Workbook postmortem-kultur; Atlassian
  incident-handbok): åtgärder utan formell spårning glöms — en postmortem utan
  efterföljande, spårad åtgärd är oskiljbar från ingen postmortem, och alla
  åtgärder spåras som work items.

## Beslut

### Del 1 — Kadens-principen

Deterministiska konsistens-kontroller (billiga, mekaniska, per-artefakt-ändring)
hör vid **varje push** (CI), inte bara vid fas-avslut. `phase-end-verify.sh`
behåller de genuint fas-bundna kontrollerna (CHANGELOG-release-rubrik,
sessionsdok-arkivering, hub-sync, fas-status-konsekvens över docs).

Första tillämpningen: två per-push-grindar i CI:s alltid-körande `lint`-jobb
([ci.yml](../../.github/workflows/ci.yml)):

- [`scripts/check-adr-count.sh`](../../scripts/check-adr-count.sh) — ADR-fil-antal
  == README:s kanoniska levande räkning (nyckar mot samma
  `[0-9]+ arkitekturbeslut`-token som `phase-end-verify.sh` läser, plus
  hävdar att tokenet förekommer på exakt en rad så läsningen är deterministisk).
- [`scripts/check-fetch-depth-invariant.sh`](../../scripts/check-fetch-depth-invariant.sh)
  — fetch-depth-enkelvärde-invarianten (se Ägarskap nedan).

Båda har egna självverifierande truth-table-test-suiter som körs i samma jobb.

### Del 2 — Lesson→grind-principen

En lesson som föreskriver en mekanisk grind eller test **genererar en spårad
todo-punkt** (`tasks/todo.md`) med ett verifierbart sluttillstånd, och punkten
står öppen tills grinden faktiskt finns. [L50](../../tasks/lessons.md) är
precedensen — den föreskrev en test som aldrig byggdes; testen är nu
`check-fetch-depth-invariant.sh`.

Konkret första tillämpning i samma commit som principen fastställs: K0a fann att
`test-check-frontmatter.sh` + `test-check-public-checklists.sh` inte är
CI-wirade — verifiering utan mekanisk enforcement, exakt principens målklass. En
spårad todo-punkt skapas som refererar denna ADR.

## Options-rymd (kadens-principen)

- **A — Status quo** (drift-checks bara vid fas-avslut). Avvisat: K0a:s rot;
  drift ackumuleras osynligt mellan fas-avslut.
- **B — Flytta allt ur phase-end-verify till per-push / pensionera den.**
  Avvisat: vissa kontroller är genuint fas-bundna — en per-push-körning mitt i
  en fas fyrar falskt (fas-status-docs säger legitimt inte KLAR ännu;
  sessionsdok är inte arkiverat). Shift-left-litteraturen själv föreskriver
  balans (billigt per commit / tungt vid milstolpe), inte allt-till-vänster.
- **C — Wira `phase-end-verify.sh` som-den-är till per-push.** Avvisat: den är
  medvetet ett **rapport-skript** (saknar `set -euo pipefail`; exit-koder är
  inte signalen, utfallstexten är) och fas-bunden i sin design (tar fas-nummer,
  datum och sessionsdok-namn som argument).
- **D — Split** (VALD): deterministiska per-artefakt-ändring-checks →
  per-push-CI-grindar (gate-mönster, `set -euo pipefail`, exit≠0 vid drift);
  fas-bundna checks stannar i `phase-end-verify.sh`.

## Ägarskap — fetch-depth-enkelvärde-invarianten

ADR-039 äger den repo-vida invarianten att fetch-depth-värdet hålls enhetligt.
Invarianten spänner över
[ADR-029](ADR-029-ci-architektur-changed-files-pattern.md)s jurisdiktion
(`changed`-jobbet) och
[ADR-030](ADR-030-docs-grindvakter-frontmatter-policy.md)s (lint/test/docs +
frontmatter-tröskeln) — alltså äger ingen av dem den; ADR-039, som skapar den
enforcing testen, gör det.

1. **Enforcement-mekanism:**
   [`scripts/check-fetch-depth-invariant.sh`](../../scripts/check-fetch-depth-invariant.sh)
   (CI `lint`-jobb, varje push).
2. **Nuvarande topologi:** 4 fetch-depth-bärande CI-jobb (changed/lint/test/docs),
   kodat som `EXPECTED_CI_CARRIERS=4` i grinden, plus två levande config-bärare
   (`.frontmatter-policy.conf`-tröskeln + `check-frontmatter.sh`-default). Sex
   levande bärare totalt, alla lika med samma värde (`100`).
3. **Ändringsregel:** att lägga till eller ta bort ett fetch-depth-bärande
   CI-jobb kräver en **medveten uppdatering** av `EXPECTED_CI_CARRIERS` och är ett
   **ADR-beslut**, inte en tyst edit. Frusen ADR-text (ADR-029 § Medvetna
   utelämningar #6, ADR-030 brödtext) säger legitimt `50` och bevaras
   (immutabilitet); grinden hävdar därför att dessa ADR:er bär en **erratum-not**
   som pekar på aktuellt värde — inte värde-likhet med brödtexten.

## Konsekvenser

- Två tysta drift-klasser (ADR-räkning, fetch-depth-invariant) fångas nu vid
  varje push i stället för vid nästa fas-avslut. Time-to-detection: veckor →
  omedelbart.
- `phase-end-verify.sh` förblir oförändrad och fortsätter äga de fas-bundna
  kontrollerna; ADR-count-grinden nyckar mot samma README-token så de två aldrig
  kan säga emot varandra.
- Lesson→grind-principen ger lessons en bro till enforcement; kostnaden är en
  todo-punkt plus grind-bygge per föreskrivande lesson. Det är medvetet — en
  föreskriven grind som inte byggs är samma falsk-grön-klass som
  [L43](../../tasks/lessons.md)/L50.
- Kadens-splitten kan i framtiden utvidgas med fler per-push-konsistens-grindar
  utan ny ADR (mönstret är nu etablerat). En generell konsistens-audit-skill är
  medvetet **inte** byggd: K0a visade att driften inte är systemisk, så en sådan
  vore överengineering per K11-disciplinen (verifierad, inte påstådd, infrastruktur).
