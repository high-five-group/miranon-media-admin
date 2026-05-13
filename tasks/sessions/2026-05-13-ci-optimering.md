# Session 6 — CI-optimering (före Fas 2.5)

> **Status:** K1 skelett pågår (denna fil). K1.A-RAPPORTERA körs parallellt av Code; K1.A-bake-in följer i samma K1-commit eller via K1.2 om Block A-rapporten är substantiell. K1.B/K1.C tas via Gate 1; K1.D via Gate 2.
> **Skapat:** 2026-05-XX (Marcus fyller faktiskt datum vid commit — filnamnet bumpas synkront)
> **Slutgiltig version:** TBD (K-sista bakar in Del 3-8)
> **Ägare:** Marcus + Claude Chat (planering) + Claude Code (implementation)
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-XX-ci-optimering.md` (arkiveras till `archive/2026-05/` vid sessionsavslut per ADR-023)
> **Styrande:**
> - `~/Repon/marcus-system/CLAUDE.md` — hub-konstitution (P-fas-mönster, sessionsdok-disciplin, transcript-disciplin)
> - `~/Repon/miranon-media-admin/CLAUDE.md` — projekt-konstitution + Sessionsstart-/Sessionsavsluts-checklistor + Fas-avsluts-verifierings-rutin
> - `CONTRIBUTING.md` — Definition of Done per session
> - `docs/byggplan.md` §4 Fas 2.5-prompt (vad CI ska skydda nästa fas)
> - `.github/workflows/ci.yml` (nuvarande CI-konfig — basläge)
> - `ADR-028` — Supply chain incident-respons-protokoll (allowlist-disciplin för audit-ci)
> **Föregångare:**
> - `tasks/sessions/archive/2026-05/2026-05-11-fas2-routing-auth.md` — Fas 2 (Sessions 4+5+5b) ✅ KLAR 2026-05-13. **Driving observation:** K5-paketet körde 14 sekventiella doc-only-commits, alla CI-gröna men ~36 s per körning = ~8 minuter spilld CI-tid på arbete som inte påverkar bygg/test-utfall.
> **Efterföljare:** Fas 2.5 — Schema-kontrakt-sync (Session 7, mot `docs/byggplan.md` §4 Fas 2.5-prompt). CI-optimeringen ska bevara cross-doc-drift-skyddet etablerat i K5.9c och säkra Fas 2.5:s schema-validering (Zod parse, Status.ts 4→6, adapter-debt-klassning).
> **Stop-test (denna session):** CI-konfig optimerad mot strategi vald i Gate 1 + cross-doc-drift-skyddet bevarat (K5.9c-grep-suite fungerar fortfarande som fas-avsluts-rutin) + markdown-länkar valideras fortfarande (manuellt eller automatiserat per strategi-val) + audit-ci-disciplin oförändrad (K17 — supply chain-skydd får aldrig skippas) + sessionsdok låst + lessons-skörd lyft + transcript sparat.
> **Sessionsdok-commit-disciplin (P3a-baserad, Fas-2-reviderad):** K1 = skelett. K1.A/B är RAPPORTERA-arbete som rör INTE sessionsdoket. **K1.N early bake-ins** committas om Block-rapporter genererar substantiella fynd eller lärdomskandidater innan K-sista (per Kandidat 5 — disciplin tjänar dokumentet, högvolyms-sessioner kräver bake-ins). K-sista bakar in Del 3-8 retrospektiv. Touch-count: post-K1 = 1.
> **Scope-begränsning:** K42-defer-paketet (process-lärdom från K5.9c systematisk-blind-fläck-fyndet) ligger INTE i denna sessions CI-scope. K42 + K38b + K39 skördas i en separat K0 lessons-sweep enligt egen mini-session, inte under CI-optimerings-arbetet. Att blanda process-lärdoms-skörd med CI-implementation bryter mot Kandidat 7 (refactor/semantik-separation) — egen klunga, egen commit.

---

## Del 1 — Prolog

### Syfte

Denna session optimerar `.github/workflows/ci.yml` så att doc-only-commits (markdown-uppdateringar utan kod-impact) inte längre triggar full verify-svit. Drivande observation: K5-paketet i Session 5b körde 14 sekventiella doc-only-commits à ~36 s = ~8 minuter spilld CI-tid på arbete som inte påverkar bygg/test-utfall. Sessionsavsluts-disciplinen (bake-ins, lessons-lyft, README/CHANGELOG-uppdateringar vid fas-avslut) producerar legitim doc-volym — det är inte ett anti-mönster att fixa, det är ett CI-mönster att anpassa till.

Sessionen är **CI-optimering före Fas 2.5**, inte en del av Fas 2.5. Motivationen att göra den nu: Fas 2.5 — Schema-kontrakt-sync producerar både kod-ändringar (Status.ts 4→6, Zod-aktivering, AirtableAdapter-JSDoc) och doc-ändringar (`data-model.md`-cross-link, ADR-026-uppdatering om relevant, BUILD-LOG-rad). En CI-konfig som väger detta korrekt sparar tid över hela framtiden av byggplanen (Fas 3, 3.5, 5, 5.5, 6a-e, 6.5, 7, 8, B, E — alla har dokumentations-commits som följer kod-commits).

**Vad sessionen INTE gör:**
- Schema-arbete (Status.ts, Zod, adapter-debt) — det är Fas 2.5 (Session 7).
- K42-defer-paket-skörd (K38b form-tolerans-validering + K39 case-sensitivity + K42 systematisk-blind-fläck-process-lärdom) — det är en separat lessons-sweep, inte CI-arbete.
- ADR-028-veckovis-granskning av audit-ci-allowlist — den schemalagda granskningen är 2026-05-19, ligger i `tasks/todo.md`, körs separat.
- Ny fas-avsluts-verifierings-rutin — den etablerades i K5.9c och fungerar. Eventuell automatisering är ett *möjligt* delval i Strategi C, inte en tvångsleverans.

**Vad sessionen ska producera (beroende på Gate 1-val):**
- Uppdaterad `.github/workflows/ci.yml` med doc-only-disciplin.
- Eventuellt ny separat workflow-fil för docs-CI (Strategi C).
- Verifikation att markdown-länkar fortfarande valideras (antingen via befintlig manuell disciplin eller via ny CI-check).
- Verifikation att cross-doc-drift-skyddet (K5.9c grep-suite) fortfarande är kontextuellt-rätt placerad — den körs lokalt vid fas-avslut, inte i CI per default. CI:s roll är *kompletterande*, inte *ersättande*.
- Bevarad audit-ci-disciplin per K17 (supply chain-skydd ska aldrig villkoras på paths-filter).
- Ny ADR vid eventuellt arkitekturbeslut om CI-arkitektur (förväntat ADR-029 om Strategi C eller D-hybrid väljs; inte ett krav för A eller B).

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
| 9 | `docs/decisions/README.md` ADR-katalog (27 ADR:er post-Fas-2) | För nytt ADR-nummer om Strategi C/D-hybrid kräver explicit arkitekturbeslut: nästa lediga är ADR-029. |
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

| K | Innehåll | Stop-test per klunga | Sessionsdok rörs? |
|---|---|---|---|
| **K1** | Sessionsdok-skelett (denna fil — Del 1 Prolog + Del 2 K1-leverans + Del 7 stop-test-mall + Del 3-6/8 TBD-placeholders) | Filen committad i repot på `tasks/sessions/2026-05-XX-ci-optimering.md`. Code-bekräftelse: 1 ny fil, ren commit, lokal HEAD = origin HEAD. | ✅ K1-commit |
| **K1.A** | RAPPORTERA: inventera nuvarande CI-konfig + körningstider per steg + audit-ci/GHSA-rmmr-r34h-pfm5-allowlist-status (K17-disciplin) | Block A levererad i Chat: 12-stegs-inventering med faktiska CI-körningstider från Session 4+5+5b-runs, audit-ci-allowlist-status bekräftad oförändrad sedan 2026-05-12, ingen ny advisory mot installerade versioner. | ❌ orört (möjlig K1.2-bake-in om volym kräver) |
| **K1.B** | RAPPORTERA: inventera doc-only-vs-kod-commits över Session 5+5b för att förstå skip-frekvens-potential | Block B levererad i Chat: räknings-tabell för alla Session 5+5b-commits med klassning (doc-only/kod/mixed) + faktisk CI-tid spilld + skip-frekvens-baseline. Inkluderar definition av "doc-only" (paths-glob för skip-villkoret). | ❌ orört |
| **Gate 1** | Strategi-val (A/B/C/D eller hybrid) baserat på K1.A+K1.B-data. Trade-off-analys utförs av Chat i nästa svar; Marcus beslutar. | Marcus' beslut explicit i Chat: "Strategi X" + ev. hybrid-variant. | ❌ orört |
| **K1.C** | PLANERA: exakt CI-konfig-ändring per vald strategi. Filer som rörs, glob-patterns, eventuell ny workflow-fil, eventuell ny ADR. | Plan levererad i Chat med exakt diff-spec (str_replace-format för ci.yml + ev. ny fil). Inkluderar svar på: hur valideras markdown-länkar? hur bevaras cross-doc-drift-skyddet? hur villkoras audit-ci INTE? hur testas konfig-ändringen utan att rota till git-history? | ❌ orört |
| **Gate 2** | Exakt CI-konfig-ändring godkänd innan IMPLEMENTERA. | Marcus' beslut explicit i Chat: "Implementera per planen" eller skärpning. | ❌ orört |
| **K1.D** | IMPLEMENTERA + VERIFIERA: applicera CI-ändring + testa via avsiktlig doc-only-commit + avsiktlig kod-commit, verifiera båda beter sig som specificerat. ADR-029 vid behov. | Doc-only-commit: CI hoppar tunga steg per strategi (eller hela jobbet vid Strategi A). Kod-commit: full svit kör. audit-ci kör i båda fallen. CI-tids-mätning: spill-elimering verifierad. | ✅ K1.D-commits + ev. K1.3-bake-in om scope växer eller avvikelser uppstår |
| **K-sista** | Stop-test + lessons-skörd + ADR (om K1.D inte redan committat) + bake-in Del 3-8 + BUILD-LOG-rad + todo.md-uppdatering + transcript | Sessionsdok låst med full retrospektiv, lessons lyfta till `tasks/lessons.md` (+ hub om UNIVERSAL), BUILD-LOG-rad tillagd, todo.md uppdaterad (Session 6 ✅ KLAR, Fas 2.5 fortfarande nästa), transcript sparad till `tasks/sessions/transcripts/2026-MM-DD-session-6-ci-optimering.txt`. | ✅ K-sista bake-in-commit |

**Sessions-numreringsanmärkning:** Session 6 motsvarar Session 38 i den samlade projekthistoriken (Session 5b var 37). Numreringen följer projektets React-numrering enligt CLAUDE.md Status-sektion.

---

## Del 2 — K1: Sessionsdok-skelett

✅ **KLAR** 2026-05-XX. Denna fil skapad och committad ("docs(sessions): start Session 6 sessionsdoc — skeleton (K1 ci-optimering)"). K1-leverans = Del 1 Prolog + Del 2 (denna sektion) + Del 7 stop-test-mall + Del 3-6/8 som TBD-placeholders med tydliga rubriker som ska fyllas via bake-ins och K-sista.

### Parallell-arbete med Code

Per användarens not vid sessionsstart: Code har redan börjat på K1.A-arbetet med samma prompt-bas. Chat-skelettet (denna fil) levereras som komplement — Code:s RAPPORTERA-output (K1.A Block A) tas in i Chat när den är klar, syntetiseras tillsammans med K1.B, och blir grund för Gate 1 strategi-valet.

### Förväntade STOPPA-OCH-FRÅGA-checkpoints

Sessionen har två explicita gates designade per Kandidat 2 (STOPPA-OCH-FRÅGA-mönster fungerar) — bygg in dem som explicit text i Code-prompterna:

**Gate 1 — Strategi-val (efter K1.A + K1.B RAPPORTERA):**
> "STOPPA OCH FRÅGA om K1.B räknings-rapporten visar < 70 % doc-only-andel av Session 5+5b-commits — då är ROI för paths-filter-strategi marginell och Strategi D (concurrency-grupp) eller status quo blir kandidater. Lever rapporten upp till de tidigare 14/N-uppskattningarna, presentera Strategi A/B/C/hybrid-analys för Marcus' beslut innan PLANERA."

**Gate 2 — Implementation-plan (efter K1.C PLANERA):**
> "STOPPA OCH FRÅGA om vald strategi kräver ny workflow-fil (Strategi C) eller pull_request_target istället för pull_request (säkerhetsimplikation). Annars proceed till K1.D IMPLEMENTERA."

### K1-leveransens struktur

Sessionsdoket består av åtta sektioner när det är komplett (K-sista):

| § | Innehåll | Status nu (K1) |
|---|---|---|
| 1 | Prolog — syfte, indata-kontext, källprioritet, klunge-struktur | ✅ komplett |
| 2 | K1 — sessionsdok-skelett (denna sektion) | ✅ komplett |
| 3 | K1.A — Inventering nuvarande CI-konfig + körningstider + audit-ci-status | ⏳ TBD (Code RAPPORTERA Block A → bake-in) |
| 4 | K1.B — Inventering doc-only-vs-kod-commits + skip-frekvens-baseline | ⏳ TBD (Code RAPPORTERA Block B → bake-in) |
| 5 | K1.C — Strategi A/B/C/D trade-off-analys + Gate 1-beslut + implementations-plan + Gate 2-beslut | ⏳ TBD (post-Gate-1 + post-Gate-2) |
| 6 | K1.D — Implementation + verifikation + ev. ADR-029 | ⏳ TBD (post-implementation) |
| 7 | K-sista — Stop-test + lessons-skörd + bake-in + BUILD-LOG + todo + transcript | 🟡 Stop-test-mall i §7.1 nedan; lessons-skörd-platshållare i §7.2 |
| 8 | Sammanfattning för framtida läsare (vad sessionen levererade / inte gjorde / nästa-steg-pekare) | ⏳ TBD (K-sista) |

### Disciplin-noteringar för denna session

- **Audit-ci kör på alla commits, alltid.** Per Kandidat 17 (live security-state vid sessionsstart) — supply chain-skydd får inte villkoras på paths-filter eller doc-only-detection. Strategi A:s skip-hela-jobbet-villkor måste därför *exkludera* audit-steget från skipping, alternativt audit-steget flyttas till separat workflow som alltid kör.
- **Markdown-länk-validering** — om nuvarande CI inte har det (verifieras i K1.A) är det inte en regression att inte lägga till det. Det är en *möjlig förbättring* att överväga i Strategi C-design (ny docs-workflow med både markdown-link-check och optional cross-doc-grep). Inte tvingande.
- **Cross-doc-drift-skyddet** etablerat i K5.9c är en *fas-avsluts*-rutin (Code kör grep-suite i RAPPORTERA-block av sista K i fas-avslutande session, Chat verifierar). Den är *lokal*, inte CI. Eventuell automatisering i CI är en kompletterande Strategi C-möjlighet, inte ersättning. Behåll den lokala rutinen oavsett.
- **Sessionsdok-disciplin är reviderad** (P3a + Fas-2-revision): K1 + K1.N bake-ins efter substantiella sub-klungor + K-sista. Förvänta minst K1.2 (K1.A-bake-in) och K-sista. Eventuellt K1.3 om K1.D scope växer.
- **STOPPA-OCH-FRÅGA-mönstret** bygg in i Code-prompter vid förväntat-osäkra utfall (alla rapport-blockar; alla beslutspunkter).
- **Format-bridge** mellan sessionsdok och lessons.md: kompakt 1-paragraph i lessons.md med korslänk till expanderat resonemang i denna fils Del 7.2 (Kandidat 14).
- **Inline-källor i Code-prompter** (UNIVERSAL från P3b) — referera inte "Del N i sessionsdoket" som källa under körning. Lägg innehåll inline.
- **Chat-kontext lever inte över sessionsbyte** (Kandidat 15) — allt som ska överleva ska in i en av: sessionsdok-bake-in / lessons.md / ADR.

---

## Del 3 — K1.A: Inventering nuvarande CI-konfig + körningstider + audit-ci-status

TBD — bakas in efter Code:s K1.A RAPPORTERA Block A.

### 3.1 Förväntat innehåll

Bake-in från Code-rapporten ska täcka:

**Block A.1 — CI-konfig per steg.** Inventering av `.github/workflows/ci.yml` med:
- Steg-namn, kommando, timeout (om satt), env-vars, secrets-beroende
- Triggerings-villkor (`on:` block): `pull_request` + `push` till `main`
- Permissions (`contents: read`)
- Concurrency-grupper (om någon — verifieras)

**Block A.2 — Körningstider per steg från senaste 5-10 CI-runs.** För varje steg medel + max-tid. Källa: GitHub Actions UI per `gh run list --workflow=ci.yml --limit=10` eller liknande. Verklighet före uppskattning per Kandidat 10 ("verkligheten på pushtid > analys vid skrivtid"). Förvänta att Playwright install + E2E tests står för betydande andel.

**Block A.3 — Audit-ci-status (K17-disciplin, sessionsstart-baseline-audit).**
- `npm audit --json | grep -c GHSA-rmmr-r34h-pfm5` → förväntat 6 (oförändrat sedan 2026-05-12).
- Kolla `npm view @tanstack/react-router@latest version` + `npm view @tanstack/history@latest version` + `npm view @tanstack/router-plugin@latest version` — har TanStack publicerat patched versioner? Förväntat: nej (granskning schemalagd 2026-05-19 i todo.md).
- Kolla GitHub advisory-status: `curl -s https://api.github.com/advisories/GHSA-rmmr-r34h-pfm5 | grep -E '"patched_versions"|"withdrawn_at"'` — förväntat: ingen patched, inte withdrawn.
- STOPPA-OCH-FRÅGA om någon av punkterna ovan avviker — då blir K0åh ny sub-klunga (allowlist-rensning per ADR-028 5-stegs Konvention-flöde).
- Verifiera att audit-ci-allowlist (`audit-ci.jsonc`) är oförändrad — `git log -1 audit-ci.jsonc` → senaste commit ska vara från Session 5 K2 (audit-ci-disciplin etablering).

**Block A.4 — Annan observability (om relevant).**
- Finns concurrency-grupp definierad? Cancel-in-progress för main-branch PR-runs?
- Finns paths-filter någonstans i workflows? `find .github/workflows -name '*.yml' -exec grep -l 'paths:' {} \;`
- Andra workflow-filer än ci.yml? `ls .github/workflows/` → förväntat: enbart ci.yml + ev. dependabot-auto-merge (om sådan finns).

### 3.2 STOPPA-disciplin

Om Block A.3 visar avvikelse mot förväntat (ny advisory, patched versioner publicerade, withdrawal) — pausa CI-optimering och starta K0åh allowlist-rensning först. Detta är K17-disciplinen i praktiken: live security-state är pre-requisit för annat arbete.

---

## Del 4 — K1.B: Inventering doc-only-vs-kod-commits + skip-frekvens-baseline

TBD — bakas in efter Code:s K1.B RAPPORTERA Block B.

### 4.1 Förväntat innehåll

**Block B.1 — Commit-räkning Session 5 + 5b.**
- Hämta commit-range: `git log <Session-5-start>..<Session-5b-slut> --oneline`
- Per commit klassa: `doc-only` (rör endast `*.md`, `*.txt`, eventuellt `docs/`, `tasks/`, README-likes), `kod` (rör `src/`, `tests/`, `supabase/functions/`, `vite.config.ts`, `tsconfig*.json`, `package.json`, `package-lock.json`, `.github/`, `playwright.config.ts`, `biome.json`), `mixed` (båda).
- Klassningskriterium: `git show --stat <hash>` → granskning av paths.
- Totalt: doc-only-räkning + kod-räkning + mixed-räkning + procent-fördelning.

**Block B.2 — Verifierad K5-doc-only-räkning.**
- 14-commits-uppskattningen kommer från användarens prompt-text. Verifiera mot faktisk K5-sub-klunga-commit-trail (K5.1-K5.9). Förvänta att räkningen ligger i intervallet 10-18 — 14 är prompt-uppskattning.
- Per Kandidat 10: räkna lokalt FÖRE strategi-design bygger på siffran.

**Block B.3 — CI-tids-spill för doc-only-andelen.**
- Doc-only-räkning × medel-CI-tid = totalt spill. Visa både med och utan E2E-/staging-steg (om CI-tiden varierar mellan kort path och full path).
- Spill jämfört med total Session 5+5b-CI-tid (kod-commits också) — vad är spill-andelen?

**Block B.4 — Definition av "doc-only" för paths-filter-syfte.**
- Föreslagen glob-pattern för paths-filter (om Strategi A eller B). Kandidater:
  - Hard skip: `'**.md'`, `'**.txt'`, `'docs/**'`, `'tasks/**'`, `'CHANGELOG.md'`, `'README.md'`, `'LICENSE'`, `'SECURITY.md'`, `'CONTRIBUTING.md'`
  - Edge cases: `.github/workflows/*.yml` (workflow-ändring ska INTE skippa, måste testas), `.github/dependabot.yml` (config-ändring), `package.json` (deps-ändring), `biome.json` (lint-config), `tsconfig*.json` (typecheck-config)
- STOPPA-OCH-FRÅGA om Marcus vill att Code föreslår final-globs eller om Chat designar dem i K1.C.

**Block B.5 — Skip-frekvens-baseline (extrapolering).**
- Givet Fas 2.5 + Fas 3 + ... -framtida-doc-commit-frekvens (uppskattning från Fas 2: ~30 % av alla commits): vilken CI-tids-besparing per kvartal? Återbetalningstid för optimering.

### 4.2 STOPPA-disciplin

Om Block B.1 visar < 70 % doc-only-andel av K5-paketet → ROI för paths-filter är marginell. Då blir Strategi D (concurrency-grupp / cancel-in-progress) eller status quo kandidater. Presentera analysen i Chat innan Strategi-val.

---

## Del 5 — K1.C: Strategi-val + implementations-plan

TBD — bakas in efter Gate 1 (strategi-val) + Gate 2 (implementations-plan godkänd).

### 5.1 Strategi-katalog (preliminär — fylls i mer detaljerat post-K1.A/B)

Fyra grundstrategier med olika trade-offs. Slutgiltigt val baseras på K1.A+K1.B-data.

**Strategi A — paths-filter på jobbet, skippa hela `verify`-jobbet för doc-only-commits.**
- Mekanik: `on.pull_request.paths-ignore` + `on.push.paths-ignore` med doc-only-globs.
- Pro: enklast att implementera, störst tids-besparing per doc-only-commit.
- Con: audit-ci hoppas också över → bryter K17. Måste lösas via separat `audit`-jobb som inte har paths-ignore.
- Con: branch protection rules på GitHub som kräver "CI / Lint + TypeCheck + Test + Build" som required check kan blockera merge om jobbet inte ens kör.
- Lösning på branch-protection-con: GitHub Actions har stöd för "skipped check counts as passed" via `pull_request.paths-ignore` (vs `paths`), OCH alternativt via separat trigger-`workflow_dispatch` eller "always-required passing job"-mönstret.

**Strategi B — paths-filter på enskilda steg, eller `if:`-villkor på dyra steg.**
- Mekanik: behåll jobbet, lägg `if: ${{ !contains(github.event.head_commit.modified, '.md') }}` eller `dorny/paths-filter`-action som första steg, sedan villkora tunga steg på dess output.
- Pro: audit-ci + biome + tsc kan fortfarande köra (snabba, billiga). Bara tunga steg (tests, build, E2E, playwright-install) hoppas.
- Pro: ingen branch-protection-rule-impact eftersom jobbet alltid kör.
- Con: mer YAML-komplex; fler `if:`-rader att underhålla.
- Con: medel-besparing per doc-only-commit (kanske 60-80 % av total CI-tid hoppas, inte 100 %).

**Strategi C — separera workflows: `code-ci.yml` (current verify) + `docs-ci.yml` (nytt, lätt).**
- Mekanik: två workflow-filer med olika paths-filter. `code-ci.yml` har `paths-ignore` för docs; `docs-ci.yml` har `paths` för docs och kör endast markdown-link-check + (optional) cross-doc-grep-suite från K5.9c.
- Pro: explicit separation — koden har sin CI, docs har sin. Kommer med möjlighet att automatisera fas-avsluts-verifierings-rutinen som "docs sanity check"-workflow (per användarens särskilda not).
- Pro: branch protection rules kan kräva båda workflows som checks (`code-ci` blir skipped-but-passed för doc-only, `docs-ci` blir aktivt-grön).
- Con: mest YAML-arbete + ny ADR (ADR-029). Två workflows = två underhållspunkter.
- Con: cross-doc-grep-suite från K5.9c är form-tolerant (K38) men relevans-bedömning kräver mänskligt omdöme för "form-variant" vs "verklig drift" (per K5.9c Stopp-disciplin). Att automatisera den i CI utan mänsklig granskning kan ge falska positives som tröttar Marcus + bryter cherry-flow. Försiktighet rekommenderas — kanske bara markdown-link-check i Strategi C, inte cross-doc-grep.

**Strategi D — concurrency-grupp + cancel-in-progress.**
- Mekanik: `concurrency: group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true`. Tidigare runs i samma branch avbryts när ny pushar.
- Pro: trivialt att implementera; sparar CI-tid när dev pushar snabbt efter varandra.
- Con: löser INTE doc-only-problemet — varje commit i K5-paketet är en separat ref-push (eller PR-pushed-commit), inte en överskrivning. Concurrency-grupp avbryter bara *pågående* runs; doc-only-commits som körs efter varandra hinner färdiggöra.
- Con: kan rekommenderas som *komplement* till A/B/C, inte ersättning.

**Hybrid-rekommendation (förhands-utkast):** B + D. Behåll jobbet som alltid kör (audit-ci + biome + tsc snabba), villkora tunga steg via paths-filter-output, lägg concurrency-grupp som komplement. Möjligen + light-C (separat liten docs-link-check-workflow) om markdown-länk-validering anses värdefullt. Slutgiltig rekommendation görs efter Gate 1.

### 5.2 Trade-off-matris

TBD — fylls med faktisk data från K1.A+K1.B + Marcus' preferens-vikt (störst besparing? lägst risk? minst underhåll?).

### 5.3 Gate 1 — strategi-val

TBD — Marcus' beslut + motivering committas i sessionsdoket.

### 5.4 Implementation-plan (post-Gate-1)

TBD — exakt diff-spec, fil-lista, prompt-mall för Code:s IMPLEMENTERA-block.

### 5.5 Gate 2 — implementation-plan godkänd

TBD — Marcus' beslut + ev. skärpning committas.

---

## Del 6 — K1.D: Implementation + verifikation + ev. ADR-029

TBD — bakas in efter K1.D-commits.

### 6.1 Förväntat innehåll

- Commit-trail för K1.D (1-3 commits beroende på strategi-val).
- Verifierings-svit: avsiktlig doc-only-commit (testa skip-villkor) + avsiktlig kod-commit (testa full svit) + ev. mixed-commit (testa korrekt fallback).
- CI-tids-mätning före/efter med faktiska siffror.
- ADR-029 (om Strategi C eller annan arkitekturkomplex variant) — Status/Datum/Fas + Kontext/Beslut/Alternativ/Konsekvenser/Spårbarhet.
- Eventuell uppdatering av `CONTRIBUTING.md` Pull Request-flöde-sektion om branch-protection-rules ändras.
- Eventuell uppdatering av `CLAUDE.md` Sessionsstart-checklistan om audit-ci-disciplin behöver ny formulering.

---

## Del 7 — K-sista: Stop-test + lessons-skörd + ADR + bake-in + BUILD-LOG + todo + transcript

TBD — bakas in i denna sista commit (K-sista).

### 7.1 Stop-test

Pass/fail per krav (fylls vid K-sista):

| Krav | Status | Verifiering |
|---|---|---|
| K1-K1.D commits committade per strategi-val | TBD | `git log K1..K-sista --oneline` matchar förväntad sekvens |
| Avsiktlig doc-only-commit verifierat skip-beteende | TBD | CI-run-länk + log-utdrag som visar hoppade steg |
| Avsiktlig kod-commit verifierat full-svit-beteende | TBD | CI-run-länk + grön status, alla 12 steg körda |
| audit-ci kör fortfarande på alla commits (K17-disciplin bevarad) | TBD | Båda CI-runs ovan har audit-ci-steget grönt |
| Markdown-länk-validering bevarad (manuellt eller automatiserat) | TBD | Antingen befintlig manuell disciplin dokumenterad i CLAUDE.md, eller ny CI-check grön i docs-CI |
| Cross-doc-drift-skyddet (K5.9c-rutinen) bevarat och kontextuellt-rätt-placerad | TBD | Rutinen körs fortfarande lokalt vid fas-avslut; ev. CI-komplement dokumenterat |
| ADR-029 committad (om strategi-val kräver) | TBD | `docs/decisions/ADR-029-*.md` finns; `docs/decisions/README.md` uppdaterad |
| Lessons-skörd lyft till `tasks/lessons.md` | TBD | Ny H2-sektion `## 2026-05-XX — Session 6 CI-optimering` |
| Hub-synk klar (om UNIVERSAL-poster) | TBD | `~/Repon/marcus-system/tasks/lessons.md` synkad |
| `tasks/todo.md` uppdaterad | TBD | Session 6 ✅ KLAR, Fas 2.5 fortfarande nästa |
| BUILD-LOG-rad tillagd | TBD | `docs/BUILD-LOG.md` har Session 6-block |
| `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` granskad för implications | TBD | Antingen oförändrad (CI-arbete ej icke-tekniska-läsare-relevant) eller "Senast uppdaterad"-bumpad |
| Sessionsdok låst | TBD | Touch-count uppdaterad i header; bake-ins synliga i Del 3-8 |
| Transcript sparat | TBD | `tasks/sessions/transcripts/2026-MM-DD-session-6-ci-optimering.txt` |

### 7.2 Lessons-skörd

TBD — fångas under sessionen. Förväntade kandidat-områden:

- **Kandidat (preliminär) — Paths-filter får aldrig villkora supply-chain-skydd [UNIVERSAL]** — K17-mönster-förstärkning: även när CI-jobbet hoppas över för doc-only-commits, måste audit-ci stå i separat jobb eller villkoras med `if: always()` så supply chain-state alltid är verifierad.
- **Kandidat (preliminär) — CI-optimering före fas hellre än mitt i [UNIVERSAL]** — sessionsplaceringen mellan Fas 2-avslut och Fas 2.5-start är optimal: producerar legitim doc-volym i båda riktningar, inga aktiva blockers, kan testa på "tom" main.
- **Kandidat (preliminär) — Cross-doc-drift-skyddet är lokal disciplin, inte CI-uppgift [UNIVERSAL]** — K5.9c-rutinen är form-tolerant och kräver mänskligt omdöme; automatisering ger falska positives som tröttar dev:n. Eventuell automatisering är komplement, inte ersättning.

Format-bridge per Kandidat 14: kompakt 1-paragraph i `tasks/lessons.md` med korslänk till expanderat resonemang i denna fils §7.2.

### 7.3 ADR-kandidater

**Obligatoriska:** Inga utan strategi-val. ADR-029 utlöses om Strategi C eller en hybrid med arkitekturimpact väljs.

**Förväntad-vid-Strategi-C:** ADR-029 — "CI-arkitektur: separation av code-CI och docs-CI". Status/Datum/Fas + Kontext (K5-paketet drev fram beslut) + Beslut (två workflows) + Alternativ (A/B/D avvägning) + Konsekvenser + Spårbarhet.

### 7.4 Bake-in-plan

TBD — fylls vid K-sista. Strukturen:
- Del 3-6 fylls från Code-rapporter + Chat-syntheses + Gate-beslut.
- Del 8 sammanfattning skrivs av Chat baserat på faktisk leverans.
- Touch-count i header uppdateras.
- Status-rad i header bumpas till "✅ KLAR YYYY-MM-DD".

### 7.5 BUILD-LOG-rad

TBD — fylls vid K-sista. Format:

```markdown
## Session 6 (React) — CI-optimering (före Fas 2.5)

**Datum:** 2026-05-XX
**Session-nummer:** 6 (React) — motsvarar Session 38 i total projekthistorik
**Commit-range:** <K1-hash> → <K-sista-hash>
**Effort-nivå:** liten/medel

(...) Strategi vald + diff-summary + CI-tids-mätning före/efter + lessons-skörd-räkning + ADR-tillägg-räkning + DoD-status.
```

### 7.6 todo.md-uppdatering

TBD. Förväntat:
- Session 6 markeras ✅ KLAR i Session-historik-listan.
- Aktuellt fokus förblir Fas 2.5 (CI-optimering var session-scope, inte fas-scope).
- Audit-ci-allowlist-granskning-rutin oförändrad (nästa 2026-05-19).
- Ev. ny återkommande disciplin om Strategi C kräver det (t.ex. "Per kvartal — granska markdown-link-check failures för stale refs").

### 7.7 Transcript-disciplin

Per CONTRIBUTING.md + CLAUDE.md sessionsavsluts-sektion. **Absolut sista steg** (per K1.6-pattern från Fas 2).

K-sista-flöde:

1. ALLA andra commits klara och pushade (sessionsdok, todo, CLAUDE.md, BUILD-LOG, ev. ADR-029, lessons-lyft repo + hub)
2. Marcus exporterar Session 6-transcripten från claude.ai
3. `mv <export> ~/Repon/miranon-media-admin/tasks/sessions/transcripts/2026-MM-DD-session-6-ci-optimering.txt`
4. `git add ... && git commit -m "docs(session-6): save Session 6 transcript per CONTRIBUTING.md transcript-disciplin" && git push`
5. Detta är sessionens sista commit. Inget annat efter.

---

## Del 8 — Sammanfattning för framtida läsare

TBD — bakas in i K-sista.

### 8.1 Vad denna session levererade

TBD.

### 8.2 Vad denna session inte gjorde

TBD. Förväntade defer-poster:
- Fas 2.5-arbete (Status.ts 4→6, Zod-aktivering, adapter-debt-klassning) — Session 7
- K42-defer-paket-skörd (K38b + K39 + K42-process-lärdom) — separat lessons-sweep
- ADR-028-veckovis-granskning av audit-ci-allowlist (schemalagd 2026-05-19)
- BYGGPLAN-LÄTTLÄST-v3-uppdatering om CI-arbete ej har icke-tekniska-läsare-implications

### 8.3 Vad nästa session ska göra

**Fas 2.5 — Schema-kontrakt-sync.** Mot `docs/byggplan.md` §4 Fas 2.5-prompt. Scope: Status.ts 4→6 statusvärden mot `data-model.md`, övriga enums granskade, Zod runtime-validering i AirtableAdapter-läsmetoderna, adapter-debt-klassning av 9 metoder per ADR (P1 A5-tabellen). Inget EF deployas i förskott (M4-principen).

Eventuellt även K42-defer-paket-lessons-sweep som K0-mini-klunga i Session 7, beroende på Marcus' prioritering — sweepen kan ligga i sessionsstart innan Fas 2.5-arbetet börjar.

### 8.4 Var den auktoritativa Session-6-trailen finns

- **Denna fil:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-XX-ci-optimering.md` (vid sessionsavslut: arkiveras till `archive/2026-05/` när Session 7 startar per ADR-023, eller behålls aktiv om Fas 2.5 startar i annan månad och arkiverings-rutinen rör sig per fas)
- **K1-commit (sessionsdok-skelett):** TBD
- **K1.A/B/C/D-commits:** TBD (1-5 commits beroende på strategi-val)
- **K-sista commit (bake-in):** TBD
- **Transcript-commit (sista):** TBD
- **Lessons-poster lyfta:** TBD (lokal + ev. hub-sync)
- **ADR-tillägg:** TBD (ADR-029 vid Strategi C eller hybrid med arkitekturimpact)
- **Total ADR-räkning efter Session 6:** TBD (idag 27, kan bli 27-28)

### 8.5 Slutprodukten

TBD.
