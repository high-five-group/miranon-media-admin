---
updated: 2026-05-18
review_by: 2026-08-18
status: draft
owner: marcus803
---

# Mini-överlämning 4 — Session 6.6.6 K0 KLAR, paus pre-K3.5

> Fjärde mini-överlämning denna session. Föregående var
> `2026-05-17-session-6-6-6-mini-overlamning-3.md` (paus pre-K3.5
> efter mini-3 utan att K0 startade). Denna täcker K0.1 → K0.4
> komplett (5 commits, 14 lessons-skörd, cross-grindvakt UTF-8-audit,
> CI-baseline-korrektur till förväntad Session 6.6.6 baseline).

---

## Sessions-handoff (för kall sessionsstart)

### Var vi är

Session 6.6.6 har genomfört K0 (pre-K3.5 CI-baseline-korrektur) över 4
sub-faser med 5 commits. HEAD = `e30a669` (K0.4 lessons-säkring). CI
post-K0.3-push: exakt Session 6.6.6:s förväntade baseline (3 errors
Miranon.Brand i `lessons.md` + 2 suggestions, ingen oväntad
pre-existing failure utöver Vale-domänen). **Nästa K-fas: K3.5 ADR-032
design** (formaliserar helfil-disable-mitigering för L_X.2 + relaterad
Vale-cleanup).

### Naturlig pausnivå

Pausen är pre-K3.5 efter komplett K0-enhet. Skäl:

1. **Komplett K0-enhet** — alla 4 sub-faser (K0.1 forensisk + K0.2
   forensisk + K0.3 4-commit-fix + K0.4 lessons-säkring) levererade.
2. **Chat-bandwidth-bevarande** — ~3-4h Code + ~2h Chat-design denna
   session. K3.5 ADR-design är tungt analytiskt arbete som kräver
   frisk Chat-iteration.
3. **L_AAA-trajektoria 95.2%** post-K0.4 signalerar att Chat-prompt-
   design-skuld eskalerar med arbets-djup. Ny session ger reset.
4. **CI i stabilt deferrat state** — inga akuta fel. K3.5-paus är
   designval, inte tvingat.

### Strategi-pivot från mini-3

Mini-3 antog "pausa pre-K3.5" utan K0-fas. Marcus' Gate-2-fångst vid
sessionsstart triggade forensisk-pass av CI-state som avslöjade 2
oväntade pre-existing failures (frontmatter + markdownlint) som inte
tillhörde Session 6.6.6 Vale-domän. K0 etablerades retroaktivt som
"pre-K3.5 CI-baseline-korrektur" och levererade 4 commits + cross-
grindvakt UTF-8-audit + 14 lessons-skörd.

K0-utfall: CI-baseline från "rött på okänd mix" till "rött på enbart
förväntad Session 6.6.6 Vale-deferral". Maskerings-mekanism upptäckt
(markdownlint-failure dolde Vale-steget i CI). Inga andra K-faser
påverkade.

---

## Del 1 — Repo-state vid mini-överlämning

### HEAD + branch

- **HEAD:** `e30a669` (K0.4 lessons-säkring — reconciliation Sektion 3.7)
- **Branch:** `main` (1 commit ahead av origin/main, working tree clean)
- **Push-state:** Ej pushad. K0.4-commit + denna mini-4-commit pushas
  tillsammans vid sessionsstart (eller deferas till K3.5-leverans).
- **CI senaste run (26045772583, post-K0.3-push):** 4 jobb success, 1
  failure (Docs link check / Vale-steget på 3 Brand-errors i
  lessons.md). Exakt förväntad Session 6.6.6 baseline.

### Commit-trail Session 6.6.6 K0 (5 commits totalt)

| # | SHA | K-fas | Tema |
|---|---|---|---|
| 1 | `3251d2f` | K0.3 Commit 1 | fix(hooks) — UTF-8-safe iteration via -z + NUL-terminated read + T9 |
| 2 | `92e95e8` | K0.3 Commit 2 | fix(specs) — bump v3.md updated → 2026-05-18 |
| 3 | `31e9f3c` | K0.3 Commit 3 | fix(docs) — MD029 fix i ADR-029 via list-item-indentering |
| 4 | `4a42826` | K0.3 Commit 4 | chore(grindvakter) — cross-tooling UTF-8-audit + T13 negativ-test |
| 5 | `e30a669` | K0.4 | chore(lessons) — säkra K0-skörd som Sektion 3.7 i reconciliation v2-final |

### Pre-K0 state (sista commit från mini-3)

- HEAD pre-K0: `d0f1c59` (mini-3 commit, paus-state)
- CI pre-K0: 2 oväntade pre-existing failures (frontmatter + markdownlint
  MD029) maskerade Vale-steget i "Docs link check"-jobbet
- Vale-status pre-K0: skipped (oobserverad pga maskering)

### Post-K0 state

- HEAD post-K0: `e30a669`
- CI post-K0.3-push: 4 jobb success, 1 failure (Docs link check / Vale
  enbart) — exakt Session 6.6.6 förväntad baseline
- Vale-status post-K0: failure (3 errors Miranon.Brand i lessons.md,
  rad 106/498/512 — K3-PENDING-domän)
- Frontmatter-validator: ✅ alla 9 styrande docs gröna
- markdownlint-cli2: ✅ 85 filer, 0 errors
- Test-suites: ✅ test-pre-commit-hook 9/9 (inkl. T9 UTF-8-regression),
  test-check-frontmatter 14/14 (inkl. T13 negativ-test)

### Σ-trajektoria (kumulativ Session 6.6.6)

| Domän | Pre-Session | Post-K2.2 | Post-K2.6.2.D.3 | Post-K0.4 |
|---|---:|---:|---:|---:|
| Vale.Terms-fynd (lokal-scope) | 601 | 29 | ~5 | ~5 |
| CI Vale-errors (CI-scope) | — | 23 | 3 | 3 |
| Frontmatter-validator | grön | grön | **röd** (latent) | **grön** |
| markdownlint MD029 | grön | grön | **röd** (latent) | **grön** |
| Hook UTF-8-coverage | ej-existerande | ej-existerande | blind-spot | **fixed** |
| Cross-grindvakt-UTF-8-audit | — | — | — | **klar** (0 nya buggar) |

---

## Del 2 — K0-fas-trail (komplett retrospektiv)

### K0.1 — Frontmatter-validator-rotorsak (~10 min)

**Symptom:** Pre-K0.3 CI-run 25996847099 hade frontmatter-validator
failure utan klar orsak vid sessionsstart.

**Code-rapport (D.3-djup-rotorsak):** Failande fil =
`docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` Check 2 (updated-match).
`updated: 2026-05-15` driftade från `git log -1 --format=%cs` =
`2026-05-17` (faktisk senaste touch i commit `91b6337` K2.6.2.D.1).

**Code's transparens-rapport-djupare-rotorsak (utöver scope):** Latent
UTF-8-quotepath-bugg i `.githooks/pre-commit`. Hooken itererade
`git diff --cached --name-only` med default `core.quotepath=true` →
svenska tecken (Ä) returnerades som octal-escape
`BYGGPLAN-L\303\204TTL\303\204ST-v3.md` → exakt-match
`[[ "$staged" = "$gov" ]]` failade → v3.md auto-bumpades ALDRIG
systematiskt sedan hook-etablering (Session 6.6 K7, 2026-05-14).

**Klass-pattern bekräftat:** Mönsterförstärkning av K1.17 (Session 6,
hub-lyft) — tj-actions/changed-files UTF-8-glob-bug på SAMMA fil
(v3.md). 2 empiriska instanser av samma klass (UTF-8-blind-spot vid
filename-iteration), olika tooling-domäner (CI workflow + git hook).

**Hub-konsolideringsbrist:** K1.17 hub-formulering var tooling-specifik
("third-party Actions"), inte klass-generaliserad. Etablerades 2026-05-14,
samma dag som K7 pre-commit-hook etablerades — propagerades aldrig till
hook-design. Säkras vid K-sista-0-konsolidering.

### K0.2 — MD029-rotorsak (~10 min)

**Symptom:** Pre-K0.3 CI-run hade markdownlint-cli2 failure med 5
MD029/ol-prefix errors i `docs/decisions/ADR-029-*.md` (rad
97/100/102/104/106).

**Marcus' hypotes:** Vale-disable-block bröt ordered list.

**Code-rapport (D.3 isolerad mätning):** Hypotes bekräftad
deterministiskt. Commit `85a47bf` (K2.6.2.D.3) införde två HTML-
kommentarer inuti ordered list:

- Rad 96: `<!-- vale Vale.Terms = NO -->` (mellan item 1↔2)
- Rad 98: `<!-- vale Vale.Terms = YES -->` (mellan item 2↔3)

HTML-block i CommonMark bryter list-kontinuitet → markdownlint
splittrar listan i 3 fragment: [item 1] / [item 2] / [items 3-6]
→ 5 MD029-errors. Pre-85a47bf = 0 MD029-errors verifierat.

**Code's D.3-metodavvikelse (Lager 2 §6.2-transparens):** Första
D.3-försöket använde temp-fil istället för git checkout, men
markdownlint-cli2 slår ihop explicit fil-argument med repo-config-globs.
Code fångade self-review + re-mätte isolerat från `/tmp` utan
repo-config. **Lessons-kandidat L_AAAA.**

**Cross-grindvakt-regression-klass identifierad:** K0.1 (91b6337 →
frontmatter) + K0.2 (85a47bf → markdownlint). Båda Session 6.6.6
Vale-cleanup-commits införde collateral-skada i andra grindvakter.
**Lessons-kandidat L_ÖÖÖ.**

### K0.3 — 4 atomic commits (~3h Code + 25 min Chat-design)

#### K0.3 forensisk-pass + scope-utvidgning

Marcus' Gate-2-fångst pre-K0.3-design: *"Jag förstår inte hur vi
hamnat här, vi har ju jobbat med och satt upp CI:n i tidigare sessioner,
gjorde vi fel då?"*

Chat's forensisk-pass avslöjade:

1. Vi gjorde INTE fel vid K7-design (Session 6.6, 2026-05-14) — vi
   följde branschstandard. K7-scope var "frontmatter-bump-mekanik",
   inte "robust UTF-8-handling". 5 nyligen publicerade pre-commit-
   guider använder inte `-z` eller `core.quotepath=false`.
2. K1.17 hub-lyft samma dag som K7 — UTF-8-lessen propagerades aldrig
   till hook-design (hub-konsolideringsbrist).
3. Branschstandard-research (5 blog-exempel 2025-2026 + pre-commit-
   framework) konfirmerar UTF-8-blind-spot som branschstandard-
   anti-mönster.
4. Git's officiella docs (<https://git-scm.com/docs/diff-options>): `-z`
   är canonical-fix för pathname-quoting. Hanterar ALLA "unusual"
   tecken, inte bara UTF-8 (vilket `core.quotePath=false` gör delvis).

**Scope-utvidgning beslutad post-forensisk-pass:** K0.3 från 3 → 4
commits. Tillägg: cross-grindvakt UTF-8-audit som klass-pattern-säkring
efter 2 bekräftade instanser. Per L6 (11/10 GOLV) över "sannolikt OK"-
defer. **Lessons-kandidat L_AAAB** (L_AAA-instans 14: L1 forensisk-
pass ej tillämpad på Alt-A/B/C-rekommendation).

#### K0.3 Commit 1 — Hook-fix + T9 (3251d2f)

**Implementation:** `.githooks/pre-commit` byter `git diff --cached
--name-only` → `git diff --cached --name-only --diff-filter=ACM -z`
med temp-fil-pattern (per L_C nivå 1 över process-substitution).

**Pattern-val (Code STOPPA-OCH-FRÅGA pre-edit):** Chat-prompt
specificerade `< <(...)` process-substitution. Code's shellcheck-strict-
verifikation triggade SC2312 (info) under `--enable=all` — process-
substitution maskerar git's return-värde. Alt A (temp-fil-pattern)
valdes per L_C nivå 1 + Session 6.6.7 K3.1 SC2312-precedent. **Lessons-
kandidat L_AAAD** (L_AAA-instans 16).

**Test-suite-utvidgning:** Ny T9 i `scripts/test-pre-commit-hook.sh`
verifierar `BYGGPLAN-LÄTTLÄST-v3.md` auto-bumpas korrekt. Regression-
skydd för UTF-8-blind-spot-klass.

**Pre-implementation minimal-test (Block 1.A):** Empirisk verifikation
av canonical NUL-iteration-pattern i isolerad `/tmp`-miljö FÖRE
hook-rewrite. Test C visade "✅ MATCH" (filnamn-iteration verbatim med
UTF-8-tecken). Per L11 + CLAUDE.md ("Testa ALLTID nytt bibliotek/approach
med minimalt test").

**Bevisning:** shellcheck-strict 0/0/0/0 + test-suite 9/9 PASS.

#### K0.3 Commit 2 — v3.md updated-bump (92e95e8)

**Implementation:** `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` frontmatter
`updated: 2026-05-15` → `updated: 2026-05-18`.

**Datum-drift (Code STOPPA-OCH-FRÅGA):** Chat-prompt specificerade
`updated: 2026-05-17` (prompt-skapande-datum), men exekvering 2026-05-18
(dag-rollover). K7.7-tillämpning: TODAY = 2026-05-18, INTE 2026-05-17.
Alt A (typat värde = committat värde = exekverings-TODAY) valdes.
**Lessons-kandidat L_AAAE** (L_AAA-instans 17 — K7.7-tillämpning på
Chat-side, inte bara Code-prompt-design-tid).

**Verifikation:** Post-commit `check-frontmatter` exit 0 (alla 9
governing docs gröna).

#### K0.3 Commit 3 — ADR-029 MD029-fix (31e9f3c)

**Implementation:** ADR-029 rad 96 + 98 HTML-kommentarer indenterade
4-space → blir del av preceding list-item per markdownlint-officiell
fix. List-kontinuitet bevaras, Vale-disable-funktion oförändrad.

**Pre-implementation minimal-test (Block 3.A):** Empirisk verifikation
i `/tmp/k03c3-md029` med replikerad ADR-029-struktur:

- markdownlint-cli2: 0 MD029-errors ✅
- Vale: 0 Miranon.Brand-fynd för "github.com" i item 2 (disable
  respekterat trots indentering) ✅

Per L_YYY (minimal-repro-disciplin) + L11.

**Källa:** Markdownlint MD029 officiella docs:
> "The fix is to indent the code block so it becomes part of the
> preceding list item as intended."
(<https://github.com/DavidAnson/markdownlint/blob/main/doc/md029.md>)

**Bevisning:** markdownlint-cli2 lokal-repo: 0 errors. Vale ADR-029:
0 fynd.

#### K0.3 Commit 4 — Cross-grindvakt UTF-8-audit + T13 (4a42826)

**Implementation:** Empirisk audit av övriga bash-scripts + .githooks
för UTF-8-blind-spot. 5 scripts klassificerade:

| Script | Iteration-mönster | UTF-8-status |
|---|---|---|
| `.githooks/pre-commit` | git diff (FIXED i Commit 1) | ✅ safe |
| `scripts/check-frontmatter.sh` | Array hardcoded paths | ✅ safe per konstruktion |
| `scripts/check-public-checklists.sh` | Array hardcoded paths | ✅ safe per konstruktion |
| `scripts/test-pre-commit-hook.sh` | Test-fixtures | ✅ safe |
| `scripts/test-check-frontmatter.sh` | Test-fixtures | ✅ safe |

**Resultat:** Inga nya UTF-8-buggar utöver hook-instansen.

**Test-suite-utvidgning:** Ny T13 (negativ-test) i
`scripts/test-check-frontmatter.sh`. **Code-design-förbättring (L_AAAG):**
Chat-prompt specificerade positiv-test (valid v3.md → exit 0). Code
ändrade till negativ-test (introducera deliberat fel → måste flaggas)
eftersom positiv-only inte kan skilja "validerad" från "tyst skippad".

**Bevisning:** test-suite 14/14 PASS.

### K0.3 Push + CI-utfall

**Push:** `git push origin main` levererade 4 commits → CI-run
26045772583.

**Per-jobb-utfall:**

| Jobb | Pre-K0.3 | Post-K0.3 |
|---|---|---|
| Detect changed files | success | ✅ success |
| Lint + Audit + TypeCheck | **failure** | ✅ success (frontmatter fixed) |
| Test + Build | skipped | ✅ success (Strategi E klassade scripts som icke-doc-only) |
| Docs link check | **failure** (markdownlint) | ⚠️ **failure** (Vale-steget — förväntad Session 6.6.6 baseline) |
| CI Passed or Skipped | skipped | skipped |

**Maskerings-mekanism upptäckt:** Pre-K0.3 markdownlint-failure i
"Docs link check"-jobbet gjorde att Vale-steget skippades (GitHub
Actions skippar efterföljande steg vid step-failure). Vale-status var
"skipped", inte "failure" → maskerad. Post-K0.3 fix av markdownlint
avtäckte Vale-steget för första gången. **Lessons-kandidat L_AAAH**
(CI-trogen invocation > approximation — V.A.6 lokal vale-test scope:ades
till ADR-029 enbart, hade full-tree-scope fångat detta FÖRE push).

### K0.3 Marcus-fångst om CI-state

Marcus' Gate-2-fångst post-CI-rapport: *"Det är väl inte så konstigt
att vi failar på Vale, eller är det de? Vi är ju inte klara med Vale,
det är ju de vi håller på med i denna session (6.6.6)."*

**Forensisk-pass (Chat) bekräftade:**

- Session 6.6.6 sessionsdok Del 7 (commit `cec2fa5`) säger explicit:
  *"CI förblir röd tills K2.3-K2.6 manuell-fix-pass slutförd. Detta är
  **design** — Vale-grindvakten exponerar drift som ska fixas, inte
  regression."*
- Mini-3 Del 7 dokumenterar CI-baseline som "3 errors lessons.md Brand
  (out-of-scope per L_XX, K-sista-domän) + 2 suggestions Miranon.Undvik
  (out-of-scope) = 5 fynd, stabilt baseline".

**K0-syftet reviderades:** Från "CI grön" till "CI på exakt förväntad
Session 6.6.6 baseline + alla oväntade pre-existing fixed".

**Beslut:** Alt C — acceptera CI röd på förväntad Vale-domän. INGEN
Commit 5. Vale-cleanup tillhör K3.5/K3.6-domän. **Lessons-kandidat
L_AAAK** (L_AAA-instans 18 — Chat missade att "CI grön" under aktiv
Vale-cleanup är instabilt state per design).

### K0.4 — Lessons-säkring (~30 min Code + 20 min Chat-design)

**Implementation:** `tasks/sessions/2026-05-17-lessons-reconciliation-
fangst-v2.md` får ny Sektion 3.7 "Post-mini-3 K0-skörd" med 14
lessons-kandidater. Frontmatter `total_unique_lessons: 80 → 94`.
`updated: 2026-05-17 → 2026-05-18` (manuell — reconciliation-fil är
non-governing, hook bumpar inte).

**Pre-edit STOPPA (Code-fångst):** Chat-prompt antog att pre-commit-
hook auto-bumpar `updated:` för ALLA modifierade filer, men hooken
bumpar enbart governing docs. Reconciliation-fil är non-governing →
hook bumpar inte → frontmatter-drift om manuell bump saknas. Alt A
(manuell bump i Block C.2) valdes. **Lessons-kandidat L_AAAL** (L_AAA-
instans 19 — Chat-prompt antog hook-beteende utan att verifiera
governing-scope).

**Code's 4 transparens-propageringar:** När L_AAAL adderades till
revisionsspec, propagerade Code till:

1. Sektion 3.7-header "(13 lessons)" → "(14 lessons)"
2. Del 5 D.2 klass-bullet "instanser 14-18" → "14-19"
3. Del 6 E.1 trail "L_ÄÄÄ-L_AAAK / K0.1-K0.3" → "L_ÄÄÄ-L_AAAL / K0.1-K0.4"
4. Commit-message tillägg som dokumenterar de 3 fixarna (L_LLL-
   tillämpning på commit-message-domän)

**Lessons-kandidat L_AAAM** (NY, ej i Sektion 3.7) — När en revision
lägger till en lesson-instans, måste ALLA cross-referenser propageras.
Chat-revision missade 3; Code propagerade self-review. Specialisering
av L_LLL på multi-sektion-edit-domän. **Operativ konsekvens:** Lager 2
§2 (NY procedursteg) — vid lesson-add i revision, generera cross-
reference-checklist FÖRE prompt-leverans.

**Bevisning:** check-frontmatter exit 0 (governing docs opåverkade),
diff 1 fil 54 insertions / 5 deletions, working tree clean.

### K0 fångst-distribution

| Källa | K0.1 | K0.2 | K0.3 | K0.4 | Σ K0 |
|---|---:|---:|---:|---:|---:|
| Code transparens-rapport | 1 | 1 | 5 | 2 | **9** |
| Marcus Gate-2-fångst | 0 | 1 | 2 | 0 | **3** |
| Chat-self-fångst | 0 | 0 | 1 | 0 | **1** |
| Code STOPPA pre-edit | 0 | 0 | 2 | 1 | **3** |
| **Σ K0 fångster** | **1** | **2** | **10** | **3** | **16** |

**Insikt:** Code's pair-programming-pattern (L_ZZ) levererade 12/16 K0-
fångster (75%) inkluderande 3 pre-edit STOPPA (19%). Chat-self-fångst
utan extern trigger: 1/16 (6%). Empirisk grund för Lager 2-checklist
som extern verifierings-mekanism.

### K0 commit-effektivitet

| K-fas | Estimat | Faktisk | Δ |
|---|---|---|---|
| K0.1 forensisk | 10 min | 10 min | 0 |
| K0.2 forensisk | 10 min | 10 min | 0 |
| K0.3 4 commits | 2.5h | 3-4h (med STOPPA-iteration) | +30-60 min |
| K0.4 lessons-säkring | 25 min | 30 min | +5 min |
| **Σ K0 Code-arbete** | **~3h** | **~3.5-4.5h** | **+30-90 min** |

Drift förklaras av 3 pre-edit STOPPA (L_AAAD, L_AAAE, L_AAAL) som
adderade ~10-15 min per iteration men förebyggde rework. Netto-effekt:
fångst pre-edit > rework post-edit.

---

## Del 3 — K-fas-status

| K-fas | Status | Output | Commit |
|---|---|---|---|
| K2.6.2.D.4 v2 fil 1 (todo.md) | DEFERAD → K3 | K3-PENDING helfil-disable | `35aaf9a` |
| K2.6.2.D.4 v2 fil 2 (lessons.md) | DEFERAD → K3 | K3-PENDING helfil-disable | `d2cd843` |
| K2.6.2.D.4 v2 fil 3 (ADR-031) | DEFERAD → K3 | K3-PENDING (15 fynd) | `5b7c02d` |
| K2.6.2.D.4 v2 fil 4 (react-headless) | DEFERAD → K3 | K3-PENDING (5 fynd) | `849485d` |
| K2.6.2.D.4 v2 fil 5 (react-stack) | KLAR | Prosa-fixad L_HH (0 fynd) | `edf9705` |
| K2.6.2.D.5 (BUILD-LOG) | DEFERAD → K3 | K3-PENDING (7 fynd) | `2b4678f` |
| K2.6.2.D.5 sessionsdok | MOOT | Vale-exkluderad | — |
| K3.1.a (Chat-research) | KLAR | 3-mitigerings-uttömning + Vale 3.14.1-verifikation | — |
| K3.1.b (empirisk test) | KLAR | TokenIgnores + IgnoredScopes + BlockIgnores alla falsifierade | — |
| K3.2 (strukturell pre-screen) | KLAR | 5 av 6 D.4/D.5-filer L_X.2-drabbade/at-risk | — |
| K3.3 (deploy K3.2-klassificering) | KLAR | 1 prosa-fix + 3 K3-PENDING-uppdateringar | `edf9705`-`849485d` |
| K3.4 (minimal-repro-verifikation) | KLAR | L_X.2 reproducerad i 4-raders-fil | — |
| K3.4.5 (upstream-issue-text) | TEXT KLAR | Filartefakt levererad, publicering avvaktar | — |
| **K0 (denna mini-överlämning)** | **KLAR** | **5 commits, 14 lessons-skörd, cross-grindvakt UTF-8-audit** | `3251d2f`-`e30a669` |
| **K3.5 (ADR-032 Draft → Accepted)** | **EJ STARTAD** | **Nästa Chat-iteration börjar här** | — |
| K3.6 (K2.6.2.F test-suite) | EJ STARTAD | Efter K3.5 | — |
| K-sista-0 (lessons-konsolidering) | EJ STARTAD | 94 → 10-15 hub-lessons | — |
| K-sista-1 (bake-in + hub-sync + arkivering) | EJ STARTAD | Final | — |

### Total Session 6.6.6 kvar (efter K0.4 + mini-4)

**Estimat:** ~4-5h Code + ~2-3h Chat-design

Breakdown:

- K3.5 ADR-032: ~60 min Chat + 15 min Code
- K3.6 test-suite K2.6.2.F: ~45 min Code + 10 min Chat
- Push (K0.3 redan pushad; K0.4 + mini-4 + K3.5 + K3.6 pushas vid
  K-sista-1 eller intermediate): ~15 min
- K-sista-0 lessons-konsolidering: ~1.5h Chat + 15 min Code
- K-sista-1 bake-in + hub-sync + arkivering: ~1.5-2h
- Final CI-verifikation: ~15 min

---

## Del 4 — Lessons-katalog (uppdaterad till 94 unika)

### Auktoritativ källa

**`tasks/sessions/2026-05-17-lessons-reconciliation-fangst-v2.md`
(commit `e30a669` post-K0.4)**

Innehåller 94 unika lessons-kandidater fördelade:

- **Sektion 3.1:** L15-L19 retroaktiva 6.6.5 (5 lessons)
- **Sektion 3.2:** L_M-L_X ≈samma mini-1+mini-2 (6 lessons)
- **Sektion 3.3:** Mini-1 unika konflikt-lessons (9 lessons, prefix
  `mini1-L_X`)
- **Sektion 3.4:** Mini-2 unika konflikt-lessons (9 lessons, prefix
  `mini2-L_X`)
- **Sektion 3.5:** Mini-2 L_BB-L_AAA unika (26 lessons)
- **Sektion 3.6:** Post-mini-2 Chat-genererade (25 lessons, L_BBB-L_ÅÅÅ)
- **Sektion 3.7 (NY post-K0.4):** Post-mini-3 K0-skörd (14 lessons,
  L_ÄÄÄ-L_AAAL)

### Sektion 3.7 — Post-mini-3 K0-skörd (14 lessons)

| Lesson | Källa | Domän |
|---|---|---|
| L_ÄÄÄ | K0.1 + K0.3 Commit 1+4 | UTF-8-blind-spot-klass vid filename-iteration |
| L_ÖÖÖ | K0.1 + K0.2 forensisk-pass | Cross-grindvakt-regression-mönster |
| L_AAAA | K0.2 Code D.3-transparens | markdownlint-cli2 glob-merge |
| L_AAAB | K0.3 design pre-Marcus' fångst | L_AAA-instans 14 — L1 ej tillämpad |
| L_AAAC | K0.3 design Alt-presentation | L_AAA-instans 15 — Chat rusade utan historik |
| L_AAAD | K0.3 Commit 1 STOPPA | L_AAA-instans 16 — bash-pattern-spec |
| L_AAAE | K0.3 Commit 2 STOPPA | L_AAA-instans 17 — datum-rollover |
| L_AAAF | K0.3 Commit 1 transparens | Inner-kommentarer i revisions |
| L_AAAG | K0.3 Commit 4 T13 Code-design | Negativ-test över positiv |
| L_AAAH | K0.3 Block V.A Code-design | CI-trogen invocation > approximation |
| L_AAAI | K0.3 Code transparens | Commit-trailer-format följer repo |
| L_AAAJ | K0.3 Commit 1 transparens | Commit-message-snippet re-verifiering |
| L_AAAK | K0.3 post-push Marcus-fångst | L_AAA-instans 18 — CI grön-definition |
| L_AAAL | K0.4 pre-edit STOPPA | L_AAA-instans 19 — hook governing-scope |

### Lessons-kandidat L_AAAM (NY post-K0.4, ej i Sektion 3.7 än)

**L_AAAM** — Cross-reference-propagering vid lesson-add i revision.
När en revision lägger till en lesson-instans (typ L_AAAL), måste
ALLA cross-referenser i samma commit propageras: tabell, header-count,
frontmatter, klass-bullets, trail-sektioner, commit-message. Chat-
revision missade 3 cross-referenser; Code propagerade self-review.
Specialisering av L_LLL på multi-sektion-edit-domän. **Operativ
konsekvens:** Lager 2 §2 (NY procedursteg) — vid lesson-add i revision,
generera cross-reference-checklist FÖRE prompt-leverans.

**L_AAAM säkras vid K-sista-0** tillsammans med övrig konsolidering,
eller adderas till Sektion 3.7 om K3.5 eller senare K-fas triggar
filartefakt-revision. Räkning blir då 95 unika.

### Lessons-namn-konvention

Per mini-3 Del 4: "L_ÅÅÅ är sista bokstavs-rymden-instans inom svenska
enkla-bokstavs-konvention (A-Z-Å). Vid behov av fler post-mini-3-skörd:
använd L_ÄÄÄ → L_ÖÖÖ → L_AAAA-style. **Beslut deferas till K-sista-0**
som omnumrerar till kanonisk L20-LNN ändå — namnspace-tematik blir
moot."

Mini-4-skörd har använt L_ÄÄÄ → L_AAAL-konventionen per direktiv.
L_AAAM tilldelas vid behov.

---

## Del 5 — Vale-fix-trail (DEDIKERAD)

### Bakgrund

Session 6.6.6 är aktiv Vale-cleanup-session. CI förväntat röd på 3
errors Miranon.Brand i `lessons.md` (rad 106/498/512) tills K3.5/K3.6
levererar formaliserad mitigation. Detta är **design**, inte regression
— se Session 6.6.6 sessionsdok Del 7 (`cec2fa5`).

### 6 K3-PENDING-filer (per K3.2 strukturell pre-screen)

| Fil | Disable-commit | Fynd-count | L_X-klass | Mitigation-strategi |
|---|---|---:|---|---|
| `tasks/todo.md` | `35aaf9a` | — | L_X.2 | Helfil-disable per ADR-032 |
| `tasks/lessons.md` | `d2cd843` | 3 (Brand) | L_X.2 | Helfil-disable per ADR-032 + ev. textual cleanup |
| `docs/decisions/ADR-031-*.md` | `5b7c02d` | 15 | L_X.2 | Helfil-disable per ADR-032 |
| `docs/research/react-headless-ui-research.md` | `849485d` | 5 | L_X.2 AT-RISK | Helfil-disable per ADR-032 |
| `docs/research/react-stack-research.md` | `edf9705` | 0 (KLAR) | L_HH | Prosa-fixad, INTE pending |
| `docs/BUILD-LOG.md` | `2b4678f` | 7 | L_X.2 | Helfil-disable per ADR-032 |

### L_X.1 vs L_X.2-distinktion (etablerad K3.1.b)

**L_X.1 — IL-mitigerbar quirk:** Vale-quirk där inline-disable (IL)
fungerar. Per-rad eller per-stycke disable räcker. **Klass-status:**
Lättare-domän, lokala lösningar möjliga.

**L_X.2 — Intra-fil-state-quirk:** Vale 3.14.1 upstream-bugg där
TokenIgnores + IgnoredScopes + BlockIgnores ALLA failar. Trigger:
flerrads-paragraf (lazy continuation) + inline code-span med
Vale.Terms-token. Vale mis-scopar inline code-spans → prosa skippas,
kod flaggas (inversion). **Klass-status:** Helfil-disable är enda
deterministiska mitigering tills upstream-fix.

**Strukturell pre-screen-precondition (L_WWW):** L_X.2-risk = token-i-
backtick-span + plain-sibling-fynd av samma token i samma fil.

### 3 mitigerings-familjer falsifierade (K3.1.b empirisk)

| Familj | Test-status | Resultat |
|---|---|---|
| TokenIgnores (regex-baserad token-exkludering) | FALSIFIED | Cascade-suppmering misslyckades på L_X.2-trigger |
| IgnoredScopes (CommonMark-element-exkludering) | FALSIFIED | Code-spans mis-scopas; ej tillförlitlig |
| BlockIgnores (block-level disable) | FALSIFIED | Triggar inte på inline-cas |
| **Helfil-disable** | **VERIFIED** | Enda deterministiska mitigering |

### Minimal-repro

**Filer (rekonstrueras från K3.4-rapport-data om /tmp rensat):**

- `case-d4.md` — 4 rader, HELT-bold rad 1 + lazy-continuation rad 2-3
  - plain rad 4
- `case-d6.md` — 4 rader, code-span rad 1 + plain lazy-continuation
  rad 2-3 + plain rad 4
- `.vale.ini` — minimal-config (BasedOnStyles=Vale + 4-terms-vocab)

**Trigger-precision:** Case-d6 träffar exakt kolumn 3:30 i svenska +
engelska markdown. Språk-oberoende (case-d6 träffar exakt samma kolumn
3:30 i båda språk). 11 cases krävdes för pinpoint (L_ZZZ + L_ÅÅÅ).

### Branschstandard-referenser (verifierade K3.1.a + K3.4)

| Källa | Relevans |
|---|---|
| Vale Markdown-docs | Code spans default-ignorerade — vår fall är distinkt |
| Vale CLI Issue #387 (jdkato 2021) | "this is not a bug" för Liquid-template-tags-fall — vår fall är distinkt |
| GitLab MR #88894 (2022) | scope: raw-fall — vår fall är distinkt (Vale.Terms är auto-genererad utan scope: raw) |
| Vale 3.14.1 = senaste stabila (L_JJJ-verifierad) | Ingen version-bump-väg möjlig |
| Elastic Docs Vale-config | Helfil-disable som branschstandard-mitigation |
| GitLab Vale-config | Helfil-disable för specific files |
| Stream Docs Vale-config | Helfil-disable för external-leverans |

### ADR-032-design-mål (K3.5)

ADR-032 ska dokumentera:

**Status:** Proposed → Accepted (vid maintainer-respons eller K-sista-1-
cutoff)

**Context:**

- L_X.2-empirisk-grund (Session 6.6.6 K3.1.b-K3.4)
- 11 cases minimal-repro
- 3 mitigerings-familjer falsifierade
- Vale 3.14.1 senaste stabila

**Decision:**

- Helfil-disable som formaliserad mitigering tills upstream-fix
- L_X.1 vs L_X.2-distinktion formell definition
- Defer-strategi: Per-fil-helfil-disable + lift-protocol vid upstream-fix
- Regression-skydd: Referens till K2.6.2.F test-suite (K3.6)

**Consequences:**

- D.4/D.5 K3-PENDING permanent tills upstream-fix
- 6 K3-PENDING-filer förblir helfil-disabled
- ADR-022 § Del 5 utvidgad med L_X.2-disable-rationale
- Branschstandard-precedent (Elastic, GitLab, Stream)

**Spårbarhet:**

- Upstream-issue-länk (placeholder eller URL beroende på publicerings-
  status)
- K2.6.2.F test-suite (K3.6) som regression-skydd
- Lift-protocol vid upstream-fix

### Upstream-issue-status

**Text-status:** KLAR (filartefakt `vale-upstream-issue-L_X2.md` i
Marcus' Downloads). Innehåller:

- TITLE + BODY med 11-case-bisection
- Mitigation-uttömning (3 familjer falsifierade)
- Engelsk + svensk variant
- References (Vale CLI #387, GitLab MR #88894, branschstandard-config-
  exempel)

**Publicering:** Avvaktar. Marcus filar på GitHub vid lämplig tidpunkt.
Issue-URL inkluderas i ADR-032 retroaktivt (eller placeholder tills
filande).

### lessons.md — TVÅ separata Vale-problem (K3.5 design-fråga)

**Problem A — L_X.2 strukturell-risk:** Om filen får lazy-continuation
paragraf med inline code-span och Vale.Terms-token, Vale mis-scopar.
Mitigering: helfil-disable.

**Problem B — 3 Miranon.Brand-fel (rad 106/498/512):** "Miranon"
standalone → ska vara "Miranon Media" per Brand.yml-pattern. Detta är
**content-drift**, inte Vale-tooling-drift.

**K3.5-design-fråga:** Helfil-disable (lösning för Problem A) skulle
**också** dölja Problem B eftersom alla Vale-regler tystas. Två
sub-alternativ:

| Alt | Lösning | Trade-off |
|---|---|---|
| A | Helfil-disable enbart för Problem A; Brand-fel text-fixas FÖRST | Renaste content; mer arbete |
| B | Helfil-disable täcker bägge (Brand-fel maskeras tillsammans med L_X.2) | Mindre arbete; content-drift döljs |
| C | Vale.Terms-only disable (per-regel) + behåll Brand-aktivering | Mest granulärt; Vale-config-komplexitet ökar |

**Beslut deferas till K3.5-design.** Mini-4 flaggar att detta är konkret
design-val, inte detalj.

### Tidsfönster till CI grön

| Aktivitet | Estimat | Kumulativ |
|---|---|---|
| K3.5 ADR-032 design + Chat | ~45-60 min | ~60 min |
| K3.5 Code commit | ~15 min | ~75 min |
| K3.6 test-suite K2.6.2.F | ~45 min Code | ~120 min |
| Push (K0.4 + mini-4 + K3.5 + K3.6) | ~15 min | ~135 min |
| CI verifikation grön | ~5 min | ~140 min |

**Total tidsfönster CI grön:** ~2-2.5h Code + Chat-arbete från K3.5-
start. Allt empiriskt arbete redan klart — K3.5 är design-only.

---

## Del 6 — Operativ disciplin-status

### L_AAA-mönster-trajektoria

| Mätpunkt | L_AAA-instanser | K-faser | % |
|---|---:|---:|---:|
| Mini-3 (pre-K0) | 11 | 17 | 59% |
| Post-K0.3 | 18 | 19 | 89% |
| **Post-K0.4 (denna mini)** | **19** | **20** | **95.2%** |

**Insikt:** Frekvensen ökar med arbets-djup, ej avtagande. K0-domän är
100% (4/4 sub-faser hade L_AAA-instans). Empirisk grund för Lager 2 v0.1
→ v1.0-revisions-prioritet vid K-sista-0.

### Code's L_ZZ-precedent (empiriskt validerad)

K0-fångst-fördelning (16 totala fångster):

| Källa | Antal | % |
|---|---:|---:|
| Code transparens-rapport | 9 | 56% |
| Code STOPPA pre-edit | 3 | 19% |
| Marcus Gate-2-fångst | 3 | 19% |
| Chat-self-fångst | 1 | 6% |
| **Code totalt (transparens + STOPPA)** | **12** | **75%** |

**Insikt 1:** Code's pair-programming-pattern (L_ZZ) levererade 75% av
K0-fångster. Empirisk grund för operativt mandat: Code-prompts ska alltid
inkludera Lager 2 §6.2 (transparens-rapport) som explicit krav.

**Insikt 2:** STOPPA pre-edit (19%) är 50% av Code-fångsterna PRE-edit,
inte post-edit. Code's STOPPA-OCH-FRÅGA-disciplin förebygger fel innan
de begås, inte bara rapporterar efter. Empirisk grund för Lager 2 §6
operativt mandat.

**Insikt 3:** Chat-self-fångst utan extern trigger: 6%. Empirisk grund
för Lager 2-checklist som extern verifierings-mekanism (Code + Marcus),
INTE Chat-internal-disciplin.

### Lager 2 v0.1 → v1.0-revisions-skuld (säkras vid K-sista-0)

Operativa konsekvenser från K0-skörd (5 utvidgningar):

| Utvidgning | Trigger | Domän |
|---|---|---|
| **§1.4 (NY)** | L_AAAB | Pre-K forensisk-pass på touched config/infrastructure som explicit procedursteg |
| **§3 utvidgning** | L_AAAE | Datum-stämpel TODAY-validering vid prompt-leverans (inte bara prompt-design) |
| **§3 utvidgning #2** | L_AAAL | Frontmatter-fält verifiera governing-vs-non-governing FÖRE hook-bump-antagande |
| **§3.3 utvidgning** | L_AAAD | Bash-pattern-spec mot ADR-033 + L_C-nivå + repo-precedent FÖRE prompt-leverans |
| **§3.5 (NY)** | L_AAAK | Sessions-scope-medvetenhet ("CI grön"-definition kan vara instabilt state under aktiv cleanup-session) |

Plus latent kandidat:

| Utvidgning | Trigger | Domän |
|---|---|---|
| **§2 (NY procedursteg)** | L_AAAM | Vid lesson-add i revision, generera cross-reference-checklist FÖRE prompt-leverans |

### Output vs Process

| Dimension | Bedömning |
|---|---|
| **Output-värde** | **11/10** — Hook UTF-8-fix permanent (klass-pattern-säkring efter 2 instanser), MD029-fix bevarar Vale-disable, cross-grindvakt-audit eliminerar latent skuld, 14 lessons-skörd säkrad, reconciliation 80→94, CI på exakt förväntad baseline |
| **Process-disciplin** | **9/10** — L_AAA 95.2% konstant, men 19% STOPPA pre-edit + 75% Code-fångst visar att L_ZZ-precedent kompenserar effektivt. Code-iteration kostnad: +30-90 min över estimat, men förebygger rework |

### Operativ rekommendation för nästa Chat

**Lager 2-checklist applikation FRÅN FÖRSTA PROMPT** med explicit
fokus på de 6 v1.0-skuld-utvidgningarna:

1. §1.4 — Pre-K forensisk-pass FÖRE varje fix-rekommendation
2. §3 — Datum-stämpel TODAY vid prompt-leverans
3. §3 #2 — Frontmatter-fält governing-scope-verifikation
4. §3.3 — Bash-pattern mot strict-mode + L_C + precedent
5. §3.5 — Sessions-scope-medvetenhet (CI-state under aktiv cleanup)
6. §2 (latent) — Cross-reference-propagering vid lesson-add

**STOPPA-OCH-FRÅGA-format för Code-prompts:** Explicit krav på Lager 2
§6.2-transparens-rapport. Code's pair-programming-pattern levererar
75% av kvalitetsfångster — kan inte saknas.

---

## Del 7 — Sessionsbyte-instruktioner för nästa Chat

### Pre-prompt-läsning (i ordning)

1. **`~/Repon/marcus-system/CLAUDE.md`** — hub-konstitution, K7
   atomic-disciplin, "Ristat i sten"-bullets (L1 + L6 + config-driven),
   kontinuitet-protokoll
2. **`~/Repon/miranon-media-admin/CLAUDE.md`** — projekt-konstitution,
   Vale-arkitektur, Fas 2.5-domän
3. **DENNA fil** — sessions-state, K0-trail, K3.5-prep, vad nästa Chat
   börjar med
4. **`tasks/sessions/2026-05-17-session-6-6-6-mini-overlamning-3.md`**
   — mini-3 (för L_X.2 + minimal-repro + branschstandard-trail)
5. **`tasks/sessions/2026-05-17-lessons-reconciliation-fangst-v2.md`**
   — auktoritativ lessons-katalog 94 kandidater
6. **`~/Repon/marcus-system/templates/chat-prompt-design-checklist.md`**
   — Lager 2 operativ skydd **TILLÄMPAS FRÅN FÖRSTA PROMPT med 6 v1.0-
   skuld-utvidgningar**
7. **`tasks/lessons.md`** — bakad L1-L19
8. **`tasks/todo.md`** — projekt-plan

### Optional men rekommenderad läsning

- **`tasks/sessions/2026-05-14-session-6-6-6.md`** — Session 6.6.6
  K1.1-K2.2 trail
- **`tasks/sessions/2026-05-16-session-6-6-6-mini-overlamning.md`** —
  mini-1
- **`tasks/sessions/2026-05-17-session-6-6-6-mini-overlamning-2.md`** —
  mini-2
- **`docs/decisions/ADR-029-*.md`** — CI-arkitektur (rad 96+98 nyligen
  fixade)
- **`.githooks/pre-commit`** + **`scripts/test-pre-commit-hook.sh`** —
  Hook-UTF-8-fix (rotorsak-fix + T9 regression-test)

### Code-state-verifikation vid sessionsstart

```bash
cd ~/Repon/miranon-media-admin
git status (förvänta clean på e30a669 om K0.4+mini-4 ej pushat)
git log --oneline -10

# Verifiera de 5 K0-commitsen finns:
git log --oneline | grep -E "K0\.[1-4]|hooks|specs.*v3.md|MD029|UTF-8-audit|reconciliation"

# Verifiera reconciliation-fil-state:
head -10 tasks/sessions/2026-05-17-lessons-reconciliation-fangst-v2.md
# Förvänta: total_unique_lessons: 94, updated: 2026-05-18

# Verifiera test-suites:
bash scripts/test-pre-commit-hook.sh; echo "Exit: $?"
# Förvänta: 9/9 PASS exit 0

bash scripts/test-check-frontmatter.sh; echo "Exit: $?"
# Förvänta: 14/14 PASS exit 0 (T13 är negativ-test)

# /tmp-state-verifikation (K3.4-data, sannolikt utrensad post-reboot)
ls /tmp/k34-minimal-repro/ /tmp/k345-en-repro/ 2>&1
# Förvänta: filer kan saknas. Om så: rekonstrueras från K3.4-rapport-
# data eller from upstream-issue-text-fil (Marcus' Downloads).

cd ~/Repon/marcus-system
git status
git log --oneline -3
```

### Var nästa Chat-iteration börjar

#### K3.5 — ADR-032 Draft → Accepted (design + Code-commit)

Detta är **design-only K-fas**. All empirisk grund klar:

- L_X.2 verifierad (K3.4 11-case minimal-repro)
- 3 mitigerings-familjer falsifierade (K3.1.b)
- Branschstandard-referenser samlade (Elastic, GitLab, Stream + Vale CLI
  #387 + GitLab MR #88894)
- Upstream-issue-text-fil färdig (publicering avvaktar)
- 6 K3-PENDING-filer med per-fil-mitigation-strategi klassificerad

**ADR-032 ska dokumentera:**

| Sektion | Innehåll |
|---|---|
| Status | Proposed → Accepted |
| Context | L_X.2-empirisk, 3-mitigerings-uttömning, Vale 3.14.1 |
| Decision | Helfil-disable formaliserad mitigering |
| L_X.1 vs L_X.2 | Formell distinktion |
| 4-lager-arkitektur | Befintlig ADR-022 + nya distinktion |
| Branschstandard-refs | Elastic, GitLab, Stream + #387 + MR #88894 |
| Upstream-issue-länk | Placeholder eller URL |
| Defer-strategi | Per-fil + lift-protocol |
| Regression-skydd | K2.6.2.F (K3.6) pekare |
| Consequences | D.4/D.5 K3-PENDING permanent tills upstream-fix |
| Spårbarhet | K3.1.b-K3.4-trail + K0-trail för CI-baseline |

**Operativ konsekvens lessons.md:** K3.5-prompt måste explicit hantera
Problem A vs Problem B (helfil-disable vs Brand-textual-fix). Inte
detalj — kärnval.

### Pre-flight Lager 2-skuld (TILLÄMPAS FRÅN FÖRSTA PROMPT)

Nästa Chat MÅSTE applicera dessa 6 v1.0-skuld-utvidgningar från
första prompt:

1. **§1.4 — Pre-K forensisk-pass.** FÖRE K3.5-design: verifiera
   projektkunskap för senaste ADR-032-state, K3.5-prep-data, branschstandard-
   refs. **Aldrig formulera ADR-design utan att läsa K3.1.b-K3.4-trail
   först.**
2. **§3 — Datum-stämpel TODAY.** ADR-032 etablerings-datum = exekverings-
   TODAY. Code's K7.7-disciplin applicerad på Chat-side. **Verifiera
   datum vid prompt-leverans.**
3. **§3 #2 — Frontmatter governing-scope.** ADR-032 ÄR governing doc
   (per ADR-030 § Del 2-listan). Hook auto-bumpar `updated:`. Verifiera
   förväntad hook-bump-beteende vs non-governing (typ reconciliation).
4. **§3.3 — Bash-pattern mot strict-mode.** Inga bash-patterns
   förväntade i K3.5 (design-only), men gäller för K3.6 test-suite-
   prompt.
5. **§3.5 — Sessions-scope-medvetenhet.** Post-K3.5/K3.6 push förväntas
   CI grön. INGEN "CI grön = mål"-feltolkning under Vale-cleanup-domänen
   längre — K3.5+K3.6 ÄR Vale-cleanup-leverans.
6. **§2 (latent) — Cross-reference-propagering.** Vid lesson-add i K3.5
   eller K3.6 revisions, generera cross-reference-checklist.

### Disciplin för K3.5-design

| Princip | Tillämpning |
|---|---|
| L1 — Pre-K forensisk-pass | Läs K3.1.b + K3.2 + K3.4-trail FÖRE ADR-032-design |
| L2 — Web-research FÖRE strategi | Branschstandard-refs verifierade redan (mini-3 Del 7) |
| L6 — 11/10 GOLV | ADR-032 ska matcha Elastic/GitLab/Stream-precedent, inte bara "good enough" |
| L_LLL — Intra-prompt konsistens | ADR-032-prosa + kod-exempel matchar EXAKT |
| L_AAA-medvetenhet | Förvänta minst 1-2 STOPPA per K-fas pre-edit; designa för fångst |
| L_ZZ | Code-prompt har explicit §6.2-transparens-rapport-krav |
| K7 — Atomic semantik | K3.5 = ADR-design + commit, INTE Vale-config-edit (det är K3.6+) |

---

## Del 8 — K3.5-operativt block (NY)

### Checklista för K3.5-start

Nästa Chat följer denna ordning för K3.5:

#### Steg 1 — Sessions-state-verifikation (~5 min)

- [ ] Läs DENNA mini-4-fil komplett
- [ ] Läs mini-3 Del 7 (empirisk grund för K3.5)
- [ ] Verifiera repo-state (HEAD = e30a669 eller senare om push gjord)
- [ ] Verifiera test-suites gröna (T9 + T13)
- [ ] Verifiera CI-state matchar förväntad Session 6.6.6 baseline

#### Steg 2 — Empirisk grund samlad (~5 min — redan klart)

- [x] L_X.2 verifierad (K3.4 11-case minimal-repro)
- [x] 3 mitigerings-familjer falsifierade (K3.1.b)
- [x] Branschstandard-refs samlade (mini-3 Del 7)
- [x] Upstream-issue-text-fil färdig (Marcus' Downloads)
- [x] 6 K3-PENDING-filer klassificerade (Del 5 ovan)

#### Steg 3 — ADR-032 design (~45 min Chat)

- [ ] Skapa ADR-032-text-skiss (Status / Context / Decision / Consequences /
      Spårbarhet)
- [ ] Verifiera mot ADR-022-precedent (existerande Vale-config-ADR)
- [ ] Verifiera mot ADR-030-precedent (grindvakts-ADR)
- [ ] Hantera Problem A vs Problem B för lessons.md
- [ ] Inkludera L_X.1 vs L_X.2 formell distinktion
- [ ] Inkludera branschstandard-precedent-tabell
- [ ] Inkludera lift-protocol vid upstream-fix
- [ ] Pekare till K3.6 test-suite

#### Steg 4 — Code-prompt formulering (~15 min Chat)

- [ ] Code-prompt med Lager 2 §6.2-krav explicit
- [ ] str_replace för ADR-032 Status: Reserved → Proposed (eller
      Accepted vid maintainer-respons)
- [ ] Frontmatter-handling (ADR-032 ÄR governing → hook auto-bumpar)
- [ ] Commit-message-template
- [ ] Verifikation: ADR-katalog README uppdatering (om ADR-032 redan
      i README)

#### Steg 5 — Code-exekvering (~15 min)

- [ ] Code skapar/uppdaterar ADR-032
- [ ] check-frontmatter exit 0
- [ ] markdownlint-cli2 exit 0
- [ ] Atomic commit
- [ ] Verifiera commit-trail

#### Steg 6 — K3.6 test-suite (~45 min Code)

- [ ] K2.6.2.F test-suite för Vale-config regression-skydd
- [ ] Test-cases för L_X.2-precondition
- [ ] Test-cases för helfil-disable-funktion
- [ ] Verifiera 0/0/0/0

#### Steg 7 — Push + CI-verifikation (~15 min)

- [ ] Push alla pending commits (K0.4 + mini-4 + K3.5 + K3.6)
- [ ] CI grön förväntad
- [ ] Per-jobb-verifikation

### K3.5 design-fråga lessons.md (operativt val)

| Sub-alt | Lösning | Operativ konsekvens |
|---|---|---|
| A | Helfil-disable enbart Problem A; Brand-fel text-fixas FÖRST | Renaste content. Mer arbete (textual edit + commit). Brand-aktivering bevarad. |
| B | Helfil-disable täcker bägge (Brand-fel maskeras tillsammans med L_X.2) | Mindre arbete (1 disable-commit). Content-drift döljs (3 Brand-fel kvarstår i lessons.md-prosa men icke-flaggade). |
| C | Vale.Terms-only disable (per-regel) + behåll Brand-aktivering | Mest granulärt. Vale-config-komplexitet ökar. Per-regel-disable kan vara fragil. |

**Min preliminära rekommendation (Chat-design):** Alt A. Skäl:

- Content-renlighet > Vale-config-enkelhet
- "Miranon" → "Miranon Media" textual fix är mekanisk, ej design-tung
- Bevarar Brand-aktivering som regression-skydd
- Matchar branschstandard (text-fix > tooling-disable)

**Beslut deferas till K3.5-Chat-design.** Marcus kan välja Alt B om
bandwidth-bevarande prioriteras.

### Empirisk grund-pekare för K3.5

| Domän | Källa | Status |
|---|---|---|
| L_X.2-bevisning | K3.4-rapport + minimal-repro | KLAR |
| 3-mitigerings-falsifikation | K3.1.b-rapport | KLAR |
| Vale 3.14.1 senaste stabila | L_JJJ web-research | KLAR |
| Branschstandard-refs | mini-3 Del 7 + denna Del 5 | KLAR |
| Upstream-issue-text | Marcus' Downloads | KLAR (publicering avvaktar) |
| ADR-022-precedent | Live i repo | KLAR |
| ADR-030-precedent | Live i repo | KLAR |
| 6 K3-PENDING-filer | denna Del 5 | KLAR |
| Problem A vs B lessons.md | denna Del 5 + Del 8 | KLAR |

**Inga empiriska luckor** — K3.5 är design-only. Code-arbete = mekanisk
ADR-edit + commit.

---

## Avslut

> **Slut på mini-överlämning 4.**
>
> Detta dokument är komplett sessions-state-snapshot post-K0.4 paus
> pre-K3.5. Vid sessionsbyte: nästa Chat-iteration läser DENNA fil +
> auktoritativa filartefakter per Del 7, applicerar Lager 2-checklist
> från första prompt med 6 v1.0-skuld-utvidgningar, börjar K3.5 ADR-032-
> design.
>
> Session 6.6.6 är inte avslutad — paus pre-K3.5 pga komplett K0-enhet
> levererad + Chat-bandwidth-bevarande för K3.5 design-tunga arbete.
> Naturlig pausnivå.
>
> CI förväntat röd på 3 errors Miranon.Brand i lessons.md tills
> K3.5+K3.6 levererar (~2-2.5h från K3.5-start). Detta är **design per
> Session 6.6.6 sessionsdok**, inte regression.
>
> Operativt mandat för nästa Chat: 11/10 GOLV + L1 forensisk-pass-
> disciplin + L_ZZ pair-programming-precedent + Lager 2 §6.2-transparens-
> rapport-krav i alla Code-prompts.

---

## Snabbreferens (för kall sessionsstart)

**HEAD:** `e30a669` (K0.4)
**Branch:** `main` (1 commit ahead av origin)
**CI-state:** Förväntad Session 6.6.6 baseline (3 Brand-errors lessons.md)
**Nästa K-fas:** K3.5 ADR-032 design
**Tidsfönster CI grön:** ~2-2.5h från K3.5-start
**Reconciliation:** 94 unika lessons
**Lager 2:** v0.1 → v1.0-revision-skuld (6 utvidgningar)
**Pair-programming:** L_ZZ verifierad 75% K0-fångster

**Auktoritativa filer för K3.5:**

1. Denna mini-4 (komplett state)
2. mini-3 Del 7 (L_X.2-empiri + branschstandard)
3. reconciliation v2-final post-K0.4 (94 lessons)
4. Lager 2 checklist + 6 v1.0-skuld-utvidgningar
5. ADR-022 + ADR-030 (precedent för ADR-032)

**Marcus' open-questions:**

- Push-pacing: K0.4 + mini-4 + K3.5 + K3.6 tillsammans, eller separat?
- GitHub-issue-publicering: när filar Marcus upstream-issue?
- lessons.md Problem A/B/C: Alt A (text-fix först) preliminär rek.
