# Fas 2 — Routing + Auth (TanStack Router + Supabase + nuqs)

> **Status:** K0 FULLSTÄNDIGT KLAR 2026-05-11 (alla 6 åtgärder committade). K2-K4 Fas 2-implementation följer i Session 5. Sessionsdoket är aktivt över Session 4 + Session 5 (samma Fas 2) — arkiveras vid Fas 2-avslut per ADR-023 + scope-splitt-anmärkning nedan.
> **Skapat:** 2026-05-11 (K1)
> **Slutgiltig version:** TBD (K-sista bakar in Del 3-8)
> **Ägare:** Marcus + Claude Chat (planering) + Claude Code (implementation)
> **Avsedd plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-11-fas2-routing-auth.md`
> **Styrande:** `docs/byggplan.md` §4 Fas 2-prompt (8 DoD-punkter) + `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md` Del 6.5 (6 K0-åtgärder)
> **Föregångare:**
> - `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md` (Pre-Fas-2, slutförd 2026-05-07) — arkiveras i K1 enligt ADR-023 sessions-arkivering
> **Efterföljare:** Fas 2.5 — Schema-kontrakt-sync, mot `docs/byggplan.md` §4 Fas 2.5-prompt.
> **Stop-test (denna session):** 6 K0-åtgärder committade + Fas 2 DoD 1-8 passerade + Playwright auth-fixture etablerad + ev. ADR:er committade + lessons-skörd lyft + sessionsdok låst + transcript sparat.
> **Sessionsdok-commit-disciplin (P3a-baserad, reviderad för Fas 2):** K1 = skelett. Faktiska arbets-commits (K0åa-åf, K2-K4) rör INTE detta sessionsdok. **K1.N early bake-ins** committas efter substantiella K0-sub-klungor för att fånga commit-hashar + avvikelser + lärdomskandidater innan K-sista. K-sista bakar in Del 3-8 retrospektiv. Mönsterbyte från ursprungliga 'K1 + K-sista' till 'K1 + K1.N bake-ins + K-sista' beslutat 2026-05-11 efter K0åb genererat 8 dolda type-fel-fynd + flera lärdomskandidater — för mycket att hålla i Chat-kontext tills K-sista. Ren str_replace-patch är konfliktfri och billig. Touch-count revideras dynamiskt under sessionen; aktuell post-K1.7 = 9 (K1 + K1.2 + K1.3 + K1.4 + K1.5a + K1.5b + K1.6 + K1.7 = K-sista för K0-fasen i Session 4 + K0åg-spårbarhet och skelett-utfyllnad inför Session 5 K2-K5). Session 5 (K2-K4 + K5) kommer addera fler touches innan Fas 2-arkivering. **K0 startvillkor-fas 1-3 komplett 2026-05-11** efter K0åc.2 CI grön (36s, 72 pure + 38 staging passed + 3 M4-defer skipped) — Fas 2-implementation (K2) nu unblockad strikt-sekvens-wise; K0åd-K0åf kan tas före eller parallellt med K2 per Marcus' beslut. **Mini-överlämning klar 2026-05-11** (Steg 1 lessons-lyft + Steg 2 CLAUDE.md + Steg 3 todo.md + Steg 4 Sessions-handoff + Steg 5b Kandidat 13-15-bake-in + cross-repo-lessons-lyft) — sessionsdoket är komplett-handoff-redo, väntar på Marcus' Update-klick i Claude.ai-projektet innan ny session-start.
> **Scope-splitt-anmärkning:** Fas 2-estimat enligt byggplan §4 = 2 sessioner. Om K0+K2+K3+K4 inte ryms i en chat-session, splitta i Session A (K1+K0+K2) och Session B (K3+K4+K5) per P1-lärdom ("Var beredd att splitta i 2 sessioner om scope växer"). Splitten är förväntad, inte avvikelse.

---

## Sessions-handoff (för kall sessionsstart)

> **Om du är en ny Chat-context som öppnar detta dokument utan föregående minnesläge — läs detta block först, sedan följ läs-ordningen nedan. Skippa Del 1-8 för översikt; gå direkt till handoff-sammanfattningen.**

### Var vi är (2026-05-11)

Fas 2 K0 startvillkor 1-3 ✅ **KLAR** (Session 4). K0åd-K0åf "Direkt efter Fas 2"-fynd ✅ **KLAR** (Session 4-avslut, K1.6). **K0åg (supply chain malware-respons GHSA-rmmr-r34h-pfm5) ✅ KLAR 2026-05-12** (Session 5 K1.7-spårning) — upptäcktes i K1.7 RAPPORTERA Block B, åtgärdades via Strategi 2 (pin exakt + overrides, commits `ea59787` + `35cd10e` ADR-028). Sessionsdoket är på touch nr 9 efter K1 + K1.2 + K1.3 + K1.4 + K1.5a (Sessions-handoff) + K1.5b (Kandidat 13-15-bake-in) + K1.6 (K-sista K0-fasen Session 4) + K1.7 (K0åg-spårning + Del 4-7-skelett inför Session 5, denna). Session 5 implementation (K2-K4 + K5) kommer addera fler touches innan Fas 2-arkivering. 12 UNIVERSAL-lessons från K0åa-K0åc + 3 meta-UNIVERSAL från mini-överlämningen (Kandidat 13-15) + 1 från K0åf (Kandidat 16) lyfta till `tasks/lessons.md` + hub (`marcus-system/tasks/lessons.md`) under H2 `## 2026-05-11 — Fas 2 K0 startvillkoren`. Kandidat 17-19 från K0åg flaggade i Del 7.2-skelettet, lyfts vid K5. CI grön på första försök efter K0åc.2 (run 25663357991, 36s) och efter K0åg-paret (separata runs 2026-05-12 morgon).

### Läs-ordning för ny session (sessionsstart-checklista anpassad för Fas 2)

Per `~/Repon/miranon-media-admin/CLAUDE.md` sessionsstart-checklistan + denna handoff-tilläggsrad:

1. `~/Repon/marcus-system/CLAUDE.md` — Hub-konstitution, principer, sessionsdok-rutin
2. `~/Repon/miranon-media-admin/CLAUDE.md` — Projektkonstitution, **Status-sektionen är aktuell post-Session 4** (Fas 2 K0 1-3 ✅, K0åd-K0åf eller K2 nästa)
3. `tasks/lessons.md` — UNIVERSAL-lärdomar. Senaste H2-sektion `## 2026-05-11 — Fas 2 K0 startvillkoren` har 14-15 nya poster relevanta för Fas 2-arbetet (specifikt: Kandidat 2 STOPPA-OCH-FRÅGA, Kandidat 5 sessionsdok-disciplin, Kandidat 7 refactor/semantik-separation, Kandidat 11 designnoter-ska-verifieras, Kandidat 12 multipla sanningskällor, Kandidat 15 chat-kontext-disciplin)
4. `tasks/todo.md` — Aktuellt fokus reflekterar Fas 2 K0-status
5. `docs/byggplan.md` — Aktuell fas: §4 Fas 2-prompten
6. **Detta sessionsdok — Del 3 (K0åa-K0åf-progress) + Del 7.2 (lessons-skörd) är värda att skanna; Del 4-8 är TBD-placeholders för K2-K4 och K-sista**
7. `git log -10 --oneline` — senaste 10 commits ger sekvens-överblick. Förvänta: 8400c3d (todo) + b4f42f2 (CLAUDE.md) + 91db29b (hub-lessons) + f1e609e (miranon-lessons) + <K1.5-hash> + 3927a24 (K1.4) + 1138e38 (K0åc.2) + 3015d08 (K0åc.1) + 3b29f41 (K1.3) + fc6f43e (K1.2)

### Vad nästa session ska göra (uppdaterat K1.7, 2026-05-12)

Session 5 startar med **Fas 2 K2** — TanStack Router file-based skelett + provider-mounting i `src/main.tsx` + `audit-ci`-disciplin för GHSA-rmmr-r34h-pfm5-whitelist-period. Alla 6 K0-startåtgärder (åa-åf) klara per Session 4. **K0åg (säkerhetsincident-respons) klar 2026-05-12** (commits `ea59787` + `35cd10e`), kodifierad i ADR-028. Sub-klungor K2 → K3 → K4 → K5 enligt Del 4-7 (konkretiserade i K1.7). Estimat: en session om scope håller; splitta till Session 6 om K4+K5 inte ryms.

**Aktiv whitelist-disciplin:** `audit-ci.json` skapas i K2 med whitelist för GHSA-rmmr-r34h-pfm5. CI:s audit-steg byter från `npm audit --audit-level=high` till `audit-ci`. Veckovis manuell granskning i `tasks/todo.md`. Sessionsstart-not i CLAUDE.md. Hela disciplinen tas bort när TanStack publicerar patched versioner per ADR-028 5-stegs Konvention-flöde.

### Disciplin-noteringar för ny session

- **Sessionsdok-disciplin är reviderad** (se header + Kandidat 5 i Del 7.2): "K1 + K1.N bake-ins + K-sista" är etablerat mönster för denna högvolyms-session. K1.N bake-ins committas efter substantiella K-sub-klungor. Touch-count revideras dynamiskt.
- **STOPPA-OCH-FRÅGA-mönstret** har fångat 3 substantiella problem i K0åa-K0åc (Kandidat 2 + 11 i lessons.md). Bygg in det i Code-prompter vid förväntat-osäkra utfall.
- **Format-bridge** mellan sessionsdok och lessons.md är hybrid: kompakt 1-paragraph i lessons.md med korslänk till expanderat resonemang i sessionsdokets Del 7.2 (se Kandidat 14).
- **Inline-källor i Code-prompter** (UNIVERSAL från P3b 2026-05-05) — referera inte "Del N i sessionsdoket" som källa under körning. Lägg innehåll inline i prompten.
- **Chat-kontext lever inte över sessionsbyte** (Kandidat 15 i Del 7.2 — meta-lärdom från mini-överlämnings-disciplin-brottet i denna session). Allt som ska överleva ska in i en av: sessionsdok-bake-in / lessons.md / ADR.

### Var den auktoritativa Fas 2-trailen finns (efter Session 4)

- **Sessionsdok:** denna fil (`tasks/sessions/2026-05-11-fas2-routing-auth.md`)
- **K0-commits:** `13cdf86` (åa nuqs) + `a5a477b` + `1d02b3b` (åb typecheck:tests) + `3015d08` + `1138e38` (åc CI-split + STAGING_REQUIRED)
- **K1.N bake-ins:** `6af3927` (K1) + `fc6f43e` (K1.2) + `3b29f41` (K1.3) + `3927a24` (K1.4) + `<K1.5-hash>` (K1.5 lessons-skörd 13-15)
- **Lessons-lyft:** `f1e609e` (miranon) + `91db29b` (hub) + `<K1.5-lessons-hash>` (miranon) + `<K1.5-hub-hash>` (hub)
- **Mini-överlämnings-commits:** `b4f42f2` (CLAUDE.md) + `8400c3d` (todo.md) + `<denna handoff-commit>`
- **CI grön-bekräftelse:** [run 25663357991](https://github.com/marcus803/miranon-media-admin/actions/runs/25663357991) (36s, alla 10 steg gröna)

---

## Del 1 — Prolog

### Syfte

Detta dokument är arbetstrailen för Fas 2 — Routing + Auth. Det producerar fyra saker:

1. **K0 preflight** — 6 åtgärder från Pre-Fas-2-verifieringen Del 6.5: 3 startvillkor (kategori 1, måste lösas före första route-fil) + 3 "Direkt efter Fas 2"-fynd (Codex' kategori 2, Fas 2.5-arbete eller före, hanteras i Fas 2 K0 per Marcus' beslut 2026-05-07).
2. **Fas 2 implementation** — `docs/byggplan.md` §4 Fas 2-promptens scope: TanStack Router file-based, `__root.tsx` med AuthProvider + ErrorBoundary + Suspense, skyddade routes via `beforeLoad`-guard mot Supabase-session, Login-vy + Logout-flöde, nuqs URL-state-setup (initial, ej per-vy), devtools för Router + Query (dev-only).
3. **DoD-verifiering** — 8 DoD-punkter från byggplan §4 Fas 2 + Playwright auth-fixture etablerad + `[GA]` Suspense-fallback + `[GA]` Error boundary.
4. **Lessons-skörd** — UNIVERSAL-kandidater från denna session lyfts till `tasks/lessons.md` (+ hub om relevant).

Sessionsdokumentet är auktoritativ trail. De faktiska filerna i repot är "current truth" efter att Code committat dem via prompterna i K2-K5.

### Indata-kontext

Lästa i denna ordning vid sessionsstart (Chat-miljö → projektkunskap; Code-miljö → faktiska filer via `view`/`bash` mot `~/Repon/miranon-media-admin/`):

| # | Källa | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution (transcript-disciplin, sessionsdok-rutin, P-fas-mönster) |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projekt-konstitution + kvalitetsribba + sessionsstart-checklista |
| 3 | `tasks/lessons.md` | UNIVERSAL-lärdomar (baseline för K5-skörd) |
| 4 | `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md` Del 6.5 + Del 8.3 | 6 K0-åtgärder + Fas 2-readiness-signal |
| 5 | `docs/byggplan.md` §3 + §4 Fas 2 | 8 etablerade arkitekturmönster post-Fas A + Fas 2-prompten (8 DoD-punkter) |
| 6 | `docs/specs/SECURITY-SPEC.md` §6 (Fas A-mönster) | `requireUser`, `AuthContext \| Response`, operations-baserat API |
| 7 | `docs/specs/STATE-STRATEGY.md` §1, §3 | server/UI/URL-state-uppdelningen |
| 8 | `docs/specs/URL-STATE-SPEC.md` | nuqs-strategin |
| 9 | `docs/decisions/README.md` + relevanta ADR:er | ADR-katalog (24 ADR:er totalt; särskilt relevanta: ADR-012 byggplan ersätter conversion-plan, ADR-018 strangler-fig, ADR-020 Fas 3.5 egen fas, ADR-023 sessions-arkivering, ADR-025 BYGGPLAN-LÄTTLÄST v3) |
| 10 | `docs/BUILD-LOG.md` Session 2 + Session 3 | Retrospektiv av Fas A + P0-P3b + Pre-Fas-2 |

### Källprioritet vid konflikt

1. Code-RAPPORTERA-output (HEAD-state-data) — auktoritativ för aktuell repo-state
2. `docs/byggplan.md` §4 Fas 2-prompt — styrande för scope och DoD
3. `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md` Del 6.5 — auktoritativ för K0-åtgärdslista (6 åtgärder)
4. `docs/specs/SECURITY-SPEC.md` §6 — bindande för server-sidans auth-mönster (klient måste respektera, inte återimplementera)
5. `docs/decisions/`-ADR:erna — bindande för arkitekturbeslut

### Klunge-struktur

Sex klung-grupper. Sessionsdok rörs i K1 + K-sista — mellan-klungor lämnar det orört (P3a-mönster). Inline-källor i Code-prompter (UNIVERSAL: "Inline-källor i Code-prompter när sessionsdok-disciplin förbjuder löpande uppdatering").

| K | Innehåll | Stop-test per klunga |
|---|---|---|
| **K1** | Sessionsdok-skelett (denna fil — Del 1 Prolog + struktur) + arkivering av pre-Fas-2-doket från `tasks/sessions/`-roten till `tasks/sessions/archive/2026-05/` per ADR-023 konvention | Sessionsdok + arkivering committade i samma commit |
| **K0 (åa-åf)** | Preflight — 6 sub-klungor:<br>**åa:** `npm install nuqs` (startvillkor 1)<br>**åb:** `tsconfig.tests.json` + `npm run typecheck:tests` + CI-koppling + `tests/api/helpers.ts:18` `APIResponse`-import (startvillkor 2)<br>**åc:** CI workflow `test:api`-split i `pure`/`staging` (eller `if: ${{ secrets.TEST_SUPABASE_URL }}`-villkor) mot falsk-grön (startvillkor 3)<br>**åd:** `docs/byggplan.md:249` — engelska→svenska statusvärden ("Direkt efter Fas 2"-fynd 1)<br>**åe:** Aktivera Zod `.parse()` i `AirtableAdapter` reads (fynd 2)<br>**åf:** `docs/specs/KVALITETSDEFINITIONER-11.md` Vue→React (fynd 3) | Alla 6 sub-klungor committade. Verifieringssvit grön efter varje commit: typecheck 0 fel, lint baseline-warnings, build grön, test:api passing+skipped enligt baseline, npm audit 0 vulnerabilities. |
| **K2** | Fas 2 implementation Part 1 — TanStack Router file-based setup: `vite.config.ts` plugin återinförs (togs bort i Fas 0), `tsr.config.json`, `src/routes/__root.tsx` med AuthProvider + ErrorBoundary + Suspense, generated route tree, devtools dev-only | byggplan §4 Fas 2 DoD-rad 1 (delvis) + 5 + 7 + 8 passerade |
| **K3** | Fas 2 implementation Part 2 — `src/auth/AuthProvider.tsx` + `src/auth/useAuth.ts`, `src/routes/login.tsx`, `src/routes/index.tsx` (login-redirect-stub), skyddade routes via `beforeLoad`-guard mot Supabase-session, logout-flöde<br><br>**Arkitektur-not (från P0-inventeringen rad 2.3):** `auth-provider.tsx` får INTE falla tillbaka på anon-key. Klienten ska behandla anon-fallback som unauthenticated (Codex' startvillkor 2 i Fråga 1). Skyddad route utan session → redirect FÖRE datafetch (inte efter 401). | byggplan §4 Fas 2 DoD-rad 1 + 2 + 3 passerade |
| **K4** | Fas 2 implementation Part 3 — nuqs `useQueryState` setup på test-route + Playwright `authenticatedPage`-fixture med TEST_*-credentials<br><br>**Korsreferens:** auth-fixture är 3:e komponenten av Codex' tre startvillkor — CI-split (K0åc) säkrar att fixture-frånvaro hard-failer, fixture-implementationen själv är K4. | byggplan §4 Fas 2 DoD-rad 4 + 6 passerade |
| **K5 (K-sista)** | Stop-test verifiering mot alla 8 DoD-punkter + lessons-skörd lyft till `tasks/lessons.md` (+ ev. hub-synk) + ev. ADR:er + sessionsdok bake-in (Del 3-8) + `tasks/todo.md` uppdaterad + `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` uppdaterad (per ADR-025) + transcript-save | Alla 8 DoD-punkter passerade. lessons.md uppdaterad. Sessionsdok låst (denna commit är touch nr 9 efter K1 + K1.2 + K1.3 + K1.4 + K1.5a + K1.5b + K1.6 + K1.7 — touch-count revideras vid varje K1.N bake-in framåt, se header disciplin-not + Del 7.1 "Sessionsdok låst"-rad för aktuell siffra). BYGGPLAN-LÄTTLÄST-v3.md "Senast uppdaterad"-stämpel bumpad. |

---

## Del 2 — K1: Sessionsdok-skelett + pre-Fas-2-arkivering

✅ **KLAR** 2026-05-11.

**K1.A — Skelett:** Denna fil. Innehållet i Del 1 utgör K1.A:s leverans.

**K1.B — Arkivering av pre-Fas-2:** Per ADR-023 konvention 1 ("Sessionsstart: ny `tasks/sessions/<datum>-<tema>.md` skapas i roten") + 2 ("Sessionsavslut: föregående aktiv flyttas till lämplig `archive/<år>-<månad>/`"). Flytt: `tasks/sessions/2026-05-06-pre-fas2-verifiering.md` → `tasks/sessions/archive/2026-05/2026-05-06-pre-fas2-verifiering.md`. Refs i CLAUDE.md, todo.md och andra dokument som pekar mot pre-Fas-2-doket uppdaterades i samma commit (kategori 2 fix-vs-skip per ADR-022 — mekanisk path-fix, säker).

**K1-leverans-avvikelser (Code 2026-05-11):**
1. **3 filer / 4 string-ändringar** istället för "4 filer" i ursprungsprompten — `git diff --stat` räknar per fil, inte per string-ref (två refs på olika rader i samma fil = 1 fil-ändring).
2. **CLAUDE.md rad 153 fick semantisk uppdatering**, inte mekanisk archive-prefix: raden beskriver "just nu aktiv session" (rollbeskrivning), inte pre-Fas-2-dokets identitet — byttes från pre-Fas-2-doket-ref till `2026-05-11-fas2-routing-auth.md`. Rad 156 bumpad i samma str_replace från "6 sessionsloggar" till "7" för filstruktur-sannhet. Mönster identifierat som UNIVERSAL-lärdomskandidat (se Del 7.2 Kandidat 1).
3. **`tasks/sessions/transcripts/`-mappen saknas i repot** — verifieringspunkten "transcripts/ kvar" från K1-prompten hoppades över eftersom mappen inte finns. Indikerar att transcript-disciplin från CLAUDE.md sessionsstart/sessionsavslut + CONTRIBUTING.md "Transcript-disciplin" inte applicerats genom Session 2/3. Disciplin-drift exponerad av K1, inte skapad av den. Marcus' beslut behövs vid K5 (se Del 7.1).

**K1-commit (`6af3927`):** "docs(fas2): start Fas 2 session document + archive pre-Fas-2 per ADR-023"
**K0åa-commit (`13cdf86`, separat klunga):** "chore(deps): install nuqs for URL-state — Fas 2 K0 startvillkor 1"
**K1.2-commit (denna early bake-in):** "docs(fas2): early bake-in of K1 avvikelser + K0åa commit-hash"
**K-sista-commit (efter session-avslut):** "docs(fas2): bake in Del 3-8 + Fas 2 retrospektiv"

---

## Del 3 — K0 (åa-åf): Preflight — 6 åtgärder

**Status:** TBD — sub-klung-status fylls i löpande, faktiskt innehåll bakas in i K5.

### 3.0 Översikt

Pre-Fas-2-verifieringen Del 6.5 identifierade 6 öppna åtgärder som hanteras som Fas 2 K0:

| Sub-K | Åtgärd | Kategori | Estimat | Commit-hash |
|---|---|---|---|---|
| K0åa | `npm install nuqs` | Startvillkor 1 — måste lösas före första route-fil | ~5 min | `13cdf86` |
| K0åb | `tsconfig.tests.json` + `typecheck:tests`-script + CI-koppling + `helpers.ts:18` `APIResponse`-import + dold-isberg-fix (6× `process` + 1× `URL`) | Startvillkor 2 | ~20 min est, faktisk ~45 min (dold isberg) | `a5a477b` (deps) + `1d02b3b` (fix) |
| K0åc | CI `test:api`-split via naming convention `.staging.test.ts` (Strategi 1.5) + helpers.ts `STAGING_REQUIRED`-villkor + ci.yml env-block för 6 secrets | Startvillkor 3 | ~15 min est, faktisk ~90 min (pre-flight + GitHub-secrets-set + M4-defer-design-pivot) | `3015d08` (refactor) + `1138e38` (semantik) |
| K0åd | `docs/byggplan.md:249` — engelska→svenska statusvärden | "Direkt efter Fas 2"-fynd 1 | ~5 min | `f2a2d9a` |
| K0åe | Aktivera Zod `.parse()` i `AirtableAdapter` reads + ADR-026 | "Direkt efter Fas 2"-fynd 2 | ~30 min, ADR-026 trigger | `8095a62` (kod) + `497a89f` (ADR-026) |
| K0åf | `docs/specs/KVALITETSDEFINITIONER-11.md` Vue→React + ADR-027 | "Direkt efter Fas 2"-fynd 3 | ~30 min, ADR-027 trigger | `a7bdaea` |
| K0åg | Supply chain malware-respons GHSA-rmmr-r34h-pfm5 — pin exakt `@tanstack/react-router` + `@tanstack/router-plugin`, `overrides` `@tanstack/history` → `1.161.6`, regenererad lock-fil, integrity-MATCH pre/post, ADR-028 | Säkerhetsincident (publicerad 2026-05-11 23:39 UTC, upptäckt i K1.7 RAPPORTERA Block B 2026-05-12) | ~60 min inkl. diagnostik + research + verifiering, ADR-028 trigger | `ea59787` (security-fix) + `35cd10e` (ADR-028) |

**Sekvenskrav:** åa → åb → åc strikt (alla tre måste vara klara innan K2 startar). åd → åe → åf valfri ordning eller parallellt; ingen blockerar K2 strikt, men Marcus' beslut 2026-05-07 var att alla 6 hanteras i Fas 2 K0 innan första route-fil. **K0åg är säkerhetsincident-respons utanför ursprunglig sekvensplanering** — blockerade K1.7-progress tills åtgärdad per Kandidat 2 STOPPA-OCH-FRÅGA-mönster, kodifierad i ADR-028.

### 3.1 K0åa — nuqs install (startvillkor 1)
✅ KLAR 2026-05-11. Commit `13cdf86` — "chore(deps): install nuqs for URL-state — Fas 2 K0 startvillkor 1". Full slutsignal (faktisk nuqs-version, bundle-storleksdiff, verifierings-output) bakas in i K5.

### 3.2 K0åb — tsconfig.tests + typecheck:tests + helpers.ts:18-fix (startvillkor 2)

✅ KLAR 2026-05-11. **Två commits** (Code applicerade K0åa-mönstret spontant — UNIVERSAL-kandidat 4 i Del 7.2):

- **K0åb.1 — `a5a477b`** "chore(deps): add @types/node as explicit devDep for tests typecheck" (2 filer: package.json + package-lock.json)
- **K0åb.2 — `1d02b3b`** "chore(tests): aktivera typecheck för tests/ — Fas 2 K0 startvillkor 2" (5 filer: tsconfig.tests.json + tsconfig.json + package.json + tests/api/helpers.ts + .github/workflows/ci.yml)

**Avvikelse — dold-isberg:** Förväntade 1 dolt type-fel (`APIResponse` i helpers.ts:133). `npm run typecheck:tests` avslöjade 8 totalt:
- 1× `APIResponse` (helpers.ts:133, känd och adresserad i prompten)
- 6× `process` (helpers.ts:30-35, `process.env`-användning utan Node-typer)
- 1× `URL` (tests/api/airtable-filter.test.ts:270, Node-runtime-global)

**Grundorsak:** `tsconfig.node.json` (som `tsconfig.tests.json` extends) har `"lib": ["ES2023"]` utan DOM och utan explicit `"types": ["node"]`. För `vite.config.ts`/`playwright.config.ts` löste TS:s automatic type acquisition Node-globaler tyst (alla `@types/*` i `node_modules` plockades in när inget `types`-fält var satt). Men kombinationen module-resolution + filtyper i `tests/` triggade att automatic acquisition inte räckte.

**Lösning (Marcus' val Alt 2 av 3-alternativs-popup från Code):** Installera `@types/node` som explicit devDep + lägg `"types": ["node"]` i tsconfig.tests.json som pekar på det. Motivering: explicit > implicit (Fas A-mönster), Dependabot-synlighet, 11/10-disciplin. Alt 1 (transitiv via @playwright/test peer) avvisades pga risken att Playwright slutar peera @types/node tyst. Alt 3 (lämna 7 fel som dokumenterad skuld) avvisades pga signalförlust.

**Versionsnot:** `@types/node` v25.6.2 installerades som ny devDep — npm valde patch utöver v25.6.0 som var transitivt installerad via Playwright peer-dep. Ingen reell version-flytt, bara explicit-deklarering.

**Verifieringssvit grön (K0åb.2 post-commit):**
- `npm run typecheck`: 0 fel
- `npm run typecheck:tests`: 0 fel (huvudverifiering — alla 8 dolda fel åtgärdade)
- `npm run lint`: 4 warnings (P3b-baseline) — nu 60 filer scannade istället för 59 pga ny tsconfig.tests.json
- `npm run build`: 325.37 kB / gzip 102.56 kB (oförändrad — typecheck-tillägget påverkar inte runtime)
- `npm run test:api`: 72 passed + 41 skipped (P3b-baseline)
- `npm audit`: 0 vulnerabilities

### 3.3 K0åc — CI test:api-split (startvillkor 3)

✅ KLAR 2026-05-11. **Två commits** (Refactor → Semantik-separation per 11/10-disciplin):

- **K0åc.1 — `3015d08`** "refactor(tests): split tests/api/ in pure + staging Playwright projects — Fas 2 K0 startvillkor 3 (1/2)" (9 filer: 1 ny + 5 renames + 3 modifierade)
- **K0åc.2 — `1138e38`** "fix(tests,ci): eliminate false-green via STAGING_REQUIRED + ci env-block — Fas 2 K0 startvillkor 3 (2/2)" (2 filer: helpers.ts + ci.yml)

**Mellan commits:** Marcus satte 6 TEST_*-secrets manuellt i GitHub Settings (Codex' tvivel bekräftades — secrets saknades helt i repo-settings, vanligt mönster när staging-suite skyddats av tyst test.skip()). Värdena kopierades från lokal `.env.test` (filen var dold i Finder pga punkt-prefix — separat Code-diagnos-runda löste det).

**Strategi 1.5 vald** (varken Strategi 1 ren testMatch eller Strategi 2 mapp-separation): naming convention `*.staging.test.ts`. Motivering: helpers.ts stannar i tests/api/ (inga import-omvägar), filnamn är binärt och syns i `git status`, glömske-immun (ny staging-test väljer suffix vid skapande). Strategi 3 (--grep tags) avvisades pga tag-glömska-risk.

**Filändringar K0åc.1 (refactor, ingen beteende-ändring):**
- `tests/api/airtable-filter.test.ts` splittad: LAGER 1 (~242 rader pure) behålls, LAGER 2 (~50 rader e2e fuzz) flyttad till ny `airtable-filter.staging.test.ts`. Ren split — befintlig header-kommentar dokumenterade redan tvålagring som konceptgräns.
- 5 git mv med 100% similarity: `cors.test.ts`, `create-admin-user.test.ts`, `edge-functions.test.ts`, `require-user.test.ts`, `update-record.test.ts` → `*.staging.test.ts`
- `playwright.config.ts`: `api`-projektet splittat i `api-pure` (testIgnore `*.staging.test.ts`) + `api-staging` (testMatch `*.staging.test.ts`, behåller TEST_SUPABASE_URL baseURL)
- `package.json` scripts: `test:api` behålls (kör båda projekt), nya `test:api:pure` + `test:api:staging`

**Filändringar K0åc.2 (semantik, falsk-grön-fix):**
- `tests/api/helpers.ts:getApiConfig()`: reviderad med positiv kontrollflöde via `missing`-array → konkret felmeddelande ("saknas: X av 6: TEST_..."). Om `STAGING_REQUIRED === '1'` → throw Error med actionable text för CI- och dev-fall. Annars (lokal default) → tyst `test.skip(true, skipReason)` för dev-ergonomi.
- `.github/workflows/ci.yml`: splittat "API tests"-stepet i "API tests (pure)" (alltid kör, inga secrets) + "API tests (staging)" (STAGING_REQUIRED='1' + 6 TEST_*-secrets via env-block).

**M4-defer-design-pivot — UNIVERSAL-kandidat 11 i Del 7.2:** Promtens designnot påstod att de 3 intentional skipped i `update-record.staging.test.ts` (`test.skip(true, 'Aktiveras när Fas 5.5 lägger till första operation')`) inte gick via `getApiConfig()`. Code:s STOP-rapport visade tvärtom: rad 41/66/89 anropar `getApiConfig()` FÖRE `test.skip(true, ...)`. Med STAGING_REQUIRED=1 + saknad env throwas alla 41 tester (38 + 3 M4-defer) tillsammans. Code presenterade 3-alternativs interactive popup:
- **Alt 1 (vald):** Behåll designen — Scenario 3 (CI utan secrets + STAGING_REQUIRED=1) är abnormt-tillstånd där hela staging-stepet ska faila. 41 throws funktionellt ekvivalent med 38 throws + 3 skips för signalering. Ingen kod-ändring i update-record.staging.test.ts.
- Alt 2 avvisat: flytta test.skip(true, ...) FÖRE getApiConfig() bryter symmetri inom samma fil (första M4-testet rad 22-38 är inte skipped och anropar getApiConfig först) + introducerar "skip-first"-konvention som måste minnas vid Fas 5.5-aktivering (glömske-fälla 6+ månader fram).
- Alt 3 avvisat: STAGING_REQUIRED-check i getApiConfig för att differentiera bryter Kandidat 6 (self-documenting positiv kontrollflöde) — komplexitet utan värde.

**Lokal verifiering 5/5 testfall grön (K0åc.2-prompten):**
- Lokal utan env, ingen flagga → 41 skipped tyst (dev-ergonomi)
- Lokal STAGING_REQUIRED=1 utan env → throw "saknas: 6 av 6", exit 1 (CI hard-fail-läge bevisad)
- Lokal `.env.test` + STAGING_REQUIRED=1 → 38 passed + 3 skipped (M4-defer)
- Lokal `test:api` default → 72+41 (baseline-invariant från K0åc.1)
- Lokal `test:api:pure` → 72 passed

**CI grön på första försök efter K0åc.2-push** (`run 25663357991`, 36s total runtime):
- API tests (pure): 72 passed (1.4s)
- API tests (staging): 38 passed + 3 skipped (11.5s) — 38 staging-tester körde faktiskt mot staging-Supabase, inte tyst skippats
- Övriga 8 steps gröna (Setup + lint + typecheck + typecheck:tests + build + cleanup)

**Falsk-grön-eliminering bevisad:** om någon framöver glömmer att rotera en secret eller secrets utgår, kommer api-staging-stepet hard-faila med "STAGING_REQUIRED=1 men staging-env är ofullständig. saknas: X av 6" — synligt i CI med konkret actionable text, inte tyst skippat.

**Pre-flight-fynd (separat sub-runda mellan K0åc.1 och K0åc.2):**
- Codex' analys 2026-05-07 sa "41 deployade deny-path-tester skippas". Faktisk verifiering 2026-05-11: 38 körbara + 3 intentional M4-defer = 41 totalt. Drift på 3 tester (~7%) som inte var fel i Codex' analys utan reflektion av att projektet är levande. Fångat som UNIVERSAL-kandidat 10 i Del 7.2.
- GitHub Settings → Secrets and variables → Actions saknade alla 6 TEST_*-secrets före K0åc.2-push. Marcus satte dem manuellt från lokal `.env.test` (filen dold i Finder pga punkt-prefix). Aldrig-läcka-disciplin: värdena ekade aldrig i terminal-output eller commit-history.

### 3.4 K0åd — byggplan.md:249 svenska statusvärden

✅ **KLAR** 2026-05-11. Commit `f2a2d9a` — "docs(byggplan): rätta engelska→svenska statusvärden på :249 (K0åd 'Direkt efter Fas 2'-fynd 1)".

**Formuleringsval:** Variant B (ren källhänvisning, inga värden i DoD). Tre varianter övervägdes — Variant A (verbatim svenska hårdkodade), Variant B (källhänvisning till `data-model.md:121-130` + strategi-pekare till `Code-verification-of-codex-analysis.md` Tillägg Fråga 1), Variant C (hybrid). Marcus' beslut: Variant B per tre argument — (1) K9-respekt: displaynamn lever på en plats, drift-säkert om Lotta lägger till sjunde Anmälningar.Status-värde post-A-track; (2) Strategi-pekare till Tillägg Fråga 1 fungerar som explicit guard mot att framtida AI introducerar target-enum:n (`draft`/`pending`/`confirmed`/...) för tidigt vid Fas 2.5; (3) Binär verifierbar DoD ("är `RegistrationStatus` i Status.ts identisk med `data-model.md:121-130`?") utan att verifieraren behöver öppna två filer + jämföra listor.

**Faktisk str_replace:** En enda ändring på rad 249. Block 4-grep verifierade att :557 (`get-waitlist` Edge Function-filnamn) var den enda andra träffen — klassad som filnamn för EF, inte driftfel. Övriga grep-träffar i Fas 2.5-sektionen var korrekta (`byggplan.md:224` "Status.ts skrivs om: 4 → 6 statusvärden för Anmälningar (mot data-model.md 2026-04-26)" — pekar redan på rätt källa, rörs inte).

**Bekräftelse av hand-på-snabbminne-blandingen i ursprungsraden:** `attended`/`no-show` finns INTE som `RegistrationStatus`-värden — deras semantiska motsvarighet (Närvarande/Frånvarande) ligger i `AttendanceStatus` för Deltaganden-tabellen (helt annan tabell, helt annan enum, helt annan livscykel). Den som skrev :249 blandade två konceptuellt åtskilda Airtable-tabeller (Anmälningar vs Deltaganden) under en gemensam engelsk-token-räcka.

**Verifieringssvit (7/7 grön):** git diff 1 fil 1+/1-, grep visuell-verifiering, grep "RegistrationStatus matchande" 1 träff på :249, grep engelska tokens endast :557 kvar, typecheck 0 fel, biome 4 baseline-warnings oförändrade, build 623ms 405 modules.

### 3.5 K0åe — Zod parse i AirtableAdapter (delat i K0åe.1 kod + K0åe.2 ADR)

✅ **KLAR** 2026-05-11. Två commits per Kandidat 7 (refactor/semantik-separation):

**K0åe.1 commit `8095a62`** — "feat(data): aktivera Zod .parse() runtime-validering i AirtableAdapter (K0åe.1)". 3 aktiva fetch-metoder (Events, Registrations, Persons) aktiverade med `z.array(Schema).parse()`-mönster. 8 stub-metoder fick `@todo`-JSDoc med ADR-026-referens. Block 2-RAPPORTERA avslöjade att sessionsdokets ursprungliga Del 3.5-not "rad :30, :41, :53" var de aktiva metoderna men filen har 14 metoder totalt (3 aktiva + 8 stubs + 3 void-metoder). Scope-val: Alt A (3 aktiva + 8 stub-todos) över Alt B (alla 11) — `.parse()` på död kod är död kod med extra steg; aktiveras per stub vid EF-deploy i Fas 2.5/Fas 6.

**K0åe.2 commit `497a89f`** — "docs(decisions): add ADR-026 Runtime-validering vid datagräns med Zod .parse() (K0åe.2)". ADR-026 89 rader, dokumenterar 6 designval (.parse() vs .safeParse(), callsite-pattern, signatur orörd, helper-tröskel ≥5 calls, stub-strategi, rå ZodError uppströms). README.md Index-tabellen uppdaterad (4-kolumns-format anpassat från prompt-utkastets 5-kolumns per Block 2-fynd).

**6 designval låsta (refererade i ADR-026):**

1. `.parse()` (throw), inte `.safeParse()` — TanStack Query catchar throw automatiskt, bevarar `Promise<T[]>` return-types, konsistent med Fas A throw-mönster, ADR-005 förautoriserade exakt detta i Konsekvenser-sektionen 2026-04-14
2. Callsite-pattern `<{ X: unknown }>` + inline `z.array(Schema).parse()` — funktionssignatur `callEdgeFunction<T>` rörs inte (defense-in-depth via signature-default `<T = unknown>` avvisat — för bred scope, ADR-026-callsite-pattern är striktare)
3. Inline-mönster, inte generisk helper — KISS för 3 calls (helper-tröskel ≥5 i ADR-026)
4. Rå ZodError uppströms — AppError-mappning defereras till Fas 3 UI-konsumtion när receiving-end finns
5. Stub-strategi via JSDoc `@todo Apply Zod .parse() when get-X Edge Function deploys. See ADR-026.` — synligt i editor-hover, kräver disciplin men markeras explicit
6. SupabaseAdapter (Fas E) följer samma mönster — låst i ADR-026 Konvention-sektion

**Bundle-storlek:** ±0 byte. Zod redan importerad sedan Fas 1 (för AssertEqual-test-typer i `domain/__tests__/schemas.assignable.ts`); K0åe.1 återanvände samma runtime. Identisk vite-bundle-hash bekräftade.

**Verifieringssvit (K0åe.1 7/8 grön, K0åe.2 6/6 grön):** Block 8-tilläggsverifiering (grep `@todo Apply Zod .parse()` = exakt 8 i AirtableAdapter.ts) passerade. Biome auto-fix flyttade schemas-import mellan models och Filters (Biome:s organizeImports preferrerar non-type imports separerat från type-imports inom samma path-grupp). Safe fix, ingen funktionell påverkan.

### 3.6 K0åf — KVALITETSDEFINITIONER-11.md Vue→React-stack-skifte

✅ **KLAR** 2026-05-11. Commit `a7bdaea` — "docs(specs): arkivera Vue-eran KVALITETSDEFINITIONER-11 + skapa React-skelett + ADR-027 (K0åf)".

**Strategi-val:** Alt B (legacy-arkivering + ny React-version) över Alt A (komplett omskrivning in-place). Tre argument: (1) Strukturell Vue-rot, inte ytlig — filen innehåller composables-tabeller, scoped slots (Vue-only-koncept utan 1:1-mappning till React), `<MmDialog>`-Vue-template-exempel, pushFocus/popFocus från FKUI. ~80% omskrivning hade producerat 90%-delete/90%-insert-diff, oläsbar git-historik, risk för glömda träffar; (2) Etablerat arkivmönster per ADR-012/021/025 (conversion-plan, BYGGPLAN-LÄTTLÄST v1→v2→v3); (3) Vue-arkivet har långsiktigt referensvärde när Fas 3+ React-komponenter byggs — 12 mönster från 5 bibliotek är konkret översättningsmaterial.

**Single-commit-strategi:** ADR-027 + git mv Vue→archive + ARKIVERAD-header + ny React-skelett + path-ref-uppdateringar i 4 aktiva styrande dokument — allt i en commit. Innehållsfyllning av React-versionen defereras till Fas 3 K0 (Sektion 1+2 Teknisk kvalitet/Återanvändbarhet), Fas 3.5 (Sektion 3 Checklista per ADR-020), Fas 6 (Sektion 4+5 Källor/Vad-INTE-tas-med när stack-bibliotek-val är låsta). Skelett + TBD-noteringar är "preliminärt — låses vid aktualisering"-mönster från P3a.

**ADR-027 dokumenterar 5 beslut + Konvention-sektion för framtida stack-skiften:** klassificera spec som "principer + checklista" (omskrivning in-place per ADR-021-mönster på ACCESSIBILITY-CHECKLIST) eller "arkitektur-mönster" (arkivera + ny version, denna ADR). Konvention för arkivnamn (`<original>-<gammal-stack>-<skapelsedatum>.md`), placering (samma katalog + stack-suffix `-REACT`), innehållsfyllnings-trigger (defer till nästa relevanta fas vid stack-konkretion-saknad).

**RAPPORTERA Block 2-bugg + STOPPA-OCH-FRÅGA-fångst:** Block 2-grepen `grep -v "docs/specs/KVALITETSDEFINITIONER-11.md"` filtrerade bort BÅDE filen själv (avsedd) OCH markdown-länkmål `[text](docs/specs/X.md)` i andra dokument (oavsiktligt). Resultatet missade 2 aktiva refs i CLAUDE.md:260 + CONTRIBUTING.md:60. VERIFIERA-stegets Check 8 (oberoende formulerad grep) fångade missan. Code stoppade, rapporterade, Marcus' beslut: Alt 1 (uppdatera båda i samma K0åf-commit) över Alt 2 (separat följdcommit) — splitt skapar oklara borderline-fall, bryter ADR-027 Beslut §4. Lärdom lyfts som Kandidat 16 (se Del 7.2).

**Verifieringssvit (9/9 grön efter Check 8-korrigering):** 7 ref-träffar uppdaterade i 4 aktiva dokument (CLAUDE.md ×2, CONTRIBUTING.md ×1, docs/byggplan.md ×3, ACCESSIBILITY-CHECKLIST.md ×1). 22 träffar bevarade i frysta zoner per ADR-022 kategori 2 (sessions-arkiv, extern analys, frysta levereranser, ADR-008 oföränderlig, BUILD-LOG retrospektiv, byggplan-direktiv SLUTFÖRT, aktivt sessionsdok). Build 325.37 kB JS oförändrat — ren docs-omflyttning utan kod-impact.

### 3.7 K0åg — Supply chain malware-respons (GHSA-rmmr-r34h-pfm5)

✅ **KLAR** 2026-05-12. Två commits per ADR-027-mönster (refactor/semantik-separation per Kandidat 7):

**K0åg arbets-commit `ea59787`** — "security(fas2): remediate GHSA-rmmr-r34h-pfm5 supply chain malware in @tanstack/* (K0åg)". Paket-impact: `@tanstack/react-router` `^1.168.19` → `1.168.19` (pin, prefix borttaget), `@tanstack/router-plugin` `^1.167.20` → `1.167.20` (pin), nytt `overrides`-block `"@tanstack/history": "1.161.6"` (transitiv tvång). Lock-fil regenererad helt (`rm -rf node_modules package-lock.json && npm install`). Backup `package-lock.json.pre-k0åg` lokalt untracked för integrity-diff-verifiering.

**K0åg ADR-commit `35cd10e`** — "docs(decisions): add ADR-028 Supply chain incident-respons-protokoll (K0åg)". ADR-028 (`docs/decisions/ADR-028-supply-chain-incident-respons.md`) kodifierar 5 process-regler + 5-stegs Konvention-flöde för framtida supply chain-incidenter.

**Upptäcktssekvens (Kandidat 2 STOPPA-OCH-FRÅGA-mönster i praktik):**

Session 5 K1.7 RAPPORTERA Block B (verifieringssvit-baseline-check) körde `npm audit` mot post-K1.6-state ~9 timmar efter advisory-publicering (2026-05-11 23:39 UTC). Audit-output rapporterade 6 critical vulnerabilities under GHSA-rmmr-r34h-pfm5. Code STOPPADE per Block B-disciplin (vulnerabilities >0), eskalerade till Marcus, K1.7 pausades och K0åg öppnades som ny sub-klunga.

**Diagnostik-syntes från K0åg Block D (RAPPORTERA-fas, 2026-05-12):**

| Bedömningsdimension | Resultat | Källa |
|---|---|---|
| Postinstall-script i `@tanstack/history@1.161.6` | FINNS INTE (endast clean/test:*/build-scripts) | Block A2 |
| Senaste lokala `npm install` före advisory | 2026-05-11 12:02 UTC (Session 4 K0åa) | Block A5 |
| Tidsfönster mellan lokal install och malware-publicering | 7h 18min före (advisory 19:20 UTC) | Block A5 + B2 |
| Misstänkta runtime-mönster i `node_modules/@tanstack/history/` | INGA (inga child_process/exec/spawn/eval/base64-decode/fetch) | Block A4 |
| Senaste CI-run före advisory | 2026-05-11 12:01 UTC (`bc9d6aa` K1.6) | Block C3 |
| CI-runs i kompromettfönstret (19:20 UTC →) | 0 | Block C3 |
| → Marcus' maskin-bedömning | SANNOLIKT SÄKER | A2 + A4 + A5 + B2 evidens |
| → CI-miljö-bedömning | SANNOLIKT SÄKER | C3 7h+ marginal |

**Patched-status (Block B research mot live npm-registret + GitHub advisory API):**

- `@tanstack/history`: vår 1.161.6, malware 1.161.9 + 1.161.12 (publicerade 2026-05-11 19:20-19:26 UTC), **patched: ingen**
- `@tanstack/react-router`: vår 1.168.19, malware 1.169.5 + 1.169.8, **patched: ingen**
- `@tanstack/router-plugin`: vår 1.167.20, malware 1.167.38 + 1.167.41, **patched: ingen**
- `nuqs@2.8.9`: egen status opåverkad (transitiv flag via peerDep)
- npm-registret `dist-tags.latest: 1.161.6` — registret har återställt latest-pekare till pre-malware (stark signal att 1.161.6 anses säker)

**Strategi-val: Strategi 2 — Pin exakt + overrides** (Marcus' beslut 2026-05-12). Tre alternativ övervägdes: Strategi 1 (uppgradera till patched — ej möjligt), Strategi 3 (downgrade per `npm audit fix --force` till `@tanstack/router-plugin@1.111.6`, 56 versioner bak — sannolik breaking changes), Strategi 4 (status quo + vänta — risk-bärande utan att lösa). Strategi 2 vald per: (a) inga breaking changes, (b) skydd mot framtida drift om Dependabot eller `npm install` försöker plocka malware-version inom semver-range, (c) reversibelt när patched publiceras.

**Marcus' fyra K0åg-beslut (per STOPPA-OCH-FRÅGA-checkpoint, 2026-05-12):**

1. **Strategi:** 2 (pin exakt + overrides) — med tilläggsverifikation: integrity-MATCH pre/post-install via lokal backup `package-lock.json.pre-k0åg`
2. **Secret-rotation:** DEFENSIV DEFER. Block A-evidens stark (ingen kompromettmarkör). VITE_*-vars är klient-bundle-konfig (inte hemliga i traditionell mening). Service role keys + GitHub PAT bor utanför `.env.local` — roteras vid annat tillfälle om säkerhetsmarginal önskas
3. **CI-secrets:** INGEN ÅTGÄRD — Block C bekräftade 7h+ marginal mellan senaste CI-run och malware-publicering
4. **ADR-028:** SKAPA — kodifiera 5 process-regler för framtida incidenter (separat commit efter security-fix-commit)

**Artefakt-kontinuitet-verifikation (Marcus' tilläggsdisciplin per ADR-028 regel 3):**

Pre/post-install diff av integrity-hashes mot `package-lock.json.pre-k0åg`-backup bekräftade: alla 6 kritiska paket (`@tanstack/history`, `react-router`, `router-core`, `router-generator`, `router-plugin`, `nuqs`) har **identiska versioner + integrity-hashes** pre/post. Bara 1 override (för `@tanstack/history`) räckte — npm-resolveringen träffade samma transitiva versioner via lock-genereringen. **Bevis att installerade artefakter är pre-malware-builds**, inte malware-runtime. Lock-fil-storleksminskning (370 → 258 paket-entries) är dedup-effekt från `overrides`-disciplinen, inte tappade dependencies (build + typecheck + tests gröna).

**Verifieringssvit-utfall post-K0åg (CI grön båda commits):**

- `npm audit`: 6 critical kvarstår (förväntat — advisory `vulnerable_versions: >=0` täcker alla versioner; faktiska bytes är pre-malware via integrity-MATCH). **Etablerat känd-tillstånd, hanteras via `audit-ci`-whitelist i K2 per öppen post 3.7.1 nedan.**
- `npx tsc --noEmit`: 0 fel
- `biome check`: 4 baseline-warnings + 1 info (oförändrat)
- `npm run build`: 327.28 kB JS / 103.13 kB gzip (+1.91 kB vs pre-K0åg baseline 325.37 från transitive minor/patch-bumps via lock-regen)
- `npm run test:api` lokalt: 72 passed + 41 skipped (baseline, STAGING_REQUIRED ej satt); CI med STAGING_REQUIRED=1: 72 pure passed + 38 staging passed + 3 M4-defer skipped
- CI: båda commits gröna alla 13 steg (`ea59787` run 25719311115, `35cd10e` post-run grön per `gh run list --workflow=CI`)

**Lessons-kandidater för K5-skörd (Kandidat 17-19, fullständig formulering bakas in i K5 efter Session 5-implementation):**

- **Kandidat 17 (potentiell):** Live security-state ska verifieras vid sessionsstart, inte antas vara samma som senaste session. Mönster-förstärkning av Kandidat 10 (verkligheten på pushtid > analys vid skrivtid) — generaliserat till säkerhetsdimensionen. K1.7 Block B-disciplin FÅNGADE advisoryn ~9h efter publicering; utan den hade K2:s `npm install`-steg dragit in malware-versioner inom `^1.168.19`-range.
- **Kandidat 18 (potentiell):** Advisory `vulnerable_versions: >=0` är false-positive-trigger för installerade pre-malware-versioner. `npm audit` rapporterar critical även när artefakterna är säkra. Verifiering via integrity-MATCH pre/post är vad som faktiskt bevisar säker artefakt. **Audit-output är signal, inte sanning.** Hanteras kirurgiskt via `audit-ci`-whitelist i K2 — full-stop-CI istället för bruskällan.
- **Kandidat 19 (potentiell):** Pin exakt + `overrides` är reversibel respons. När patched versioner publiceras: ta bort overrides, ta tillbaka `^`-prefix, vanlig uppgradering. Pin är inte permanent — det är "väntar på patched".

**Öppen post 3.7.1 — `npm audit`-disciplin under whitelist-period (kodifieras i K2 + CLAUDE.md + todo.md per 11/10-mål):**

`npm audit --audit-level=high` rapporterar 6 critical under GHSA-rmmr-r34h-pfm5 i förväntat-känt-tillstånd tills TanStack publicerar patched versioner. Detta ska INTE accepteras som permanent röd CI — det förstör signal-systemets värde (Kandidat 10 "verkligheten på pushtid > analys vid skrivtid" tappar mening om CI alltid är röd). K2 löser disciplinen kirurgiskt via `audit-ci`-paketet med specifik whitelist mot GHSA-rmmr-r34h-pfm5. Plus återkommande veckovis manuell granskning i `tasks/todo.md`. Plus sessionsstart-disciplin-not i CLAUDE.md. Se Del 4 K2 nedan.

**Promt-räknings-mismatch-fynd från K1.7 RAPPORTERA (för K5 lessons-skörd):**

K1.7-prompten hade två räknings-antaganden som inte stämde mot faktisk repo-state: (a) Block D förväntade "3 touch-counter-mentions" men faktiskt 4 (rader 13, 24, 122, 365 — alla konsistent på "8"); (b) Block B förväntade "6 GHSA-grep-träffar" men npm audit JSON grupperar 6 vulns under 1 advisory-URL = 1 grep-träff. Båda är prompt-räknings-fel (Chat gissade utan att kolla), inte tillstånd-fel. **Inte STOPPA-triggers** — Kandidat 12-fångst skulle krävt drift mellan källor, men alla 4 mentions var konsistenta. Hanterades genom att uppdatera 4 ställen atomiskt istället för 3, och förstå JSON-strukturen istället för anta. Mönster-förstärkning av Kandidat 6 (verifieringsräkning ska räkna alla refs) + Kandidat 11 (designnoter ska vara verifierade) + Kandidat 10 (verkligheten > analys).

---

## Del 4 — K2: Fas 2 implementation Part 1 — TanStack Router skelett + audit-ci-disciplin

TBD — bakas in i K-sista.

### 4.0 Översikt

K2 etablerar TanStack Router file-based-skelettet utan auth-logik + införar `audit-ci`-baserad audit-disciplin för whitelist-perioden mot GHSA-rmmr-r34h-pfm5. Provider-mounting + Router-instantiering sker i `src/main.tsx`. Layout-route `__root.tsx` äger Suspense + ErrorBoundary + Devtools. Pathless layout-route `_authenticated.tsx` äger guard-skelett (full implementation i K3). Inga skyddade routes aktiverade funktionellt i K2 — det är K3-scope.

**Arkitektur-tier (verifierat 2026-05-12 mot post-K0åg paket-state per Kandidat 11):**

- `src/main.tsx` — modul-scope `queryClient` (med config från STATE-STRATEGY.md §3), `router`-instans (`createRouter({ routeTree, context: { queryClient, auth: undefined! } })`), providers wrappar `<RouterProvider>`: `<QueryClientProvider> > <AuthProvider> (skelett i K2) > <App> > <RouterProvider>`. `initSentry()` FÖRE `createRoot` per P0-inventering rad 2.2 (verifierat i K1.7 Block G).
- `src/routes/__root.tsx` — `createRootRouteWithContext<{ queryClient: QueryClient; auth: AuthContextValue }>()`. RootLayout: Suspense fallback (inline-spinner, JSDoc-not `// Tillfällig — ersätts av Mm-Spinner från Fas 3`) + ErrorBoundary fallback (inline `<div role="alert">` med "Ladda om"-knapp, samma JSDoc-not) + `<Outlet />` + Router Devtools + Query Devtools (alla dev-only via `import.meta.env.DEV`).
- `src/routes/_authenticated.tsx` — pathless layout-route. Skelett: `createFileRoute('/_authenticated')({ beforeLoad: () => { /* TODO K3: full guard mot context.auth */ } })`. Pathless `_`-prefix → ingen URL-effekt; barn-routes blir `/hem`, inte `/_authenticated/hem`.
- `src/routes/_authenticated/hem.tsx` — placeholder `<h1>Hem</h1>` (minimum för byggplan §4 DoD-rad 1).
- `audit-ci.json` (repo-rot) — whitelist-config för GHSA-rmmr-r34h-pfm5 med kommentar + ADR-028-referens + expiry-policy.

### 4.1 Förväntad output

**Nya filer:**

- `tsr.config.json` — TanStack Router-config. Format verifieras mot senaste TanStack Router-docs i K2-RAPPORTERA per Kandidat 10. Förmodade fält: `routesDirectory: "./src/routes"`, `generatedRouteTree: "./src/routeTree.gen.ts"`, `routeFileIgnorePrefix: "-"`.
- `src/routes/__root.tsx` — innehåll per 4.0 Arkitektur-tier.
- `src/routes/_authenticated.tsx` — skelett per 4.0.
- `src/routes/_authenticated/hem.tsx` — minimal placeholder per 4.0.
- `src/routeTree.gen.ts` — auto-genererad av TanStack Router-pluginen vid första `npm run dev`. **Måste vara .gitignore-ad** (är det per Fas 0-config — verifieras i K2 Block-F).
- `audit-ci.json` — whitelist-config:

```json
{
  "$schema-comment": "audit-ci v7+ config for kirurgisk audit-disciplin",
  "high": true,
  "allowlist": ["GHSA-rmmr-r34h-pfm5"],
  "allowlist-comment": "GHSA-rmmr-r34h-pfm5 — TanStack supply chain incident 2026-05-11. Vår installerade @tanstack/history@1.161.6 är pre-malware (integrity-MATCH verifierat i K0åg). Whitelist-post tas bort när TanStack publicerar patched versioner. Se ADR-028. Granskas veckovis per tasks/todo.md."
}
```

**Ändrade filer:**

- `vite.config.ts` — aktivera `TanStackRouterVite({ target: 'react', autoCodeSplitting: true })`-pluginen. Pluginen läggs FÖRE `react()` per TanStack-rekommendation. För-Fas-0-kommentar rad 6-9 (verifierat i K1.7 Block F) ger import-mall.
- `src/main.tsx` — uppdatera till providers + `<RouterProvider>`-pattern. K2 levererar AuthProvider som tom Context-provider med `value={undefined}` — full Supabase-session-logik i K3. Detta möjliggör att TypeScript-typerna är på plats, devtools renderar, och `__root.tsx` kan instantieras utan att blocka på auth-implementationen. `initSentry()`-anropet på rad 14 bevaras orört FÖRE createRoot.
- `.github/workflows/ci.yml` — byt audit-steg från `npm audit --audit-level=high` till `npx audit-ci --config audit-ci.json`. Kommentar i workflow-fil pekar till ADR-028 + audit-ci.json.
- `~/Repon/miranon-media-admin/CLAUDE.md` — lägg till not i sessionsstart-checklistan:

```markdown
**Sessionsstart audit-disciplin (K0åg → ADR-028):**
- Kontrollera att `npx audit-ci --config audit-ci.json` är grön (whitelist GHSA-rmmr-r34h-pfm5 ska vara enda undantaget).
- Om `npm audit` rapporterar critical UTANFÖR whitelisten → STOPPA-OCH-FRÅGA per Kandidat 2.
- Om GHSA-rmmr-r34h-pfm5 visar färre än 6 träffar → eventuellt TanStack-team har publicerat patched versioner. Granska, uppgradera, ta bort whitelist + overrides + pin-discipline. Se ADR-028 5-stegs Konvention-flöde.
```

- `~/Repon/miranon-media-admin/tasks/todo.md` — lägg till återkommande post under "Aktuellt fokus":

```markdown
**Återkommande disciplin: Veckovis npm-audit-granskning (K0åg whitelist-period)**

audit-ci whitelist mot GHSA-rmmr-r34h-pfm5 är aktiv tills TanStack publicerar patched versioner.

- Senast granskad: 2026-05-12 (K0åg)
- Nästa granskning senast: 2026-05-19
- Granskningssteg: (1) `npm view @tanstack/react-router@latest` — kolla om patched version finns, (2) `npm view @tanstack/history@latest` analogt, (3) GitHub advisory-status (withdrawn? patched_versions uppdaterad?), (4) om patched finns → starta K0åh/Fas-2.5-sub-klunga för uppgradering + whitelist-rensning per ADR-028 5-stegs Konvention-flöde
- Tas bort från denna lista när whitelist är borttagen från audit-ci.json
```

**Nya devDependencies (npm install i K2 via `npm install -D`):**

- `@tanstack/react-router-devtools` — separat paket sedan 1.114+. Krav för byggplan §4 DoD-rad 5. **STOPPA om version som tas är inom malware-range** (jämför mot K0åg whitelist — react-router-devtools är inte i listan, men paketet kan ha egen advisory som inte fångats). Pin exakt om så.
- `audit-ci` — för kirurgisk audit-disciplin. K0åg ADR-028 regel 4 ("npm audit vid sessionsstart") + öppen post 3.7.1.

**Nya dependencies (`npm install`):**

- `react-error-boundary` — för root-nivå ErrorBoundary. Krav för byggplan §4 DoD-rad 8.

### 4.2 DoD-rader från byggplan §4 Fas 2 som K2 stänger

- **1 (delvis):** `npm run dev` ger fungerande app utan crash (full login-redirect i K3). Visar `<h1>Hem</h1>`-placeholder på `/hem` (utan funktionell guard).
- **5:** Router Devtools synliga i dev, inte i prod (`import.meta.env.DEV`-gating).
- **7:** `[GA]` Suspense-fallback på root visar laddningsindikator.
- **8:** `[GA]` Error boundary på root fångar router-fel + visar fallback med "ladda om"-knapp.

### 4.3 STOPPA-OCH-FRÅGA-punkter för K2-prompten (Kandidat 2-mönster)

1. Efter `npm install @tanstack/react-router-devtools react-error-boundary audit-ci` — STOPPA om någon paket-version dras in som är inom malware-range (jämför mot K0åg whitelist) eller peer-dep-warnings introduceras.
2. Efter första `npm run dev` post-plugin-aktivering — STOPPA om `routeTree.gen.ts` inte genereras eller har TS-fel.
3. Efter `npx tsc --noEmit` — STOPPA om typecheck visar >0 fel (route-typer från generated `routeTree.gen.ts` kan exponera latent type-frågor).
4. Efter `npm run build` — STOPPA om JS-bundle bumpar med mer än ~30 kB (förväntad bumpa för TanStack Router-runtime + react-error-boundary; överskott indikerar tree-shaking-failure eller devtools i prod).
5. Efter byte av `ci.yml` audit-steg → `audit-ci`-anrop — STOPPA om CI-run rapporterar fler träffar än 6 under GHSA-rmmr-r34h-pfm5 (whitelist gav inte förväntad effekt) eller om audit-ci rapporterar någon advisory utanför whitelist.

### 4.4 Sub-klung-mönster (om scope växer per Kandidat 5)

Om K2 visar sig vara större än en clean klunge, splitta till K2.1 (deps + audit-ci-config + plugin + tsr.config), K2.2 (file-skelett + main.tsx), K2.3 (CLAUDE.md + todo.md disciplin-uppdateringar + ci.yml audit-byte). K1.N bake-ins av sessionsdoket mellan sub-klungor per etablerat mönster.

---

## Del 5 — K3: Fas 2 implementation Part 2 — AuthProvider + login/logout + skyddade routes

TBD — bakas in i K-sista.

### 5.0 Översikt

K3 implementerar full Supabase-auth-flöde + aktiverar `_authenticated.tsx`-guard. Innehåller den enskilt mest kritiska arkitekturpunkten i hela Fas 2: **AuthProvider får INTE falla tillbaka på anon-key**. Server-sidans `requireUser` (Fas A M2) nekar anon-key, men UI-flow ska aldrig komma dit — guarden redirectar FÖRE datafetch.

### 5.1 Förväntad output

**Nya filer:**

- `src/auth/AuthProvider.tsx` — Context-provider med `{ user: User | null, isLoading: boolean, login: (email, password) => Promise<void>, logout: () => Promise<void> }`. Lyssnar på `supabase.auth.onAuthStateChange` med cleanup i `useEffect`. **Faller INTE tillbaka på anon-key** (anti-mönster mot `src/data/config/supabase-client.ts:16`-fallbacken; K3 säkrar att UI-flow inte triggar fallbacken — själva supabase-client.ts:s anon-fallback rörs först i Fas 2.5+).
- `src/auth/useAuth.ts` — `useContext`-wrapper. Throws om använd utanför Provider.
- `src/routes/login.tsx` — publik route (INGEN `_authenticated`-parent). Minimal `<form>` med `<label>` + `<input type="email">` + `<input type="password">` + `<button type="submit">`. A11y full 11 (label-input-koppling, `aria-describedby` för fel-state, `aria-live="polite"` för status, fokus-management). JSDoc-not: `// Refactor till React Aria Form + MmInput + MmButton i Fas 3`.
- `src/routes/index.tsx` — `createFileRoute('/')({ beforeLoad: ({ context }) => { redirect till '/hem' om context.auth.user, annars '/login' } })`. Pure-redirect-route, ingen `component`.

**Ändrade filer:**

- `src/routes/_authenticated.tsx` — full `beforeLoad`-guard:
```typescript
beforeLoad: ({ context, location }) => {
  if (context.auth.isLoading) return;  // vänta tills auth-state är känd
  if (!context.auth.user) {
    throw redirect({ to: '/login', search: { redirect: location.href } });
  }
}
```
- `src/main.tsx` — AuthProvider-skelettet från K2 ersätts med full implementation-import (samma struktur, byter bara från placeholder till `src/auth/AuthProvider`).

### 5.2 Anti-mönster som K3 explicit förbjuder

**Förbjudet 1:** Röra `src/data/config/supabase-client.ts:16` anon-fallback. K3 säkrar att UI-flow aldrig anropar `getAuthHeader()` utan session via guard-redirect FÖRE datafetch. Fallbacken själv åtgärdas i Fas 2.5+.

**Förbjudet 2:** "Optimistisk auth" — anta session finns och rendera vy-skin medan auth laddar. Inkonsekvent UX. Guarden blockerar render via `beforeLoad` Promise-await.

**Förbjudet 3:** Logout som bara rensar lokal Context utan `supabase.auth.signOut()`. Server-sidan måste invalidera session.

### 5.3 DoD-rader från byggplan §4 Fas 2 som K3 stänger

- **1 (full):** `npm run dev` → `/login`-formulär → inloggning → redirect till `/hem`.
- **2:** Logout → `supabase.auth.signOut()` + Context-rensning + redirect till `/login`.
- **3:** Direkt-navigering till `/hem` utan session → `beforeLoad` throws `redirect({ to: '/login' })` → renderar inte `/hem`-komponenten.

### 5.4 STOPPA-OCH-FRÅGA-punkter

1. Efter AuthProvider — STOPPA om `onAuthStateChange` har subscription-cleanup-issues (memory leak-risk).
2. Efter `beforeLoad`-aktivering — STOPPA om redirect-loop (kan hända om login-routen oavsiktligt blir auth-skyddad).
3. Efter logout-flöde — STOPPA om `supabase.auth.getSession()` post-logout inte returnerar `{ session: null }`.

---

## Del 6 — K4: Fas 2 implementation Part 3 — nuqs + Playwright auth-fixture

TBD — bakas in i K-sista.

### 6.0 Översikt

K4 stänger sista 2 DoD-raderna: nuqs URL-state-setup (initial, inte per-vy — det är Fas 6) och Playwright `authenticatedPage`-fixture. Auth-fixture är 3:e komponenten av Codex' tre startvillkor (`docs/analysis/Codex-project-analysis-2026-05-07.md` Fråga 1 startvillkor 3) — CI-split via STAGING_REQUIRED från K0åc säkrar att fixture-frånvaro hard-failer; fixture-implementationen själv är K4.

### 6.1 Förväntad output

**Nya filer:**

- `src/routes/_authenticated/test-nuqs.tsx` — temporär dev-route gated på `import.meta.env.DEV`. Använder `useQueryState('test', parseAsString.withDefault(''))`. JSDoc-not: `// Tas bort i Fas 6 när första riktiga nuqs-vy aktiveras`. Mönster-val (gated route vs render-guard) bekräftas i K4-RAPPORTERA mot TanStack file-based router-docs per Kandidat 10.
- `tests/playwright/fixtures/authenticated-page.ts` — Playwright-fixture med `TEST_USER_EMAIL` + `TEST_USER_PASSWORD`. **Hard-fail om TEST_*-env saknas** (kompletterar K0åc CI-split).
- `tests/playwright/auth.staging.test.ts` — minimal smoke-test: `authenticatedPage` → `/hem` → assert `<h1>Hem</h1>` synligt. `.staging.test.ts`-suffix per K0åc-konvention.

**Ändrade filer:** Inga obligatoriska (verifieras i K4-RAPPORTERA om Playwright redan har annan mapp-konvention från Fas 0 visual-regression-uppsättning).

### 6.2 DoD-rader

- **4:** `useQueryState` mot dev-route → URL skriver `?test=value`.
- **6:** Playwright `authenticatedPage`-fixture körbar mot staging.

### 6.3 STOPPA-OCH-FRÅGA

1. Efter nuqs-setup — STOPPA om `useQueryState` triggar fler re-renders än förväntat.
2. Efter fixture — STOPPA om login-flöde inte avslutas inom rimlig tid (AuthProvider loading-state-regression från K3).
3. Efter `npm run test:api` mot fixture — STOPPA om staging-test failar med auth-fel (TEST_USER ej seedat).

---

## Del 7 — K5: Stop-test + lessons-skörd + ADR + bake-in + transcript-save

TBD — bakas in i denna sista commit (K-sista).

### 7.0 Översikt

Sessionens slut-disciplin: verifiera alla 8 DoD från byggplan §4 Fas 2, skörda UNIVERSAL-lessons från Session 5, ev. ADR:er, baka in Del 3-7 i sessionsdoket, uppdatera todo.md + BYGGPLAN-LÄTTLÄST-v3 + CLAUDE.md-filstruktur. **Transcript-disciplin etableras som absolut SISTA steg** (defer-post från K1.6 — se 7.7).

### 7.1 Stop-test

Pass/fail per krav:

| Krav | Status | Verifiering |
|---|---|---|
| K0 6 åtgärder committade | TBD | `git log K1..K5 --oneline` visar 6 K0-commits |
| Fas 2 DoD 1-8 passerade | TBD | Manuell verifiering mot byggplan §4 Fas 2 + automatiserad test-svit |
| Playwright `authenticatedPage`-fixture grön mot test:e2e | TBD | `npm run test:e2e` (eller motsvarande) passerar |
| ADR:er committade (om relevanta) | TBD | `docs/decisions/` har eventuella ADR-026/-027 |
| Lessons-skörd lyft till lessons.md | TBD | `tasks/lessons.md` har Fas 2-sektion |
| Hub-synk klar (om UNIVERSAL-poster) | TBD | `~/Repon/marcus-system/tasks/lessons.md` synkad |
| `tasks/todo.md` uppdaterad | TBD | Fas 2 markerad ✅, Fas 2.5 listad som nästa |
| `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` uppdaterad (ADR-025) | TBD | "Senast uppdaterad"-stämpel bumpad + Fas 2-status reflekterad |
| Sessionsdok låst | TBD | Sessionsdoket är post-K1.7 på touch nr 9 efter K1 (skelett) + K1.2 (K1+K0åa bake-in) + K1.3 (K0åb bake-in) + K1.4 (K0åc bake-in + startvillkor-fas 1-3 milstolpe) + K1.5a (Sessions-handoff-sektion) + K1.5b (Kandidat 13-15-bake-in + mini-överlämnings-stängning) + K1.6 (K0-fasens K-sista Session 4) + K1.7 (K0åg-spårning + Del 4-7 skelett-utfyllnad inför Session 5 K2-K5, sista touch före K5-implementation). Disciplin reviderad i header — K1.N bake-ins är etablerat mönster för Fas 2-sessionen, inte enstaka avsteg. |
| Transcript sparat | **DEFER** — Marcus' beslut 2026-05-11 K1.6: transcript-disciplin etableras i separat process-runda Session 5+. Mappen `tasks/sessions/transcripts/` saknas fortfarande. Todo-pinpoint lagt i `tasks/todo.md`. Motivering: K1.6 är redan substantiellt (sessionsdok-bake-in + lessons-lyft + todo + CLAUDE.md + ev. ADR), att etablera ny disciplin samtidigt ökar halvslar-risk per Kandidat 5 (disciplin tjänar dokumentet). | Defer-not committad + todo-pinpoint i tasks/todo.md |

### 7.2 Lessons-skörd

TBD — fångas under sessionen. Kandidater fylls i löpande:

**Kandidat 1 — Semantisk path-ref vs mekanisk prefix-fix vid sessionsdok-arkivering [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K1-leveransen 2026-05-11, Code's självständiga byte av CLAUDE.md rad 153 + komplementär bumpa av rad 156

När en ref till en sessionsdok ska flyttas till `archive/` vid sessionsstart/-avslut, klassificera refen först: beskriver den dokets *identitet* ("se 2026-05-06-pre-fas2-verifiering.md") eller dokets *roll* ("just nu aktiv session", "senaste leveransen", "session N av M")? Identitets-refs ska få mekanisk archive-prefix per ADR-022 kategori 2. Roll-refs ska få semantisk uppdatering till nya rollens innehavare (det nya sessionsdoket som nu fyller rollen) — rollen har flyttat, inte dokets identitet. Klassrelaterade följdändringar (t.ex. "N sessionsloggar" → "N+1" för filstruktur-sannhet) görs i samma str_replace för konsistens.

**Mönstret:** vid arkivering, gå igenom alla ref-träffar och klassificera var och en innan str_replace körs. Frågan: "om jag tar bort denna ref och läser meningen runt, beskriver den ett dokument eller en roll?"

**Anti-mönster att undvika:** mekanisk path-prefix på roll-refs producerar nonsens-meningar (t.ex. "just nu aktiv session: archive/2026-05/pre-Fas-2..." — logiskt motsägelsefullt eftersom archive-prefix signalerar "inte aktiv").

**Generaliserbar:** gäller alla "aktiv X"-pekare som någonsin arkiveras (sessionsdok, ADR-status, fas-status, dokumentversioner). Föreslås UNIVERSAL-lyft + cross-repo-synk till `marcus-system/tasks/lessons.md` vid K5.

**Kandidat 2 — STOPPA-OCH-FRÅGA-mönster i Code-prompter fungerar [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åb-prompten 2026-05-11

Code-prompter som inkluderar explicit STOPPA-checkpoints vid förväntat-osäkra utfall (typ "STANNA om typecheck:tests visar fler än X fel") fångar dolda isberg som annars hade fortsatt orörda. K0åb-prompten innehöll: "STOPPA OCH FRÅGA om npm run typecheck:tests visar fler än 0 fel — vi vill verifiera att helpers.ts:18-fixen var den enda dolda type-buggen, inte bara den vi visste om." Code stannade exakt rätt vid 8 fel istället för att försöka maskera dem. **Generaliserbar regel:** när en åtgärd avslöjar tidigare osynliga delar av kodbasen (typecheck över ny path, lint över ny mapp, test över ny domän), bygg in STOPPA-OCH-FRÅGA i prompten innan IMPLEMENTERA-blocket. Förväntat: scope växer med 5-10× när luckor öppnas.

**Kandidat 3 — Implicit transitiv dep → explicit när direkt-användning kommer [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åb @types/node-beslut 2026-05-11

När `tests/` eller `src/` börjar referera typer/paket som funnits transitivt (via peer-deps eller indirect dependencies), lyft till explicit devDep/dep. Logisk ägandelogik: om koden använder det direkt, äger paketet sin position i package.json. Risk för implicit transitiv: (a) Dependabot ser inte uppdateringar, (b) version-fluktuation om peer-providern uppgraderas, (c) tyst-bryt om peer-providern slutar peera. **Generaliserbar regel:** vid varje "varför fungerar det här?" om en typ/funktion som inte är explicit deklarerad — lyft till explicit deklaration. Konsistens med Fas A "operations-baserat API explicit istället för fritt tableId"-mönster: explicit > implicit i alla riktningar.

**Kandidat 4 — Code applicerar tidigare commit-mönster automatiskt utan explicit instruktion när scope matchar [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åb två-commit-separation 2026-05-11

K0åb-prompten skrev inte explicit "dela i två commits". När Marcus svarade Alt 2 (install @types/node) applicerade Code spontant K0åa-mönstret (deps-install separerat från fix-commit) och producerade två commits (`a5a477b` + `1d02b3b`) utan att fråga. Resultatet var korrekt och följde best practice. **Generaliserbar regel:** Code internaliserar kommit-mönster över sessioner — om K_N använder ett mönster, K_(N+1) med liknande scope tenderar att följa det utan explicit prompt. Implikation för prompt-design: när ett tidigare mönster fungerade, behöver det inte upprepas i varje prompt; Code känner igen det. Men: om man vill avvika från etablerat mönster, MÅSTE det vara explicit i prompten. Tystnad = mönster-igenkänning.

**Kandidat 5 — Sessionsdok-disciplin revideras när avvikelse-volym kräver det [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K1.2 + K1.3 early bake-ins 2026-05-11

Ursprunglig sessionsdok-disciplin (P3a-mönster): "K1 + K-sista". I Fas 2 K1 + K0åa + K0åb genererade tillsammans 4 commit-hashar + 8 dolda type-fel + 5 lärdomskandidater + 3 K1-leverans-avvikelser. För mycket information för K-sista att baka in från Chat-kontext utan tappad detalj. Praktiskt mönster blev: **K1 (skelett) + K1.N bake-ins efter substantiella K0-sub-klungor + K-sista (full retrospektiv)**. Disciplin reviderad i sessionsdok-headern 2026-05-11 (K1.3). **Generaliserbar regel:** sessionsdok-disciplin är inte universell — den beror på faktisk avvikelse-volym per K. Lågvolyms-sessioner (få commits, få avvikelser) följer "K1 + K-sista". Högvolyms-sessioner (många commits, många avvikelser) behöver "K1 + K1.N bake-ins + K-sista". Beslutskriterium: när Chat-kontextens minne av exakt detaljer börjar tunnas, är det dags för bake-in. Disciplin tjänar dokumentet, inte tvärtom.

**Kandidat 6 — Verifieringsräkning i str_replace-prompter ska räkna alla refs i ny string [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K1.2-verifiering 2026-05-11

K1.2-prompten specificerade `grep -c "Kandidat 1" → 1 träff` som verifieringscheck. Faktisk träffmängd: 2 (rubriken i Del 7.2 + korslänk från Del 2). Båda specificerade i str_replace själv — räkningsmisstaget var Chat:s, inte Code's. **Generaliserbar regel:** när en str_replace-patch lägger till en identifierare på flera ställen (rubrik + korslänkar + commit-message-mention etc.), räkna alla förekomster i den nya texten innan verifieringsgreparna formuleras. Annars triggar Code "STOPPA OCH FRÅGA" på falsk positiv, vilket bryter flödet. **Mönstret:** efter att ha skrivit `new_str` för en str_replace, kör mental `grep -c "<token>"` på den nya texten + alla andra ändringar i patchen innan exakta siffror sätts i verifieringsblocket. Bättre: använd "minst X träffar" istället för "exakt X" när osäkerhet finns — Code STOPPAR bara på färre träffar, inte fler.

**Kandidat 7 — Refactor → Semantik-separation som 11/10-disciplin för flerstegs-ändringar [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åc.1 + K0åc.2 split 2026-05-11

När en ändring kan ses som BÅDE "samma utfall, ny struktur" (refactor) OCH "ny utfall, ny eller samma struktur" (semantik-ändring), splitta i två commits. K0åc-fallet: K0åc.1 splittade tester i pure/staging-projekt utan beteende-ändring (`npm run test:api` gav 72+41 både före och efter). K0åc.2 ändrade semantiken (STAGING_REQUIRED → hard-fail istället för tyst skip). Granskbarhet vinner stort: K0åc.1-diff är "ren struktur", K0åc.2-diff är "ren beteende". I en monolitisk commit hade granskaren behövt resonera om båda samtidigt. **Generaliserbar regel:** vid varje multi-fil-ändring, fråga: "kan jag splitta detta i en commit som bevarar utfall (refactor) + en commit som ändrar utfall (semantik)?" Om ja → gör det. 10/10-praxis är monolit; 11/10 är separation.

**Kandidat 8 — Beteende-invariant som hård test-check i refactor-commits [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åc.1 verifiering 2026-05-11

K0åc.1-prompten specificerade `npm run test:api` 72 passed + 41 skipped som hård invariant + STOPPA-OCH-FRÅGA på avvikelse. Code stannade om aggregatet brutits. Refactorn bevisad ren-strukturell, inte hypotetiskt. **Generaliserbar regel:** refactor-commits ska ha minst en hård test-invariant + explicit STOPPA-checkpoint. Annars är "refactor" bara påstående, inte bevis. Test-invarianten är vad som skiljer "jag tror jag inte ändrade beteendet" från "jag har bevisat att beteendet är oförändrat". Generaliserar bortom test-suite till alla mätbara invariants (build-storlek, lint-warnings, dep-count, etc. — välj den som matchar refactorns scope).

**Kandidat 9 — Förebyggande extern-resurs-verifiering mellan refactor och semantik [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: GitHub-secrets-set mellan K0åc.1 och K0åc.2 2026-05-11

K0åc.2 krävde extern resurs (GitHub repo-secrets) för att fungera i CI. Att lyfta "verifiera secrets manuellt" som steg MELLAN K0åc.1 och K0åc.2 sparade en falsk-röd CI-körning. Reaktiv approach hade varit "kör K0åc.2, se vad som händer, fixa secrets om CI failar". Förebyggande approach är 11/10-disciplin. **Generaliserbar regel:** när semantik-commit kräver extern resurs (secrets, env, deployerad endpoint, externa API-keys, DNS-records, etc.), bygg in verifierings-steg FÖRE push i prompt-flödet. Pre-flight-prompt är billig (~5 min); falsk-röd CI är dyr (förvirring, debugging-runda, extra commits).

**Kandidat 10 — Pre-flight verifiering avslöjar dokumentations-drift [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åc pre-flight-rapport 2026-05-11

Codex' analys 2026-05-07 dokumenterade "41 deployade deny-path-tester skippas lokalt". Verkligheten 4 dagar senare (vid K0åc pre-flight 2026-05-11): 38 körbara + 3 intentional M4-defer = 41 totalt. Drift på ~7% där 3 tester ändrade natur (M4-defer-tillägg). Codex hade rätt på sammanräkningen, fel på fördelningen. **Inte fel i Codex' analys** — reflektion av att projektet är levande. Detta är fjärde gången jag stöter på "siffran är subtilare än rapporten påstod" (K0åb 1→8 fel, K1 ref-räkningen 4 vs 3+4, K1.2 grep-count 1→2, K0åc 41→38+3). **Generaliserbar regel:** när en analys är 1+ vecka gammal och implementations-design hänger på dess siffror, kör samma verifierings-kommando lokalt FÖRE du litar på dem. Speciellt viktigt för räkningar (X tester, Y filer, Z fel) som lätt driver. Mönstret är universellt: "verkligheten på pushtid > analys vid skrivtid". Pre-flight som disciplin, inte som extra-steg.

**Kandidat 11 — Designnoter i prompter ska vara verifierade, inte påstådda [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åc.2 M4-defer-design-pivot 2026-05-11

K0åc.2-promtens designnot påstod att de 3 intentional skipped i `update-record.staging.test.ts` "inte går via getApiConfig() och triggas inte av STAGING_REQUIRED". Påstående baserat på antagande från pre-flight-rapporten "alla 6 testfiler importerar getApiConfig" som jag tolkade som "import = användning per default men inte i defer-tester". Code:s strikta RAPPORTERA visade tvärtom: rad 41/66/89 anropar getApiConfig() FÖRE test.skip(true, ...). Code's interactive popup tvingade designval. **Påstående klätt som faktum men byggt på antagande är 9/10-praxis.** Generaliserbar regel: designnoter i prompter ska antingen (a) hänvisa till verifierad data från RAPPORTERA-block ("per Block 1 rad 17"), eller (b) markeras explicit som "förmodad — Code verifierar i RAPPORTERA". Påståenden utan källa eller modaliterad osäkerhet är fällor. Code:s STOPPA-OCH-FRÅGA fångade detta — bekräftar Kandidat 2-mönstret (STOPPA-OCH-FRÅGA fungerar) ännu en gång. **Mönsterförstärkning:** över K0åa-K0åc har STOPPA-OCH-FRÅGA fångat 3 substantiella problem (K0åb 1→8 fel, K0åc.2 M4-defer-design, K0åc.2 GitHub-secrets-saknad). Detta är inte slump — det är systematisk osäkerhets-fångst. STOPPA-OCH-FRÅGA är basinstrument, inte luxus.

**Kandidat 12 — Multipla sanningskällor inom samma sessionsdok driver [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K1.4 pre-flight-fynd (Code Block 4 sidofynd) 2026-05-11

K1.4-pre-flight avslöjade att touch-count för K-sista var dokumenterat på tre ställen i sessionsdoket: (a) header disciplin-not, (b) Del 1 klunge-strukturtabellens K5-cell (rad 67), (c) Del 7.1 "Sessionsdok låst"-rad. K1.2 + K1.3 uppdaterade (a) och (c) men missade (b). Vid K1.4-pre-flight stod rad 67 fortfarande på "touch nr 2" medan (a) och (c) sa "4". K1.4 fixar rad 67 retroaktivt + uppdaterar alla tre i samma str_replace-pass framåt. **Generaliserbar regel:** när samma faktum dokumenteras på flera ställen i ett dokument, finns två giltiga vägar: (1) en sanningskälla + korslänkar, eller (2) uppdatera alla ställen i en enda atomisk str_replace-pass. Mixed approach (vissa ställen uppdateras, andra glöms) ger drift inom samma fil — låg-disciplin signal och förvirrande för granskare. Sessionsdoket har tre touch-count-mentions; identifiera och uppdatera alla i varje K1.N bake-in framåt. Mer generellt: vid varje sessionsdok-bake-in, gör en `grep`-pass på det faktum som ändras för att hitta alla mentions innan str_replace-uppsättningen skrivs.

**Kandidat 13 — Drift-fix-grep ska exkludera meta-dokumentation om driften själv [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K1.4-verifierings-anomali 2026-05-11

K1.4-promtens verifieringssvit innehöll `grep -c "touch nr 2" → 0 träffar` som check på att Del 1 K5-cellens drift var raderad (rad 67 ändrad från "touch nr 2" till "touch nr 5"). Code rapporterade 1 träff istället för 0. Träffen var inom Kandidat 12-texten själv (Del 7.2) som *citerar* drift-fyndet historiskt: "rad 67 stod fortfarande på 'touch nr 2' medan (a) och (c) sa '4'". Meta-dokumentation om en bug, inte buggen själv. **Generaliserbar regel:** när en text-fix grep:as för att verifiera frånvaro, måste lessons-poster, ADR:er och historiska referenser till samma sträng exkluderas från räkningen — annars rapporteras falsk positiv. Två tekniska lösningar: (a) `grep "X" | grep -v "<meta-kontext>"` för att exkludera meta-träffar, eller (b) använd "minst N träffar inom meta-kontext, 0 träffar utanför" per Kandidat 6:s "minst X"-mönster. Mönster-förstärkning av Kandidat 6 (verifieringsräkning ska räkna alla refs i ny string) — i K1.4 räknade jag inte korslänken från Kandidat 12 → drift-fyndet. **Praktisk variant:** verifieringsanomali från Steg 4 (Sessions-handoff) — `grep -c "STOPPA-OCH-FRÅGA-mönstret"` (med exakt suffix "-et") gav 1 träff istället för förväntad ≥2 eftersom andra träffar saknade suffix. Samma mönster: för exakt-formulerad grep, för smal träffmängd. Lösning: bredare grep utan suffix, eller "minst X med ev. ändelse-variation".

**Kandidat 14 — Sessionsdok-format vs lessons.md-format ska klargöras innan första lyft i en ny session [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: Steg 1 lessons-lyft format-popup 2026-05-11

Sessionsdoket har expanderat 3-5 paragraf-format per kandidat (Mönstret / Anti-mönster / Generaliserbar). Lessons.md har kompakt 1-paragraph "Symptom: ... Generaliserbar regel: ... Källa: ..."-konvention etablerad över 14 tidigare poster. Steg 1-prompten skrev "lyft verbatim, behåll allt: generaliserbar regel, mönster, anti-mönster, källa-not" — vilket implicit antog format-likhet. Code:s STOPPA-OCH-FRÅGA fångade konflikten med 3-alternativs interactive popup. Marcus valde Hybrid (Alt 3): kompakt post i lessons.md med explicit korslänk till sessionsdokets Del 7.2 för expanderat resonemang. **Generaliserbar regel:** vid första lyft till en katalog (lessons, ADR, BUILD-LOG, decisions/README) i en ny session, börja med en explicit "format-bridge"-anmärkning i prompten: "Källformat i sessionsdoket är X, mål-format i lessons.md är Y, här är bridge-mallen." Annars antas verbatim-lyft. **Mönster-förstärkning av Kandidat 11 (designnoter ska vara verifierade, inte påstådda):** jag antog format-likhet istället för att verifiera mot lessons.md-mallen i RAPPORTERA-blocket. Skulle ha lagt en explicit "Block X — Verifiera lessons.md-format-konvention"-instruktion i RAPPORTERA-fasen.

**Kandidat 15 — Chat-kontext lever inte över sessionsbyte; "fångas i Chat-kontexten" är ALDRIG giltig fångst-strategi [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: Mini-överlämnings-disciplin-brott 2026-05-11

Chat sade "jag fångar det här i Chat-kontexten" om Kandidat 13 + 14 mitt under mini-överlämningsförberedelse. Mini-överlämningen finns EXAKT för att Chat-kontext inte överlever sessionsbyte — så att säga "fångas i Chat" mitt under är logisk självmotsägelse. Marcus fångade brottet ("Du har nu två lärdomskanditater till, alltså 13 och 14, som du säger att du sparar i Chat-kontexten som du måste förstå att du INTE kan göra, vi ska ju starta NY session nu, det är ju därför vi gör detta!!!"). **Generaliserbar regel:** "fångas i Chat-kontexten" är aldrig en giltig fångst-strategi för information som ska överleva sessionsbyte. Det är endast giltigt för "håll i huvudet de närmaste 2-3 turerna i samma session". För allt annat finns tre giltiga vägar: (a) sessionsdok-bake-in (för work-in-progress), (b) lessons.md-lyft (för UNIVERSAL-mönster), (c) ADR-skapande (för arkitekturbeslut). Mönster-förstärkning av Kandidat 5 (sessionsdok-disciplin revideras när avvikelse-volym kräver det): högvolyms-sessioner kräver bake-ins, inte minne. **Meta-meta-observation:** Chat sade "fångas i Chat" minst 3 gånger under mini-överlämningen efter att Kandidat 5 redan var bake-baked i sessionsdoket. Det indikerar att Chat kan deklarera en disciplin utan att internalisera den. Värt att fånga som disciplinens-disciplin: "Att ha skrivit en regel innebär inte att den följs i samma session" — kräver aktiv vakthållning av Marcus eller framtida Chat-kontext.

**Kandidat 16 — Grep -v exklusion av filnamn fångar både filen själv OCH markdown-länkmål i andra dokument [UNIVERSAL]**
> Datum: 2026-05-11 | Källa: K0åf Block 2-RAPPORTERA missade 2 aktiva refs (CLAUDE.md:260 + CONTRIBUTING.md:60), fångade av VERIFIERA Check 8

K0åf Block 2 körde `grep -rn "KVALITETSDEFINITIONER-11" --include="*.md" --include="*.ts" --include="*.tsx" | grep -v "node_modules\|docs/archive\|docs/specs/KVALITETSDEFINITIONER-11.md"` för att lista aktiva refs som behövde uppdateras inför stack-skifte-arkiveringen. Resultatet missade 2 aktiva refs eftersom `grep -v "docs/specs/KVALITETSDEFINITIONER-11.md"` filtrerade bort BÅDE filen själv (avsedd) OCH markdown-länkmål `[text](docs/specs/KVALITETSDEFINITIONER-11.md)` i andra dokument (oavsiktligt). VERIFIERA-stegets Check 8 (oberoende formulerad grep utan samma substring-filter) fångade missan.

**Mönstret:** vid grep-exklusion av filpath, använd path-prefix-disciplin (`grep -v "^docs/specs/X.md:"` — leading `^` + trailing `:` matchar bara `grep -n`-output där fil-path följs av radnummer) istället för naken substring-match.

**Anti-mönster att undvika:** `grep -v "docs/specs/X.md"` matchar både fil-output OCH alla länkmål, refs, dokumentations-pekare som råkar innehålla samma substring. Producerar falska negatives som är osynliga utan oberoende verifiering.

**Generaliserbar:** gäller alla grep-exklusioner av filpaths i markdown-tunga repos. Mönster-förstärkning: Code:s VERIFIERA-checks ska ALDRIG återanvända samma grep-filter som RAPPORTERA-stegets — annars är de bara samma kontroll i nytt format. Check 8 lyckades fånga missan exakt eftersom den var oberoende formulerad (sökte path-prefix för historiska zoner via `docs/archive\|tasks/sessions/archive`, inte negativ-substring av aktiv path). UNIVERSAL-värdig för hub-lyft eftersom alla cross-repo-disciplin-arbete med path-refs kan stöta på det.

### 7.3 ADR-kandidater

**Obligatoriska per byggplan §4 Fas 2 ADR-krav-rad:** Inget nytt krävs (URL-state följer URL-STATE-SPEC.md).

**Realiserade ADR:er under K0-fasen (sub-klungor med ADR-trigger):**
- ✅ ADR-026 (K0åe.2 commit `497a89f`) — Runtime-validering vid datagräns med Zod `.parse()`
- ✅ ADR-027 (K0åf commit `a7bdaea`) — KVALITETSDEFINITIONER-11.md stack-skifte (Vue → React)
- ✅ ADR-028 (K0åg commit `35cd10e`) — Supply chain incident-respons-protokoll (npm advisories)

**Möjliga sidoeffekt-ADR:er för Session 5 K2-K4 (skapas bara om implementation kodifierar arkitekturbeslut bortom byggplan):**
- ADR-029 om `_authenticated.tsx`-layout-route + `context.auth`-pattern blir mer än trivial
- ADR-030 om `react-error-boundary`-val kodifieras som princip
- ADR-031 om annat oförutsett

Beslut tas in-situ per sub-klunga.

### 7.4 Sessionsdok bake-in

Bakas in i K-sista-commit:

- Del 3.7 verifierings-utfall (CI-run-id post-K0åg, integrity-MATCH-detaljer, audit-ci-disciplin etablering)
- Del 4 (K2) skelett → verklig progress + faktiska commit-hashes
- Del 5 (K3) skelett → verklig progress
- Del 6 (K4) skelett → verklig progress
- Del 7.2-7.4 (lessons + ADR + bake-in själv) bakas in
- Del 8 (Sammanfattning) bakas in

Per Kandidat 12: touch-counter uppdateras atomiskt på alla **4** ställen (header disciplin-not + Sessions-handoff-blocket + Del 1 K-tabellens K5-cell + Del 7.1 "Sessionsdok låst"-rad) i samma str_replace-pass — verifierat 2026-05-12 att 4 mentions, inte 3, är faktisk räkning per K1.7 RAPPORTERA Block D.

### 7.5 Övriga dokument-uppdateringar

- `tasks/todo.md` — Fas 2 status → KLAR, Fas 2.5 → AKTUELLT FOKUS, audit-ci-whitelist-veckogransknings-post uppdaterad med "senast granskad: <K5-datum>"
- `~/Repon/miranon-media-admin/CLAUDE.md` — Status-sektion + Filstruktur (`src/auth/`, `src/routes/`, `audit-ci.json`) + sessionsstart audit-disciplin-not (K0åg → ADR-028)
- `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` — "Senast uppdaterad" + Fas 2 → KLAR (ADR-025)
- `docs/decisions/README.md` Index-tabellen — om någon ADR-029+ tillkommer
- `docs/BUILD-LOG.md` — Session 5-sektion med Fas 2-retrospektiv + K0åg-spårning + audit-ci-disciplin-etablering

### 7.6 Sessionsdok-arkivering (DEFER till Fas 2.5-sessionsstart)

Sessionsdoket `2026-05-11-fas2-routing-auth.md` arkiveras INTE i K5 — arkiveras vid Fas 2.5-sessionsstart (nästa session) per ADR-023 konvention 2 ("Sessionsavslut: föregående aktiv flyttas till lämplig `archive/<år>-<månad>/`"). Sessionsdoket täcker hela Fas 2 över Session 4 + Session 5; arkiveringspunkten är Fas 2-avslut, inte Session 5-avslut.

### 7.7 Transcript-disciplin etablering (ABSOLUT SISTA STEG)

Defer-post från K1.6. Per CONTRIBUTING.md "Transcript-disciplin": transcripts sparas till `tasks/sessions/transcripts/<datum>.txt` som originalkopia.

**K5-flöde:**

1. ALLA andra commits klara och pushade (sessionsdok, todo, CLAUDE.md, BYGGPLAN-LÄTTLÄST-v3, BUILD-LOG, ev. ADR:er, lessons-lyft repo + hub)
2. Marcus exporterar Session 5-transcripten från claude.ai (Marcus väljer metod: Settings → Privacy → JSON / kopiering / print-to-PDF)
3. `mkdir -p ~/Repon/miranon-media-admin/tasks/sessions/transcripts && mv <export> ~/Repon/miranon-media-admin/tasks/sessions/transcripts/2026-MM-DD-fas2-session5.txt`
4. `git add tasks/sessions/transcripts/2026-MM-DD-fas2-session5.txt && git commit -m "docs(fas2): save Session 5 transcript per CONTRIBUTING.md transcript-disciplin" && git push`
5. Detta är sessionens sista commit. Inget annat efter.

**Session 4-transcript:** förlorad — acceptabel disciplin-etablerings-kostnad för att inte fortsätta drift. Dokumenteras i CLAUDE.md Filstruktur som "transcripts/ etablerad <K5-datum> från Session 5 framåt".

---

## Del 8 — Sammanfattning för framtida läsare

TBD — bakas in i K5.

### 8.1 Vad denna session levererade

TBD.

### 8.2 Vad denna session inte gjorde

TBD. Förväntade defer-poster:
- Fas 2.5-arbete (`Status.ts`-omskrivning 4→6 värden, övriga adapter-debt-metoder, full Zod-aktivering om K0åe blev partiell)
- Hem-vy + Event-vy (Fas 6a-e)
- Tab bar / app-shell (Fas 5)
- Optimistic mutations (Fas 5.5)

### 8.3 Vad nästa session ska göra

**Fas 2.5 — Schema-kontrakt-sync.** Mot `docs/byggplan.md` §4 Fas 2.5-prompt. Scope: `Status.ts` 4→6 statusvärden mot `data-model.md`, övriga enums granskade, Zod runtime-validering i AirtableAdapter-läsmetoderna (om K0åe blev partiell), adapter-debt-klassning av 9 metoder per ADR (P1 A5-tabellen). Inget EF deployas i förskott (M4-principen).

### 8.4 Var den auktoritativa Fas 2-trailen finns

- **Denna fil:** `~/Repon/miranon-media-admin/tasks/sessions/2026-05-11-fas2-routing-auth.md` (efter K5: arkiveras till `archive/2026-05/` när Fas 2.5 startar per ADR-023)
- **K1-commit (sessionsdok + pre-Fas-2-arkivering):** TBD
- **K0åa-K0åf commits:** TBD (6 commits)
- **K2-K4 commits:** TBD (uppskattningsvis 5-8 commits beroende på splitt)
- **K5 sista commit (bake-in):** TBD
- **Lessons-poster lyfta:** TBD
- **ADR:er (om relevanta):** TBD
- **Total ADR-räkning efter Fas 2:** TBD (idag 24, kan bli 24-26)

### 8.5 Slutprodukten

TBD. Förväntad sluttillstånd:
- `npm run dev` ger fungerande login → /hem (placeholder)
- Logout fungerar
- Skyddade routes redirectar utan session
- nuqs `useQueryState` fungerar
- Router/Query devtools dev-only
- Suspense + Error boundary på root
- Playwright `authenticatedPage`-fixture grön
- 6 K0-åtgärder committade (3 startvillkor + 3 "direkt efter Fas 2"-fynd)
- Verifieringssvit grön: typecheck 0 fel, lint baseline-warnings, build grön (JS-storlek bumpad av nuqs + TanStack Router-runtime), test:api passing+skipped enligt baseline, npm audit 0 vulnerabilities, test:e2e grön mot authenticatedPage

### 8.6 Eventuella nya lärdomskandidater för framtida UNIVERSAL-lyft

TBD.

---

## Appendix A — K1 Code-prompt-mall (refereras från Chat-leverans 2026-05-11)

K1.B Code-prompten levereras inline i Chat efter denna fil placerats i Marcus' Downloads. Strukturen följer P3a/Pre-Fas-2-mönstret:

1. LÄS — `~/Repon/miranon-media-admin/CLAUDE.md`, `tasks/sessions/` (verifiera platthet), `docs/decisions/ADR-023-sessions-arkivering.md` (konvention)
2. RAPPORTERA — working tree status, befintlig `tasks/sessions/`-innehåll, bekräfta att `2026-05-06-pre-fas2-verifiering.md` finns i roten och inte redan i archive
3. PLANERA — `mv pre-Fas-2-doket` till `archive/2026-05/`, `mv` ny sessionsdok från Downloads till `tasks/sessions/`-roten, uppdatera ev. path-refs i andra dokument (CLAUDE.md, todo.md) som pekar mot pre-Fas-2-doket
4. IMPLEMENTERA — 2 `mv` + ev. `str_replace` för path-refs
5. VERIFIERA — `git diff --stat` visar exakt 2-4 filer (2 mv:s + ev. 1-2 ref-updates), inga oönskade ändringar
6. COMMITTA — message: "docs(fas2): start Fas 2 session document + archive pre-Fas-2 per ADR-023" + push
7. DOKUMENTERA — säg till Marcus: "K1 klart. Sessionsdok i tasks/sessions/-roten, pre-Fas-2 arkiverad. Redo för K0åa nuqs-install."
