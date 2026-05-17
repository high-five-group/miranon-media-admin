
# ADR-029: CI-arkitektur — changed-files-baserat skip-mönster + third-party Actions-policy

- Status: Accepted
- Datum: 2026-05-13
- Fas: Session 6 — CI-optimering (mellan Fas 2 och Fas 2.5)

## Kontext

Fas 2 stängdes 2026-05-13 (Session 5b). K5-paketet körde 14 sekventiella doc-only-commits, alla CI-gröna men ~95s per körning = ~22 min spilld CI-tid på arbete som inte påverkar bygg/test-utfall (verifierat empiriskt i Session 6 K1.A Block A.2 + K1.B Block B.3). Sessionsavsluts-disciplinen (sessionsdok-bake-ins, lessons-skördar, README/CHANGELOG-fas-avslut, BUILD-LOG-uppdateringar, byggplan-versionsbumpning) producerar legitim doc-volym — det är inte ett anti-mönster, det är ett CI-mönster att anpassa sig till.

Pre-Fas-2.5-positionen är idealisk för CI-optimering: ingen pågående fas-blocking, både drivande data (K5-paketet) och framtida-konsumenten (Fas 2.5 + 3 + 3.5 + ... = ~113 commits över 14,5 sessioner med ~40 % doc-only-andel = ~60 min framtida-spill om ej optimerat per K1.B Block B.5).

Marcus kvalitetsregel 2026-05-13: "INTE sänker kvaliten på våra CI utan höjer kvaliten, men tar bort onödiga saker för bara docs commits". Detta utesluter Strategi A (paths-ignore på jobbet hoppar audit-ci — bryter K17). Strategi B (if:-villkor på steg), C (separat docs-ci.yml), D (concurrency-grupp) och E (Vite-mönstret med changed-files-jobb + needs-skip + aggregator) övervägdes.

Research mot Vite ci.yml (vår direkta upstream-stack, verifierat 2026-05-13 mot main-branch) avslöjade Strategi E som branschledar-standard. Vite använder INTE paths-ignore i `on:`-blocket utan har ett första `changed`-jobb som detekterar via `tj-actions/changed-files` och sätter `should_skip`-output. Tunga test-jobb villkoras på den. Ett aggregator-jobb (`test-passed`) rapporterar grön status även när tester skippas — branch-protection-friendly.

Strategi E är *renare* än Pure C på fyra dimensioner: en sanningskälla (en workflow-fil), branschledar-validering (Vite + argo-cd + qmk_firmware), branch-protection-readiness via aggregator-jobb, naturlig extension-yta för framtida cross-doc-grep-automation. Den är 11/10-valet givet CLAUDE.md-principen "branschledarnas mönster är golvet".

## Beslut

1. **changed-files-baserat skip-mönster** etableras. Workflow-job ordning:

   a. `changed` (ubuntu-latest, ~5s) — `tj-actions/changed-files@9426d409...` v47.0.6 detekterar om alla ändrade filer matchar doc-only-globs. Outputs: `should_skip_tests` + `docs_changed`.

   b. `lint` (ubuntu-latest, ~15-20s, **kör ALLTID**) — npm ci + audit-ci + `biome check` + tsc --noEmit + typecheck:tests + actionlint. Säkerställer K17 supply-chain-skydd på varje commit + snabb kod-kvalitetsfeedback.

   c. `test` (ubuntu-latest, conditional on `should_skip_tests != 'true'`, ~75s) — npm ci + test:api:pure + test:api:staging + Playwright install + test:e2e:staging + build. De tunga stegen som spillas på doc-only.

   d. `docs` (ubuntu-latest, conditional on `docs_changed == 'true'`, ~30-40s) — `lycheeverse/lychee-action@8646ba30...` v2.8.0 markdown-link-validering. Scope: `docs/**/*.md` + `tasks/*.md` + `./*.md` (utelämnar `tasks/sessions/**` — frozen + in-flight, se §Medvetna utelämningar).

   e. `ci-passed` (ubuntu-latest, `if: always() && !contains(needs.*.result, 'failure') && !contains(needs.*.result, 'cancelled')`, ~3s) — aggregator-jobb. Branch-protection-required check vid framtida aktivering.

2. **Lint separeras från test.** Tidigare verify-jobbet kombinerade lint-steg med test-steg i en sekvens. Strategi E delar dem så att lint kan köra parallellt med test (vid kod-commit) eller ensam (vid doc-only-commit). Parallellisering ger även ~15s tids-besparing på kod-commits.

3. **lychee markdown-link-check etableras som NY kvalitets-check** som inte fanns innan. Detta är "höjer kvaliten"-delen av Marcus' regel. Pre-Fas-2 K3 åe-arbetet hade broken-refs som manuellt arbete; nu fångas det automatiskt.

4. **Concurrency-grupp** på workflow-nivå (`group: ${{ github.workflow }}-${{ github.event.number || github.sha }}`, `cancel-in-progress: true`) — auto-cancel av in-progress runs vid ny push på samma branch/PR.

5. **`permissions: {}`** på workflow-top-level — security hardening, least-privilege default för GITHUB_TOKEN.

6. **Third-party Actions-policy** etableras som ADR-028-utvidgning:
   - **SHA-pin obligatoriskt** på alla non-GitHub-officiella Actions (`tj-actions/*`, `lycheeverse/*`, etc.)
   - GitHub-officiella Actions (`actions/checkout`, `actions/setup-node`, `actions/cache`) får använda version-tag (`@v6`, `@v4`)
   - **Veckovis Actions-supply-chain-granskning** läggs till `tasks/todo.md` parallellt med (nu rensade) npm-allowlist-granskningen från K0åh.
   - Granskningssteg: kontrollera om använda third-party Actions har nya releases, jämför SHA mot officiell release-commit, dokumentera ev. supply-chain-incidenter.

## Alternativ övervägda

| Strategi | Beskrivning | Varför avvisad |
|---|---|---|
| A | `paths-ignore` på jobb i `on:`-blocket | Bryter K17 (audit-ci hoppas helt på doc-only); branch-protection-komplicerat |
| B | `if:`-villkor på enskilda tunga steg | Klottrar ci.yml; ingen branschledar-stöd; markdown-link-check får ingen naturlig hemvist |
| C | Separat docs-ci.yml | Två synk-punkter; saknade upstream-stöd; två-workflows-state vid branch protection mer komplicerat än aggregator-jobb |
| D | Concurrency-grupp ensam | Adresserade ej doc-only-problemet — antas som komplement i E |
| **E** | **Vite-mönstret (changed-files + needs-skip + aggregator)** | **Vald — branschledar-validerad, en sanningskälla, branch-protection-friendly** |

## Konsekvenser

**Positivt:**

- ~74 % CI-tids-besparing per doc-only-commit (empiriskt verifieras i K1.D commit 2)
- Branch-protection-readiness via `ci-passed`-aggregator (om Marcus aktiverar senare)
- lychee adderar broken-link-detection som inte fanns innan — kvalitetshöjning
- En sanningskälla (ci.yml), inga synk-problem mellan två workflow-filer
- Branschledar-mönster (Vite, argo-cd, qmk_firmware, aws-doc-sdk-examples) — minskar nyhets-risk
- Lint parallelliseras med test — ~15s besparing på kod-commits också (sekundärt mål uppfyllt)
- Concurrency-grupp ger ytterligare gratis-besparing vid rapid-fire-pushar

**Negativt:**

- Två nya third-party Actions (`tj-actions/changed-files`, `lycheeverse/lychee-action`) — Actions-supply-chain-yta ökar
  - Mitigation: SHA-pinning + veckovis Actions-granskning (utvidgning av ADR-028-policy)
- ci.yml växer från 12 steg (1 jobb) till 5 jobs / ~24 steps total — högre fil-komplexitet
  - Mitigation: jobs är konceptuellt separerade (changed/lint/test/docs/ci-passed), läsbarhet kompenserar
- lychee-baseline kan kräva justering om existing markdown har broken links
  - Mitigation: rättad scope efter Gate 2-review (inkluderar `tasks/*.md`); broken links åtgärdas som drift, inte tystas via preventiv `.lycheeignore`
- **Job-isolation kräver explicit cache för delade artefakter (Playwright-browsers).** Empiriskt bekräftat i K1.D commits 1/1.5/1.6: monolit-jobb-baseline hade ~95s (alla steg samma runner-instans, delad cache). Splittring till 5 jobs (Strategi E) isolerade test-jobbets `~/.cache/ms-playwright` → cold install 153s (commit 1). Lösning: `actions/cache@v4` med `hashFiles('package-lock.json')`-key + drop `--with-deps` (ubuntu-latest har Playwright OS-libs förinstallerade). Post-fix: 96s wall-clock med Playwright install 11s.

**Säkerhet (Actions-supply-chain):**

- `tj-actions` hade incident i **mars 2025** (GHSA-mrrh-fwg8-r2c3, secrets-läckage via kompromitterade taggar på flera repos i org:en). Vår valda v47.0.6 är post-patched (first_patched 46.0.1). En äldre cmd-injection GHSA-mcph-m25j-8j63 (jan 2024, first_patched v41) är också post-patched.

- **K18-disciplin applicerad på Actions-supply-chain:** Advisory-count är signal, inte sanning. När `gh api advisories?affects=<action>` rapporterar critical/high-träffar, analysera `first_patched_version` mot vald version FÖRE klassning som blockerande. Exempel från K1.C 2026-05-13: tj-actions/changed-files v47.0.6 valdes; advisory-baseline rapporterade 2 high (GHSA-mrrh-fwg8-r2c3 mars 2025 första-patched 46.0.1; GHSA-mcph-m25j-8j63 jan 2024 första-patched 41). Båda historiska, post-patched för v47.0.6 — inte aktiv risk. Identisk metodologi som K0åh-resolutionen för GHSA-rmmr-r34h-pfm5 (npm-domän). Bekräftar att K18 är paradigm-spanning, inte ekosystem-specifik.

- **actionlint installeras via maintainer-distribuerat `download-actionlint.bash`** (upstream-konvention; verktyget distribueras inte som GitHub Action av rhysd). Script:et verifierar släppta binär-checksums mot kända värden, vilket är teknisk integrity-skydd motsvarande SHA-pin för Actions. Vid framtida `rhysd/actionlint-action`-release: migrera till SHA-pinnad action per §6.

- K17-mönster gäller alla supply-chain-källor inklusive Actions-marketplace.

## Medvetna utelämningar och scope-avgränsningar

Per Marcus' Gate 2-kvalitetsregel 2026-05-13 ("genväg = disciplin-brott"): varje utelämning dokumenteras explicit med motivering, senior-team-test och 11/10-test.

1. **lychee-scope utesluter `tasks/sessions/**`.** Arkiverade sessionsdok är frozen zoner per ADR-023 (lint-checkas inte). Aktiva sessionsdok är in-flight-state med TBD-poster och cross-fas-referenser under arbete. Senior-team-test: frozen + WIP-content lint-checkas inte. 11/10-test: utelämning refererar etablerad ADR. **Beslut:** låt stå.

<!-- vale Vale.Terms = NO -->
2. **`.lycheeignore` startar tom.** Empirisk add-only-policy: lägg endast till mönster när dokumenterad-flaky-behavior bevisats. Preventiv exklusion (typ "lägg till github.com som potentiellt-flaky") tystar K18-signal vi inte vet om är problem. Senior-team-test: ja, default-disciplin för ignorelist-management. 11/10-test: bevarar K18 ("output är signal, inte sanning"). **Beslut:** låt stå.
<!-- vale Vale.Terms = YES -->

3. **actionlint installeras via download-script, inte SHA-pinnad Action.** Maintainer (rhysd) distribuerar inte verktyget som GitHub Action; install-via-script ÄR upstream-mönstret (Vite gör det). Script:et verifierar släppta checksums — teknisk integrity-skydd motsvarande SHA-pin. Senior-team-test: ja, världsklass-projekt (Vite) använder samma metod. 11/10-test: konsekvent med upstream + migration-väg dokumenterad. **Beslut:** låt stå; migrera vid framtida actionlint-action-release.

4. **Single-OS (ubuntu-latest), single-Node (.nvmrc) — inte matrix.** Deployment-target = browser (Vite-build); backend = Deno Edge Functions (kör ej i Node CI); cross-OS-test ger inte deployment-validation. Senior-team-test: ja, många React-SPA-projekt single-OS. 11/10-test: scope matchar deployment-surface. **Beslut:** låt stå; utvidga vid behov om Fas 5+ etablerar service-worker eller native-modules som kräver OS-validation.

5. **Enkel `ci-passed`-aggregator (Vites mönster har dual `test-passed`/`test-failed`).** Branch protection ej aktiverad (K1.A Block A.4); explicit failure-signal överflödig utan automation som läser den. Senior-team-test: komplexitet utan användning = överbyggnad. 11/10-test: KISS-principen; kan utvidgas vid framtida branch-protection-aktivering. **Beslut:** låt stå.

6. **`fetch-depth: 50` i changed-jobb (inte unbounded eller mindre).** Marcus' single-author push-to-main-pattern har typiskt <15 commits per session; 50 = 3x säkerhetsmarginal. Senior-team-test: Vite använder samma värde med samma logik. 11/10-test: explicit antagande dokumenterat. **Beslut:** låt stå.

**Anti-mönster-anteckning (initial genväg rättad i K1.D):** lychee-scope utelämnade tidigare även `tasks/lessons.md`, `tasks/todo.md`, `tasks/byggplan-direktiv.md`, `tasks/datamodell-research-*.md` med motiveringen "risk för broken links vid baseline". Marcus' Gate 2-kvalitetscheck fångade att riskpåståendet var antagande, inte data (K11-anti-mönster). Rättning: scope inkluderar nu `tasks/*.md`. Eventuella broken links åtgärdas som drift, inte tystas via preventiv `.lycheeignore`. Anti-mönster skördas som lessons-kandidat i Session 6 K-sista ("Preventiv exklusion utan empirisk basis är genväg, inte försiktighet").

## Konvention för framtida CI-utvidgningar

- **Nya tunga test-suites** (om Fas 3.5 / Fas 7 etablerar dem) — läggs som steg i `test`-jobbet, inte nytt jobb om scope är test-natur. Nytt jobb om scope är ny pipeline-kategori (t.ex. visual regression).
- **Nya docs-checkar** (markdownlint, cross-doc-grep-automation från K5.9c, spell-check) — läggs som steg i `docs`-jobbet.
- **Nya kod-kvalitets-checkar** — läggs i `lint`-jobbet om snabba (<10s); eget jobb om längre.
- **Aggregator-namnet `ci-passed`** är branch-protection-required-stable. Ändra inte. Nya jobb läggs till `needs`-listan.
- **CI-verifikation efter push:** använd `gh run watch <run-id> --exit-status` istället för SHA-baserad polling. `gh run list --jq '... select(.headSha == "<kort-sha>")'` matchar aldrig (API returnerar full 40-char SHA, inkompatibel med kort-SHA). Korrekt mönster: `RUN_ID=$(gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId') && gh run watch "$RUN_ID" --exit-status`. Bekräftat empiriskt i Session 6 K1.D commits 1/1.5/1.6.

## Spårbarhet

- **Föregångare:** ADR-028 (supply-chain incident-respons-protokoll, 2026-05-12) — ADR-029 utvidgar policy till Actions-ekosystem.
- **Drivande observation:** Session 5b K5-paketet 14 doc-only-commits, ~17-19 min spilld CI-tid (K1.B Block B.3).
- **Research-källa:** Vite `ci.yml` main-branch verifierad 2026-05-13.
- **lychee-källa:** [lycheeverse/lychee-action](https://github.com/lycheeverse/lychee-action) maintained jan 2026.
- **Implementation:** Session 6 K1.D commits — denna ADR (commit 2) + ci.yml-omstrukturering (commit 1 + 1.5 + 1.6 iterativt med cache-fix + drop --with-deps + ci-passed-fix).
- **Verifikation:** empirisk via K1.D commit 1 + 1.5 + 1.6 CI-runs (kod-config-iteration) + commit 2 CI-run (doc-only — testar själva skip-mekaniken).

## Baseline-fynd 2026-05-14

K1.D Commit 2 (a5411e1) körde lychee första gången mot repot. Resultat:

| Kategori | Count | Beskrivning |
|---|---|---|
| 🔍 Total URLs checked | 559 | docs/**/*.md + tasks/*.md + ./*.md |
| ✅ Successful | 439 | rena 200 OK |
| 🔀 Redirected | 24 | följda redirects, slutligen OK |
| 👻 Excluded | 11 | filer markerade exkluderade i lychee-config |
| ❓ Unknown | 0 | inga unparsable URLs |
| 🚫 Errors | **81** | broken/auth-gated/stale |

**3-kategori-klassning av de 81 errors:**

| Kategori | Antal | Mönster | Hantering |
|---|---|---|---|
| **A — Verklig drift** | ~25 (8 unika) | Stale refs efter ADR-021 (docs-omstrukturering) / ADR-023 (sessionsdok-arkivering) / ADR-027 (stack-skifte) / K5.8b. Exempel: `docs/STATE-STRATEGY.md` (flyttad till `docs/specs/`); `tasks/sessions/2026-05-11-fas2-routing-auth.md` (arkiverad till `archive/2026-05/`). | `.lycheeignore` DEFERRED-FIX-MARKER → Session 6.5 |
| **B — Path-konstruktion-fel** | ~46 (20 unika) | docs/analysis/-rapporter använder `src/...` istället för `../src/...` (saknar ../-prefix för djup 2). Plus cirkulär-path-bug i `docs/research/datamodell-research/06b-supabase-target.md` (refererar sig själv via full absolut path). | `.lycheeignore` DEFERRED-FIX-MARKER → Session 6.5 |
| **C — Acceptable** | ~14 (6 unika) | Auth-gated (`claude.ai` 403), pre-release-mallar (`compare/v0.1.0...v0.2.0` 404), stale upstream (adobe react-spectrum). | `.lycheeignore` Block 1 — Acceptable |

Per K7 refactor/semantik-separation (Marcus' Gate 2-disciplin 2026-05-13): CI-arkitektur ≠ content-korrekturläsning. `.lycheeignore` accepterar baseline via 4 acceptable-patterns + 8 DEFERRED-FIX-MARKER-patterns. Fix-arbete spåras i `tasks/todo.md` Session 6.5-sektion.

### Konkret mervärde: lychee synliggjorde ADR-027-stack-skifte-drift

Bland kategori A-fynden: `KVALITETSDEFINITIONER-11.md` refererad istället för `KVALITETSDEFINITIONER-11-REACT.md`. Detta är direkt drift från ADR-027 (Vue → React stack-skifte, Session 5b K3.5/K5) som K5.9c cross-doc-grep-rutinen inte fångade (rutinen sökte efter Vue-specifika strängar, inte länkmål-validering).

Mönster: lychee + cross-doc-grep är komplementära kvalitetsverktyg.

- Cross-doc-grep fångar **innehållsdrift** (samma faktum, olika ord)
- lychee fångar **referensdrift** (samma ord, fel länkmål)

Generaliserbar mönsterförstärkning av K5.9c-disciplinen: **fas-avsluts-rutinen ska inkludera båda check-typer**, inte bara cross-doc-grep. Lyfts som lessons-kandidat i Session 6 K-sista. Eventuellt Fas 7-konsolidering integrerar lychee-disciplin med K5.9c-grep-suite som unified "docs sanity check".

### Pattern-design-skärpning

Pattern `^file://.*/docs/analysis/[^/]+\.(ts|tsx|md|css|js)(>|#.*)?$` övervägdes initialt men smalades till `(ts|tsx|css|js)` (utan `.md`) per Marcus' Gate-skärpning 2026-05-14. Motivering: bredare pattern skulle tysta legitima cross-analysis-md-refs (typ `docs/analysis/Codex-project-analysis.md` → `docs/analysis/Code-verification-...md`). Buggy `.md`-refs (osannolikt vid path-konstruktion-fel) släpps igenom; krävs explicit fix per K11-disciplin. K11-tillämpning: pattern-design ska skydda mot kända risker, inte maximera täckning preventivt.
