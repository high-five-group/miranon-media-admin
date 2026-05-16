<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# ADR-031: Dependabot-strategi 2026 — grouping, cooldown, minimal CI-yta, manuell review

- Status: Accepted (Session 6.6.5 K-sista 2026-05-16)
- Datum: 2026-05-16
- Fas: Session 6.6.5 — Dependabot-strategi-uppgradering (mellan Fas 2 och Fas 2.5)

## Kontext

Session 6.6 K2.5 (2026-05-14) identifierade pre-existing skuld: 5 öppna Dependabot-PR:er (#21-#25) failar på `API tests (staging)`-steget pga GitHub Actions secrets-isolation (repo secrets injiceras som tomma strängar i Dependabot-PR-context). K2.5 deferades till egen mini-session per Marcus' Alt H: "pre-existing skuld lyfts i egen session med egen ADR, inte tackled mid-fas". Session 6.6.5 är den sessionen.

Vid K1 RAPPORTERA 2026-05-16 (Code Block A.6 dependabot-config-empiri) bekräftades att den faktiska skulden är bredare än "bara staging-secrets":

- **Volym-skuld:** 6 öppna PR:er (#19, #21-#25), inte 5 som K2.5-prep angav. PR #19 (`tailwind-merge`) är dolt fall — passade pre-Strategi-E singel-jobb-CI men skulle faila mot nya 5-jobs-config
- **Konfig-skuld:** `.github/dependabot.yml` etablerades Pre-Fas-2 (Session 3, commit `dca1591`, ADR-024) **före** GitHub:s native cooldown-feature (juli 2025) och **före** 2026-supply-chain-läget (Axios mars, CanisterWorm, Trivy + Checkmarx KICS-kompromettering). Configgen har 4 stack-grupper (`tanstack`, `react-aria`, `types`, `tailwind`) men saknar catch-all, cooldown, reviewers, commit-prefix, och GitHub-Actions-grouping
- **Policy-skuld:** Ingen explicit ADR-trail om auto-merge-position. 2026-branschens reträtt från auto-merge post-Axios-incident (Dependabot Deputy Confusion TTPs per BoostSecurity 2024+2025) kräver explicit dokumenterat val

Pre-Fas-2.5-positionen är fortfarande idealisk för config-investering: ingen pågående fas-blocking, kontextfärsk lessons-trail (Session 6.6 K1.1-K1.19), och framtida-konsumenten (Fas 2.5 + 3 + 3.5 + ... = flera 100 commits + flera 10 dep-bumps) drar nytta direkt. Mönsterförstärkning av Session 6.6 K1.16 (grindvakt-investering avslöjar emergent värde): config-investering har samma profil.

Marcus' kvalitetsregel 2026-05-13 (etablerad Session 6 K1.D): "INTE sänker kvaliten på våra CI utan höjer kvaliten". Tillämpas här: dependency-strategi ska skydda supply chain BÄTTRE än status quo, inte bara reducera PR-volym.

## Beslut — Fyra-lager-strategi

### Lager 1 — Volym-reduktion via grouping

Catch-all produktion + utveckling med stack-grupper bevarade. Major-bumps får individuella PR:er per default genom `update-types: ["minor", "patch"]` på catch-all-grupperna.

**Konfigurations-design:**

```yaml
groups:
  production-deps:
    dependency-type: "production"
    update-types: ["minor", "patch"]
    exclude-patterns:
      - "@tanstack/*"
      - "@react-aria/*"
      - "@react-stately/*"
      - "react-aria-components"
      - "tailwindcss"
      - "@tailwindcss/*"
  development-deps:
    dependency-type: "development"
    update-types: ["minor", "patch"]
    exclude-patterns:
      - "@types/*"
  tanstack:
    patterns: ["@tanstack/*"]
  react-aria:
    patterns: ["@react-aria/*", "@react-stately/*", "react-aria-components"]
  types:
    patterns: ["@types/*"]
  tailwind:
    patterns: ["tailwindcss", "@tailwindcss/*"]
```

**Motivering production/development-separation (F1 svar A):**

- Production-deps (`@sentry/react`, `@supabase/supabase-js`, Zod, lucide-react, tailwind-merge) körs i klientens browser och påverkar end-user-säkerhet + bundle-storlek
- Development-deps (Vite, Biome, Playwright, TypeScript, `@types/*`) rör bara lokal miljö + CI
- Olika riskprofiler motiverar separat PR-gräns för manuell review
- Branschpraxis-precedens: GitHub Blog 2023-08 introducerade `dependency-type`-filter exakt för detta scenario

GitHub-actions-ecosystem får också grouping (saknas i ursprungs-config):

```yaml
groups:
  github-actions-all:
    patterns: ["*"]
    update-types: ["minor", "patch"]
```

### Lager 2 — Supply-chain-buffer via cooldown

Native `cooldown:`-attribut sedan juli 2025 (GitHub Blog 2025-07-01 changelog).

**Konfigurations-design:**

```yaml
cooldown:
  default-days: 7
  semver-major-days: 7
  semver-minor-days: 7
  semver-patch-days: 3
```

**Motivering F2 svar B (default 7 dagar, patch 3 dagar):**

- 2026-konsensus-mittpunkten i web-research (StepSecurity 2026-04-15, Safeguard.sh 2026-02-20)
- Axios-malware mars 2026 fångades inom 3-4 dagar av community + security-vendors
- CanisterWorm (npm-typo-squatting wave) fångades inom timmar-dagar
- **Security-CVE går omedelbart oavsett cooldown** (GitHub:s explicita design för `cooldown` — gäller endast `version-updates`, inte `security-updates`)
- pip-audit referens-implementation använder `default-days: 7` (GitHub Issue 14645)
- Patch 3 dagar reflekterar lägre risk + högre fix-iteration-naturlighet

### Lager 3 — Least-privilege CI-yta (Alt D Hybrid)

`.github/workflows/ci.yml` får `if: github.actor != 'dependabot[bot]'`-villkor på 2 stegen:

- `API tests (staging)` (`npm run test:api:staging`)
- `E2E tests (staging)` (`npm run test:e2e:staging`)

**Stegen som körs FORTSATT på dependabot[bot]:**

- `changed` (changed-files-detection)
- `lint` jobb komplett: npm ci + audit-ci + biome check + tsc --noEmit + typecheck:tests + actionlint + yamllint + scripted-checklist + frontmatter-validator
- `test` jobb: npm ci + Playwright install + `API tests (pure)` (`npm run test:api:pure`)
- `build` step: `npm run build`
- `docs` jobb (om docs ändrats): lychee + markdownlint-cli2 + Vale

**Motivering:**

- 2 av 3 övervägda alternativ (A manuell merge / B Dependabot-secrets / C skip-for-bot / D hybrid) etablerar antingen för mycket secrets-yta (B) eller för lite test-coverage (C). Hybrid är 11/10-balansen
- Manuell pre-merge-verify mitigerar coverage-gap: Marcus kör staging+e2e lokalt mot bumped deps INNAN merge
- Ingen secrets-utvidgning till Dependabot-zon (lager-isolation principen)
- Lint-jobbet (audit-ci + biome + tsc + actionlint + yamllint + frontmatter) är **kvar** — full kod-kvalitets-feedback bevaras
- Pure-tester (72 tester) körs fortsatt — täcker affärslogik som inte kräver external services

### Lager 4 — Manuell review-policy (explicit non-auto-merge)

ADR dokumenterar explicit att projektet **inte** använder `auto-merge` för Dependabot-PR:er. Marcus reviewar varje PR manuellt (även `chore(deps)`-bumps i `production-deps`-gruppen).

**Reviewers + commit-message-prefix i config:**

```yaml
reviewers: ["marcus803"]
commit-message:
  prefix: "chore(deps)"
  prefix-development: "chore(dev-deps)"
  include: "scope"
```

**Motivering F4 svar A:**

- Conventional Commits-disciplin etablerad i projektet (verifierad i Session 6.6 commit-trail)
- Default `Bump X from Y to Z` bryter konventionen
- Reviewers `[marcus803]` dokumenterar manuell-review-policy mekaniskt (för framtida läsare som inte läst ADR)
- `include: "scope"` ger bättre scope-info än Dependabot-default

**Schedule + limits (F3 svar A + F5 svar A):**

```yaml
schedule:
  interval: "weekly"
  day: "monday"
  time: "06:00"
  timezone: "Europe/Stockholm"
open-pull-requests-limit: 5   # npm
# github-actions: 3
```

- F3 svar A — måndag 06:00 Europe/Stockholm = arbetsfönster-design (PR-batch redo när Marcus börjar veckan)
- F5 svar A — Safeguard.sh 2026: 5 PR:er reviewas seriöst, 50 ignoreras. Med grouping + cooldown blir realistisk volym 1-3/vecka. Limit på 5 är luft, inte tak, men dokumenterar discipline-ceiling

## Alternativ övervägda

| # | Alternativ | Varför avvisad |
|---|---|---|
| A | Status quo (4 stack-grupper, ingen catch-all, ingen cooldown) | Volym-skuld förvärras (6 PR:er accumulating); ingen supply-chain-buffer mot 2026-läget; auto-merge-policy implicit |
| B | Alt B — Dependabot-secrets (sätta repo-secrets på Dependabot-PR-context) | Utvidgar secrets-yta till Dependabot-zon (BoostSecurity Deputy Confusion TTP-mitigation försvagas); kräver GitHub Enterprise eller eget secrets-management |
| C | Alt C — skip alla tester för dependabot[bot] | För lite test-coverage; pure-tester och biome+tsc+build skulle missas — sänker kvalitet, inte höjer |
| D | Alt D — Alt D Hybrid (skip staging+e2e, kör pure+lint+build) | **VALD** — 11/10-balans mellan secrets-isolation och test-coverage |
| E | Auto-merge för minor+patch i production-deps | 2026-branschens reträtt post-Axios (BoostSecurity Deputy Confusion TTPs, dev.to nickytonline 2026-05). Avvisad till framtida revidering om supply-chain-läget stabiliseras |

## Konvention för framtida CI-utvidgningar

Analog till ADR-029 § Konvention för framtida CI-utvidgningar. Future-trigger-villkor för revidering av denna ADR:

**Auto-merge-revidering** — när:

- Supply-chain-läget stabiliseras (≥6 månader utan major npm/GHA-incident jämförbar med Axios/CanisterWorm)
- `socket.dev`-integration etablerad (real-time package-malware-detection före install)
- StepSecurity-integration etablerad (hardened-runner med egress-control)
- Projektet har test-coverage som mätbart täcker dep-bump-regressioner (>80 % line-coverage på affärslogik)

**Volym-revidering** — om:

- >5 öppna PR:er konstant trots config (mer än 4 veckor i rad)
- Catch-all + 4 stack-grupper räcker inte för PR-batch som hanteras inom rimlig tid
- Mitigation: utvärdera mer aggressiv grouping (alla deps i 1 PR per vecka) eller cooldown-förlängning

**Cooldown-revidering** — om:

- Karens visar sig för kort (CVE landar inom karenstid och bumpen mergar utan att fångas)
- Karens visar sig för lång (patches stoppas onödigt och säkerhetsfixar deferas)
- Mitigation: justera `default-days` / `semver-patch-days` baserat på empirisk data

**CI-yta-revidering** — om:

- Marcus rutinmässigt mergar utan manuell staging-verify och regression visar sig i prod
- Mitigation: utvärdera Alt B (Dependabot-secrets via GitHub Enterprise) eller `workflow_dispatch`-automation för on-demand staging-körning på Dependabot-PR

## Konsekvenser

### Positiva

- Realistisk PR-volym (1-3/vecka vs 6+ accumulating idag)
- Supply-chain-buffer via cooldown 7d/3d mot fresh-publish-attacker (Axios-typ-incidenter)
- Least-privilege CI-yta (ingen secrets-yta-utvidgning till Dependabot-zon)
- Dokumenterad disciplin för framtida läsare (auto-merge-position explicit i ADR + reviewers-config)
- Bevarade stack-grupper (tanstack, react-aria, tailwind, types) ger fortsatt semantisk PR-batching för "high-touch"-stacks
- Production/development-separation reflekterar faktisk risk-profil

### Negativa

- Cooldown ger 7-dagars latens på minor/major (acceptabelt; security går igenom direkt)
- CI-coverage-gap för staging+e2e på Dependabot-PR:er
  - Mitigation: manuell pre-merge-verify (Marcus kör staging+e2e lokalt mot bumped deps)
  - Mitigation 2: lint+pure+build är kvar — 80 % av regression-domänen fångas fortsatt
- Reviewers-config kräver manuell review-disciplin (kan inte automatiseras till "godkänn allt minor")
  - Mitigation: F5-limit 5 npm håller volymen hanterbar

### Trade-offs

- Production/dev-separation kostar extra PR per vecka för semantisk gränshygien — acceptabelt per dual-risk-profile-skäl
- 4 stack-grupper bevarade trots catch-all-tillägg — kostar PR-volym (worst-case 1 catch-all + 4 stack = 5 PR/vecka) men ger semantisk PR-läsbarhet vid review

### Cross-ref till ADR-024 + ADR-028 + ADR-029

ADR-031 utvidgar ADR-024 (ursprungs-dependabot-config) med 2026-policy-revidering. ADR-028 (supply-chain-incident-respons) kompletteras med proaktiv buffer (cooldown) — `audit-ci` allowlist reaktiv, cooldown preventiv. ADR-029 (Strategi E) intakt; Alt D Hybrid använder `if:`-villkor på enskilda steg vilket är konsekvent med Strategi E:s "lint körs alltid, test conditional"-paradigm.

### Säkerhet (supply-chain)

- Cooldown skyddar mot fresh-publish-attacker (Axios mars 2026, CanisterWorm 2026, Trivy + Checkmarx KICS-kompromettering 2026)
- Manuell review skyddar mot Dependabot Deputy Confusion TTPs (BoostSecurity 2024+2025) — auto-merge är angripare-mål i flera kända incidenter
- Reviewers-config ger mekanisk "vem är ansvarig"-spårning
- Audit-ci K17-disciplin bevarad på `lint`-jobbet (kör på alla commits, inkl. Dependabot)

## Empirisk grund (web-research 2026-05-16)

- **GitHub Docs** — [Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference) (cooldown syntax + groups + scheduling)
- **GitHub Blog 2025-07-01** — cooldown native feature changelog ("Dependabot now supports cooldown periods to reduce notification fatigue and increase supply-chain safety")
- **StepSecurity 2026-04-15** — [Hardening Dependabot: Cooldown + Grouping in 2026](https://www.stepsecurity.io/blog/) supply-chain-context post-Axios
- **Safeguard.sh 2026-02-20** — operational 2026 fyra-lever-modellen (grouping + auto-merge + rate-limits + reachability-analysis)
- **BoostSecurity 2024** — [Dependabot Deputy Confusion TTPs](https://boostsecurity.io/blog/) initial-utgåva
- **BoostSecurity 2025** — Dependabot Deputy Confusion uppföljning post-Axios
- **dev.to nickytonline 2026-05** — "Why I'm pausing Dependabot auto-merge in 2026"
- **GitHub Issue 14645 (pip-audit)** — cooldown referens-implementation (`default-days: 7`)
- **Travis Gosselin** — [Catch-all Dependabot grouping for enterprise](https://travisgosselin.com/dependabot-with-grouped-updates/) enterprise-readiness-analys
- **GitHub Blog 2023-08** — Dependabot grouped version updates GA-announcement (catch-all `"*"` med `exclude-patterns` + `update-types: ["minor", "patch"]`)

## Baseline-fynd 2026-05-16

Empirisk data per lager, ifylld vid Session 6.6.5 K-sista #1 efter K2-K4 implementation har producerat post-state. Format analogt till ADR-030 § Baseline-fynd.

| Lager | Pre-existing config | Post-implementation config | Verifierings-källa |
|---|---|---|---|
| 1 — Grouping | 4 npm-grupper (tanstack/react-aria/tailwind/types) utan `update-types`-filter; inget github-actions-grouping; inget catch-all; alla stack-grupper bevarade | 4 stack-grupper med `update-types: [minor, patch]` + 2 catch-all (`production-dependencies` + `development-dependencies`) med `dependency-type` + `exclude-patterns` + `update-types`-filter; 1 github-actions catch-all-grupp | `.github/dependabot.yml` (K2 commit `ce5c0a8`, 112 rader); grep-verifierat 7 grupper post-implementation |
| 2 — Cooldown | Saknas helt (feature ej använd; pre-juli-2025-config-baseline) | npm: `cooldown.default-days: 7` + `semver-patch-days: 3`; github-actions: `cooldown.default-days: 7`. Security-updates kringgår per GitHub design (gäller endast `version-updates`) | `.github/dependabot.yml` grep `cooldown:` (2 träffar rad 31 + 102), K2 commit `ce5c0a8` |
| 3 — Minimal CI-yta | Staging + e2e körs på alla actors (inkl. Dependabot); pre-existing skuld från Session 4 K0åc.2 `STAGING_REQUIRED` hard-fail på shallow staging-env (5 PR:er #21-#25 failade pre-K3) | `API tests (staging)` + `E2E tests (staging)` har `if: github.actor != 'dependabot[bot]'`; pure-tests + typecheck + biome + build + 6 lint-grindvakter + Lychee körs fortsatt på Dependabot-PR:er | `.github/workflows/ci.yml` grep `github.actor != 'dependabot[bot]'` (2 träffar rad 193 + 232), K3 commit `06cbcc4`, CI run 25957075755 positiv-bekräftelse marcus803-push |
| 4 — Manuell review + reviewers | Implicit (Marcus reviewar via vana, ingen config-deklaration, ingen ADR-spårning) | Explicit i ADR-031 § Beslut Lager 4 + `reviewers: [marcus803]` på båda ecosystems i `dependabot.yml` + non-auto-merge-position dokumenterad | `.github/dependabot.yml` grep `reviewers:` (2 träffar rad 25 + 97), denna ADR Accepted-bump |
| Schedule + limit | npm weekly måndag (UTC-default; ingen explicit time + timezone), github-actions monthly, `open-pull-requests-limit: 10` (npm) / default-5 (github-actions) | npm: weekly måndag `time: "06:00"` + `timezone: "Europe/Stockholm"`, `open-pull-requests-limit: 5`; github-actions: monthly, `open-pull-requests-limit: 3` | `.github/dependabot.yml` rad 19-23 + 27 (npm) + rad 91 + 96 (github-actions), K2 commit `ce5c0a8` |
| Commit-message | Default `Bump X from Y to Z`-format (bryter projektets Conventional Commits-disciplin) | `prefix: "chore(deps)"` + `prefix-development: "chore(deps-dev)"` (npm) + `prefix: "ci(deps)"` (github-actions) + `include: "scope"` på båda | `.github/dependabot.yml` grep `commit-message:` (2 träffar), K2 commit `ce5c0a8` |

### Verifikations-noter

- **K3 positiv-bekräftelse:** CI run 25957075755 (commit `06cbcc4`) bekräftade if-villkor-mekaniken för positive case (marcus803-actor → staging-steg körs som vanligt). Negativ verifikation (Dependabot-actor → staging-steg skippas) deferas till nästa Dependabot-cykel (weekly schedule per `.github/dependabot.yml`).
- **K-sista-checkpoint flaggad:** Marcus reviewar första post-K4 Dependabot-PR och bekräftar (a) PR:er är grupperade enligt `production-dependencies`/`development-dependencies`-mönstret, (b) cooldown filtrerar versioner publicerade <7 dagar (default) eller <3 dagar (patch), (c) staging-steg visar "skipped"-status per K3. Checkpoint loggas i Session 6.7 K1-sessionsstart eller separat handoff-not.
- **K2.1-skuld-spårbarhet (latent shallow-clone-bug):** ADR-030 § Del 3 Check 2-design hade latent shallow-clone-bug som triggades vid K1 (dag-rollover) — `git log -1 --format=%cs -- <fil>` returnerar HEAD-commit-datum istället för filens senaste touch-datum på shallow clone (default fetch-depth: 1). Triggades inte tidigare pga sammanträffande invariant (alla 9 styrande docs bumpades till samma datum i K7.C `866dd7c`). K2.1 commit `a67908d` fix:ade via `fetch-depth: 50` på lint + test + docs jobs (matchar `changed`-jobbet per ADR-029 § Utelämning #6). Detta är ADR-030-skuld upptäckt vid K2-implementation; trail dokumenterad här. Formell ADR-030-tillägg-form (ny ADR vs ADR-030-edit) beslutas vid K-sista #2 lessons-skörd-domän.

## Spårbarhet

- **Föregångare:** ADR-024 (publika professionalitetssignaler, ursprungs-dependabot-config 2026-05-06)
- **Drivande observationer:**
  - Session 6.6 K2.5 — pre-existing skuld (5 Dependabot-PR:er failar på staging-secrets-isolation) deferad till mini-session per Marcus' Alt H
  - Session 6.6.5 K1 RAPPORTERA Block A.5 — 6 öppna PR:er (inte 5), PR #19 dolt fall
  - Session 6.6.5 K1 RAPPORTERA Block A.6 — `.github/dependabot.yml`-config-empiri: 4 stack-grupper, inget cooldown, ingen catch-all, inga reviewers
  - 2026-supply-chain-läget (Axios mars, CanisterWorm, Trivy + Checkmarx KICS-kompromettering)
  - GitHub native cooldown-feature (juli 2025) — befintlig config pre-feature-datum
- **Etablerad:** Session 6.6.5 K1 2026-05-16 (sessionsdok [`tasks/sessions/archive/2026-05/2026-05-14-session-6-6-5.md`](../../tasks/sessions/archive/2026-05/2026-05-14-session-6-6-5.md))
- **Implementation:**
  - K1 ✅ KLAR 2026-05-16 — sessionsdok + ADR Draft + README atomisk (commit `29bcef5`)
  - K2 ✅ KLAR 2026-05-16 — `.github/dependabot.yml`-uppgradering Lager 1+2 (commit `ce5c0a8`)
  - K2.1 ✅ KLAR 2026-05-16 — fetch-depth retrofit på lint/test/docs jobs + Lychee URL-fix (commit `a67908d`)
  - K3 ✅ KLAR 2026-05-16 — `.github/workflows/ci.yml` Alt D Hybrid Lager 3 (commit `06cbcc4`, CI run 25957075755 positiv-bekräftelse)
  - K4 ✅ KLAR 2026-05-16 — PR-backfill (#19, #21-#25 close, commit `0eedc6a`)
  - K-sista #1 ✅ KLAR 2026-05-16 — Status-bump Draft → Accepted + Baseline-fynd ifyllt (denna commit)
  - K-sista #2-#8 EJ STARTAD — lessons-skörd, BUILD-LOG, hub-sync, sessionsdok-arkivering, todo + CLAUDE.md status, PR-merge
- **Verifikation:** empirisk via K2 yamllint på `.github/dependabot.yml` (exit=0) + K3 CI run 25957075755 alla 5 jobs gröna inkl. positiv-bekräftelse av staging-steg-körning för marcus803-actor + K-sista #1 grep-sanity (7 grupper, 2 cooldown, 2 if-villkor, 2 reviewers). Negativ-verifikation av Dependabot-actor-skip + grouping-cykel-rekonstruktion deferas till nästa Dependabot-cykel per `.github/dependabot.yml` weekly schedule (K-sista-checkpoint flaggad i sessionsdok)
