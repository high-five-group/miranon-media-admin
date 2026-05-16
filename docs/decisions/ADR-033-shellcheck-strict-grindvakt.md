<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# ADR-033: Shellcheck-strict-grindvakt för bash-scripts

- Status: Accepted (Session 6.6.7 K-sista 2026-05-16)
- Datum: 2026-05-16
- Fas: Session 6.6.7 — Shellcheck-strict-grindvakt + shallow-clone-detection-bonus (mellan Fas 2 och Fas 2.5)

## Kontext

Session 6.6 (K7.B miljö-disciplin + K7.5.4 SC2034 klass-blindhet-lesson, 2026-05-14/15) identifierade två öppna luckor i bash-script-disciplinen:

1. **Ingen CI-grindvakt mot shellcheck-fynd.** Pre-K7.B etablerade lokal shellcheck-disciplin men ingen mekanisk grindvakt mot regressioner. Default-severity är "warning"; style-domän skip:as utan explicit `--severity=style`. Optional checks (SC2250, SC2312, SC2310, SC2311) skip:as utan `--enable=all`. K7.5.4 SC2034-fix-paket lade `# shellcheck disable=SC2034` på 2 config-filer för att stänga unused-var-warnings — men utan strict-mode-grindvakt kan motsvarande fynd-kategorier driva framöver.

2. **Pre-existerande warning-profil är inte normativ standard (K7.5.4-lesson).** Aktivering av grindvakt måste vara strict (0 warnings + 0 errors + 0 info + 0 style), inte "0 errors" som default. Annars dröjer style-domän-driften kvar och blir lessons-skuld i framtida sessioner.

Session 6.6.7 körs som mini-session mellan Fas 2 och Fas 2.5 per Strategi β (bekräftad 2026-05-16, committed `9e46e48` i [`tasks/todo.md`](../../tasks/todo.md)). Shellcheck-domänen får egen ADR-trail per [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) § Konvention för framtida CI-utvidgningar.

ADR-029 § Konvention citat: *"Nya kod-kvalitets-checkar — läggs i `lint`-jobbet om snabba (<10s); eget jobb om längre."* Shellcheck mot 8 filer kör <5s — naturlig hemvist är `lint`-jobbet.

[ADR-030](ADR-030-docs-grindvakter-frontmatter-policy.md) etablerade precedent för docs-grindvakter (markdownlint-cli2, Vale, yamllint, scripted-checklist, frontmatter). ADR-033 är samma mönster tillämpat på bash-script-domänen — bash-hygien som motsvarighet till docs-hygien.

Pre-Fas-2.5-positionen är fortfarande idealisk för grindvakts-investering: ingen pågående fas-blocking; framtida-konsumenten (Fas 2.5 + 3 + 3.5 + ...) producerar fler bash-scripts (deploy-pipeline Fas 7, ev. test-helper-scripts) som drar nytta direkt. Mönsterförstärkning av Session 6 K1.16 success-signal (grindvakt-investering avslöjar emergent värde).

Strategi β-tillägget (shallow-clone-detection) konsoliderar Session 6.6.5 K2.1 fetch-depth-fix (commit `a67908d`) med defensive-programming-lager — om en framtida spoke kopierar frontmatter-grindvakten utan att kopiera fetch-depth-config triggas samma latent shallow-clone-bug (L8 från Session 6.6.5). ADR-030 § Del 3 "Defensive programming (defer)"-bullet pekar till denna implementation.

## Beslut

### Del 1 — Shellcheck-strict som CI-grindvakt (Alt A per Block D-fråga 1)

`.github/workflows/ci.yml` lint-jobbet får ny step efter `Validate frontmatter on governing docs`:

```bash
shellcheck \
  --severity=style \
  --enable=all \
  scripts/*.sh \
  .githooks/* \
  .checklist-policy.conf \
  .frontmatter-policy.conf
```

**Strict-mode-krav:** 0 warnings + 0 errors + 0 info + 0 style = exit 0. Annars exit 1.

- `--severity=style` aktiverar style-fynd som default-severity skip:ar (warning-och-uppåt).
- `--enable=all` aktiverar optional checks (SC2250, SC2312, SC2310, SC2311 m.fl.) som är default-disabled.

shellcheck är pre-installerat på `ubuntu-latest` (verifieras i K3.3) — ingen apt-install krävs.

### Del 2 — Retroaktiv fix av baseline-fynd

Baseline-pass pre-CI-aktivering: **366 fynd** mot strict-mode (verifierat K1 RAPPORTERA 2026-05-16). Distribution:

| Severity | Antal | Domän |
|---|---|---|
| error | 2 | design-beslut (SC2148 shell-directive på sourced configs) |
| warning | 0 | K7.B/K7.5.4-polish höll |
| info | 2 | design-beslut (SC2312 subshell return masking) |
| style | 362 | mekanisk (SC2250 + SC2292 + SC2248) |

Per Marcus' Block D-beslut 2026-05-16 (sub-A.1 splittat i A.1.a + A.1.b):

**A.1.a — Design-beslut-pass FÖRST (~30 min, K3.1):**

- Per-fynd-rapport för 4 design-beslut-fynd (2 SC2148 errors + 2 SC2312 info)
- Föreslagen fix per fynd + ev. alternativ
- Marcus godkänner bulk eller per fynd
- A.1.a commit innan A.1.b mekanik-pass startar

**A.1.b — Mekanik-pass på 362 resterande (~60-90 min, K3.2):**

- `shellcheck --severity=style --enable=all --format=diff scripts/*.sh .githooks/* .checklist-policy.conf .frontmatter-policy.conf > /tmp/sc-fix.diff`
- Empirisk diff-inspektion: renlighet + mekanisk enhetlighet inom varje SC-kod + per-fil fix-volym
- Om diff är ren: `git apply /tmp/sc-fix.diff` + shellcheck-pass-verifikation + commit
- Om icke-mekaniska element: RAPPORTERA + STOPPA-OCH-FRÅGA innan apply
- 2h-mark progress-rapport: fortsätt-vs-pivotera-till-A.3 (defer-style-domänen)

### Del 3 — Scope för shellcheck-grindvakt

| Glob | Filer (2026-05-16) | Motivering |
|---|---|---|
| `scripts/*.sh` | 5 | Alla bash-scripts i scripts/ |
| `.githooks/*` | 1 (`pre-commit`) | Framtida hooks fångas automatiskt via glob |
| `.checklist-policy.conf` | 1 | Sourced av `scripts/check-public-checklists.sh` via `source` |
| `.frontmatter-policy.conf` | 1 | Sourced av `scripts/check-frontmatter.sh` via `source` |

Sourced-config-filerna lägger till `# shellcheck shell=bash`-direktiv (inte shebang, eftersom de inte är executable) som del av A.1.a-fix.

### Del 4 — ADR-numrering (ADR-033 vs ADR-032-reservation)

Per Marcus' Block D-fråga 2 beslut 2026-05-16: ADR-033 (inte ADR-032 trots filsystem-luckan).

**Sekvens:**

- ADR-031 (Session 6.6.5 Dependabot-strategi, Accepted 2026-05-16)
- **ADR-032 reserverad** för Session 6.6.6 (Vale-cleanup-domän, defererad)
- **ADR-033** (denna ADR, Session 6.6.7 shellcheck-domän)

**Motivering:** 6.6.6-estimat ~7-10h Vale-cleanup är substantiell-nog för egen ADR-trail. Reservation committas via L19-mitigation-rad i `tasks/todo.md` Mini-session 6.6.6-blocket vid Session 6.6.7 K-sista (per L19 från Session 6.6.5 — planerings-beslut + ordnings-rationale måste till filsystem, inte Chat-only).

Numrerings-luckor är acceptabla historiskt (jfr ADR-katalog-konvention) och bättre än att tvinga 6.6.6 till ADR-034 om den körs efter 6.6.7.

### Del 5 — Strategi β-tillägg: shallow-clone-detection (K4-domän)

Defensive-programming-lager för `scripts/check-frontmatter.sh`. Per [ADR-030](ADR-030-docs-grindvakter-frontmatter-policy.md) § Del 3 sub-§ "Implementations-krav på CI-miljö" bullet "Defensive programming (defer)":

> `scripts/check-frontmatter.sh` kan utvidgas med shallow-clone-detection (`git rev-parse --is-shallow-repository`) som degraderar Check 2 gracefully om fetch-depth-config glöms. Flaggad i `tasks/todo.md` som Alt C-defer från Session 6.6.5 K-sista #3.

K4.1 implementerar pre-Check 2 shallow-detection. K4.2 utvidgar test-suite (T10/T11 shallow-scenarier). K4.3 uppdaterar ADR-030 § Del 3 sub-§ från "(defer)" → "(implementerad i ADR-033 K4)".

Detta är ADR-033-scope eftersom det är `scripts/`-domän + test-suite-utvidgning + ADR-030-tillägg — alla tre ligger under shellcheck/script-hygien-domänen även om motivationen är frontmatter-bug-mitigation.

## Alternativ övervägda

### Strategi för shellcheck-grindvakt (Block D-fråga 1)

| # | Alternativ | Varför avvisad |
|---|---|---|
| **A** | **Shellcheck som CI-step i lint-jobb** | **VALD** — konsekvent med ADR-030-precedent (check-frontmatter + check-public-checklists), branschpraxis-pattern, <5s exekvering, ingen lokal installations-friktion |
| B | Pre-commit + CI dubbel-gate | Över-engineering; bash-scripts ändras sällan i daglig drift; ökar local-friction (kräver Marcus har shellcheck installerat lokalt); CI-only räcker |
| C | Bara CI-step (identisk Alt A i praktiken) | Tas bort eftersom Alt A är den naturliga semantiken |

### Retroaktiv fix-omfattning (Block D-sub-fråga A)

| # | Alternativ | Varför avvisad |
|---|---|---|
| **A.1** | **Fix-allt (366 fynd via shellcheck-fix-suggestions)** | **VALD** — auto-mekanisk transformation gör fix-allt billig; 11/10 GOLV-disciplin per L6 + L13 (verifierad branschstandard är 11/10:s GOLV, inte tak); pre-empirisk fångst: A.3-pivot reserverad mid-implementation om kostnad >2h |
| **A.1.a** | **Design-beslut-pass FÖRST (4 icke-mekaniska)** | **VALD del-sekvens** — per-fynd-godkännande FÖRE mekanik-pass; isolerar design-beslut från mekanik-domänen |
| **A.1.b** | **Mekanik-pass på 362 (SC2250/SC2292/SC2248) via `--format=diff` + `git apply`** | **VALD del-sekvens** — auto-mekanisk efter A.1.a; verifieras via diff-inspektion pre-apply |
| A.2 | Fix-bara-errors-och-info (4 fynd ~30 min, defer 362 style) | För konservativ; bryter 11/10 GOLV-disciplin; 362 style-fynd skulle bli lessons-skuld |
| A.3 | Fix-errors + welcome-style-domän (2 errors + ~50-100 mest-synliga, defer resterande) | Mellanting; reserverad som mid-implementation-pivot om A.1.b visar sig kosta >2h vid 2h-mark-progress-rapport |

### K-strukturering (Block D-fråga 3)

| # | Alternativ | Varför avvisad |
|---|---|---|
| **A** | **TVÅ K:n (K3 shellcheck + K4 shallow-clone)** | **VALD** — tematisk-renhet (semantik-separation per K7-disciplin); K4-scope (~1h med test-suite + ADR-tillägg) är väsentlig-storlek; konsekvent med ADR-030-precedent (K4-K7 separata K:n) |
| B | EN K (K3 implementera-paket) | Atomisk leverans men blandar två semantik-domäner (CI-grindvakt + defensive-programming) |
| C | TRE K:n (K3 baseline-fix + K4 ny CI-step + K5 shallow-clone) | Mest granulär men för många K-gränser för en mini-session (~2-3h); K3 sub-paketeras via K3.1-K3.4 istället |

## Konsekvenser

### Positiva

- **Mekaniskt skydd mot bash-script-style-drift** — analog till markdownlint-cli2 för markdown-drift, Vale för terminologi-drift, yamllint för YAML-drift
- **Grindvakt fångar nya warnings + errors innan merge** — pre-empirisk verifikation per K1.16-mönster (grindvakt avslöjar oväntade kategorier)
- **Strict-mode (0/0/0/0) etablerar 11/10-GOLV** per L6 + L13 (Session 6.6.5): verifierad shellcheck-strict-praxis 2026 är style-clean i bibliotek-kvalitets-bash
- **Auto-mekanisk fix-suggestion** via shellcheck `--format=diff` minimerar fix-effort för 362 mekaniska fynd
- **Konsekvent med ADR-030-precedent** (5 docs-grindvakter) — bash-domänen får motsvarande lager, samma mall-struktur
- **Hub-spoke-portabilitet bevarad** (K7.6 "Ristat i sten") — config-filer + scripts är universella; per-spoke-anpassning sker via `.checklist-policy.conf` + `.frontmatter-policy.conf` (etablerad disciplin per ADR-030)
- **Shallow-clone-detection K4-tillägg konsoliderar L8** (Session 6.6.5 latent bug-klass) — defensive-programming-lager skyddar mot framtida spoke-kopiering utan fetch-depth-config

### Negativa

- **366 baseline-fynd-fix-paket är substantiell volym** — risk för iterativ fix-runda om mekanik visar icke-mekaniska element
  - **Mitigation:** A.1.a design-beslut-pass FÖRE mekanik; A.3-pivot reserverad mid-implementation vid 2h-mark
- **Nya bash-scripts måste vara shellcheck-strict från start** — ny disciplin för framtida sessioner
  - **Mitigation:** dokumentation i CONTRIBUTING.md "Lokala dev-verktyg (frivilligt)"-sektion + CI-failure ger snabb feedback
- **Strict-mode kan generera false-positives** för legitim bash-idiomatik (typ `[ ]` vs `[[ ]]` i POSIX-portable scripts)
  - **Mitigation:** SC-direktiv (`# shellcheck disable=SCxxxx`) tillåts som per-fall-defer men kräver kommentar med motivering (jfr K7.5.4 SC2034-precedent)

### Säkerhet

- **Inga supply-chain-implikationer** — shellcheck installeras via SHA256-pinnad download från koalaman/shellcheck GitHub releases v0.11.0 (K3.3 empirisk pre-flight 2026-05-16 bekräftade falsk-grön-risk med ubuntu-latest pre-installerad v0.9.0-1)
- **SHA-pin-strategi för shellcheck v0.11.0:** koalaman/shellcheck publicerar inte officiell `.sha256sum`-fil per release-asset (empirisk verifikation 2026-05-16: endast binär-tarballs publiceras). SHA256 (`8c3be12b05d5c177a04c29e3c78ce89ac86f1595681cab149b65b97c4e227198`) är downstream-beräknad 2026-05-16 mot fast nedladdad release-asset från GitHub releases. Integritets-skydd via GitHub-release-immutability (per [GitHub-docs about-releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)). Konsekvent med [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) § Medvetna utelämningar #3 actionlint-precedent (maintainer-distribuerat download-script med binär-checksum-verifikation = teknisk integrity-skydd motsvarande upstream-publicerad SHA). Re-verifikation: ladda ned samma URL + `sha256sum` lokalt; SHA-match bevisar release-asset oförändrad.
- **Bash-script-säkerhet förbättras** via SC-katalog som strict-mode fångar:
  - SC2086 (unquoted vars → word-splitting)
  - SC2155 (declare-without-error-check → masked exit codes)
  - SC2046 (unquoted command substitution)
  - SC2148 (saknad shell-directive → unspecified shell behaviour)
- **Defensive programming** via K4 shallow-clone-detection minimerar latent-bug-klass-domänen (L8-mönsterförstärkning)

## Konvention för framtida bash-script-utvidgningar

- **Nya skript i `scripts/`** — måste passera shellcheck-strict (0 warnings + 0 errors + 0 info + 0 style) från start. Naturlig disciplin via CI-failure-feedback.
- **Nya hooks i `.githooks/`** — fångas automatiskt av glob `.githooks/*`. Samma strict-krav.
- **Nya config-filer sourced av skript** — läggs till i grindvakts-scope (analog till `.checklist-policy.conf` + `.frontmatter-policy.conf` här). Måste ha `# shellcheck shell=bash`-direktiv (inte shebang) eftersom de är sourced-bara.
- **shellcheck-direktiv** (`# shellcheck disable=SCxxxx` eller `# shellcheck shell=bash`) tillåts som per-fall-defer men kräver kommentar med motivering (jfr K7.5.4 SC2034-precedent). Direktiv utan motivering är anti-mönster.
- **Vid spoke-kopiering** (hub-spoke-portabilitet per K7.6): kopiera shellcheck-step-config tillsammans med scripts + policy-filer. Samma disciplin som ADR-030 frontmatter-grindvakt + ADR-029 fetch-depth-50-krav.

## Medvetna utelämningar och scope-avgränsningar

Per Marcus' Gate 2-kvalitetsregel 2026-05-13 ("genväg = disciplin-brott"): varje utelämning dokumenteras explicit.

1. **Pre-commit hook-installation skippas (Alt B avvisad).** Per Block D-fråga 1: shellcheck-binary-installation i lokal dev-miljö är friction utan motsvarande gain — CI-only räcker. Senior-team-test: ja, många branschledande projekt (Vite, TanStack, Astro) har shellcheck CI-only. 11/10-test: minimerar global tooling-friktion. **Beslut:** låt stå; revidera om CI-feedback-loop visar sig för långsam.

2. **shellcheck-version 0.10+ krävs** (för `--enable=all`-stöd). Marcus lokal version 0.11.0 verifierad K1 (Block A). ubuntu-latest pre-installerad version verifieras i K3.3. Om <0.10: apt-install med pinned version eller GitHub-action med pinned version. Senior-team-test: version-pinning konsekvent med ADR-028 + ADR-029 supply-chain-policy. **Beslut:** låt stå; K3.3 levererar empirisk version-rapport.

3. **Inga visual regression-tests för scripts** — utanför domänen. shellcheck-domänen är text-analys, inte runtime. Functional-tests via `scripts/test-*.sh`-suite (9 testfall för check-frontmatter, 11 post-K4) täcker runtime-domänen. **Beslut:** låt stå.

4. **Strategi β-tillägget K4 inkluderas i ADR-033 trots olika problemdomän.** Defensive-programming för frontmatter-grindvakten är konceptuellt ADR-030-domän, men *implementations*-domänen är `scripts/` + test-suite + ADR-030-edit — alla inom shellcheck/script-hygien-yta. K4 i ADR-033 = bash-script-quality-disciplin tillämpad på defensiv-programmering. Senior-team-test: ja, defensive-programming i scripts är script-hygien. **Beslut:** låt stå.

5. **Reservation av ADR-032 för 6.6.6 istället för att använda ADR-032 nu.** Per Block D-fråga 2 och Marcus' L19-mitigation 2026-05-16. Senior-team-test: numrerings-luckor är acceptabla; bättre än ADR-034-omnumrering om 6.6.6 körs efter. **Beslut:** låt stå; L19-mitigation-rad commitas vid K-sista.

6. **Upstream-publicerad SHA256 saknas för koalaman/shellcheck.** Per empirisk verifikation 2026-05-16: koalaman publicerar endast binär-tarballs (`.tar.gz` + `.tar.xz` per OS/arch), inga separata checksum-filer. Fallback: downstream-beräknad SHA256 mot GitHub-release-immutability-garanti. Senior-team-test: ja, många populära upstream-projekt har samma policy; downstream-pin är teknisk-ekvivalent med upstream-pin för immutable releases (GitHub releases kan tas bort men inte modifieras byte-för-byte post-publish). 11/10-test: trail-disciplin bevarad via § Säkerhet-bullet + denna utelämnings-punkt + L_G [UNIVERSAL] lessons-flagga. **Beslut:** låt stå; revidera om koalaman framtida-publicerar officiella `.sha256sum`-filer.

## Spårbarhet

- **Föregångare:**
  - [ADR-028](ADR-028-supply-chain-incident-respons.md) (supply-chain-incident-respons-protokoll, 2026-05-12) — bekräftar version-pinning-disciplin om shellcheck-version pinning behövs i CI
  - [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) (CI-arkitektur — § Konvention för framtida CI-utvidgningar, 2026-05-13) — auktoriserar denna ADR-trail
  - [ADR-030](ADR-030-docs-grindvakter-frontmatter-policy.md) (docs-grindvakter + frontmatter-policy, 2026-05-14) — mall-precedent för grindvakts-ADR; K4 implementerar § Del 3 "Defensive programming (defer)"-bullet
  - [ADR-031](ADR-031-dependabot-strategi-2026.md) (Dependabot-strategi 2026, 2026-05-16) — samma mini-session-mönster (mellan-fas-investering)

- **Drivande observationer:**
  - Session 6.6 K7.B miljö-disciplin-lessons (BSD grep + SC2069 + bash 3.2)
  - Session 6.6 K7.5.4 SC2034 klass-blindhet-lesson + mitigation-domän-pekare ("pre-existerande warning-profil ≠ normativ standard")
  - Session 6.6.5 L8 (Frontmatter-validator shallow-clone-incompatibility, latent bug-klass) — driver K4-scope
  - Session 6.6.5 L1 + L6 + L13 (Pre-K forensisk-pass + 11/10 GOLV-disciplin + branschstandard är GOLV)
  - Strategi β-bekräftelse 2026-05-16 (committed `9e46e48` i `tasks/todo.md`) — auktoriserar 6.6.7 FÖRE 6.6.6

- **Etablerad:** Session 6.6.7 K2 2026-05-16 (sessionsdok [`../../tasks/sessions/2026-05-16-session-6-6-7.md`](../../tasks/sessions/2026-05-16-session-6-6-7.md))

- **Implementation:**
  - K1 ✅ KLAR 2026-05-16 — Block A/B/C/D + Marcus' beslut 1A + 2A + 3A + sub-A.1.a/A.1.b
  - K2 ✅ KLAR 2026-05-16 — sessionsdok-skelett + ADR-033 Draft + Strategi β-bekräftelse (denna commit)
  - K3 EJ STARTAD — Shellcheck-grindvakt (K3.1 A.1.a + K3.2 A.1.b + K3.3 CI-step + K3.4 baseline-bake-in)
  - K4 EJ STARTAD — Shallow-clone-detection (K4.1 script-edit + K4.2 test-suite + K4.3 ADR-030-edit)
  - K-sista EJ STARTAD — Lessons-skörd + ADR-032-reservation-commit + hub-sync + arkivering

- **Verifikation:** empirisk via K3 CI-run (post-A.1.b apply). Status bumpas från Draft till Accepted vid K-sista bake-in.

- **Baseline-fynd 2026-05-16:** Se § Baseline-fynd nedan; post-fix-state ifylls vid K-sista.

## Baseline-fynd 2026-05-16

Empirisk shellcheck-utfall pre-implementation (K1 RAPPORTERA, 2026-05-16):

### Per fil

| Fil | Fynd | Klassificering |
|---|---|---|
| `scripts/test-check-frontmatter.sh` | 77 | style-dominerade (mest SC2250) |
| `scripts/test-pre-commit-hook.sh` | 69 | style-dominerade |
| `scripts/test-check-public-checklists.sh` | 40 | style-dominerade |
| `scripts/check-frontmatter.sh` | 32 | style-dominerade + 2 SC2312 info |
| `scripts/check-public-checklists.sh` | 17 | style-dominerade |
| `.githooks/pre-commit` | 13 | style-dominerade |
| `.frontmatter-policy.conf` | 1 | SC2148 error (saknad `# shellcheck shell=bash`-direktiv) |
| `.checklist-policy.conf` | 1 | SC2148 error (saknad `# shellcheck shell=bash`-direktiv) |
| **Totalt** | **366** | **0 warnings + 2 errors + 2 info + 362 style** |

### Per SC-kod

| SC-kod | Antal | Severity | Klass | Fix-approach |
|---|---|---|---|---|
| SC2250 | 306 | style | mekanisk (brace-around-vars: `$file` → `${file}`) | A.1.b (auto via `--format=diff` + `git apply`) |
| SC2292 | 34 | style | mekanisk (prefer `[[ ]]` över `[ ]`) | A.1.b (33 auto + 1 manuell rad 99 per L_E cross-syntax-fall) |
| SC2248 | 22 | style | mekanisk (prefer double quoting `"$var"`) | A.1.b (auto) |
| SC2148 | 2 | error | design-beslut (shell-directive på sourced configs) | A.1.a (`# shellcheck shell=bash` rad 1) |
| SC2312 | 2 | info | design-beslut (subshell return masking via `$(pwd)`) | A.1.a (CURRENT_DIR refactor per L_C nivå 1) |
| **Totalt** | **366** | — | — | — |

### Post-fix-state

Empirisk post-implementation (post-K3.3 CI-step aktivering, run `25962416481` commit `82a7793`):

| Severity | Pre-fix | Post-fix | Δ |
|---|---|---|---|
| error | 2 | **0** | **-2** |
| warning | 0 | 0 | 0 |
| info | 2 | **0** | **-2** |
| style | 362 | **0** | **-362** |
| **Totalt** | **366** | **0** | **-366** |

Target: 0/0/0/0 (strict-mode-grön) för grindvakt-aktivering. **UPPNÅDD** per CI-run `25962416481` step 14 "Validate bash scripts with shellcheck-strict" exit 0.

### CI-verifikation

Empirisk implementation (2026-05-16):

- **Pre-grindvakt-CI-run-id:** `25962395263` (sista run pre-K3.3, commit `ea40d63` ADR-033 SHA-pin-fallback-dokumentation)
- **Post-grindvakt-CI-run-id:** `25962416481` (commit `82a7793` K3.3 shellcheck-step aktiverad)
- **Lint-jobb tid pre/post-shellcheck-step:** 24s pre (`ea40d63`) / 24s post (`82a7793`) — shellcheck-domän overhead ~1-2s under jitter-spann ±5s
- **Empirisk verifikation att shellcheck-step exit 0 på post-fix-state:** **PASS** (run `25962416481` step 14 "Validate bash scripts with shellcheck-strict" exit 0)
- **SHA256-verifikation:** **PASS** (run `25962416481` step 13 "Install shellcheck (pinned v0.11.0)" `sha256sum -c` returnerade 0)
- **shellcheck-version-grep:** **PASS** (run `25962416481` step 13 sista rad `shellcheck --version | grep -F "version: 0.11.0"` exit 0 — bekräftar att SHA-pinnad asset levererade förväntad version)
