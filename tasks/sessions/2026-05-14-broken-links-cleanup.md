# Session 6.5 — Broken-links-batch-städning

> Defer-paket från Session 6 K1.D per K7-disciplin (refactor/semantik-separation: CI-arkitektur ≠ content-korrekturläsning).
>
> **Källa:** ADR-029 § Baseline-fynd 2026-05-14 (~71 broken links, kategori A + B).
> **Status:** Aktiv (skapad 2026-05-14).
> **Estimat:** ~30-60 min Code-arbete.
> **Parent-session:** Session 6 (CI-optimering), arkiverad post-Session 7-start per ADR-023.

---

## Sessions-handoff (för kall sessionsstart)

### Var vi är

Session 6 ✅ KLAR 2026-05-14. Strategi E etablerad per ADR-029. Lychee-grindvakt aktiv med 0 errors mot reducerad scope (Commit 4c run 25848500304: 455 total / 381 successful / 74 excluded / **0 errors**). 6 DEFERRED-FIX-MARKER-regex-rader i `.lycheeignore` (rad 35, 38, 41, 44, 47, 52) maskerar ~71 broken links som ska elimineras i denna mini-session.

### Stop-test för Session 6.5 ✅ KLAR

Per K1.13 (DEFERRED-FIX-MARKER > blanket fail-suppression):

1. Alla 6 DEFERRED-FIX-MARKER-regex-rader borttagna från `.lycheeignore`
2. Block 1 (Acceptable, ~3 patterns: GitHub compare/releases + adobe) kvar orörd
3. Lychee mot full scope: `🚫 Errors | 0`
4. CI grön mot main efter sista commit
5. Lessons skördade och hub-synkade per ADR-018

### Läs-ordning för ny session

1. `~/Repon/marcus-system/CLAUDE.md` — Hub-konstitution (inkl. ## Chat output-disciplin + ## Code STOPPA-OCH-FRÅGA-format)
2. `~/Repon/miranon-media-admin/CLAUDE.md` — Projekt-konstitution (Status: Fas 2 ✅ KLAR; Session 6.5 pågående)
3. `tasks/lessons.md` H2 `## 2026-05-14 — Session 6` — särskilt K1.12, K1.13, K1.14, K1.15, K1.16, K1.18, K1.19
4. `docs/decisions/ADR-029-*.md` § Baseline-fynd 2026-05-14
5. `docs/decisions/ADR-022-analys-flyttat-till-docs-research.md` § Fix-vs-skip-disciplin på path-refs i frysta zoner (3-kategori-modell)
6. `.lycheeignore` — DEFERRED-FIX-MARKER-block
7. Denna fil — sessionsdok-trail

---

## Del 1 — Indata-kontext

Lästa i denna ordning vid sessionsstart:

| # | Källa | Roll |
|---|---|---|
| 1 | `~/Repon/marcus-system/CLAUDE.md` | Hub-konstitution, P3a-mönster, K-disciplin, Chat-output 4-zoner-mall |
| 2 | `~/Repon/miranon-media-admin/CLAUDE.md` | Projekt-konstitution, sessionsstart-checklista |
| 3 | `tasks/lessons.md` Session 6 H2 (K1.12-K1.19) | Grindvakt-disciplin, DEFERRED-FIX-MARKER-pattern, ADR-022 3-kategori-modell |
| 4 | `docs/decisions/ADR-029-*.md` § Baseline-fynd | Defer-scope + kategori-modell |
| 5 | `docs/decisions/ADR-022-*.md` | 3-kategori-modell för path-refs (relationskontext-skip vs källhänvisning-fix vs flytt-beskrivning-skip) |
| 6 | `.lycheeignore` | Baseline-skuld (6 DEFERRED-FIX-MARKER-regex-rader) |

### Pre-K1 commit-trail

| # | Commit | Tema |
|---|---|---|
| 0 | (pre-K1, amend) | Receive Fas 2 11/10-verification rapport (defer till Session 7 K0) |

---

## Del 2 — K1 RAPPORTERA (Code 2026-05-14)

### Block 1 — Repo-state

| Item | Värde |
|---|---|
| Branch | main |
| HEAD pre-Session-6.5 | `adb5f09` (post-Session-6-K-sista) |
| Aktiva sessionsdok | `tasks/sessions/2026-05-13-ci-optimering.md` (Session 6, arkiveras vid Session 7-start) |

Uncommitted fil vid sessionsstart: `docs/analysis/Fas-2-11-10-verification-2026-05-14.md` — committad i pre-K1 per K7-disciplin (defer till Session 7 K0).

### Block 2 — .lycheeignore-baseline (Code mätning 2026-05-14)

| Item | Värde |
|---|---|
| Total rad-räkning | 55 |
| Block 1 (Acceptable) patterns | 3 (GitHub compare, GitHub releases, adobe stale) |
| Block 2 (DEFERRED-FIX-MARKER) regex-rader | 6 (rad 35, 38, 41, 44, 47, 52) |
| Faktisk defer-skuld per ADR-029 | ~71 broken links (~25 Kategori A + ~46 Kategori B) |

**Pattern-klassning per regex-rad:**

| Rad | Pattern | Kategori | Träffar |
|---|---|---|---|
| 35 | `docs/(DESIGN-SYSTEM-SPEC\|SECURITY-SPEC\|STATE-STRATEGY\|byggplan-revision-inventory\|gap-analysis).md` | A.1 (ADR-021 docs-omstrukturering) | ~5 unika |
| 38 | `docs/specs/KVALITETSDEFINITIONER-11.md` | A.2 (ADR-027 stack-skifte) | ~3 |
| 41 | `tasks/sessions/2026-05-11-fas2-routing-auth.md` | A.3 (ADR-023 sessionsdok-arkiv) | ~1 |
| 44 | `docs/research/datamodell-research/docs/research/.*` | A.4 (cirkulär-path-bug 06b) | ~1 |
| 47 | `docs/analysis/(docs\|src\|supabase\|public)/.*` | B.1 (path-konstr utan `../`) | ~21 |
| 52 | `docs/analysis/[^/]+\.(ts\|tsx\|css\|js)` | B.2 (analys-internal utan `../`) | ~5-6 |

### Block 3 — CI baseline-status

| Run | Conclusion | Duration | Commit |
|---|---|---|---|
| Latest | ✅ success | 37s | `adb5f09` — close Session 6 sessionsavsluts-checklist |
| -1 | ✅ success | 35s | `4ac37ab` — retroaktiv skörd K1.18 + K1.19 |
| -2 | ✅ success | 37s | `efa0a96` — P3a per-K statusrad-utvidgning |

Doc-only-mönster (~35-37s) bekräftat. Säkert att starta Session 6.5.

### Block 4 — Föreslagen fix-strategi

**Kategori A (~25 refs, 8 unika destinations):**

Per ADR-022 3-kategori-modell:

- **Ren-mekanisk find-replace (~22-23 av 25):**
  - A.1: `docs/X.md` → `docs/specs/X.md` eller `docs/logs/X.md` per fil-placering i ADR-021-omstrukturering
  - A.2: `KVALITETSDEFINITIONER-11.md` → `KVALITETSDEFINITIONER-11-REACT.md` globalt
  - A.3: `tasks/sessions/2026-05-11-*.md` → `tasks/sessions/archive/2026-05/2026-05-11-*.md`
- **Kräver bedömning per ref (~2-3):**
  - A.4: cirkulär-path-bug i `06b-supabase-target.md` — läses + bedöms per K11
- **Skip per ADR-022 kategori 3 (frusen historik):**
  - `docs/BUILD-LOG.md:238` (pre-ADR-021-fillista, historisk referens)

**Kategori B (~46 refs, 20 unika destinations i `docs/analysis/`):**

- Konsekvent `../`-prefix-tillägg (~21 av 21 i `Code-verification-of-codex-analysis.md`)
- Sub-variation B.2 (~5-6): `[text](src/X.ts)`-mönster utan radnummer — samma fix
- Empirisk taktik: `sed -i` på Code-verification.md + lychee-run + manuell bedömning av ev. kvarvarande

---

## Del 3 — K2 PLANERA + IMPLEMENTERA Kategori A

*(Levereras post-K1-bekräftelse)*

---

## Del 4 — K3 PLANERA + IMPLEMENTERA Kategori B

*(Levereras post-K2)*

---

## Del 5 — K4 VERIFIERA (full lychee mot full scope)

*(Levereras post-K3)*

---

## Del 6 — K-sista: Lessons-skörd + bake-in + hub-sync

*(Levereras post-K4)*

---

## Definition of Done

Per `CONTRIBUTING.md` Definition of Done — per session:

- [ ] `npm run test:api` grön (eller doc-only-skip-pattern)
- [ ] `npx tsc --noEmit` 0 fel (eller doc-only-skip)
- [ ] `npx @biomejs/biome check .` 0 fel (eller doc-only-skip)
- [ ] `npm run build` grön (eller doc-only-skip)
- [ ] **Lychee mot full scope: 0 errors** (Session 6.5-specifik DoD)
- [ ] **Alla 6 DEFERRED-FIX-MARKER-regex-rader borttagna ur `.lycheeignore`** (Session 6.5-specifik DoD)
- [ ] `docs/BUILD-LOG.md` uppdaterad med Session 6.5-block
- [ ] `tasks/lessons.md` uppdaterad
- [ ] `tasks/todo.md` uppdaterad — Session 6.5 ✅ KLAR + Session 7 K0 Fas-2-verifikation-defer flaggad
- [ ] Commits pushade

---

## Lessons-kandidater

*(Skördas K-sista. Förväntat scope: 3-5 lessons baserat på mini-session-storlek. Initial-kandidater redan identifierade i Chat 2026-05-14:*
*— Chat-output 4-zoner-mall-tillämpning (mönsterförstärkning K1.19 + möjligen ny K-post om projektkunskaps-synk-verifiering vid sessionsstart)*
*— Eventuella nya från K2/K3 ADR-022-tillämpningar)*
