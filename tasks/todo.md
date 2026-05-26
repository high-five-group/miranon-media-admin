<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk. 8 äkta Vale.Terms-fynd + 1 emergent rad-245-quirk dokumenterade i K2.6.2.D.4 v2-trail. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# todo.md — Miranon Media Admin (React)

<!-- markdownlint-disable-next-line MD036 -->
*Senast uppdaterad: 2026-05-26 (Session 6.7 ✅ KLAR — K1–K8 + plugin-wiring + K-sista landade; Session 7 nästa)*

> Aktiva uppgifter. Lärdomar fångas i `tasks/lessons.md`.
> Arkitekturbeslut fångas i `docs/decisions/`.
> Implementation-journal i `docs/BUILD-LOG.md`.
> Styrande dokument: [`docs/byggplan.md`](../docs/byggplan.md)

---

## Aktuellt fokus

**Fas 2 ✅ KLAR 2026-05-13** — Routing + Auth komplett. Alla 8 DoD-rader stängda och empiriskt verifierade via 6-tests Playwright-regression. Defense-in-depth tre-skikt-arkitektur levererad: skikt 1 (klient-guard K3.2/K3.3) + skikt 2 (AuthError throw K3.4) + skikt 3 (server requireUser Fas A M2). Sessions 4 + 5 + 5b (arkiveras till `tasks/sessions/archive/2026-05/` i K5.8). Hub-lyft-kandidater: 7 totalt (K17 + K18 + K19 + K34 + K36 + K37 + K38) för K5.7 hub-sync.

**Session 6 ✅ KLAR 2026-05-14** — CI-optimering mellan Fas 2 och Fas 2.5. Strategi E (Vite-mönstret) etablerad per ADR-029. Empirisk verifikation: doc-only ~34s vs ~95s baseline = ~64 % besparing. Kod ~96s matchar baseline. lychee broken-link-detection etablerad. ADR-028 utvidgad till ADR-029 § Third-party Actions-policy. 17 UNIVERSAL-lessons skördade (största enskilda session-skörd); 10 hub-lyfta. Sessionsdok-trail: [`tasks/sessions/2026-05-13-ci-optimering.md`](sessions/2026-05-13-ci-optimering.md).

**Session 6.5 ✅ KLAR 2026-05-14** — Broken-links-batch-städning. 54 broken refs eliminerade (6 + 23 + 1 + 24) + 1 disciplin-utvidgning (ADR-022 kategori 4 "Frusen extern leverans"). 8 commits (6 fix + 1 revert + 1 disciplin). 15 lessons-kandidater skördade (13 [UNIVERSAL], 2 lokala). `.lycheeignore` 55 → 35 rader, 6 → 0 DEFERRED-FIX-MARKER. Sessionsdok-trail: [`tasks/sessions/archive/2026-05/2026-05-14-broken-links-cleanup.md`](sessions/archive/2026-05/2026-05-14-broken-links-cleanup.md) (arkiverad).

**Session 6.6 ✅ KLAR 2026-05-15** — Docs-grindvakter + frontmatter-policy + observations-pass. 5 CI-grindvakter etablerade (yamllint + markdownlint-cli2 + scripted-checklist-check + Vale + frontmatter-validator). Frontmatter-policy 4 fält på 9 styrande docs + pre-commit auto-bump + 5-check CI-validator (10 docs explicit lista i ADR-030 § Del 2 inkl. hub). ADR-030 etablerad och Accepted. K7.5 retroaktiv config-driven-refactor av K5 + SC2034 klass-fix polish. 15 lessons-kandidater skördade (alla [UNIVERSAL]). 2 defer-paket öppna (6.6.6 + 6.6.7; 6.6.5 ✅ KLAR 2026-05-16, se BUILD-LOG Session 6.6.5). Strategi E job-skip empirisk på post-K7.5-baseline (docs-only 36s, full-CI 88s). Sessionsdok-trail: [`tasks/sessions/archive/2026-05/2026-05-14-session-6-6.md`](sessions/archive/2026-05/2026-05-14-session-6-6.md) (arkiverad K-sista commit #3).

**Session 6.6.7 ✅ KLAR 2026-05-16** — Shellcheck-strict-grindvakt + shallow-clone-detection levererad. 17 commits (`3f025b9` → K-sista #5/#6 efter denna). ADR-033 Accepted. 12 [UNIVERSAL]-lessons (L_A-L_L). Se [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) Session 6.6.7-block.

**Session 6.6.6 ✅ KLAR 2026-05-24** — Vale-cleanup + lessons-konsolidering. K-sista-0 + K-sista-1-A–H landade (commit-trail `950aa0f` → `62d661b`). 125 lessons-kandidater konsoliderade till L15-L27 (`tasks/lessons.md` H2 "## 2026-05-23 — Session 6.6.6"); ADR-032 Accepted. Se [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) Session 6.6.6-block.

**Session 6.7 ✅ KLAR 2026-05-26** — CLAUDE.md-audit (hub 37→ refaktor 609→118; spoke 31→ refaktor 622→126) + skills-extraktion till Claude Code-plugin distribuerat via git-marketplace `marcus-hub` (inwirat i spoken, steg A–C) + checklist-trimning (K7 trim ≈ noll) + discovery-test (K8 4/6 → 2 meta-discipliner flyttade till alltid-på). ADR-034 Accepted. 10 [UNIVERSAL]-lessons (L28–L37) skördade + hub-synkade (K6.7.1–10). Audit-rubrik flyttad till `marcus-system/templates/`. Sessionsdok-trail: [`tasks/sessions/2026-05-24-session-6-7.md`](sessions/2026-05-24-session-6-7.md).

**Nästa efter Session 6.7 (Strategi β):** Session 7 K0 — Fas 2 11/10-verification (7 gap-punkter committed i Session 6.5 pre-K1 som received-defer per K7; se [`docs/analysis/Fas-2-11-10-verification-2026-05-14.md`](../docs/analysis/Fas-2-11-10-verification-2026-05-14.md)) → Fas 2.5 Schema-kontrakt-sync (per `docs/byggplan.md` §4).

**Strategi β-rationale (post-6.6.7-leverans 2026-05-16):** quick-wins först (6.6.7 ✅ KLAR) → tungt arbete (6.6.6 ✅ KLAR) → process-mognad (6.7) → produkt-leverans (Session 7 K0 + Fas 2.5). 6.6.7-momentum levererat: shellcheck-strict 0/0/0/0 + shallow-clone-detection defense-in-depth lager 2 + 12 [UNIVERSAL]-lessons hub-konsolideringskandidater.

Sessionsdok-trail (arkiverad 2026-05-13 i K5.8): [`tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`](sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md).

### Mini-session 6.6.6 ✅ KLAR 2026-05-24 — Vale.Terms + Miranon.VueToReact-cleanup

**Status (2026-05-24):** ✅ KLAR. K-sista-0 + K-sista-1-A till -H levererade (F = 6.7-prep-expand `1825b3e` + `762706f`, G = arkivering `d4c3620`, H = final-verifikation `62d661b`). CI grön (run 26362719206).

Vale.Terms (425) + Miranon.VueToReact (114) hanterades via Vale-config-cleanup + per-fil helfil-disable (ADR-032). **Prep-fil:** [`tasks/sessions/archive/2026-05/2026-05-14-session-6-6-6-prep.md`](sessions/archive/2026-05/2026-05-14-session-6-6-6-prep.md). **Klass:** kvalitets-fynd defererade via per-fil rad-1-disable (regression-skydd via Alt F per K1.13-utvidgning). Full trail: sessionsdok Del 8.

**Effektiv ordning (Strategi β bekräftad 2026-05-16):** Startas EFTER Session 6.6.7 — tungt fokus-arbete (~7-10h över 52 filer); momentum från 6.6.7-leverans skyddar mot avstamps-friktion. L15-L18 + L19 + ev. nya lessons skördas + bake:as in vid K-sista i ny H2 `## 2026-05-16 — Session 6.6.5 (post-K-sista #2 retroaktiva)` i `tasks/lessons.md`. Hub-sync konsolideras med 6.6.6:s egna [UNIVERSAL]-skörd.

Defer-bakgrund: K6.2 V4 bekräftade Vale 3.14.1 har INGEN `--fix`-flagga. Manuell sed-batch är osäker för 3/5 unika Vale.Terms-substitutioner (`aria`/`fk`/`vite` har hög kod-bryt-risk). Per-fil rad-1-disable valt för regression-skydd (naturlig disable-borttagning vid 6.6.6-fix).

**ADR-032 (Vale L_X.2 helfil-disable):** Accepted (K3.5, commit `2d55ea0`). Sekvens: ADR-031 (6.6.5 Dependabot) → ADR-032 (6.6.6 Vale, Accepted) → ADR-033 (6.6.7 shellcheck).

### Mini-session 6.6.7 ✅ KLAR 2026-05-16 — shellcheck-grindvakt för scripts/*.sh + .githooks/* (TOP-PRIORITY post-6.6.5 per Strategi β)

**Effektiv ordning (Strategi β bekräftad 2026-05-16):** Startas FÖRE Session 6.6.6 — quick-win (~2-3h) + bygger momentum + konsoliderar Session 6.6.5 K2.1 fetch-depth-fix med defensive-programming-lager (shallow-clone-detection integrerat i K4-scope).

Defer från Session 6.6 K7.B + K7.5.4 (SC2034 klass-blindhet). Egen ADR-trail per ADR-029 § Konvention för framtida CI-utvidgningar.

**Scope (utvidgat 2026-05-16):**

- Shellcheck-strict-mode (0 warnings + 0 errors) som CI-grindvakt för alla bash-scripts i repot. Inkluderar `scripts/*.sh`, `.githooks/*`, `.checklist-policy.conf`, `.frontmatter-policy.conf`
- ADR-033 etablering (shellcheck-strict-grindvakt + scope-definition)
- **NY från K-sista #3 Alt C-defer:** shallow-clone-detection i `scripts/check-frontmatter.sh` via `git rev-parse --is-shallow-repository`-check + gracefully Check 2-degradering
- **NY från ovan:** `scripts/test-check-frontmatter.sh` utvidgning med shallow-clone-scenario-tester
- **NY från ovan:** ADR-030 § Del 3 sub-§ "Implementations-krav på CI-miljö" kompletteras med defensive-programming-not (refererar till scripts-detection)

**Trigger (uppdaterad 2026-05-16):** TOP-PRIORITY post-Session 6.6.5 ✅ KLAR per Strategi β. **Estimat:** ~2-3h totalt (shellcheck baseline ~1-2h + shallow-clone-detection bonus ~1h, inkluderar ev. retroaktiv fix av befintliga warnings utöver SC2034-klass-fix från K7.5 polish).

**Prep-fil:** `tasks/sessions/archive/2026-05/2026-05-14-session-6-6-7-prep.md` (arkiverad K-sista #5 2026-05-16).

### Session 6.6.5 K-sista-checkpoints

- **Dependabot-side empirisk-verifikation (förväntat ~2026-05-18 per weekly schedule):** Marcus reviewar första post-K4 Dependabot-PR och bekräftar (a) grouping enligt production-deps/development-deps/stack-grupper-mönstret, (b) cooldown-filter (versioner <7d skippas, patch <3d), (c) staging-stegen visar "skipped"-status (om Dependabot-actor). Loggas i Session 6.7 K1-sessionsstart eller separat handoff-not.

- **Shallow-clone-detection-tillägg (defensive programming, Alt C-defer från Session 6.6.5 K-sista #3):** `scripts/check-frontmatter.sh` utvidgning med `git rev-parse --is-shallow-repository`-detection som degraderar Check 2 gracefully om fetch-depth-config glöms. Test-suite (`scripts/test-check-frontmatter.sh`) utvidgad med shallow-scenarier. **Allokerad till Session 6.6.7 K4 per Strategi β 2026-05-16** (tematisk match: scripts/*.sh defensive-programming-domän). Inte akut — K2.1 fetch-depth: 50-retrofit löste rotorsaken (commit `a67908d`). Detta är defense-in-depth-lager 2 + hub-portabilitets-skydd. Spårbar via `tasks/lessons.md` L8 + ADR-030 § Del 3 sub-§ "Implementations-krav på CI-miljö".

### Återkommande disciplin: Branch-protection-aktivering på main

ADR-029 § Konsekvenser planerar för manuell aktivering av branch-protection. Aggregator `ci-passed` är ready (empiriskt verifierat Session 6.6 K9 2026-05-15: 5/5 senaste runs gröna med 3-4s aggregator-step).

**Marcus-action:** GitHub Settings → Branches → main → Branch protection rule → require status check `ci-passed` (+ ev. PR-review-krav, linear history per Marcus-preferens).

**Trigger:** när som helst Marcus väljer. Inte session-blockerande. Status 2026-05-15: `gh api repos/marcus803/miranon-media-admin/branches/main/protection` returnerar HTTP 404 "Branch not protected".

**Spårbarhet:** Session 6.6 K9 K9.1 lesson (mekanism-installation ≠ aktivering) + ADR-029 § Konsekvenser-citat.

### Operativ skuld — Transcript-disciplin ej implementerad

`CONTRIBUTING.md` transcript-disciplin (sessions-transcripts till `tasks/sessions/transcripts/<datum>.txt` som sanningskälla vid sessionsavslut) är skriven men inte operativt implementerad. Session 6.5 är första session där noten explicit flaggas som process-skuld.

**Trigger för åtgärd:** vid första framtida session där Marcus får tid att sätta upp transcript-export-rutinen från Chat. Inte blocker för Session 7+ arbete, men disciplin-skuld som driver mot 9/10 ju längre den ligger.

**Källa:** Session 6.5 K-sista.4 beslut 2026-05-14.

### Session 6.5 ✅ KLAR 2026-05-14 — lychee-baseline fix-arbete (deferred från Session 6 K1.D Commit 3)

K1.D Commit 2 lychee-baseline (2026-05-14) fångade 81 broken/stale refs. Per K7 refactor/semantik-separation: CI-arkitektur ≠ content-korrekturläsning. `.lycheeignore` accepterar baseline med DEFERRED-FIX-MARKER-block; fix-arbete spåras här.

**Scope (~67 refs som ska fixas, klassade i [ADR-029 § Baseline-fynd](../docs/decisions/ADR-029-ci-architektur-changed-files-pattern.md)):**

| Kategori | Antal | Drift-typ | Fix-strategi |
|---|---|---|---|
| A.1 docs-omstrukturering (ADR-021) | ~5 unika | `docs/STATE-STRATEGY.md` → `docs/specs/STATE-STRATEGY.md` (+ DESIGN-SYSTEM-SPEC, SECURITY-SPEC, byggplan-revision-inventory, gap-analysis) | Sök-och-ersätt per refererande fil |
| A.2 KVALITETSDEFINITIONER stack-skifte (ADR-027) | ~4 träffar | `KVALITETSDEFINITIONER-11.md` → `KVALITETSDEFINITIONER-11-REACT.md` | Sök-och-ersätt |
| A.3 Sessionsdok-arkivering (ADR-023 / K5.8b) | ~2 träffar | `tasks/sessions/2026-05-11-fas2-routing-auth.md` → `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` | Sök-och-ersätt (eventuellt redan delvis fixat) |
| A.4 Cirkulär-path-bug | ~25 träffar | `docs/research/datamodell-research/06b-supabase-target.md` refererar sig själv via full absolut path från projekt-rot — bör vara hash-only `#L101` etc. | Fixa hash-link-syntax i 06b-supabase-target.md |
| B.1 docs/analysis/ path-konstruktion | ~30 träffar | `src/main.tsx` → `../src/main.tsx` (saknar ../-prefix för djup 2) | Sök-och-ersätt per fil (Codex-project-analysis.md + Code-verification-...md) |
| B.2 docs/archive/ samma bugg | ~7 träffar | Som B.1 fast i `docs/archive/`-filer | Sök-och-ersätt eller markera frozen-zon explicit |

**Per-fas-fix-procedure:**

1. Per drift-kategori: lokalisera alla refererande filer via `rg -l '<gammal-path>' docs/ tasks/`
2. Sök-och-ersätt med `sed -i ''` (macOS) eller motsvarande
3. Verifiera via `git diff` att inga oavsiktliga matches gjordes
4. Kör lokal lychee om verktyget installerats: `lychee --offline './docs/**/*.md' './tasks/*.md' './*.md'`
5. När alla kategorier fixade: ta bort motsvarande DEFERRED-FIX-MARKER-block från `.lycheeignore`
6. CI grön → Session 6.5 ✅ KLAR

**Trigger för start:** Session 6.5 kan köras separat eller integreras med Fas 2.5 / Fas 3 doc-touch. Marcus avgör tajming. Estimat: 1-2 timmar Code-tid.

**Pre-Session 6.5-not (2026-05-14, Session 6 K1.D Commit 4c):** K1.D Commit 4b empiriskt-verifierade fix av tanstack canonical-URLs i `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` (`/query` → `/query/latest`, `/table` → `/table/latest`). CI-verifikation fördröjdes av UTF-8-glob-bug i tj-actions/changed-files (svenska tecken i v3.md-filnamnet gav `should_skip_tests: false` + `docs_changed: false` — lychee kördes inte). Commit 4c (denna uppdatering) triggar ASCII-path docs-changed → lychee körs → 0 errors verifieras empiriskt. UTF-8-bugg flaggas som lessons-kandidat #17 för K-sista hub-lyft-överväganden + ev. ADR-029-appendix om mönstret är reproducerbart.

**Lessons-kandidat #14 (skördas Session 6 K-sista):** lychee + cross-doc-grep är komplementära kvalitetsverktyg — båda behövs vid fas-avslut. lychee fångar **referensdrift**; K5.9c fångar **innehållsdrift**. Generaliserbar disciplin etablerad via ADR-029 § Baseline-fynd.

### Återkommande disciplin: K0åi-trigger för pin-luckring (post-K0åh resolution 2026-05-13)

Allowlist `audit-ci.jsonc` är tom (K0åh, 2026-05-13). Exakt-pin på 5 `@tanstack/*`-paket + `overrides: { "@tanstack/history": "1.161.6" }` bevaras tills TanStack rör `latest`-dist-tag bortom 1.161.6.

- **Trigger:** Vid sessionsstart, om `npm view @tanstack/history@latest version` returnerar annan version än `1.161.6` → starta K0åi (pin-luckring `^`-prefix-återinförande + overrides-borttagning per [ADR-028](../docs/decisions/ADR-028-supply-chain-incident-respons.md) reverse-flow).
- **Senast kontrollerad:** 2026-05-13 (K0åh, returnerade `1.161.6` — pin-disciplin fortsatt motiverad)
- **K0åh resolution-detaljer:** Se [ADR-028](../docs/decisions/ADR-028-supply-chain-incident-respons.md) `## Updates` för advisory-snär-uppdaterings-spårning + reverse-flow-spec.
- **Tas bort från denna lista** när K0åi har körts (overrides + exakt-pin upplöst, post-incident state).

### Återkommande disciplin: Veckovis Actions supply-chain-granskning (ADR-029 §6)

Third-party GitHub Actions med SHA-pin granskas veckovis för:

- Nya releases (uppdatera SHA om relevant security-fix)
- Publicerade supply-chain-incidenter (typ tj-actions mars 2025)
- Withdrawn actions eller maintainer-byten

Pinned third-party Actions just nu:

- `tj-actions/changed-files@9426d40962ed5378910ee2e21d5f8c6fcbf2dd96` (v47.0.6)
- `lycheeverse/lychee-action@8646ba30535128ac92d33dfc9133794bfdd9b411` (v2.8.0)

**Senast granskad:** 2026-05-13 (ADR-029 etablering)
**Nästa granskning senast:** 2026-05-20

**Granskningssteg:**

1. `gh api repos/tj-actions/changed-files/releases/latest --jq '{tag_name, target_commitish, published_at}'`
2. `gh api repos/tj-actions/changed-files/git/refs/tags/<tag_name> --jq '.object.sha'` — verifiera att SHA matchar release-tag
3. Jämför verifierad SHA mot pinned SHA i `.github/workflows/ci.yml`
4. Om SHA skiljer: läs release-notes via `gh api repos/tj-actions/changed-files/releases/latest --jq '.body'`
5. Repetera 1-4 för `lycheeverse/lychee-action`
6. Kolla advisory-status:
   - `curl -s 'https://api.github.com/advisories?affects=tj-actions/changed-files' | jq '.[] | {ghsa_id, severity, first_patched_version, published_at}'`
   - Analysera `first_patched_version` mot vår pinned-version per K18-disciplin
   - Repetera för `lycheeverse/lychee-action`
7. Om incident med vår version aktivt sårbar: följ ADR-028 5-stegs Konvention-flöde anpassat för Actions (SHA-pin till pre-incident-version + uppgradering vid resolution)
8. Om alla rena: uppdatera "Senast granskad"-datum + "Nästa granskning senast" + commit

Se [`docs/byggplan.md`](../docs/byggplan.md) §4 Fas 2-prompten och [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) Session 2 för kontext från Fas A + Fas 0/1.

**Session-historik:**

- **Session 1 (React): 2026-04-14** — Fas 0 + Fas 1 klara. BUILD-LOG + 10 ADR:er skapade. Dokumentationsrutiner (BUILD-LOG + ADR) integrerade i CLAUDE.md sessionsstart/avslut. Commits: `fcc6de3`, `e3d8e8a`, `c91bfa0`, `680858c`.
- **Session 2 (React): 2026-04-30 → 2026-05-05** — Fas A (säkerhetshardening, M1–M8, 14 commits, 113 tester) + P0–P3a byggplan-revision (`docs/byggplan.md` 832 rader, 13 fas-prompter, 10 nya ADR:er ADR-011..ADR-020, 7 UNIVERSAL-lessons). P3b städning pågår. Se [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) Session 2 för full retrospektiv.
- **Session 3 (Pre-Fas-2-verifiering): 2026-05-06** — Repo-strukturell polish + publika professionalitetssignaler. K3 åa-åf: LICENSE + package.json metadata + .github/-paketet (CI + dependabot + templates) + CHANGELOG/SECURITY/CONTRIBUTING + README badges/Documentation map + docs/-omstrukturering (specs/analysis/reference/logs) + analys/ → docs/research/datamodell-research/ + tasks/sessions/-arkivering. 4 nya ADR:er (ADR-021..024). Trail: [`tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md`](sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md).
- **Session 4 (Fas 2 K0 startvillkor): 2026-05-11** — K0 startvillkor 1-3 av 3 klara. Två sub-faser per startvillkor där refactor/semantik kan separeras (K0åb.1+.2, K0åc.1+.2). Plus 4 K1.N early bake-ins av sessionsdoket (`6af3927` + `fc6f43e` + `3b29f41` + `3927a24`). 6 K0-commits: `13cdf86` (nuqs) + `a5a477b` + `1d02b3b` (typecheck:tests + APIResponse + @types/node) + `3015d08` + `1138e38` (CI test:api-split + STAGING_REQUIRED + 6 GitHub-secrets). CI grön på första försök efter K0åc.2 (36s, run 25663357991): 72 pure passed + 38 staging passed + 3 M4-defer skipped + 8 övriga steps. 12 UNIVERSAL-lessons lyfta till lessons.md + hub (`f1e609e` + `91db29b`). Aktiv sessionsdok-trail: [`tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`](sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md). PÅGÅR — K0åd-K0åf "Direkt efter Fas 2"-fynd + K2 implementation återstår.
- *Session 1 (React) motsvarar Session 31 i total projekthistorik. Vue-bygget var session 1–30 i `~/Repon/miranon-media-os/`. Session 2 = Session 32–34. Session 3 = Session 35. Session 4 = Session 36.*

---

## Fas 0: Projektsetup + tokens ✅ KLAR

**Mål:** Fungerande React-projekt med alla verktyg installerade, tokens konfigurerade, lint som passerar.
**Klar:** 2026-04-14 (Session 1 (React), commit `fcc6de3`).
**Dokumentation:** [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) → Session 1 (React) → Fas 0.

### Initiering

- [x] 0. Initiera Vite-projekt (manuellt, eftersom katalogen inte var tom)

### Filer som skapas

- [x] `package.json` (alla dependencies)
- [x] `vite.config.ts` (React-plugin + `@tailwindcss/vite` — TanStack Router-plugin återinförs i Fas 2)
- [x] `tsconfig.json`
- [x] `tsconfig.app.json`
- [x] `tsconfig.node.json`
- [x] [GA] `biome.json` (Biome 2.4 — se [ADR-001](../docs/decisions/ADR-001-biome-over-eslint-stylelint-prettier.md))
- [x] `index.html`
- [x] `src/main.tsx` (minimal — renderar "Miranon Media Admin" + [GA] registrerar service worker)
- [x] `src/vite-env.d.ts` (bonus-fil för `import.meta.env`-typer)
- [x] `src/styles/tokens/primitives.css` (från DESIGN-SYSTEM-SPEC §1, bindestreck för halvsteg — se [ADR-003](../docs/decisions/ADR-003-css-custom-property-naming.md))
- [x] `src/styles/tokens/semantic.css` (från DESIGN-SYSTEM-SPEC §1)
- [x] `src/styles/tokens/components.css` (skelett)
- [x] `src/styles/base.css` (reset, fokusregel, typografi, Inter-font)
- [x] `src/styles/tailwind.css` (`@import "tailwindcss"` + `@theme`-block från DESIGN-SYSTEM-SPEC §8 — se [ADR-002](../docs/decisions/ADR-002-tailwind-v4-theme-css-first.md))
- [x] `src/lib/cn.ts` (clsx + tailwind-merge)
- [x] [GA] `src/lib/report-web-vitals.ts` (web-vitals → Sentry/sendBeacon)
- [x] [GA] `src/env.ts` (@t3-oss/env-core — validerar VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY vid uppstart)
- [x] `playwright.config.ts` (från DESIGN-SYSTEM-SPEC §6)
- [x] `.env.local` (skapad lokalt, inte committad — `.env.*` i `.gitignore`)
- [x] [GA] `public/sw.js` (tom service worker-skelett — utökas med Workbox i Fas 5)

### Verifiering

- [x] 1. `npm run dev` startar utan fel (Vite 8.0.8, redo på 320 ms)
- [x] 2. `npm run build` producerar output utan varningar (97 moduler, 244.73 kB JS / 10.83 kB CSS)
- [x] 3. `npx tsc --noEmit` — noll TypeScript-fel
- [x] 4. [GA] `npx @biomejs/biome check .` — exit=0 (4 warnings på `!important` i `prefers-reduced-motion`, accepterat)
- [x] 5. Token-CSS laddas: `--mm-primary` → `#d4960a` verifierat via grep i `dist/assets/index-*.css`
- [x] 6. Tailwind genererar utilities från `@theme`: `text-primary`, `bg-surface`, `text-text-secondary`, `text-caption`, `text-body` (1rem/line-height 1.5), `font-sans` (Inter) — alla 8 verifierade i bundled CSS
- [x] 7. [GA] Service worker registrering-kod på plats i `main.tsx`
- [x] 8. [GA] `reportWebVitals` importerbar utan fel (tsc + build passerar)
- [x] 9. [GA] Saknad env-variabel → uppstartsfel (Node-test bevisar ZodError)
- [x] 10. [GA] `npm audit --audit-level=high` — 0 high/critical

---

## Fas 1: Domäntransplant ✅ KLAR

**Mål:** Alla domain- och data-filer kopierade från Vue-repot, Zod-scheman tillagda, supabase-client konsoliderad via `@/env`, `fetchWithRetry` på infrastrukturnivå.
**Klar:** 2026-04-14 (Session 1 (React), commit `c91bfa0`).
**Dokumentation:** [`docs/BUILD-LOG.md`](../docs/BUILD-LOG.md) → Session 1 (React) → Fas 1.

### Kopierade filer (src)

- [x] `src/domain/models/*.ts` (8 filer — rakt av)
- [x] `src/domain/types/*.ts` (Filters.ts, Status.ts — rakt av)
- [x] `src/data/adapters/*.ts` (DataSourceAdapter, AirtableAdapter, SupabaseAdapter — rakt av)
- [x] `src/data/config/supabase-client.ts` (modifierad — [ADR-009](../docs/decisions/ADR-009-supabase-client-env-consolidation.md) + [ADR-006](../docs/decisions/ADR-006-fetch-with-retry-infrastructure.md))
- [x] `src/lib/alert-screen-reader.ts` (kebab-case rename från `alertScreenReader.ts`)
- [x] `src/lib/focus-utils.ts` (kebab-case rename från `focusUtils.ts`)

### Kopierade filer (binaries + docs + supabase)

- [x] `public/favicon/` (7 filer)
- [x] `public/miranon-logo.svg`
- [x] `docs/` (21 filer — selektivt, ej `tasks/` eller `.claude/`, se [ADR-008](../docs/decisions/ADR-008-file-inventory-selective-run.md))
- [x] `supabase/functions/` (7 Edge Function-filer, Deno-kod)

### [GA] Skapade filer

- [x] `src/domain/schemas/*.schema.ts` (8 filer + barrel `index.ts`) — [ADR-005](../docs/decisions/ADR-005-zod-parallell-definitions.md)
- [x] `src/domain/__tests__/schemas.assignable.ts` (`AssertEqual` compile-time-test)
- [x] `src/data/utils.ts` (`fetchWithRetry`) — [ADR-006](../docs/decisions/ADR-006-fetch-with-retry-infrastructure.md)
- [x] `scripts/verify-phase-1.ts` (runtime-verifiering, 11 assertions)

### Konfigändringar

- [x] `biome.json` exkluderar `supabase/functions` — [ADR-010](../docs/decisions/ADR-010-biome-exclude-deno-edge-functions.md)

### Verifiering

- [x] `npx tsc --noEmit` — 0 fel
- [x] Testfil importerar Event, Registration, Person → resolvar (via `schemas.assignable.ts`)
- [x] `EventSchema.parse({})` → ZodError (runtime-verifierat)
- [x] TypeScript-test: 10 `AssertEqual`-asserts passerar (schema ↔ interface parity för alla domain-typer)
- [x] `fetchWithRetry`: 4 försök (1 + 3 retries), backoff 200ms/400ms/800ms ± jitter (runtime-verifierat)
- [x] `alertScreenReader('test')` → aria-live-element i DOM (runtime-verifierat via stub)
- [x] `npx @biomejs/biome check .` — exit=0
- [x] `git add -A && git commit -m "fas 1: domäntransplant"` → `c91bfa0`
- [x] `git push` → `origin/main`

---

## Fas 2: Routing + Auth ✅ KLAR

Slutförd 2026-05-13 över Sessions 4 + 5 + 5b. Alla 8 DoD-rader stängda och empiriskt verifierade via K4.3 6-tests Playwright-regression. Defense-in-depth tre-skikt-arkitektur levererad (klient-guard + AuthError throw + server requireUser). ADR-026, ADR-027, ADR-028 levererade. 7 hub-lyft-kandidater för K5.7 (K17 + K18 + K19 + K34 + K36 + K37 + K38).

Sessionsdok-trail (arkiverad 2026-05-13 i K5.8): [`tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md`](sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md).

**Fas 2.5 — Schema-kontrakt-sync ← NU** (per `docs/byggplan.md` §4)

---

## Kommande faser (från `docs/byggplan.md` §4)

- **Fas 3: UI-primitiver** — React Aria + CVA + [GA] ARIA 1.3
- **Fas 3.5: Test-infra + mönsterbibliotek** (egen fas per ADR-020)
- **Fas 5: App-shell + Tab bar** — minimal, FK-inspirerad + [GA] error boundaries, service worker, View Transitions
- **Fas 6: Hem + Event + Personer + Mer** — 4 flikar + [GA] optimistic UI, Realtime, stale-while-error
- **Fas 6.5: Aktivitetslogg** — [GA] xAPI-schema, trace_id, GDPR retention
- **Fas 7: Konsolidering** — [GA] CSP, Trusted Types, chaos testing, deploy-pipeline, Golden Master-test, Deno lint på Edge Functions
- **Fas 8 (framtid):** Passkeys, push-notifieringar, avancerad offline

---

## Byggplan-revision (P0 → P3b)

Meta-arbete parallellt med byggfaserna. Reviderade conversion-plan till byggplan baserat på Fas A-fynd, datamodell-research och Codex/Code-verifiering. Slutprodukt: `docs/byggplan.md` (P3a). P3b avslutar med städning + arkivering.

- [x] **P0 — Inventering** ✅ AVSLUTAD 2026-05-04
      Leverans: `docs/logs/byggplan-revision-inventory.md`
- [x] **P1 — Fas-sekvens-revision** ✅ AVSLUTAD 2026-05-04
      Leverans: `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md`
      §5-uppdatering applicerad i commit `5ed4668`
- [x] **P2 — Stödspec-synkning** ✅ AVSLUTAD 2026-05-04
      Leverans: `tasks/sessions/archive/2026-05/2026-05-04-stodspec-synk-p2.md`
      A1-utfall: Fas 3.5 = egen fas (test-infra + mönsterbibliotek bägge JA)
- [x] **P3a — Skriv byggplan + ADR-katalog** ✅ AVSLUTAD 2026-05-05
      Leverans: `docs/byggplan.md` (832 rader, 13 fas-prompter), 10 ADR:er (ADR-011..ADR-020), `tasks/sessions/archive/2026-05/2026-05-05-byggplan-skriv-p3a.md`
- [x] **P3b — Städning + arkivering + BUILD-LOG retrospektiv** ✅ AVSLUTAD 2026-05-05
      Leverans: `tasks/sessions/archive/2026-05/2026-05-05-byggplan-stadning-p3b.md`. 7 commits, direktivet markerat SLUTFÖRT i §11+§12, 7 UNIVERSAL-lessons lyfta till hub.
- [x] **Pre-Fas-2-verifiering — repo 11/10 inför Fas 2** ✅ AVSLUTAD 2026-05-06
      Leverans: `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md`. 4 nya ADR (ADR-021..024), docs/-omstrukturering, .github/-paketet, top-level professional docs, analys/-flyttning, tasks/sessions/-arkivering. Repo redo för Codex-verifiering + Fas 2.
      Trail: `tasks/sessions/archive/2026-05/2026-05-05-byggplan-stadning-p3b.md`
      Direktiv: `tasks/byggplan-direktiv.md` §6 P3 städnings-DoD + §12 slutnot

---

## Teknisk skuld som spåras (från Fas 0 + Fas 1)

- **Zod refaktorering:** Schema blir sanningskälla i Fas 2/3 ([ADR-005](../docs/decisions/ADR-005-zod-parallell-definitions.md))
- **Event-aliasering:** Per-fil alias i Fas 2+, global rename om 5+ filer behöver alias ([ADR-007](../docs/decisions/ADR-007-event-name-collision-deferred-aliasing.md))
- **TanStack Router-plugin:** Återinförs i Fas 2 när `src/routes/` skapas
- **CSP-nonce security headers-plugin:** Fas 7
- **Biomes `no-arbitrary-value` + `no-hardcoded-colors`:** Custom GritQL-plugins i Fas 7
- **Deno lint/check på supabase/functions:** Fas 7 ([ADR-010](../docs/decisions/ADR-010-biome-exclude-deno-edge-functions.md))
- **Schema-validering i adapter-metoder:** Fas 2 ska wrappa `callEdgeFunction`-resultat med `.parse()`
- **`lucide-react@1.8.0` versionsanomalier:** Undersök innan Fas 3 (UI-primitiver) när ikoner börjar användas
- **docs/specs/DESIGN-SYSTEM-SPEC.md stale-risk:** Governance-beslut uppskjutet efter alla faser
- **DEFER → Fas 3:** 4 CSS-warnings i `src/styles/base.css:72-75` (`!important` i `prefers-reduced-motion`). Fas 3 omarbetar `base.css` när primitiver landas — städning sker som biprodukt. Trigger: första Fas 3-session. Källa: P3b sessionsdok Del 3.4 H.1.
- **DEFER → passiv (bevakas):** PostCSS audit-fix. `npm audit` rapporterar PostCSS-relaterade transitive dependencies, inga high/critical. PostCSS uppdateras naturligt via Tailwind v4-uppgradering eller Dependabot. Trigger: om `npm audit --audit-level=high` blir röd, ELLER vid Tailwind v5-migration. Källa: P3b sessionsdok Del 3.4 H.2.
- **DEFER → Fas 7:** `supabase/functions/test-auth/` borttagning från produktion. Lever idag med `verify_jwt = false` i `config.toml` — Playwright-helper för deny-paths-tester. Fas 7 (Konsolidering: CSP, chaos testing, deploy) ska exkludera `test-*`-funktioner från produktions-deploy via CI-pipeline. Källa: P3b sessionsdok Del 3.4 H.4.
- **K3.4-kvalitetsklyfta (2026-05-13, deferred till Fas 3.5):** auth-error-path unit-test-mönster för `getAuthHeader()` AuthError-kontraktet. Test-fall: `callEdgeFunction` + `postEdgeFunction` med session=null → AuthError + fetchWithRetry never called. Vitest-installation hör hemma där per Gate 1-beslut 2026-05-13 (scope-creep att göra i K3.4 utan ADR — projektet är Playwright-only). Sessionsdok-trail: `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 5.9. Lyfts till Fas 3.5-prompten när Session 6+ påbörjar Fas 2.5 → 3 → 3.5-sekvensen.
