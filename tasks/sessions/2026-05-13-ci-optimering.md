# Session 6 — CI-optimering (före Fas 2.5)

> **Status:** ✅ KLAR 2026-05-14 (K-sista bake-in). Strategi E (Vite-mönstret) etablerad per ADR-029. Empirisk verifikation: ~64 % besparing på doc-only-commits (~34s vs ~95s baseline). 17 UNIVERSAL-lessons skördade (största enskilda session-skörd). 10 hub-lyfta.
> **Skapat:** 2026-05-13 (K1)
> **Slutgiltig version:** 2026-05-14 (K-sista, post-Commit 4c empirisk verifikation)
> **Ägare:** Marcus + Claude Chat (planering) + Claude Code (implementation)
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-13-ci-optimering.md` (arkiveras till `archive/2026-05/` vid Session 7-start per ADR-023)
> **Styrande:**
> - `~/Repon/marcus-system/CLAUDE.md` — hub-konstitution (P-fas-mönster, sessionsdok-disciplin, transcript-disciplin)
> - `~/Repon/miranon-media-admin/CLAUDE.md` — projekt-konstitution + Sessionsstart-/Sessionsavsluts-checklistor + Fas-avsluts-verifierings-rutin
> - `CONTRIBUTING.md` — Definition of Done per session
> - `docs/byggplan.md` §4 Fas 2.5-prompt (vad CI ska skydda nästa fas)
> - `.github/workflows/ci.yml` (nuvarande CI-konfig — basläge)
> - `ADR-028` — Supply chain incident-respons-protokoll (allowlist-disciplin för audit-ci)
> **Föregångare:**
> - `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` — Fas 2 (Sessions 4+5+5b) ✅ KLAR 2026-05-13. **Driving observation:** K5-paketet körde 14 sekventiella doc-only-commits, alla CI-gröna men ~36 s per körning = ~8 minuter spilld CI-tid (Marcus' ursprungs-uppskattning; K1.A faktisk mätning: ~95s × 14 = ~22 min). Estimat-vs-verklighet-diff 2,6× är dokumenterad K11-fångst.
> **Efterföljare:** Session 6.5 — Broken-links-batch-städning (defer-paket, ~30-60 min K0-mini-klunga FÖRE Fas 2.5). Sedan Fas 2.5 — Schema-kontrakt-sync (Session 7, mot `docs/byggplan.md` §4 Fas 2.5-prompt).
> **Stop-test (denna session):** CI-konfig optimerad mot Strategi E + cross-doc-drift-skyddet bevarat (K5.9c-rutinen oförändrad) + markdown-länkar valideras nu automatiskt (lychee) + audit-ci-disciplin oförändrad (K17) + sessionsdok låst + lessons-skörd lyft + transcript sparat (K-sista.3). ✅ Alla 8 punkter uppfyllda 2026-05-14.
> **Sessionsdok-commit-disciplin (P3a-baserad, Fas-2-reviderad):** K1 = skelett. K1.A/B är RAPPORTERA-arbete som rör INTE sessionsdoket. **K1.N early bake-ins** committas om Block-rapporter genererar substantiella fynd eller lärdomskandidater innan K-sista (per Kandidat 5). K-sista bakar in Del 3-8 retrospektiv. Touch-count: post-K-sista = 2 (K1 + K-sista).
> **Scope-begränsning:** K42-defer-paketet (process-lärdom från K5.9c systematisk-blind-fläck-fyndet) ligger INTE i denna sessions CI-scope. K42 + K38b + K39 skördas i en separat K0 lessons-sweep enligt egen mini-session, inte under CI-optimerings-arbetet. Att blanda process-lärdoms-skörd med CI-implementation bryter mot Kandidat 7 (refactor/semantik-separation) — egen klunga, egen commit.

---

## Del 1 — Prolog

### Syfte

Denna session optimerar `.github/workflows/ci.yml` så att doc-only-commits (markdown-uppdateringar utan kod-impact) inte längre triggar full verify-svit. Drivande observation: K5-paketet i Session 5b körde 14 sekventiella doc-only-commits à ~36 s = ~8 minuter spilld CI-tid på arbete som inte påverkar bygg/test-utfall. Sessionsavsluts-disciplinen (bake-ins, lessons-lyft, README/CHANGELOG-uppdateringar vid fas-avslut) producerar legitim doc-volym — det är inte ett anti-mönster att fixa, det är ett CI-mönster att anpassa till.

Sessionen är **CI-optimering före Fas 2.5**, inte en del av Fas 2.5. Motivationen att göra den nu: Fas 2.5 — Schema-kontrakt-sync producerar både kod-ändringar (Status.ts 4→6, Zod-aktivering, AirtableAdapter-JSDoc) och doc-ändringar (`data-model.md`-cross-link, ADR-026-uppdatering om relevant, BUILD-LOG-rad). En CI-konfig som väger detta korrekt sparar tid över hela framtiden av byggplanen (Fas 3, 3.5, 5, 5.5, 6a-e, 6.5, 7, 8, B, E — alla har dokumentations-commits som följer kod-commits).

**Vad sessionen INTE gjorde:**
- Schema-arbete (Status.ts, Zod, adapter-debt) — det är Fas 2.5 (Session 7).
- K42-defer-paket-skörd (K38b form-tolerans-validering + K39 case-sensitivity + K42 systematisk-blind-fläck-process-lärdom) — det är en separat lessons-sweep, inte CI-arbete.
- ADR-028-veckovis-granskning av audit-ci-allowlist — den schemalagda granskningen var 2026-05-19 men K17-sessionsstart-baseline avslöjade snäv-uppdatering 2026-05-12; resulterade i K0åh allowlist-rensning som biprodukt.
- Broken-links-batch-städning — defer:ad till Session 6.5 per K7 (refactor/semantik-separation).

**Vad sessionen producerade:**
- Strategi E (Vite-mönstret med changed-files + needs-skip + aggregator) etablerad som kanonisk CI-arkitektur per ADR-029
- ci.yml restrukturerad från 12-stegs verify-jobb (1 jobb) till 5 jobs (changed → lint → test → docs → ci-passed)
- Empirisk verifikation: doc-only ~34s vs ~95s baseline = ~64 % besparing; kod ~96s matchar baseline
- Lychee broken-link-detection etablerad som NY kvalitetscheck (0 errors empiriskt verifierad post-K1.D)
- ADR-028 utvidgad till ADR-029 § Third-party Actions-policy (SHA-pin + veckogranskning för Actions)
- K17 supply-chain-skydd bevarat (audit-ci kör på alla commits)
- Branch-protection-readiness etablerad via `ci-passed`-aggregator (ej aktiverat)

### Indata-kontext

Lästa i denna ordning vid sessionsstart (Chat-miljö → projektkunskap; Code-miljö → faktiska filer via `view`/`bash` mot `~/Repon/miranon-media-admin/`):

| # | Källa | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution (transcript-disciplin, sessionsdok-rutin, P-fas-mönster, hub-och-spoke-lessons-flöde) |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projekt-konstitution + Sessionsstart-/Sessionsavsluts-checklistor + Fas-avsluts-verifierings-rutin + Status-sektion (Fas 2 ✅ KLAR 2026-05-13) |
| 3 | `tasks/lessons.md` | UNIVERSAL-lärdomar. Direkt relevanta för CI-design: K17 (live security-state vid sessionsstart), K18 (audit-output är signal inte sanning), K19 (pin + overrides supply chain-respons), K34 (test-credentials aldrig-läcka), K36 (automatiserad test fångar timing-bugs), K37 (test-runner-konvention i RAPPORTERA), K38 (VERIFIERA-grep form-tolerant). K39 + K42-defer-poster sweepas separat. |
| 4 | `tasks/todo.md` | Aktuellt fokus = Fas 2.5 — Schema-kontrakt-sync. Återkommande disciplin: veckovis audit-ci allowlist-granskning (nästa 2026-05-19). |
| 5 | `docs/byggplan.md` §4 Fas 2.5-prompt | Vad CI ska skydda nästa fas: Status.ts 4→6 statusvärden, Zod runtime-validering vid datagräns, adapter-debt-klassning (9 metoder per P1 A5-tabellen), inga EF-deploys i förskott (M4-principen). |
| 6 | `.github/workflows/ci.yml` | Nuvarande CI-konfig — basläge. 12 steg: checkout, setup-node, npm ci, audit-ci, biome check, tsc --noEmit (src), npm run typecheck:tests, npm run test:api:pure, npm run test:api:staging, playwright install, npm run test:e2e:staging, npm run build. |
| 7 | `CONTRIBUTING.md` Definition of Done | Per session (test:api grön, tsc 0, biome 0, build grön, BUILD-LOG, ADR vid arkitekturbeslut, lessons, commits pushade) + per fas (byggplan §2 + README + CHANGELOG + sessionsdok-arkivering + UNIVERSAL-hub-sync + Fas-avsluts-verifierings-rutin). |
| 8 | `docs/decisions/ADR-028-supply-chain-incident-respons.md` | Allowlist-disciplin + 5-stegs Konvention-flöde för audit-ci. Veckovis granskning i todo.md. K0-sessions-disciplin per K17 (live security-state vid sessionsstart). |
| 9 | `docs/decisions/README.md` ADR-katalog (28 ADR:er post-Fas-2; 29 post-Session-6) | För nytt ADR-nummer: ADR-029 etablerad i K1.D commit 2 (a5411e1). |
| 10 | `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` Del 4-6 | K2-K4 commit-trail för K1.B-inventering (doc-only-vs-kod-räkning). Särskilt Del 6 K5-flödet med 14 doc-commits. |
| 11 | `docs/BUILD-LOG.md` Session 5+5b-block | K3.4 + K5 final-trail för K1.B doc-only-räkning. |

### Källprioritet vid konflikt

1. **Code-RAPPORTERA-output** (HEAD-state-data, K1.A Block A-leverans) — auktoritativ för aktuell CI-konfig + faktiska CI-körningstider per steg (inte uppskattningar)
2. **K1.B räknings-rapport** — auktoritativ för doc-only-vs-kod-commit-fördelningen över Session 4+5+5b (skip-frekvens-potential)
3. **`docs/byggplan.md` §4 Fas 2.5-prompt** — styrande för vad CI ska skydda nästa fas (Status.ts/Zod/adapter-debt)
4. **`~/Repon/miranon-media-admin/CLAUDE.md` Fas-avsluts-verifierings-rutin** — auktoritativ för cross-doc-drift-skyddets *roll* (kompletterande till CI, inte ersättande)
5. **ADR-028** — bindande för audit-ci-disciplin (allowlist får inte gå förlorad vid paths-filter)
6. **`CONTRIBUTING.md` DoD** — per-session-DoD listar `test:api grön + tsc 0 + biome 0 + build grön` som krav. Strategi-val får inte ta bort detta för kod-commits. För doc-only kan kraven *villkoras*, inte *strykas globalt*.
7. **tasks/lessons.md K17** — supply chain-skydd ska aldrig hoppas över. audit-ci kör på *alla* commits, inte villkorat.

### Klunge-struktur

Klunga K1 med fyra naturliga sub-klungor (K1.A → K1.B → K1.C → K1.D) + två STOPPA-OCH-FRÅGA-gates + K-sista för retrospektiv. Sessionsdok rörs i K1 (skelett, denna commit) + ev. K1.N bake-ins efter substantiella sub-klungor + K-sista. Mellan-klungor lämnar det orört (P3a-mönster); inline-källor i Code-prompter (UNIVERSAL: "Inline-källor i Code-prompter när sessionsdok-disciplin förbjuder löpande uppdatering").

| K | Innehåll | Sessionsdok rörs? | Final status |
|---|---|---|---|
| **K1** | Sessionsdok-skelett (denna fil — Del 1 Prolog + Del 2 K1-leverans + Del 7 stop-test-mall + Del 3-6/8 TBD-placeholders) | ✅ K1-commit `120ef50` | ✅ KLAR |
| **K0åh** | Allowlist-rensning (advisory snärjt 2026-05-12 → 0 critical) — emergent från K17-sessionsstart-baseline | ❌ orört (egen K0-klunga) | ✅ KLAR (`0d19ede` + `9a4d8d5`) |
| **K1.A** | RAPPORTERA: inventera nuvarande CI-konfig + körningstider per steg + audit-ci/GHSA-rmmr-r34h-pfm5-allowlist-status (K17-disciplin) | ❌ orört | ✅ KLAR (rapport i Chat) |
| **K1.B** | RAPPORTERA: inventera doc-only-vs-kod-commits över Session 5+5b för att förstå skip-frekvens-potential | ❌ orört | ✅ KLAR (rapport i Chat) |
| **Gate 1** | Strategi-val (Pure C initial → **Strategi E** via Vite-research) | ❌ orört | ✅ KLAR (Strategi E vald) |
| **K1.C** | PLANERA + VERIFIERA: SHA-pin Actions, paths-listan, lychee-scope-analys | ❌ orört | ✅ KLAR (rapport i Chat) |
| **Gate 2** | Anti-genväg-review (Marcus' kvalitetsregel "genväg = disciplin-brott") | ❌ orört | ✅ KLAR (lychee-scope rättad) |
| **K1.D** | IMPLEMENTERA + VERIFIERA (8 commits: 1 + 1.5 + 1.6 + 2 + 3 + 4a + 4b + 4c) | ❌ orört | ✅ KLAR (lychee 0 errors empiriskt) |
| **K-sista** | Stop-test + lessons-skörd + bake-in Del 3-8 + BUILD-LOG-rad + todo.md-uppdatering + hub-sync + transcript | ✅ K-sista bake-in-commits (denna + K-sista.2 + hub-sync + K-sista.3) | ✅ KLAR (denna commit) |

**Sessions-numreringsanmärkning:** Session 6 motsvarar Session 38 i den samlade projekthistoriken (Session 5b var 37). Numreringen följer projektets React-numrering enligt CLAUDE.md Status-sektion.

---

## Del 2 — K1: Sessionsdok-skelett

✅ **KLAR** 2026-05-13 (`120ef50`). Denna fil skapad och committad ("docs(sessions): start Session 6 sessionsdoc — skeleton (K1 ci-optimering)"). K1-leverans = Del 1 Prolog + Del 2 (denna sektion) + Del 7 stop-test-mall + Del 3-6/8 som TBD-placeholders med tydliga rubriker som fyllts via K-sista (denna commit) per re-mappad K1.A/B/C/D-struktur (Marcus' Alt A 2026-05-14).

### Parallell-arbete med Code

Per användarens not vid sessionsstart: Code hade redan börjat på K1.A-arbetet med samma prompt-bas. Chat-skelettet (denna fil) levererades som komplement — Code:s RAPPORTERA-output (K1.A Block A) togs in i Chat när den var klar, syntetiserades tillsammans med K1.B, och blev grund för Gate 1 strategi-valet.

### Förväntade STOPPA-OCH-FRÅGA-checkpoints

Sessionen hade två explicita gates designade per Kandidat 2 (STOPPA-OCH-FRÅGA-mönster fungerar):

**Gate 1 — Strategi-val (efter K1.A + K1.B RAPPORTERA):** Marcus bad om web-research mot "world-class CI workflows" först. Research mot Vite ci.yml avslöjade Strategi E som branschledar-mönster. Vald över Pure C.

**Gate 2 — Implementation-plan (efter K1.C PLANERA):** Marcus' kvalitetsregel ("genväg = disciplin-brott") fångade K11-anti-mönster i lychee-scope-design. Rättat.

### K1-leveransens struktur

Sessionsdoket består av åtta sektioner när det är komplett (K-sista):

| § | Innehåll | Status nu (K-sista) |
|---|---|---|
| 1 | Prolog — syfte, indata-kontext, källprioritet, klunge-struktur | ✅ komplett |
| 2 | K1 — sessionsdok-skelett (denna sektion) | ✅ komplett |
| 3 | K1.A — Inventering nuvarande CI-konfig + körningstider + audit-ci-status | ✅ bake-in (K-sista 2026-05-14) |
| 4 | K1.B — Inventering doc-only-vs-kod-commits + skip-frekvens-baseline | ✅ bake-in (K-sista 2026-05-14) |
| 5 | K1.C — Strategi A/B/C/D/E trade-off-analys + Gate 1-beslut + implementations-plan + Gate 2-beslut | ✅ bake-in (K-sista 2026-05-14) |
| 6 | K1.D — Implementation + verifikation + ADR-029 | ✅ bake-in (K-sista 2026-05-14) |
| 7 | K-sista — Stop-test + lessons-skörd + bake-in + BUILD-LOG + todo + transcript | ✅ bake-in (denna commit) |
| 8 | Sammanfattning för framtida läsare | ✅ bake-in (K-sista 2026-05-14) |

### Disciplin-noteringar för denna session

- **Audit-ci kör på alla commits, alltid.** Per Kandidat 17. Bevarat i Strategi E: `lint`-jobbet kör alltid (kod ELLER doc-only), audit-ci är ett steg i lint-jobbet.
- **Markdown-länk-validering** lades till som NY kvalitetscheck via lychee (ADR-029 § Beslut 1d). Det är "höjer kvaliten"-delen av Marcus' Gate 2-regel.
- **Cross-doc-drift-skyddet** etablerat i K5.9c är fortfarande en *fas-avsluts*-rutin (lokal, manuell). Strategi E kompletterar med referensdrift-detektion via lychee (Kandidat 14 — komplementära kvalitetsverktyg).
- **Sessionsdok-disciplin** P3a-baserad: K1 + K-sista bakar in retrospektiv. Touch-count post-K-sista = 2.

---

## Del 3 — K1.A: Inventering nuvarande CI-konfig + körningstider + audit-ci-status

**PLANERA-RAPPORTERA (2026-05-13):**

Code rapporterade Block A.1-A.4: 12-stegs ci.yml verify-jobb, ~95s baseline-tid (96s medel över 30 commits), top-3 dyraste steg = Install Playwright Chromium (30s), API tests staging (26.5s), E2E tests (13s). Branch protection EJ aktiverad. Ingen paths-filter, ingen concurrency.

**K17 supply-chain live-status (Block A.4):**

`npm audit` rapporterade **0 critical/high** — oväntat efter K0åg som etablerade allowlist mot GHSA-rmmr-r34h-pfm5. Diagnos: GitHub snävade `vulnerable_version_range` 2026-05-12 från `>=0` till `= 1.161.9` OR `= 1.161.12`. Vår 1.161.6 är pre-malware. Marcus valde **Alt B (minimum K0åh):** rensa allowlist (commits `0d19ede` + `9a4d8d5`), behåll pin + overrides till K0åi-trigger när TanStack publicerar `latest >= 1.161.13`. ADR-028 uppdaterad med Resolution-section. Veckovis-granskning ersatt med K0åi-trigger i `tasks/todo.md`.

**K11-tillämpning K0åh:** allowlist-rensning baserad på faktisk advisory-range-snävning (data), inte antagande om "post-incident-acceptabelt". Mönster: audit-output-changes ska analyseras innan tolkning (K18). Identifierat som lessons-kandidat K1.1 (hub-lyft).

---

## Del 4 — K1.B: Inventering doc-only-vs-kod-commits + skip-frekvens-baseline

**PLANERA-RAPPORTERA (2026-05-13):**

Session 5+5b commit-range `5709f26^..2170cb8` = **30 commits**. Strict-klassning: 13 doc-only (43 %), 13 kod (43 %), 4 mixed. Funktionell-klassning: 15 doc-only (50 %). K5-paketet (K5.1-K5.9c) = 14 commits, Marcus' 14-uppskattning exakt under funktionell klassning.

**Skip-frekvens-analys (Block B.3-B.5):**

- Spill per doc-only-run: ~78s (95s baseline minus förväntat changed-job-overhead)
- Total Session 5+5b spill: ~17-19,5 min
- Extrapolerat Fas 2.5→7: ~113 commits över 14,5 sessioner med ~40 % doc-only-andel = **~46 min projicerad besparing** om Strategi E etableras

**Sessionsstart-uppskattning vs verklighet:** Marcus' ursprungliga prompt sa "~36s per körning = ~8 minuter spilld". Faktisk baseline-mätning K1.A: ~95s per körning, ~22 min spilld. **~2,6× underskattning.** Påverkade inte strategi-val (Strategi E gynnar båda) men flaggar bredare K11-mönster: estimate-utan-mätning på sessionsstart-nivå. Subtle lessons-kandidat (ej hub-lyft separat — meta-mönster för K1.7).

---

## Del 5 — K1.C: Strategi-val + implementations-plan

### Gate 1 — Strategi-val (BESLUT 2026-05-13)

Initial Chat-rekommendation: **Pure C** (separat docs-ci.yml). Marcus bad om web-research mot "world-class CI workflows" först. Research mot Vite ci.yml (vår direkta upstream-stack) avslöjade **Strategi E** = changed-files-jobb + needs-skip + aggregator. Vald över Pure C på fyra dimensioner:

(a) en sanningskälla (en workflow-fil)
(b) branschledar-validerad (Vite + argo-cd + qmk_firmware)
(c) branch-protection-friendly via `ci-passed`-aggregator
(d) naturlig extension-yta för framtida cross-doc-grep-automation

Lessons-källa: K1.2 (hub-lyft) — **Branschledar-mönster är golvet, inte taket; verifiera empiriskt.**

### K1.C PLANERA-RAPPORTERA (Block 1-5)

Code:s rapport: ADR-029 ledigt, ci.yml 78 rader (post-K0åc/K4.3-state, funktionellt = K1.A-baseline), SHA-värden verifierade via `git/refs/tags/`-endpoint:
- `tj-actions/changed-files@v47.0.6` → SHA `9426d40962ed5378910ee2e21d5f8c6fcbf2dd96`
- `lycheeverse/lychee-action@v2.8.0` → SHA `8646ba30535128ac92d33dfc9133794bfdd9b411`

**Block 2.4 advisory-baseline:** 2 high mot tj-actions men båda historiska/post-patched för v47.0.6:
- `GHSA-mrrh-fwg8-r2c3` (mars 2025 secrets-läckage) — first_patched 46.0.1
- `GHSA-mcph-m25j-8j63` (jan 2024 cmd-injection) — first_patched 41

K18-tillämpning analog med K0åh (audit-output är signal, inte sanning). Inga STOPPA-triggers aktiverade.

### Gate 2 — Anti-genväg-review (BESLUT 2026-05-13)

Marcus' kvalitetsregel: "INTE sänker kvaliten på våra CI utan höjer kvaliten, men tar bort onödiga saker för bara docs commits. **Genväg = disciplin-brott.**" Fångade K11-anti-mönster i K1.C-planen: lychee-scope utelämnade `tasks/*.md` baserat på antagande ("risk för broken links"). **Rättat:** scope inkluderar nu `tasks/*.md`; utelämnar bara `tasks/sessions/**` (frozen + WIP).

**6 medvetna utelämningar dokumenterade i ADR-029 § "Medvetna utelämningar"** (alla 11/10 med senior-team-test):
1. `tasks/sessions/**` ur lychee-scope (frozen ADR-023 + in-flight WIP)
2. Tom `.lycheeignore`-baseline (empirisk add-only-policy)
3. `actionlint` via download-script (upstream-konvention)
4. Single-OS (ubuntu-latest), single-Node (.nvmrc) (deployment-scope-match)
5. Enkel `ci-passed`-aggregator (KISS-principen, branch protection ej aktiv)
6. `fetch-depth: 50` i changed-jobb (3× single-author-marginal)

Lessons-källor: K1.5 (hub-lyft) — **Preventiv exklusion utan empirisk basis är genväg.**

---

## Del 6 — K1.D: Implementation + verifikation + ADR-029

### Commit-trail (8 commits + 4 K11-fångster)

| # | Hash | Tema | Tid | Outcome | K11-not |
|---|---|---|---|---|---|
| 1 | `12b3942` | ci.yml restructure (Strategi E) | 228s | Playwright cache-miss pga job-isolation | K11-fångst #2 (Vite cache-pattern i research, missat i K1.D §1.1) |
| 1.5 | `5f3f148` | actions/cache via hashFiles | 615s timeout | Apt-hängning på `--with-deps` mot azure-mirror | K11-fångst #3 (Vite droppade `--with-deps`; default-vana) |
| 1.6 | `94577c1` | Drop `--with-deps` + ci-passed `needs.*.result`-pattern | **96s ✓** | Matchar baseline | Cache-key-val: hashFiles över jq (K1.8 källa) |
| 2 | `a5411e1` | ADR-029 + todo + CLAUDE.md (doc-only-test) | 94s | Lychee 81 errors fångade — skip-mekanik verifierad | Strategi E:s skip-mekanik empiriskt-bekräftad |
| 3 | `f0dc697` | `.lycheeignore` 12-pattern + ADR-029 § Baseline-fynd | ~95s | 4 errors kvar (tanstack) | DEFERRED-FIX-MARKER-pattern (K1.13 källa) |
| 4a | `071ef39` | `docs/archive/**` scope-exclude | ~25s | Scope-konsistens-fix (ADR-023-mall) | K1.15 källa |
| 4b | `ee0a045` | v3.md tanstack `/query`→`/query/latest` | ~25s | UTF-8-glob-bug — docs-job skippades trots .md-ändring | K1.17 källa (hub-lyft) |
| 4c | `16e212b` | ASCII-trigger via `tasks/todo.md`-uppdatering | **34s ✓** | Lychee 0 errors empiriskt | K11-fångst #4 (Verify-4b Alt A över Alt B) |

### Cache-key-val (Commit 1.5 BESLUT)

Tre kandidater övervägdes: (a) jq mot package.json semver-range, (b) hashFiles på lock-file (Vite-mönster), (c) npm ls efter npm ci. **Vald: Alt B (hashFiles).** Motivering: korrekthet > optimering — Alt A:s "fel-version-cache-hit vid `^`-range-bump" är silent correctness violation. Lessons-kandidat K1.8 (hub-lyft).

### ci-passed if-villkor-rättning (Commit 1.6 BESLUT)

Vite-pattern `!cancelled() && !failure()` fungerar mestadels men har bug: workflow-level `cancelled()` fångar inte per-job-cancellation. Korrekt pattern: `always() && !contains(needs.*.result, 'failure') && !contains(needs.*.result, 'cancelled')`. Empiriskt bekräftat i Commit 1.5 timeout-run där ci-passed felaktigt rapporterade success. Lessons-kandidat K1.11 (lokalt).

### Lychee baseline-fynd (Commit 2)

**81 errors klassificerade i 3 kategorier:**

- **A — Verklig drift:** ~25 stale refs efter ADR-021/023/027 + K5.8b-arkivering (inkl. `KVALITETSDEFINITIONER-11.md` Vue→React-stack-skifte-drift som K5.9c cross-doc-grep missat → K1.14 källa)
- **B — Path-konstruktion-fel:** ~46 `file:///docs/analysis/src/...` (saknar `../` prefix från analysis-djup)
- **C — Externa acceptable:** ~14 auth-gated / pre-release-mallar / stale upstream

Per Marcus' Gate 2-disciplin + K7 (refactor/semantik-separation): kategori C → `.lycheeignore` (acceptable per ADR-029 policy). Kategori A+B → defer Session 6.5 via DEFERRED-FIX-MARKER-pattern. Lessons-källor: K1.12 (grindvakt avslöjar dold skuld), K1.16 (oväntade kategorier), K1.13 (DEFERRED-FIX-MARKER > blanket suppression).

### UTF-8-glob-bug (Commit 4b → 4c)

`tj-actions/changed-files@v47.0.6` returnerade false-outputs för v3.md (svenska `Ä` → UTF-8-escape `\303\204`). ASCII-trigger via Commit 4c (tasks/todo.md-uppdatering) löste empirisk verifikation. K11-tillämpning fjärde gången i samma K1.D (Alt A empirisk över Alt B logisk). Lessons-kandidat K1.17 (hub-lyft) + K1.7 (meta, hub-lyft).

### Empirisk verifikation av Strategi E

| Metrik | Baseline | Strategi E (Commit 4c) | Förbättring |
|---|---|---|---|
| Kod-commit | ~95s | ~96s | Marginal (parallellisering) |
| Doc-only commit | ~95s | ~34s | **~64 % besparing** |
| Lychee broken-link-detection | manuell (K3 åe) | automatisk i CI | NY kvalitetshöjning |
| Branch-protection-readiness | ej | aggregator `ci-passed` | Etablerat |
| K17 supply-chain-skydd | bevarat | bevarat | ± |

### Lychee final-stats (Commit 4c run 25848500304)

| Status | Antal |
|---|---|
| 🔍 Total | 455 |
| ✅ Successful | 381 |
| 🔀 Redirected | 0 |
| 👻 Excluded | 74 |
| 🚫 Errors | **0 ✓** |

### ADR-029 etablerad

Status: **Accepted**. Innehåller § Medvetna utelämningar (6 punkter) + § Säkerhet (K18-tillämpning) + § Konvention (gh run watch-pattern) + § Baseline-fynd 2026-05-14 (3-kategori + Session 6.5-defer + ADR-027-drift-fångst).

### Session 6.5-defer-paket

~71 errors (kategori A+B). Estimat ~30-60 min. Trigger: K0-mini-klunga FÖRE Fas 2.5 i Session 7. Spårbar via DEFERRED-FIX-MARKER-pattern.

---

## Del 7 — K-sista: Lessons-skörd + bake-in + hub-sync

### Lessons-skörd

**17 UNIVERSAL-kandidater** (största enskilda session-skörd; jfr Session 5 = 13, Session 5b = 5, Pre-Fas-2 = 14). Full text i `tasks/lessons.md` H2 `## 2026-05-14 — Session 6 (K1.D CI-optimering, K1.1-K1.17)`.

**10 hub-lyfta till `~/Repon/marcus-system/tasks/lessons.md`:**
- K1.1 K17/K18 paradigm-spanning (npm + Actions + cache)
- K1.2 Branschledar-mönster är golvet, inte taket
- K1.5 Preventiv exklusion utan empirisk basis är genväg
- K1.7 K-disciplin-deklaration ≠ tillämpning (meta, 5 K11-fångster)
- K1.8 Cache-key-strategy: korrekthet > optimering
- K1.12 Grindvakt-baseline avslöjar dold skuld
- K1.13 DEFERRED-FIX-MARKER > blanket fail-suppression
- K1.14 Lychee + cross-doc-grep komplementära
- K1.16 Grindvakt avslöjar oväntade drift-kategorier (emergent värde)
- K1.17 tj-actions UTF-8-glob-bug mot non-ASCII-paths

Varav K1.1+K1.4 konsoliderade och K1.7+K1.10 konsoliderade i hub-versionen.

**5 lokala:** K1.3 (aggregator-mönster CI-specifikt), K1.6 (job-isolering cache CI-specifikt), K1.11 (GHA `cancelled()` GHA-specifikt), K1.15 (arkivzoner-konsistens närliggande-universal-men-CI-fokus), + estimat-undervärdering-meta (subtle, K1.7-förstärkning).

**2 konsoliderade in i hub-rader:** K1.4 (supply-chain → K1.1), K1.10 (default-vanor → K1.7).

### Bake-in-bookkeeping

- **Sessionsdok-fullbordan:** Del 3-8 bake-in (K-sista.1 commit — denna)
- **Lessons + BUILD-LOG + todo:** K-sista.2 commit
- **Hub-sync till marcus-system:** separat operation (per ADR-018)
- **Transcript-save:** K-sista.3 commit (SISTA per CONTRIBUTING.md)

### ADR-spår

- **ADR-029 (ny):** CI-arkitektur changed-files-pattern + third-party Actions-policy
- **ADR-028 (uppdaterad):** Resolution-section + K0åi-trigger-pattern

### Hub-sync-not

Per ADR-018 hub-spoke-disciplin: hub-lyft sker som separat operation i `~/Repon/marcus-system/`. Inte commit i miranon-media-admin-repot. Spårbar via senaste H2-rubrik i `~/Repon/marcus-system/tasks/lessons.md`.

### Transcript-save-not

Per CONTRIBUTING.md transcript-disciplin: transcript-save är **sista commit** i sessionen. Source: `/mnt/transcripts/` på Chat-sidan; Marcus levererar manuellt till `~/Downloads/` eller motsvarande path.

---

## Del 8 — Sammanfattning för framtida läsare

### Vad Session 6 levererade

Strategi E (Vite-mönstret med changed-files + needs-skip + aggregator) etablerad som kanonisk CI-arkitektur per ADR-029. ci.yml restrukturerad från 12-stegs verify-jobb (1 jobb) till 5 jobs (changed → lint → test → docs → ci-passed). Empirisk verifikation: doc-only-commits ~34s vs ~95s baseline = **~64 % besparing**. Kod-commits ~96s matchar baseline. Lychee broken-link-detection etablerad som ny kvalitetscheck. ADR-028 supply-chain-disciplin utvidgad till ADR-029 § Third-party Actions-policy (paradigm-spanning).

### Vad framtida läsare ska veta

1. **CI-arkitekturen är 5-jobs Strategi E.** Doc-only-commits skippar test-jobbet automatiskt. Kod-commits kör alla. Lychee kör vid docs-touching commits.
2. **Cache-disciplinen:** Playwright-browsers cachas via `hashFiles('package-lock.json')` per Vite-mönster. Drop `--with-deps` — ubuntu-latest har OS-libs förinstallerade.
3. **ci-passed-aggregatorn** använder `needs.*.result`-array, inte `cancelled()`/`failure()`. Korrektare per-job-cancellation-detection.
4. **`.lycheeignore`-disciplin:** Empirisk add-only-policy. DEFERRED-FIX-MARKER-block för temporära defer (typ Session 6.5). Inga preventiva exklusioner utan data.
5. **Actions-supply-chain-disciplin:** SHA-pin obligatoriskt på third-party Actions per ADR-029 § 6. Veckovis granskning parallellt med K0åi-trigger för npm.
6. **CI-verifierings-pattern:** `gh run watch <RUN_ID> --exit-status` istället för SHA-polling. Etablerat efter empiriska polling-bugs.

### Process-observationer för framtida sessioner

1. **Fyra K11-fångster i K1.D-arbetet** demonstrerade meta-disciplinen "deklarera K11 ≠ tillämpa K11" (lessons-kandidat K1.7 hub-lyft). Plus femte K11-fångst i K-sista-paket-design (Chat antog struktur utan att verifiera mot K1-skelett-commit `120ef50`). Framtida sessioner med arkitektur-arbete: använd K-disciplinär-checklist FÖRE PLANERA/IMPLEMENTERA-leverans. Verifiera varje icke-trivialt val mot empirisk data eller upstream-mönster.
2. **Marcus' Gate 2-kvalitetsregel** ("genväg = disciplin-brott") är operationell, inte teoretisk. Använd vid varje utelämning som granskningsfråga: "är detta vad ett senior-team hade gjort?"
3. **Defer-paket via DEFERRED-FIX-MARKER-pattern** är 11/10 vs blanket fail-suppression. Per-item-spårbarhet är kärnan.

### Nästa

- **Session 6.5 — broken-links-batch-städning** (~30-60 min K0-mini-klunga, ~71 errors kategori A+B). Trigger: FÖRE Fas 2.5 i Session 7. Detalj: ADR-029 § Baseline-fynd 2026-05-14.
- **Session 7 — Fas 2.5 Schema-kontrakt-sync** per `docs/byggplan.md` § 4. Strategi E levererar empiriska besparingar från första commit.
- **Långsiktigt (Fas 7-konsolidering):** Lychee + cross-doc-grep unified docs sanity check (K1.14-mönster) + Actions-veckogranskning parallellt med K0åi npm-disciplin.

### Triggers för framtida CI-revidering

- **Matrix-tester behövs** (om Fas 5+ etablerar service-worker eller native-modules) → utvidga till `[ubuntu, macos] × [node20, 22]` per medveten-utelämning #4-review
- **Branch protection aktiveras** → verifiera `ci-passed` är required check via `gh api repos/<owner>/<repo>/branches/main/protection`
- **`rhysd/actionlint-action` publiceras** → migrera från `download-script` till SHA-pinnad Action per medveten-utelämning #3 migration-väg
- **UTF-8-glob-bug reproducibility test** → om annan svensk-path triggar samma issue → upstream-issue eller version-byte

### Var den auktoritativa Session-6-trailen finns

- **Denna fil:** `tasks/sessions/2026-05-13-ci-optimering.md` (arkiveras till `archive/2026-05/` när Session 7 startar per ADR-023)
- **K1-commit (sessionsdok-skelett):** `120ef50` (2026-05-13)
- **K0åh commits (allowlist-rensning):** `0d19ede` + `9a4d8d5` (2026-05-13)
- **K1.D commits (8):** `12b3942` → `5f3f148` → `94577c1` → `a5411e1` → `f0dc697` → `071ef39` → `ee0a045` → `16e212b`
- **K-sista commits (3 + hub):** denna sessionsdok-bake-in + lessons/BUILD-LOG/todo + transcript (sista) + hub-sync till marcus-system
- **Lessons-poster lyfta:** 17 lokala (tasks/lessons.md H2 ## 2026-05-14) + 10 hub-lyfta (marcus-system/tasks/lessons.md)
- **ADR-tillägg:** ADR-029 (ny) + ADR-028 (uppdaterad Resolution-section)
- **Total ADR-räkning efter Session 6:** 29 (var 28 post-Fas-2)

### Slutprodukten

CI-konfig redo för Fas 2.5+. ~46 min projicerad framtida-besparing över Fas 2.5→7. Branchledar-validerat arkitektur-mönster. Lessons-skörd 17 kandidater (största enskilda). Process-disciplin förstärkt via 5 K11-fångster i samma session.
