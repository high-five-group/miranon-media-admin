---
updated: 2026-05-20
review_by: 2026-08-20
status: draft
owner: marcus803
---

# Session 6.6.6 — Mini-överlämning 5 (post-K3.6 + arkitektur-revision pre-K-sista-0)

> **Trail från K3.6 Code-leverans (2 sannolika commits eller fler) till
> K-sista-0 lessons-konsolidering.** Innehåller komplett sessions-state-
> snapshot post-K3.6 + paradigm-skifte i K-sista-1-arkitektur baserat på
> web-research om CLAUDE.md anti-bloat + distribuerad operativ disciplin
> + scope-separation mot Session 6.7 (CLAUDE.md-audit + skills-
> extraktion + checklist-trimning).
>
> **Status:** Aktiv mini-överlämning (skapad 2026-05-20 post-K3.6
> Code-exekvering, pre-K-sista-0-design).
> **Föregående mini-överlämningar:** 1 (`cc01761`), 2 (`6179402`),
> 3 (skapad 2026-05-17), 4 (skapad 2026-05-18).
> **Parent-session:** [`2026-05-14-session-6-6-6.md`](2026-05-14-session-6-6-6.md).
> **Arkiveras:** Tillsammans med Session 6.6.6-sessionsdok vid K-sista-1
> (`tasks/sessions/archive/2026-05/`).
>
> **KRITISK NY KONTEXT:** Web-research (2026-05-20 denna Chat-iteration)
> avslöjade anti-bloat-konsensus för CLAUDE.md + distribuerad operativ
> disciplin-arkitektur. K-sista-1 SCOPE REVIDERAT — defer
> CLAUDE.md-audit/Project Instructions/skills-extraktion till
> **Session 6.7** (som redan har prep-fil 2026-05-14 med exakt detta
> scope). K-sista-1 levererar smalare: lessons-bake-in + Lager 2 v1.0
> + hub-sync + web-research-rule + Session 6.7-prep-uppdatering.

---

## Del 0 — Sammanfattning för kall sessionsstart

### TLDR

Session 6.6.6 har levererat:

- **K3.5 ✅ KLAR** (2 commits, `8724e39` + `2d55ea0`): ADR-032 Vale L_X.2 helfil-disable formaliserad + lessons.md Brand-text-fix (3 substitutioner). Brand-aktivering bevarad via Alt A.
- **K3.6 ✅ KLAR** (5 commits, `40ed346` → `617423d`): K2.6.2.F regression-test-suite (AssertFlip-mönster för L_X.2 lift-trigger) + 4 pre-existing-skulder lösta atomiskt + 1 emergent broken-link-fix (K3.6-E errata-ai → vale-cli repo-rename, fångad av lychee CI).
- **K3.6 inkluderade Alt B-utvidgning** (changed-files-pattern-fix) per 11/10-disciplin "lös skulder, skapa inte nya".
- **Push genomförd 2026-05-20** — `b38f2ad → 617423d` (7 commits). **CI grön** — run `26175893903`.
- **Vale-baseline 0/0/0** — FÖRSTA gången sedan Vale-aktivering Session 6.6 K6.

**Återstår Session 6.6.6:**

- **K-sista-0** — Lessons-konsolidering 121 → 10-15 hub-lessons (~1.5h Chat + 15 min Code)
- **K-sista-1** — Lessons-bake-in + Lager 2 v0.1 → v1.0 + hub-sync + **web-research-rule (NY)** + **Session 6.7-prep-uppdatering (NY)** + arkivering (~2-2.5h)

**Beslut bekräftat av Marcus 2026-05-20 (denna Chat):**

- Paradigm-skifte i K-sista-1-arkitektur (web-research-baserat anti-bloat)
- Scope-separation K-sista-1 vs Session 6.7
- Web-research-rule lyfts till hub-CLAUDE.md + spoke-CLAUDE.md som "Ristat i sten"-bullet i K-sista-1
- `session-handoff.skill` (Del 13) som ny skill för Session 6.7 K4

### Vad nästa Chat ska göra (i ordning)

1. **K-sista-0 lessons-konsolidering** (Chat-arbete tunga, 121 → 10-15 hub-lessons)
2. **K-sista-1 Code-leverans** (8 atomic commits A-H per K7-disciplin)
3. **Förbered Session 6.7-prep-fil-uppdatering** (NY scope per K-sista-1-F)
4. **Arkivera Session 6.6.6-sessionsdok** till `tasks/sessions/archive/2026-05/`

### Disciplin-status pre-K-sista-0

- **L_AAA-trajektoria (Code Block VII.2):** 25 instanser / 26 K-faser = 96.2% — frekvensen stabiliserad nära 95-97% (primär räkning, K-fas-empirisk)
- **L_AAA-trajektoria (Chat-design-instanser):** 27 sub-instanser identifierade för K-sista-0-konsolidering (sekundär räkning, lessons-skörd-grund)
- **Code-fångst K3.6:** 100% extern (87.5% lokal pre-commit + 12.5% CI). Chat-self-fångst: **0%** stabilt över 3 K-faser
- **Output 11/10:** ADR-032 + K2.6.2.F + 5 skulder-lösning (inkl. emergent K3.6-E) + Vale-baseline 0/0/0 beyond branschstandard
- **Process 9/10:** Chat-internal-disciplin 0%, externt verifierbart 100% genom Code + lychee CI

---

## Del 1 — K-fas-status post-K3.6

### Komplett K-fas-trail Session 6.6.6

| K-fas | Status | Output | Commit(s) |
|---|---|---|---|
| K1.1 (forensisk-baseline) | ✅ KLAR | 601 fynd-baseline | RAPPORTERA-only |
| K2.0-K2.1.7 (config-pivots) | ✅ KLAR | 7 L_I-iterationer | RAPPORTERA-only |
| K2.2 (atomic config-leverans) | ✅ KLAR | 601 → 29 lokalt | `cec2fa5` |
| K2.6.2.D.4 v1 (initial-fix-försök) | FAILED | 7 mitigerings-försök misslyckades | (revert-trail) |
| K2.6.2.D.4 v2 (per-fil-K3-PENDING) | ✅ KLAR | 5 K3-PENDING-disables | `35aaf9a`-`849485d` |
| K2.6.2.D.5 (BUILD-LOG K3-PENDING) | ✅ KLAR | 1 K3-PENDING-disable | `2b4678f` |
| K3.1.a (web-research) | ✅ KLAR | 3-mitigerings-uttömning + Vale 3.14.1 | — |
| K3.1.b (empirisk falsifierings-test) | ✅ KLAR | TokenIgnores+IgnoredScopes+BlockIgnores alla falsifierade | — |
| K3.2 (strukturell pre-screen) | ✅ KLAR | L_WWW-precondition + 5/6 D.4/D.5 L_X.2 | — |
| K3.3 (deploy K3.2-klassificering) | ✅ KLAR | 1 prosa-fix + 3 K3-PENDING-updates | `edf9705`-`849485d` |
| K3.4 (minimal-repro) | ✅ KLAR | 11-case minimal-repro reproducerar L_X.2 | — |
| K3.4.5 (upstream-issue-text) | TEXT KLAR | filartefakt levererad, publicering avvaktar | — |
| K0 (CI-baseline-korrektur) | ✅ KLAR | 5 commits hook-fix + v3.md bump + ADR-029 MD029 + cross-grindvakt audit | `3251d2f`-`e30a669` |
| **K3.5 (ADR-032 design + Brand-fix)** | **✅ KLAR 2026-05-20** | **ADR-032 Accepted + 3 Brand-substitutioner + 5 K3-PENDING-uppgraderade** | `8724e39` + `2d55ea0` |
| **K3.6 (K2.6.2.F test-suite + 4 skulder + emergent K3.6-E)** | **✅ KLAR 2026-05-20** | **Test-suite + CI-integration + ADR-031 Status-fix + ADR-033-add + Miranon.Undvik-fix + README IL-clarification + changed-files-pattern-utökning (Alt B) + emergent broken-link-fix (errata-ai → vale-cli repo-rename)** | **`40ed346` (K3.6-A) + `a90c53c` (K3.6-B) + `dba4643` (K3.6-C) + `91960f7` (K3.6-D) + `617423d` (K3.6-E)** |
| K-sista-0 (lessons-konsolidering) | EJ STARTAD | 94 → 10-15 hub-lessons + nya L_AAA-25/26/27 | Nästa K-fas |
| K-sista-1 (bake-in + hub-sync + arkivering + web-research-rule + Session 6.7-prep-update) | EJ STARTAD | Smalare scope per denna mini-överlämning | Final |

### Push-pacing-status — GENOMFÖRD

Per Alt II push-pacing (etablerad mini-4):

- **Push genomförd 2026-05-20** — 7 commits från `b38f2ad` → `617423d`
- **CI grön** — run `26175893903` (https://github.com/marcus803/miranon-media-admin/actions/runs/26175893903)
- **Alla 5 jobs PASS:** Detect changed files → Lint+Audit+TypeCheck → Test+Build (skipped per Strategi E doc-only) → Docs link check → CI Passed
- **Vale-baseline post-K3.6: 0 errors, 0 warnings, 0 suggestions** ✅ (FÖRSTA GÅNGEN sedan Vale-aktivering Session 6.6 K6)
- **ADR-räkning: 33 (1-33 komplett, ingen drift)**

### Test-vale-regression-state (NY post-K3.6)

K3.6-A levererade:

- `tests/vale-regression/` med 7 fixtures (README + 3 cases + .vale.ini + 2 styles-filer)
- `scripts/test-vale-regression.sh` (3 tester: T1 inverterad assertion, T2 helfil-disable, T3 Brand ej maskerad)
- CI-step "Validate Vale L_X.2 regression-test-suite" efter Vale-step i docs-jobbet
- Changed-files-pattern utökad med tests/vale-regression/** + scripts/test-vale-regression.sh

**Lift-trigger-mekanism aktiv:** När T1 går från PASS (bug bekräftad) → FAIL (Vale rapporterar inte längre L_X.2-fynd), upstream-fix har landat. ADR-032 § Lift-protokoll aktiveras automatiskt vid framtida Vale-version-bump.

### Pre-existing-skulder lösta i K3.6

| # | Skuld | Lösning K3.6 | Commit |
|---|---|---|---|
| 1 | ADR-031 README Status `Draft` vs faktisk `Accepted` | str_replace till `Accepted` | K3.6-B `a90c53c` |
| 2 | ADR-033 saknas i README ADR-katalog | Tillagd rad efter ADR-032 (empirisk titel "Shellcheck-strict-grindvakt för bash-scripts") | K3.6-B `a90c53c` |
| 3 | 2 Miranon.Undvik suggestions | Rad 1063 FIX "enkelt"→"småskaligt"; rad 99 IL-disable (legitim meta-citat) | K3.6-C `dba4643` |
| 4 | README.md Vale.Terms-inline-disable rad 57-59 | BEHÅLLEN — empiriskt verifierat behov (github→GitHub canonical-substitution); kommentar uppdaterad till "L_X.1 IL-mitigation per ADR-032" | K3.6-D `91960f7` |
| **5 (emergent)** | **Broken Vale-issue-URL i ADR-032 + tests/README** | **Vale GitHub repo flyttat errata-ai/vale → vale-cli/vale (efter mini-3 Del 7 referens-samling 2026-05-17). GitHub redirectar repo-rot men INTE issue-URLs. Fångad av lychee CI-grindvakt post-K3.6-A push** | **K3.6-E `617423d`** |

**Nya skulder skapade i K3.6:** Inga per Alt B (komplett lösning). Changed-files-pattern-luckan löst i K3.6-A istället för att deferas. Skuld 5 (emergent) var inte skapad av K3.6 — den var pre-existing från mini-3-referens-samling som lychee fångade post-push. Marcus' direktiv "gillar inte att dra med skulder" respekterat.

**Empirisk validering av Strategi E + lychee-grindvakt:** Lokal Vale + markdownlint + shellcheck + test-suite var alla 0/0/0 pre-push. Endast lychee fångade broken-link (kräver internet-traffic, kan inte ersättas av lokal pre-commit). ADR-029-rationale empiriskt validerad ("lychee adderar broken-link-detection som inte fanns innan — kvalitetshöjning").

---

## Del 2 — Sessions-trail

### Sessions-numrerings-klargöring (KRITISK)

Empirisk verifikation via projektkunskap 2026-05-20:

| Session | Scope | Status |
|---|---|---|
| Session 6.6 | Docs-grindvakter + frontmatter + observations-pass | ✅ KLAR 2026-05-15 |
| Session 6.6.5 | Dependabot-strategi 2026 | ✅ KLAR 2026-05-16 |
| **Session 6.6.6** | **Vale-cleanup (VI ÄR HÄR)** | **Pågående** |
| Session 6.6.7 | shellcheck-strict-grindvakt (ADR-033) | ✅ KLAR 2026-05-16 |
| **Session 6.7** | **CLAUDE.md-audit + skills-extraktion + checklist-trimning** | **Planerad (prep-fil 2026-05-14)** |

**Viktigt för nästa Chat:** Session 6.7 (inte 6.6.7) är CLAUDE.md-audit-sessionen. Session 6.6.7 är redan KLAR (shellcheck). Marcus använde "6.6.7" felaktigt i Chat 2026-05-20 men menade Session 6.7 (bekräftat 2026-05-20).

### Mini-överlämningar-trail

| Mini | Skapad | Scope | Commit |
|---|---|---|---|
| Mini-1 | 2026-05-16 | Session 6.6.6 K1.1-K2.6.2.D.4 v1-trail | `cc01761` |
| Mini-2 | 2026-05-17 | Session 6.6.6 K2.6.2.D-pivot + reconciliation v1 | `6179402` |
| Mini-3 | 2026-05-17 | K3.1.b-K3.4 + reconciliation v2-final | `bcd5e22` (eller motsvarande) |
| Mini-4 | 2026-05-18 | K0-trail + K3.5-prep + Lager 2 v0.1-skuld + 6 v1.0-utvidgningar | `b38f2ad` |
| **Mini-5 (denna)** | **2026-05-20** | **K3.5+K3.6-trail + arkitektur-revision + scope-separation vs Session 6.7** | (denna commit i K-sista-1) |

---

## Del 3 — Web-research-syntes (KRITISK ny kontext)

### Bakgrund

Marcus bad 2026-05-20 om "web-research på hur du och claude (Anthropic) fungerar bäst tillsammans med mig och vår dokumentation". Per L_II + L_18 (web-research som operationell 11/10-disciplin) genomförde Chat omfattande research på följande domäner:

1. CLAUDE.md best practices + instruction budget
2. Anti-bloat-patterns för Claude Code
3. Claude Code hooks (PreToolUse/PostToolUse) som enforcement-mekanism
4. Claude.ai Projects (Chat-side) — Project Instructions + Profile Preferences
5. Lessons-learned anti-patterns + knowledge-accumulation

### Empirisk huvudfynd — instruction budget

**Anti-bloat-konsensus är empiriskt entydig:**

| Källa | Empirisk slutsats |
|---|---|
| Claude Code docs (Anthropic officiell) | "150-200 instruction budget, system prompt tar ~50, kvarstår ~100-150 slots" |
| HumanLayer (production-team) | "Vi håller vår CLAUDE.md under 60 rader" |
| Anthropic/DataCamp | "CLAUDE.md instructions följs ~70%. Hooks enforce rules 100%" |
| TECHSY (mars 2026) | "Past 80 rader rules dropping; past 200 rader large blocks ignored; past 500 ord dense rules adherence collapses" |
| BSWEN/Reddit (april 2026) | "40 line root, rest in skill files Claude pulls on demand" |
| Bijit Ghosh (maj 2026) | "A 60-line file where every line is load-bearing > 400-line file with 30 useful rules buried in 370 lines of noise" |
| DataCamp (mars 2026) | "Official recommendation under 200 lines per file, some experienced teams run fewer than 60" |

**Konsekvens:** Min ursprungliga K-sista-1-rekommendation ("balanserad ~150-200 rader spoke-CLAUDE.md med operativ disciplin") skulle EMPIRISKT DEGRADERA compliance — det motsatta av Marcus-intentionen.

### Empirisk huvudfynd — Chat vs Code distinktion

Marcus arbetar med Claude i **två separata kontexter**:

| Kontext | Mekanism för persistent instructions | Compliance | Optimum-storlek |
|---|---|---|---|
| **Claude.ai Chat** (web/desktop) | Project Instructions (i Claude.ai-projekt-settings) | Hög (system-level) | 200-800 ord |
| **Claude.ai Chat** (alla projekt) | Profile Preferences (globala settings) | Hög (system-level) | <500 ord |
| **Claude Code** (terminal) | CLAUDE.md (spoke) | ~70% | <60-200 rader |
| **Claude Code** (enforcement) | Hooks (.claude/settings.json) | **100%** | N/A |
| **Båda** | Projektkunskap (lessons.md, ADRs) | Reference | Obegränsad |

**Konsekvens:** Min ursprungliga "baka in i spoke-CLAUDE.md"-plan missade Project Instructions-mekanismen helt. Project Instructions är där 90% av Chat-side-disciplin egentligen bör bo — inte i CLAUDE.md som Chat inte läser automatiskt.

### Empirisk huvudfynd — Hooks som 100% compliance

Claude Code stödjer hooks som körs vid lifecycle-events:

- **PreToolUse** — körs FÖRE tool-användning (Edit/Write/Bash). Kan blockera via exit code 2 + stderr.
- **PostToolUse** — körs EFTER tool-användning. Validation + format-cleanup.
- **SessionStart** — körs vid session-start. Context-injection + env-setup.
- **UserPromptSubmit** — körs vid user prompt-submit. Context-augmentering.

**Empirisk källa:** "Without this hook, you would need to write 'never run dangerous commands' in your CLAUDE.md and trust that the model always follows the instruction. With this hook, dangerous commands are physically blocked at the execution layer. The agent cannot bypass it, forget it, or reason its way around it."

**Konsekvens:** Där vi kan automatisera regler (typ vale-validation pre-Edit, shellcheck pre-Write), hooks ger 100% compliance vs CLAUDE.md 70%. Detta är Session 6.7-domän eller framtida session.

### Empirisk huvudfynd — L_AAA-mönstret är attackerbart

Mina 27 L_AAA-instanser är ALLA av samma klass: **antaganden utan empirisk verifikation**.

- L_AAA-21: Gissade TODAY utan empirisk källa
- L_AAA-22: Multi-del-leverans istället för inline-paketering
- L_AAA-23: Refererade fiktiv ADR-022 § Del 5
- L_AAA-24: Chat-konversation istället för kodblock
- L_AAA-25: Använde förenklad fixture istället för verbatim real-repo
- L_AAA-26: Gissade ADR-033-titel istället för att läsa filen
- L_AAA-27: Bash-pattern utan strict-mode-pre-verifikation

**Klass-domän:** Project Instructions (Chat-side persistent prompt). Profile Preferences (universell). Nyckel-formulering: "Cite sources, never invent ADR-refs/dates/titles. Empirisk verifikation FÖRE antaganden. Web-research operationell del av 11/10."

### Workshop / persistent memory (övervägande för framtid)

Web-research avslöjade `zachswift615/workshop` (GitHub-projekt) som ger Claude Code persistent memory + automatisk context-capture mellan sessions. Detta är värt att överväga senare som Session 6.8+ eller bortom — bortom Session 6.6.6/6.7-scope.

---

## Del 4 — "Var lever reglerna" — distribuerad arkitektur-karta

### Sanningskälla-arkitektur post-research

```text
┌─────────────────────────────────────────────────────────────────┐
│ CLAUDE.AI (CHAT-SIDE)                                           │
│ — Här Marcus jobbar med Claude i web/desktop för design,        │
│   lessons-konsolidering, strategi                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ⭐ Profile Preferences (~300-400 ord)                            │
│    Plats: Claude.ai → Profil → Settings → Personalization       │
│    Scope: Globala alla Claude.ai-projekt                        │
│    Roll: Universella discipliner som gäller alla projekt        │
│    Innehåll:                                                    │
│    ├─ "Marcus använder 11/10 disciplin (beyond branschstandard)"│
│    ├─ "Alltid empirisk verifikation före antaganden"            │
│    ├─ "Cite sources, never invent refs/dates/titles"            │
│    ├─ "Web-research som operationell 11/10-disciplin"           │
│    └─ Format-disciplin (svar på svenska, kodblock för leveranser)│
│    Status: Antagligen ej satt — Marcus bekräftar i K-sista-1    │
│                                                                 │
│ ⭐ Project Instructions (~500-700 ord) [NY KOMPONENT]            │
│    Plats: Claude.ai → miranon-media-admin-projekt → Settings    │
│    Scope: Endast denna projekt-chattar                          │
│    Roll: Projekt-specifik operativ Chat-disciplin               │
│    Innehåll (designas i Session 6.7 K4):                        │
│    ├─ Projekt-konstitution (status, fas, Session-nummer)        │
│    ├─ L_AAA-mitigations konkret operationaliserade              │
│    ├─ Pekare till projektkunskap (CLAUDE.md, lessons, ADRs)     │
│    ├─ "Forensisk-pass FÖRE design"-protokoll (L1)               │
│    ├─ "Web-research FÖRE strategi-val"-protokoll (L_II + L_18)  │
│    ├─ "Bilaga-paketering inline"-format-disciplin (L_AAA-22)    │
│    └─ "Cite empirisk källa för datum/ADR-refs"-disciplin        │
│    Status: Antagligen ej satt — Marcus bekräftar i K-sista-1    │
│                                                                 │
│ Projektkunskap (uppladdade filer, obegränsad mängd)             │
│    Plats: Claude.ai → projekt → Knowledge                       │
│    Roll: Reference-material för Chat                            │
│    Innehåll:                                                    │
│    ├─ spoke-CLAUDE.md (uppladdad)                               │
│    ├─ lessons.md (uppladdad)                                    │
│    ├─ Aktiva sessionsdok                                        │
│    ├─ ADRs                                                      │
│    └─ Övriga refs                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ CLAUDE CODE (TERMINAL-SIDE)                                     │
│ — Här Marcus jobbar med Claude i terminal/VS Code för           │
│   implementation, commits, verifikation                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ~/Repon/marcus-system/CLAUDE.md (~50-100 rader) Hub             │
│    Roll: Universella regler alla projekt                        │
│    Innehåll:                                                    │
│    ├─ "Ristat i sten"-bullets (UNIVERSAL)                       │
│    ├─ K7 atomic-disciplin                                       │
│    ├─ L_ZZ pair-programming-protokoll                           │
│    ├─ Hub-spoke-portabilitet-pattern                            │
│    ├─ Code-host-antagande-disciplin                             │
│    └─ ⭐ Web-research-disciplin [NY i K-sista-1]                │
│    Status: Existerar, uppdateras i K-sista-1                    │
│                                                                 │
│ ~/Repon/miranon-media-admin/CLAUDE.md (~60-100 rader) Spoke     │
│    Roll: Projekt-specifik Code-konstitution                     │
│    Innehåll:                                                    │
│    ├─ Projekt-status (current fas, Session-nummer)              │
│    ├─ 6-10 testbara regler Code konsekvent missar utan dem      │
│    ├─ Pekare: "Läs lessons.md för X, ADR-katalog för Y"         │
│    ├─ Build/test/lint-kommandon                                 │
│    └─ ⭐ Web-research-disciplin-bullet [NY i K-sista-1]         │
│    Status: Existerar, uppdateras i K-sista-1 (smal scope)       │
│    KRYMPS i Session 6.7 (skills-extraktion → CLAUDE.md tunn)    │
│                                                                 │
│ ~/Repon/miranon-media-admin/skills/ [Session 6.7 SCOPE]         │
│    Roll: Extraherade operativa procedurer från CLAUDE.md        │
│    Innehåll (designas Session 6.7 K4):                          │
│    ├─ session-start.skill                                       │
│    ├─ session-end.skill                                         │
│    ├─ phase-end-verify.skill                                    │
│    ├─ lessons-hub-sync.skill                                    │
│    ├─ pre-commit-biome.skill                                    │
│    ├─ chat-self-review.skill                                    │
│    └─ ⭐ web-research-discipline.skill [NY scope-tillägg]       │
│    Status: EJ STARTAD — Session 6.7-domän                       │
│                                                                 │
│ .claude/settings.json + hooks (där 100% compliance behövs)      │
│    Roll: Enforcement-mekanism                                   │
│    Befintligt: pre-commit + check-frontmatter + shellcheck      │
│    Övervägande Session 6.7+:                                    │
│    ├─ PreToolUse-hook för markdown-validation                   │
│    ├─ PostToolUse-hook för auto-format                          │
│    └─ SessionStart-hook för forensisk-pass-automation           │
│    Status: Befintliga aktiva, utvidgning defer Session 6.7+     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ DELAD INFRASTRUKTUR (TRAIL + KUNSKAP)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ~/Repon/marcus-system/tasks/lessons.md (Hub-lessons)            │
│    Roll: UNIVERSAL-flaggade lessons från alla spokes            │
│    Status: 8 konsoliderade rader från Session 6.6.5             │
│    K-sista-1 uppdaterar med konsoliderade Session 6.6.6-lessons │
│                                                                 │
│ ~/Repon/miranon-media-admin/tasks/lessons.md (Spoke-lessons)    │
│    Roll: Projekt-specifika lessons + trail med datum + källa    │
│    Status: L1-L19 bakade. K-sista-0 konsoliderar 94 kandidater  │
│    från Session 6.6.6 till 10-15 hub-lessons + bakar in         │
│                                                                 │
│ docs/decisions/ADR-*.md (ADRs)                                  │
│    Roll: Arkitektur-trail                                       │
│    Status: 33 ADR:er (ADR-001 till ADR-033)                     │
│                                                                 │
│ ~/Repon/marcus-system/templates/chat-prompt-design-checklist.md │
│    Roll: Operativt verktyg för Chat-prompt-design               │
│    Status: v0.1 (etablerad Session 6.6.6 K0.3)                  │
│    K-sista-1 bumpar till v1.0 med 8 utvidgningar internaliserade│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Var reglerna NU bor vs efter K-sista-1 + Session 6.7

| Regel-domän | Nu (pre-K-sista-1) | Post K-sista-1 | Post Session 6.7 |
|---|---|---|---|
| Universella Chat-discipliner | Lessons + checklist | Lessons + checklist + (manuellt Profile Preferences) | Profile Preferences |
| Projekt-specifik Chat-disciplin | Lessons + checklist | Lessons + checklist | Project Instructions |
| Universella Code-discipliner | Hub-CLAUDE.md | Hub-CLAUDE.md + web-research-rule | Hub-CLAUDE.md (tunn) + hub-skills |
| Projekt-specifik Code-disciplin | Spoke-CLAUDE.md | Spoke-CLAUDE.md + web-research-rule | Spoke-CLAUDE.md (tunn) + spoke-skills |
| Operativa procedurer | I CLAUDE.md (bloat) | I CLAUDE.md (oförändrat tills Session 6.7) | Extraherade till skills |
| Enforcement | Pre-commit + CI | Oförändrat | + hooks (övervägande) |

---

## Del 5 — Web-research-disciplin som ny hub-rule (Marcus' Punkt 1 2026-05-20)

### Marcus' empiriska insikt

Citat 2026-05-20: "Ser du nu hur SJUUUUUUUKT viktigt det är med web-research, det är sinnessjukt. Detta måste in stenhårt i hubben och speglas ner i alla spokes liksom."

Bakgrund: Web-research denna Chat-iteration (CLAUDE.md best practices + Project Instructions + hooks) avslöjade paradigm-skifte i arkitektur. Utan empirisk research skulle Chat ha designat ~150-200 rader spoke-CLAUDE.md som EMPIRISKT skulle degraderat compliance. Research räddade arkitekturen.

### Operationalisering — Web-research-disciplin

**Etableras i K-sista-1 som "Ristat i sten"-bullet i hub-CLAUDE.md + spegling i spoke-CLAUDE.md.**

#### Formulering för hub-CLAUDE.md (UNIVERSAL)

```markdown
**Web-research är operationell 11/10-disciplin, inte optional.** Före strategi-
val, arkitektur-rekommendation, tool-val, branschstandard-claim eller version-
bump-rekommendation: gör web-research. Empirisk källa > antagande. Citera
källan i designen. L_II + L_18 + L_JJ. Etablerad Session 6.6.6 K-sista-1
(2026-05-20) efter empirisk insikt att Chat-design utan research skulle
brutit anti-bloat-konsensus + missat Project Instructions-mekanismen +
introducerat dual-trap shellcheck-fel.
```

#### Formulering för spoke-CLAUDE.md (projekt-spegling)

```markdown
**Web-research-disciplin per hub-CLAUDE.md "Ristat i sten" — applicerad
i miranon-media-admin:** Före Vale-config-strategi, ADR-design, tool-
version-bump, dependency-rekommendation, branschstandard-claim: gör
web-research. K3.1.a (3-mitigerings-uttömning) + K3.4 (Vale 3.14.1
upstream-fix-research) + K3.6 (AssertFlip-mönster + CLAUDE.md-anti-
bloat) är empirisk precedent i denna spoke.
```

### Konsekvens för Session 6.7

Session 6.7 K4 skill-design ska inkludera **`web-research-discipline.skill`** som ny skill (utöver de 6 redan listade). Skill ska operationalisera:

- Trigger-villkor (när web-research är obligatoriskt)
- Domän-checklista (strategi-val, branschstandard, version-research)
- Output-format (källa-citation, datum, relevans-bedömning)
- Anti-pattern-katalog (research om sak Claude redan kan — slöseri; research om sak Chat redan har gissat — för sent)

**Notering till Session 6.7-prep-fil-uppdatering (K-sista-1):** Lägg till `web-research-discipline.skill` i Del 1.2 Skills-att-skapa-tabell. Källa: Marcus' Punkt 1 2026-05-20 + denna mini-överlämnings Del 3-research-syntes.

---

## Del 6 — K-sista-0 reviderad design (Lessons-konsolidering)

### Scope

Lessons-konsolidering 94 kandidater → 10-15 hub-lessons + Lager 2 v0.1-status oförändrad (bumpas i K-sista-1).

**Auktoritativ input-källa:**
`tasks/sessions/2026-05-17-lessons-reconciliation-fangst-v2.md` (commit `f8080c3`)

**Innehåll:**
- Sektion 3.1: L15-L19 retroaktiva 6.6.5 (5 lessons)
- Sektion 3.2: L_M-L_X ≈samma mini-1+mini-2 (6 lessons)
- Sektion 3.3: Mini-1 unika konflikt-lessons (9 lessons)
- Sektion 3.4: Mini-2 unika konflikt-lessons (9 lessons)
- Sektion 3.5: Mini-2 L_BB-L_AAA unika (26 lessons)
- Sektion 3.6: Post-mini-2 Chat-genererade (25 lessons, L_BBB-L_ÅÅÅ)
- Sektion 3.7: Post-mini-3 K0-skörd (14 lessons, L_ÄÄÄ-L_AAAL)

**Nya lessons från K3.5-K3.6 + denna Chat-iteration (att inkludera):**

| Namn | Källa | Beskrivning |
|---|---|---|
| L_AAAM | Mini-4 Del 5 K3.5 design-fråga | Multi-sektion-edit cross-reference-propagering |
| L_AAAN | K3.5 Block I ADR-022-fynd | Chat-prompt-INTERNAL referenser kräver empirisk verifikation |
| L_AAAO | K3.5 V.B.6 post-edit ADR-032 MD029 | Code-block under ordered list-item kräver 4-space indent |
| L_AAAP | K3.5 V.B.6 post-edit ADR-032 Brand-träffar | Meta-ADR om Brand-rule kräver Brand-helfil-disable, distinkt från content-files |
| L_AAA-21 (denna Chat) | Pre-mini-5 datum-gissning | Chat-side "TODAY-verifikation" utan empirisk källa |
| L_AAA-22 (denna Chat) | Pre-K3.5 multi-del-leverans | Multi-del Code-prompt-leverans vs K7 inline-källor-disciplin |
| L_AAA-23 (denna Chat) | K3.5 ADR-022 § Del 5-fynd via Code | Chat-design refererade fiktiv ADR-struktur utan verifikation |
| L_AAA-24 (denna Chat) | Pre-K3.6 GO-signal-format | Chat-konversation istället för kodblock vid Code-instruktion |
| L_AAA-25 (denna Chat) | K3.6 Code Fynd #1 | Fixture-design utan källverifikation mot real-repo |
| L_AAA-26 (denna Chat) | K3.6 Code Fynd #4 | ADR-titel-gissning trots att filen kunde läsas |
| L_AAA-27 (denna Chat) | K3.6 Code Fynd #3 | Bash-pattern utan strict-mode-pre-verifikation |
| L_AAAQ (denna Chat) | Web-research 2026-05-20 | Anti-bloat-konsensus + distribuerad arkitektur är empiriskt etablerad branschpraxis |
| L_AAAR (denna Chat) | Web-research 2026-05-20 | Project Instructions vs CLAUDE.md distinktion (Chat vs Code) — olika mekanismer |
| L_AAAS (denna Chat) | Web-research 2026-05-20 | Hooks 100% vs CLAUDE.md 70% compliance — enforcement där möjligt |
| L_AAAV (Code Block VII.5) | K3.6-E broken-link CI-fångst | Upstream-repo-rename utan issue-redirect bryter lychee-grindvakt; broken-link-fångst sker INTE pre-push, bara CI-only. Lokal lychee-test pre-commit för länk-tunga ADR-edits worth-it (~30s lokal vs ~5-10 min CI-fail-cycle) |
| L_AAAW (Code Block VII.5) | K3.6-A V.A iteration #1 | macOS `mktemp -t` placerar fil i `/var/folders/.../T/` utanför CWD-tree → Vale .vale.ini-scope-matching missar. Fix: CWD-relative `mktemp .tmp-XXXXXX.md`. Vale config-discovery matchar CWD-relativ tree, inte absolut path |
| L_AAAX (Code Block VII.5) | K3.6 AssertFlip empirisk validering | AssertFlip-mönster fungerar empiriskt som lift-trigger. T1 PASS i Vale 3.14.1 = bug bekräftad; framtida T1 FAIL = upstream-fix landat → CI röd = ADR-032 § Lift-protokoll aktiveras automatiskt. Branschstandard-konformitet (arXiv 2507.17542 + Vale-CLI #387 jdkato-precedent) |

**Total post-K3.6 + denna Chat: 94 + 14 = 108 lessons-kandidater (bas-räkning). Med Del 13-tillägg adderas L_AAA-28 + L_AAAT + L_AAAU (+3) och Code Block VII.5 adderar L_AAAV + L_AAAW + L_AAAX (+3) → totalt 114 lessons-kandidater att konsolidera (se Del 13 + Code-rapport för komplett räkning).**

### Klass-pattern-konsoliderings-mål

Konsolidera 121 → 10-15 hub-lessons via klass-pattern (per mini-3 Del 4):

| Klass | Lessons-instanser | Föreslagen hub-formulering |
|---|---|---|
| Empirisk-disciplin-klass | L_S, L_T, L_N, L_NN, L_MM, L_PP, L_UUU, L_VVV, L_WWW, L_AAA-25/26/27 | "Empirisk verifikation FÖRE antaganden, alltid. Cite source." |
| Vale-quirks-klass-pattern | L_X.1/X.2, L_HH, L_OO, L_QQ, L_TT, L_UU, L_XX, L_RRR | "Vale-quirks är klass av latenta upstream-buggar — minimal-repro + branschstandard-research" |
| Mitigerings-uttömning-disciplin | L_OOO, L_PPP, L_QQQ, L_SSS, L_TTT | "Mitigerings-familj-uttömning som empirisk bevisning för upstream-bug-claim" |
| Disciplin-meta-klass (L_AAA-klassen) | L_GG, L_II, L_LL, L_AAA, L_LLL, L_MMM, L_AAAN, L_AAA-21 till -27 | "L_AAA = antaganden utan empirisk verifikation. Externt verifierbart > Chat-self-fångst." |
| Tooling-disciplin-klass | L_RR, L_VV, L_BB, L_CCC, L_JJJ, L_AAAS | "Tool-bug-klassning kräver minimal-repro + branschstandard-research" |
| Klass-namnging-klass | L_FF, L_WW, L_YY, L_HHH | "Klass-namn är arkitektur-design, inte nomenklatur-detalj" |
| Hub-portabilitets-klass | L15-L19, L_JJ, L_ZZ | "Hub-spoke-portabilitet är default — config-driven > hardcoded" |
| K-fas-strategi-klass | L_NNN, L_FFF, L_GGG | "Empirisk-baserad K-fas-omprioritering vid >50% systemisk-problem-hit-rate" |
| Vale-config-arkitektur-klass | mini1-L_P, mini2-L_O, mini2-L_P, L_SS | "Vale-config 4+1-lager-arkitektur per ADR-032" |
| Klassificerings-kontext-disciplin | L_NN, L_FFF, L_XXX | "Klassificering kräver kontext-läsning, inte tool-meddelande-direkt" |
| Upstream-bug-klassning-disciplin | L_TTT, L_YYY, L_JJJ, L_ZZZ, L_ÅÅÅ | "Upstream-bug = minimal-repro + 3-mitigerings-uttömning + branschstandard-precedent" |
| Web-research-klass (NY denna Chat) | L_II, L_18, L_JJ, L_AAAQ, L_AAAR, L_AAAS | "Web-research är operationell 11/10-disciplin, inte optional. Källa > antagande." |

**Konsoliderings-mål:** ~12 hub-lessons (genomsnitt av 10-15-fönstret).

### K-sista-0 procedur

1. **Chat läser v2-final + mini-1-5 i ordning** (auktoritativa källor)
2. **Klass-pattern-konsolidering per tabellen ovan**
3. **Omnumrera till L20-LNN** (kanonisk, fortsätter L1-L19-serien i `tasks/lessons.md`)
4. **Identifiera UNIVERSAL-flaggade** för hub-lyft (förvänta de flesta är universella)
5. **Bake-in-design** för K-sista-1 (lessons.md H2 "## 2026-05-20 — Session 6.6.6 (konsoliderad post-K-sista-0)")
6. **K-sista-0 är RAPPORTERA-only** — INGEN Code-commit i K-sista-0. Bake-in sker i K-sista-1.

### Estimat

~1-1.5h Chat-arbete + 15 min Code (om K-sista-0 paketeras separat). Sannolikt mer effektivt att paketera K-sista-0 + K-sista-1 som EN Chat-design-session där lessons-konsolideringen sker i Chat och K-sista-1 Code-prompt levereras direkt efteråt.

---

## Del 7 — K-sista-1 REVIDERAD design (smalare scope)

### Scope-revision baserad på Session 6.7-medvetenhet

**Tidigare plan (mini-4 Del 5):**
- Sessionsdok bake-in
- ADR-032 status-bump (om Proposed)
- Reconciliation v1 + v2-final → archive
- Mini-överlämningar 1-2-3 → archive
- Hub-sync UNIVERSAL-lessons
- Lager 2-checklist hub-sync
- Spoke-portabilitets-test
- CI-verifikation grön + push

**REVIDERAD plan (denna mini-överlämning):**

| K-sista-1-aktivitet | Status | Scope-bedömning |
|---|---|---|
| Lessons-bake-in till spoke-lessons.md | Behåll | K-sista-0-output bakar in här |
| ADR-032 status-bump | N/A | Redan Accepted i K3.5 |
| Reconciliation v1 + v2-final → archive | Behåll | Standard arkivering |
| Mini-överlämningar 1-5 → archive | Behåll | Inkluderar denna mini-5 |
| Hub-sync UNIVERSAL-lessons | Behåll | Hub-CLAUDE.md tasks/lessons.md uppdatering |
| Lager 2-checklist v0.1 → v1.0 | Behåll | 8 utvidgningar internaliserade (6 från mini-4 + 2 NY från Session 6.6.6) |
| **NY: Web-research-rule** | **NY** | **Hub-CLAUDE.md + spoke-CLAUDE.md "Ristat i sten"-bullet** |
| **NY: Session 6.7-prep-fil-uppdatering** | **NY** | **Lägg till anti-bloat-research + Project Instructions/Profile Preferences-distinktion + web-research-discipline.skill** |
| **DEFER: spoke-CLAUDE.md operativ disciplin-bake-in** | **DEFER → Session 6.7** | Anti-bloat-konsensus + Session 6.7-scope-överlapp |
| **DEFER: Project Instructions design** | **DEFER → Session 6.7** | Session 6.7 K4 skill-design-domän |
| **DEFER: Profile Preferences design** | **DEFER → Session 6.7** | Session 6.7 hub-domän |
| **DEFER: Skills-extraktion** | **DEFER → Session 6.7** | Session 6.7 K5 explicit scope |
| **DEFER: Hooks-utvidgning** | **DEFER → Session 6.7+** | Hooks-arkitektur förtjänar dedikerad design |
| Spoke-portabilitets-test | Behåll | Verifiera Vale-config fungerar på tom-projekt |
| CI-verifikation grön + push | Behåll | Om push EJ genomförd i K3.6 |
| Sessionsdok arkivering | Behåll | Standard arkivering |

### K-sista-1 atomic commits (per K7-disciplin)

| Commit | Domän | Filer |
|---|---|---|
| K-sista-1-A | Lessons-bake-in (spoke) | tasks/lessons.md (H2-tillägg) |
| K-sista-1-B | Sessionsdok-uppdatering + arkivering | tasks/sessions/2026-05-14-session-6-6-6.md (full retrospektiv) + git mv till archive/2026-05/ |
| K-sista-1-C | Hub-sync UNIVERSAL-lessons | ~/Repon/marcus-system/tasks/lessons.md (H2-tillägg) — SEPARAT REPO-COMMIT |
| K-sista-1-D | Web-research-rule + Kontinuitet-arkitektur-rule (hub + spoke) | ~/Repon/marcus-system/CLAUDE.md + ~/Repon/miranon-media-admin/CLAUDE.md (2 "Ristat i sten"-bullets add: web-research + L_AAAE kontinuitet-arkitektur, Alt α-paketering per Del 14) |
| K-sista-1-E | Lager 2-checklist v0.1 → v1.0 | ~/Repon/marcus-system/templates/chat-prompt-design-checklist.md (frontmatter bump + 8 utvidgningar bake-in inkl. NY web-research + NY kontinuitet-arkitektur) — SEPARAT REPO-COMMIT |
| K-sista-1-F | Session 6.7-prep-fil-uppdatering | tasks/sessions/archive/2026-05/2026-05-14-session-6-7-prep.md (utvidga med anti-bloat-research + Project Instructions/Profile Preferences-distinktion + web-research-discipline.skill) |
| K-sista-1-G | Reconciliation + mini-överlämningar arkivering | git mv reconciliation v1+v2-final + mini-1-5 → archive/2026-05/ |
| K-sista-1-H | Final-verifikation + push | CI-verifikation grön + push alla pending commits |

**Total estimat K-sista-1:** ~2-2.5h Code + Chat-arbete (estimat höjd från ursprunglig mini-4 K-sista-1-plan pga 2 nya scope-domäner: web-research-rule + Session 6.7-prep-uppdatering).

**Hub-spoke-commit-strategi:** K-sista-1-C + K-sista-1-D + K-sista-1-E är hub-repo-commits, andra är spoke-repo-commits. Push-pacing: hub pushas separat efter alla hub-commits klara, spoke pushas separat efter alla spoke-commits klara. INTE blandas.

### Lager 2 v0.1 → v1.0 — 8 utvidgningar internaliserade (6 från mini-4 + 2 NY från Session 6.6.6)

Per mini-4 Del 5 + denna Chat-iteration + post-Code-rapport-iteration (L_AAAE):

| # | Utvidgning | Status |
|---|---|---|
| 1 | §1.4 Pre-K forensisk-pass | Empiriskt tillämpad K3.5 + K3.6 |
| 2 | §3 Datum-stämpel TODAY | Empiriskt tillämpad K3.5 + K3.6 + denna Chat |
| 3 | §3 #2 Frontmatter governing-scope | Empiriskt tillämpad K3.5 |
| 4 | §3.3 Bash-pattern strict-mode | Empiriskt tillämpad K3.6 (Code's Fynd #3) |
| 5 | §3.5 Sessions-scope-medvetenhet | Empiriskt tillämpad K3.5 + K3.6 |
| 6 | §2 Cross-reference-propagering | Empiriskt tillämpad K3.5 (Code's K3.5-A + K3.5-B propagering till 8 filer) |
| **7 (NY)** | **Web-research som operationell 11/10-disciplin (när det är obligatoriskt)** | **NY från denna Chat-iteration — paradigm-skifte-fångst** |
| **8 (NY från L_AAAE)** | **Kontinuitet-arkitektur-disciplin** | **NY från post-Code-rapport-iteration. Allt som ska överleva sessions-byte MÅSTE bakas in i filartefakter INNAN Chat-session avslutas. Chat-trail är efemär, filer är arbete-säkrat. Pre-sessions-byte verifikation: "Är allt nytt säkrat i fil?" Empirisk källa: 7 lessons-kandidater från mini-5-skapelse-iteration (Del 14) hade gått förlorade utan post-skapelse-trail-fångst** |

Lager 2 v1.0 bumpas med ALLA 8 utvidgningar internaliserade som procedural-steg, inte bara textuell princip.

---

## Del 8 — Session 6.7-prep-fil-uppdatering (K-sista-1-F)

### Bakgrund

`tasks/sessions/archive/2026-05/2026-05-14-session-6-7-prep.md` existerar med scope etablerat 2026-05-14 (post-Session 6.6 K-sista). K-sista-1 ska UPPDATERA den med ny empirisk kontext från Session 6.6.6 + denna Chat-iterations web-research.

### Tillägg till Del 1.2 Skills att skapa-tabell

Lägg till ny rad i Del 1.2-tabellen:

```markdown
| `web-research-discipline.skill` | Före strategi-val, arkitektur-rekommendation, tool-val, branschstandard-claim, version-bump | Trigger-villkor + domän-checklista + output-format (källa-citation, datum, relevans) + anti-pattern-katalog. NY från Session 6.6.6 K-sista-1 (Marcus' Punkt 1 2026-05-20). |
```

### Tillägg till Del 1.4 ADR för skill-arkitektur

Sub-§ 1.4-tillägg:

```markdown
**NY från Session 6.6.6 K-sista-1 (2026-05-20):** Skill-arkitektur ska distingera mellan:

- **Hub-skills** (`~/Repon/marcus-system/skills/`) — Universella, alla spokes
- **Projekt-skills** (`~/Repon/<spoke>/skills/`) — Domän-specifika
- **Profile Preferences** (Claude.ai globala settings) — Universell Chat-disciplin (Marcus-personlig)
- **Project Instructions** (Claude.ai projekt-settings per spoke) — Projekt-specifik Chat-disciplin

Skill-format är samma för Hub-skills och Projekt-skills, men distinktionen mot Profile Preferences + Project Instructions är arkitektur-domän som ska adresseras i ADR-skill-arkitektur (ADR-034 sannolikt, numrering bekräftas vid skapelse).

Project Instructions / Profile Preferences är **Chat-side persistent prompts** som inte är skill-filer — de bor i Claude.ai-settings, inte i repo. Men de SPEGLAR samma operativa innehåll som relevanta skills. K-sista-1 lyfter Profile Preferences + Project Instructions som distinktion i prep-filen för Session 6.7 K4 skill-design-arbete.
```

### Ny sub-§ 1.6 — Web-research-rule + anti-bloat-grund

```markdown
### 1.6 — Anti-bloat-konsensus + distribuerad arkitektur (NY från Session 6.6.6 K-sista-1)

Per Session 6.6.6 mini-överlämning 5 Del 3 — Web-research-syntes (2026-05-20):

**Anti-bloat-konsensus är empiriskt entydig:**

| Källa | Empirisk slutsats |
|---|---|
| Claude Code docs (Anthropic) | "150-200 instruction budget, system prompt ~50, kvarstår ~100-150 slots" |
| HumanLayer (production) | "<60 rader CLAUDE.md" |
| Anthropic/DataCamp | "CLAUDE.md instructions följs ~70%. Hooks 100%" |
| Bijit Ghosh, TECHSY, BSWEN | "Past 80 rader rules dropping; past 200 rader large blocks ignored" |

**Konsekvens för Session 6.7 K6 CLAUDE.md-refactor:**

CLAUDE.md-mål post-K6 är < 100 rader (under 200, optimum 60-100). All operativ procedur extraheras till skills. CLAUDE.md innehåller endast:

1. Projekt-status (current fas, Session-nummer)
2. 6-10 testbara regler Code konsekvent missar utan dem
3. Pekare till skills, lessons.md, ADRs
4. Build/test/lint-kommandon
5. "Ristat i sten"-bullets från hub (inkl. web-research-rule)

**Web-research-rule etablerad i K-sista-1:**

Hub-CLAUDE.md har ny "Ristat i sten"-bullet:

> "Web-research är operationell 11/10-disciplin, inte optional. Före strategi-val, arkitektur-rekommendation, tool-val, branschstandard-claim eller version-bump-rekommendation: gör web-research. Empirisk källa > antagande. Citera källan i designen. L_II + L_18 + L_JJ + L_AAAQ."

Spoke-CLAUDE.md speglar med projekt-specifika exempel (K3.1.a + K3.4 + K3.6 + denna mini-överlämning).

Session 6.7 K4 ska designa `web-research-discipline.skill` som operationaliserar regeln.
```

### Tillägg till Del 5 Sessionsstart-prompt

Pre-prompt-läsning utvidgad med:

```markdown
7. **`tasks/sessions/archive/2026-05/2026-05-20-session-6-6-6-mini-overlamning-5.md`** —
   Mini-överlämning 5 (post-K3.6 + arkitektur-revision). Innehåller:
   - Web-research-syntes (anti-bloat + distribuerad arkitektur)
   - "Var lever reglerna"-karta
   - Project Instructions + Profile Preferences-distinktion
   - K-sista-1-scope-reviderade

   KRITISK för Session 6.7 K2-K3 CLAUDE.md-audit eftersom anti-bloat-konsensus
   styr refactor-mål.
```

### Tillägg till Del 4 Förväntade lessons-kandidater

Lägg till 3 nya lessons-domäner:

```markdown
9. **Anti-bloat-disciplin-skill** — Hur stort får CLAUDE.md vara? Empirisk regel (<100 rader optimum, <200 max). Källa: Session 6.6.6 K-sista-1 web-research.

10. **Chat-side vs Code-side distinktion** — Project Instructions (Chat) vs CLAUDE.md (Code) vs hooks (enforcement). Olika mekanismer, olika syften. Källa: Session 6.6.6 K-sista-1 web-research.

11. **Web-research-disciplin-skill-design** — Vad är trigger-villkor för obligatorisk web-research? Vad är "good enough" research-djup? Källa: Marcus' Punkt 1 2026-05-20.
```

---

## Del 9 — L_AAA-trajektoria + Lager 2 v1.0-skuld-utvidgningar

### L_AAA-mönster-trajektoria post-K3.6

**Två komplementära räkningar (etablerad 2026-05-20 post-Code-rapport):**

**Räkning A — Code's K-fas-empirisk (primär per L_ZZ):**

| Mätpunkt | L_AAA-instanser | K-faser | % | Δ |
|---|---:|---:|---:|---:|
| Mini-3 (pre-K0) | 11 | 17 | 65% | — |
| Post-K0.3 | 17 | 20 | 85% | +20% |
| Post-K0.4 (mini-4) | 19 | 22 | 86% | +1% |
| Post-K3.5 | 21 | 24 | 88% | +2% |
| **Post-K3.6 (Code Block VII.2)** | **25** | **26** | **96.2%** | **+8%** |

Code's räkning räknar **diskreta K-fas-instanser där L_AAA-mönster manifesterades** + de K-faser de inträffade i. Frekvensen stabiliserad nära 95-97%.

**Räkning B — Chat-design-instanser (sekundär, för K-sista-0 lessons-konsolidering):**

Inkluderar Chat-design-iterationer (L_AAA-21 till L_AAA-27 + L_AAAM-AAAU) som distinkt L_AAA-instanser, även om de inträffar inom samma K-fas. Per denna Chat-iteration: 27 sub-instanser av L_AAA-klassen identifierade och kategoriserade för K-sista-0-konsolidering.

**Operativ relevans:** Räkning A är empirisk trajektoria (Code-verifierad), Räkning B är lessons-skörd-grund (för konsolidering 121 → 10-15 hub-lessons). Båda korrekta från olika perspektiv.

**Empirisk insikt:** Chat-self-fångst förblir 0-6% (Code Block VII.11: K3.6 Chat-self-fångst = 0%). Externt verifierat genom Code-pair-programming-precedent.

**Klass-domän för L_AAA-attack:** Project Instructions (Chat-side persistent prompt etableras Session 6.7) + Profile Preferences (universell Chat-disciplin) + skill-format med pre-prompt-verifikations-checklist.

### Code's L_ZZ-precedent (empiriskt validerad post-K3.6)

| Källa | K0-fångst | K3.5-fångst | K3.6-fångst (Block VII.11) |
|---|---:|---:|---:|
| Code Block I pre-edit STOPPA | 9 (56%) | 4 (100%) | **4 (50%)** |
| Code Block V.A lokal-iteration | — | — | **2 (25%)** |
| CI-fångst (lychee broken-link) | — | — | **1 (12.5%)** |
| Marcus Gate-2-fångst | 3 (19%) | 0 (0%) | **0 (0%)** |
| Chat-self-fångst | 1 (6%) | 0 (0%) | **0 (0%)** |
| **Total extern fångst** | **94%** | **100%** | **87.5% lokal + 12.5% CI = 100% extern** |

**Operativ insikt:** Code-prompts ska ALLTID inkludera Lager 2 §6.2 (transparens-rapport) + STOPPA-OCH-FRÅGA pre-edit-instruktioner. K3.6-empiri: 87.5% lokal pre-commit-fångst + 12.5% CI-fångst = 100% extern. Chat-self-fångst 0%. Detta är inte tillfälligt — det är stabilt mönster över 3 K-faser (K0, K3.5, K3.6).

### Pre-flight Lager 2 v1.0-skuld för nästa Chat (TILLÄMPAS FRÅN FÖRSTA PROMPT)

Nästa Chat (K-sista-0 + K-sista-1) MÅSTE applicera dessa 8 utvidgningar från första prompt:

1. **§1.4 — Pre-K forensisk-pass.** FÖRE K-sista-0 lessons-konsolidering: läs v2-final + mini-1-5 + denna mini-överlämning. Aldrig formulera klass-konsolidering utan att läsa alla källor.

2. **§3 — Datum-stämpel TODAY.** Lessons-bake-in H2-datum = exekverings-TODAY. Verifiera vid Chat-prompt-leverans + Code-edit. **Empirisk källa krävs — INTE gissning** (L_AAA-21).

3. **§3 #2 — Frontmatter governing-scope.** lessons.md ÄR governing (per `.frontmatter-policy.conf`). Pre-commit-hook auto-bumpar `updated:`. Hub-lessons.md ÄR governing. Verifiera hook-bump-beteende.

4. **§3.3 — Bash-pattern mot strict-mode.** Ingen bash-pattern förväntad i K-sista-0/1 (mestadels markdown-edits), men gäller om K-sista-1-G (arkivering) använder `git mv`-mönster eller liknande. shellcheck-strict 0/0/0/0 om script används.

5. **§3.5 — Sessions-scope-medvetenhet.** K-sista-0 + K-sista-1 = Session 6.6.6-avslut. CI grön förväntas post-push. INGEN "CI grön = mål"-feltolkning.

6. **§2 — Cross-reference-propagering.** Lessons-bake-in propagerar till spoke-lessons.md + hub-lessons.md (separat repo) + Lager 2-checklist + Session 6.7-prep-fil. 4-5 cross-references per lesson-add. Generera cross-reference-checklist FÖRE prompt-leverans.

7. **§NY — Web-research som operationell 11/10-disciplin.** Om K-sista-0/1 ska göra strategi-val eller arkitektur-claim där empirisk grund saknas: gör web-research. Citera källa. Denna mini-överlämning Del 3 är precedent.

### STOPPA-OCH-FRÅGA-format för Code-prompts

Explicit krav på Lager 2 §6.2-transparens-rapport. Code's pair-programming-pattern levererade 75-100% av kvalitetsfångster — kan inte saknas.

---

## Del 10 — Sessionsbyte-instruktioner för nästa Chat

### Pre-prompt-läsning (i ordning)

1. **`~/Repon/marcus-system/CLAUDE.md`** — hub-konstitution, K7 atomic-disciplin, "Ristat i sten"-bullets, kontinuitet-protokoll
2. **`~/Repon/miranon-media-admin/CLAUDE.md`** — projekt-konstitution, Vale-arkitektur, Fas 2.5-domän
3. **DENNA fil** (`tasks/sessions/2026-05-20-session-6-6-6-mini-overlamning-5.md`) — sessions-state, K3.5+K3.6-trail, arkitektur-revision, scope-separation
4. **`tasks/sessions/2026-05-18-session-6-6-6-mini-overlamning-4.md`** — mini-4 (K0-trail + K3.5-prep + 6 v1.0-utvidgningar)
5. **`tasks/sessions/2026-05-17-lessons-reconciliation-fangst-v2.md`** — auktoritativ lessons-katalog 94 kandidater
6. **`~/Repon/marcus-system/templates/chat-prompt-design-checklist.md`** — Lager 2 v0.1 (bumpas till v1.0 i K-sista-1-E)
7. **`tasks/sessions/archive/2026-05/2026-05-14-session-6-7-prep.md`** — Session 6.7-prep (uppdateras i K-sista-1-F)
8. **`tasks/lessons.md`** — bakad L1-L19 (bakas in med konsoliderade L20-LNN i K-sista-1-A)
9. **`tasks/todo.md`** — projekt-plan

### Optional men rekommenderad läsning

- **`tasks/sessions/2026-05-17-session-6-6-6-mini-overlamning-3.md`** — mini-3 (för L_X.2-empiri + branschstandard-trail)
- **`tasks/sessions/2026-05-17-session-6-6-6-mini-overlamning-2.md`** — mini-2 (för K2.6.2.D-pivot-trail)
- **`tasks/sessions/2026-05-16-session-6-6-6-mini-overlamning.md`** — mini-1
- **`tasks/sessions/2026-05-17-lessons-reconciliation-fangst.md`** — v1 reconciliation (historisk trail)
- **`tasks/sessions/2026-05-14-session-6-6-6.md`** — Session 6.6.6 K1.1-K2.2-trail
- **`docs/decisions/ADR-032-vale-lazy-continuation-helfil-disable.md`** — formaliserad mitigation från K3.5
- **`tests/vale-regression/`** + **`scripts/test-vale-regression.sh`** — K3.6-leverans (lift-trigger)

### Code-state-verifikation vid sessionsstart

```bash
cd ~/Repon/miranon-media-admin
git status
git log --oneline -15

# Verifiera K3.5 + K3.6-commits finns:
git log --oneline | grep -E "K3\.5|K3\.6|ADR-032|test-vale-regression|skuld|Brand-fix"
# Förvänta: K3.5-A + K3.5-B + K3.6-A + K3.6-B + K3.6-C + K3.6-D + K3.6-E = 7 commits

# Verifiera reconciliation-fil-state:
head -10 tasks/sessions/2026-05-17-lessons-reconciliation-fangst-v2.md
# Förvänta: total_unique_lessons: 94 (filens nuvarande state). Nästa Chat bakar in 27 nya lessons från Session 6.6.6 + Del 13 + Code-rapport + Del 14 → total 121 post-K-sista-1-A.

# Verifiera test-suites:
bash scripts/test-pre-commit-hook.sh; echo "Exit: $?"
# Förvänta: 9/9 PASS exit 0

bash scripts/test-check-frontmatter.sh; echo "Exit: $?"
# Förvänta: 14/14 PASS exit 0

bash scripts/test-vale-regression.sh; echo "Exit: $?"
# Förvänta: 3/3 PASS exit 0 (T1 inverterad assertion = bug bekräftad)
# Om T1 FAIL: upstream-fix har landat → aktivera ADR-032 § Lift-protokoll

# /tmp-state-verifikation (K3.4-data, sannolikt utrensad post-reboot)
ls /tmp/k34-minimal-repro/ /tmp/k345-en-repro/ 2>&1
# Förvänta: filer kan saknas (rensas post-reboot). Real fixtures bor nu
# permanent i tests/vale-regression/ per K3.6-A.

cd ~/Repon/marcus-system
git status
git log --oneline -3
# Verifiera Lager 2-checklist v0.1-state
```

### Var nästa Chat-iteration börjar

#### K-sista-0 — Lessons-konsolidering (RAPPORTERA-only Chat-arbete)

**Status:** EJ STARTAD

**Mål:** 121 lessons-kandidater → 10-15 hub-lessons + L20-LNN omnumrering + UNIVERSAL-flagging.

**Procedur:** Per Del 6 i denna mini-överlämning.

**Estimat:** ~1-1.5h Chat-arbete.

#### K-sista-1 — Bake-in + hub-sync + arkivering + web-research-rule + Session 6.7-prep-uppdatering (Code-leverans 8 atomic commits)

**Status:** EJ STARTAD

**Mål:** Per Del 7 i denna mini-överlämning.

**Procedur:**

- K-sista-1-A: Lessons-bake-in (spoke-lessons.md H2-tillägg)
- K-sista-1-B: Sessionsdok-uppdatering + arkivering
- K-sista-1-C: Hub-sync UNIVERSAL-lessons (hub-repo)
- K-sista-1-D: Web-research-rule (hub + spoke "Ristat i sten"-bullet)
- K-sista-1-E: Lager 2-checklist v0.1 → v1.0 (hub-repo)
- K-sista-1-F: Session 6.7-prep-fil-uppdatering
- K-sista-1-G: Reconciliation + mini-överlämningar arkivering
- K-sista-1-H: Final-verifikation + push

**Estimat:** ~2-2.5h Code + Chat-arbete.

### Pre-flight Lager 2-skuld (TILLÄMPAS FRÅN FÖRSTA PROMPT)

Per Del 9 ovan — 8 utvidgningar (inkl. NY web-research-disciplin + NY kontinuitet-arkitektur-disciplin).

### Code's L_ZZ pair-programming-precedent (empiriskt validerad)

Empirisk grund för operativt mandat: Code-prompts ska alltid inkludera Lager 2 §6.2 (transparens-rapport) + STOPPA-OCH-FRÅGA pre-edit-format. 75-100% av kvalitetsfångster kommer från Code, inte Chat-self-disciplin.

---

## Del 11 — Tids-estimat + push-pacing

### K-sista-0 + K-sista-1 estimat

| K-fas | Estimat | Faktiskt (att verifiera) |
|---|---|---|
| K-sista-0 lessons-konsolidering | 1-1.5h Chat | TBD |
| K-sista-1-A bake-in (spoke) | 15 min Code | TBD |
| K-sista-1-B sessionsdok + arkivering | 20 min Code | TBD |
| K-sista-1-C hub-sync | 15 min Code (hub-repo) | TBD |
| K-sista-1-D web-research-rule | 15 min Code (2 filer) | TBD |
| K-sista-1-E Lager 2 v0.1 → v1.0 | 20 min Code (hub-repo) | TBD |
| K-sista-1-F Session 6.7-prep-uppdatering | 20 min Code | TBD |
| K-sista-1-G reconciliation + mini-arkivering | 10 min Code | TBD |
| K-sista-1-H final + push | 15 min Code | TBD |
| **Σ K-sista-1 Code-arbete** | **~2-2.5h** | **TBD** |
| **Σ K-sista-0 + K-sista-1 Chat-design** | **~1.5-2h** | **TBD** |
| **Σ Total** | **~3.5-4.5h** | **TBD** |

### Push-pacing post-K3.6 — GENOMFÖRD

Per Alt II push-pacing:

- ✅ **Genomfört i K3.6:** K0.4 + K3.5-A + K3.5-B + K3.6-A + K3.6-B + K3.6-C + K3.6-D + K3.6-E (5:e fix-commit broken-link) pushade i `b38f2ad → 617423d` (7 commits, 2026-05-20)
- ✅ **CI verifierad:** Run `26175389427` (initial K3.6-A push triggade lychee broken-link-fail) → K3.6-E fix-commit → run `26175893903` ALL GREEN
- K-sista-1 pushas separat efter alla 8 atomic commits klara
- Hub-repo (marcus-system) pushas separat efter K-sista-1-C + K-sista-1-D + K-sista-1-E klara

**Status:** Push genomförd och CI grön. K-sista-1-H behöver endast pusha K-sista-1-commits.

### CI-state-prediktion

Post-K-sista-1-H push förväntas CI grön på båda repos:

- miranon-media-admin: alla 8 jobs PASS inkl. test-vale-regression + check-frontmatter (med lessons.md-bake-in `updated:`-bump)
- marcus-system: ingen CI (hub är icke-CI-repo)

Om CI röd: STOPPA-OCH-FRÅGA, identifiera failande job + rotorsak.

---

## Del 12 — Operativ disciplin-status

### Output 11/10 — bekräftat

- ADR-032 (K3.5): Beyond branschstandard (Elastic/GitLab/Stream + formell L_X.1/L_X.2-klass-distinktion + lift-protokoll + branschstandard-precedent)
- K2.6.2.F test-suite (K3.6): AssertFlip-mönster + inverterad-assertion + 100% scope-täckning + ADR-029-konvention-konformitet + L_AAAX empirisk validering (T1 PASS = bug bekräftad)
- 5 pre-existing-skulder lösta atomiskt (4 från K3.5 Block VII + 1 emergent K3.6-E broken-link) utan att skapa nya skulder
- Vale-baseline 0/0/0 — FÖRSTA gången sedan Vale-aktivering Session 6.6 K6
- CI grön — run `26175893903` (push `b38f2ad → 617423d`, 7 commits)
- Web-research-syntes (denna Chat): Empirisk grund för paradigm-skifte räddade arkitekturen från degraderad compliance

### Process 9/10 — Code-pair-programming-precedent empiriskt validerad

- **L_AAA-trajektoria post-K3.6 (Code Block VII.2):** 25 instanser / 26 K-faser = 96.2% — frekvensen stabiliserad nära 95-97%
- **Code's L_ZZ-fångst-fördelning K3.6 (Block VII.11):**
  - Code Block I pre-edit STOPPA: 4 fångster (50%)
  - Code Block V.A lokal-iteration: 2 fångster (25%) — self-fixed pre-commit
  - CI-fångst (lychee broken-link): 1 fångst (12.5%) — K3.6-E
  - Marcus + Chat-self-fångst: **0 (0%)**
- **Total extern fångst K3.6: 100%** (87.5% lokal pre-commit + 12.5% CI)
- **Chat-self-fångst: 0%** över 3 K-faser (K0, K3.5, K3.6) — stabilt mönster, inte tillfälligt
- Lager 2-checklist är extern skydds-mekanism som fungerar, INTE Chat-internal-disciplin

### L_AAA-mitigations etablerade i K-sista-1

1. Web-research-rule i hub + spoke (operativ disciplin)
2. Lager 2 v0.1 → v1.0 med 8 utvidgningar (operativt verktyg)
3. Session 6.7-prep-uppdatering med Project Instructions + Profile Preferences-design-domän (framtida mitigation)
4. Lessons-konsolidering 121 → 10-15 hub-lessons (komprimerad, lättare att tillämpa)
5. `session-handoff.skill` referens-implementation (Del 13) — formaliserar mini-överlämning-skapelse-procedur

### L_AAA-mitigations defererade till Session 6.7

1. Project Instructions design (Chat-side persistent prompt)
2. Profile Preferences design (universell Chat-disciplin)
3. CLAUDE.md anti-bloat-refactor (hub + spoke)
4. Skills-extraktion (inkl. `web-research-discipline.skill` + `chat-self-review.skill`)
5. Hooks-utvidgning (övervägande)

---

## Del 13 — Bake-in-design för Session 6.7 (`session-handoff.skill` referens-implementation)

### Bakgrund

Marcus' direktiv 2026-05-20 post-mini-5-leverans: "om den till och med är bättre än 4:an (den föregående) så behöver vi även instruktioner för hur en sådan skall skrivas, det skall också bli en Skill i session 6.7".

**Mini-5 vs mini-4-jämförelse (forensisk):** Mini-5 är empiriskt bättre på 10 av 14 dimensioner — paradigm-skifte-leverans, "Var lever reglerna"-karta, scope-separation mot Session 6.7, web-research-syntes, klass-pattern-konsolidering, forensisk post-skapelse-granskning (6 L_AAA-28-instanser fångade + fixade). Bekräftar att mini-överlämning-skapande har genrekonventioner värda att formalisera.

### Skill-namn

`session-handoff.skill` — matchar etablerad skill-namn-konvention från Session 6.7-prep-fil Del 1.2 (`session-start.skill`, `session-end.skill`, `phase-end-verify.skill`, `lessons-hub-sync.skill`, `chat-self-review.skill`, `web-research-discipline.skill`).

### Skill-spec preliminär (formaliseras Session 6.7 K4)

```markdown
---
name: session-handoff
trigger: "Vid behov av sessions-byte mid-Session (bandwidth-paus, komplexitets-tröskelvärde, arkitektur-revision, pre-K-sista-leverans)"
input_required: ["session-id", "K-fas-status", "föregående mini-överlämningar"]
output: "Filartefakt i tasks/sessions/<DATUM>-session-<N>-mini-overlamning-<X>.md"
version: 1.0
last_updated: 2026-05-20
owner: marcus803
empirical_precedent:
  - mini-1 (cc01761) — Session 6.6.6 K1.1-K2.6.2.D.4 v1-trail
  - mini-2 (6179402) — K2.6.2.D-pivot + reconciliation v1
  - mini-3 — K3.1.b-K3.4 + reconciliation v2-final
  - mini-4 (b38f2ad) — K0-trail + K3.5-prep + Lager 2 v0.1-skuld + 6 v1.0-utvidgningar
  - mini-5 — K3.5+K3.6-trail + arkitektur-revision + scope-separation vs Session 6.7 (REFERENS-IMPLEMENTATION)
---

# session-handoff

## Syfte

Skapa komplett kontinuitet-paket för Chat-iteration som kan startas kallt utan kunskap om föregående arbete. Bevarar L_AAA-mitigation, 11/10-disciplin, scope-trail, och möjliggör paradigm-skifte-leverans när empirisk insikt ändrar arkitektur-riktning.

## Trigger-villkor

### Obligatoriskt

- Sessions-bandwidth-paus (Chat-context fullt eller närmar sig)
- Komplexitets-tröskelvärde (>3 K-faser klara, multi-domän-leverans)
- **Arkitektur-revision baserad på ny empirisk insikt** (paradigm-skifte — mini-5-precedent 2026-05-20)
- Före K-sista-leverans i komplex Session

### Optional (mini-överlämning är overkill)

- Mid-K-fas paus (prompt-direktiv räcker)
- Single-K-fas-leverans utan multi-commit

## Procedur (13-stegs)

### Pre-skapelse-steg

1. **Forensisk-pass FÖRE skapande** — `project_knowledge_search` på ALLA referenser
   - Sessions-numrering empiriskt verifierat (mini-5-precedent: Session 6.7 ≠ 6.6.7)
   - Commit-SHAs från git log, inte gissning
   - ADR-titlar från fil-header, inte gissning
   - Datum från `date +%F`, inte gissning

2. **L_AAA-pre-mitigation** — Identifiera egna gissningar
   - Datum, ADR-refs, commit-SHAs, version-nummer, sessionsnamn, rad-positioner
   - Verifiera varje mot empirisk källa FÖRE skapande

3. **Web-research om relevant** (Lager 2 v1.0 #7)
   - Strategi-val / arkitektur-claim → research obligatoriskt
   - Tool-version-research → research obligatoriskt
   - Mini-5-precedent: anti-bloat-research räddade arkitekturen från degraderad compliance

### Skapelse-steg

4. **YAML-frontmatter** per `.frontmatter-policy.conf`
   - `updated:` (TODAY empirisk)
   - `review_by:` (TODAY + 3 månader)
   - `status:` (draft/stable)
   - `owner:` (marcus803)

5. **H1 + scope-summary blockquote**
   - Titel: "Session <N> — Mini-överlämning <X> (scope-summary)"
   - Scope-summary: vad / status / parent-session / arkivering
   - **Kritisk-ny-kontext-flagga** om paradigm-skifte (mini-5-precedent etablerade detta)

6. **Del 0 TLDR** — Sammanfattning för kall sessionsstart
   - Vad är levererat (K-fas-trail i kort form)
   - Vad återstår (nästa steg)
   - Disciplin-status (L_AAA-räkning + Output/Process-rating)

7. **Del 1 K-fas-status** — Tabell över ALLA K-faser
   - Commit-SHAs (verifierade!)
   - Status + Output per K-fas

8. **Del 2 Sessions-trail**
   - Mini-trail-tabell
   - **Sessions-numrerings-klargöring** (mini-5-precedent: kritiskt om Session-tree är komplex)

9. **Mellandelar (variabla per sessions-behov)**
   - Web-research-syntes (om paradigm-skifte)
   - Arkitektur-karta (om distribuerad infrastruktur)
   - Design-frågor (om STOPPA-OCH-FRÅGA-leverans)
   - Klass-pattern-konsoliderings-mål (om K-sista-0-input)

10. **Pre-flight-del** — Lager 2-skuld-utvidgningar TILLÄMPAS FRÅN FÖRSTA PROMPT
    - Lista exakt vilka utvidgningar (v1.0 har 7 — mini-5-precedent)
    - Specifika instruktioner för nästa Chat

11. **L_AAA-trajektoria-del** — Räkning + Code's L_ZZ-precedent
    - Trajektoria-tabell över tid
    - Empirisk insikt om Chat-self-fångst vs Code-fångst

12. **Sessionsbyte-del (avslut)** — Operativa instruktioner
    - Läs-ordning (i strikt ordning)
    - Code-state-verifikation bash-block
    - Var nästa Chat-iteration börjar
    - Tids-estimat + push-pacing

### Post-skapelse-steg (NY från mini-5-precedent — Marcus' "kolla igenom den")

13. **Forensisk post-skapelse-granskning** — operationaliserat L_ZZ
    - `grep -n` på räkningar (utvidgningar, instanser, K-faser) över hela filen
    - Verifiera intra-fil-konsistens
    - Fixa ALLA inkonsistenser INNAN present_files
    - Förvänta 5-7 L_AAA-28-instanser (mini-5-empiri: 6 instanser)
    - Rapportera fix:ar till Marcus efter granskning

14. **Pre-leverans Chat-trail-bake-in-verifikation** (NY från L_AAAE post-mini-5-Code-rapport-iteration)
    - Granska Chat-iteration-trail för insikter, designval, kontroll-fråge-svar, L_AAA-fångster som UPPSTÅTT under skapelse-iterationen själv
    - Insikter från egen design-cykel är ofta de mest värdefulla men lättast förlorade
    - Säkerställ att lessons-kandidater är bakade in i mini-överlämningen (egen Del eller utvidgning av befintlig Del) — INTE bara i Chat-output
    - L_AAAE-precedent: 7 lessons-kandidater (L_AAAY-L_AAAE) uppstod under mini-5-skapelse-iteration själv som hade gått förlorade utan post-skapelse-trail-fångst (Del 14)
    - Pre-sessions-byte verifikation-fråga: "Är allt nytt från denna Chat-iteration säkrat i fil? Om sessions-byte sker NU, förlorar vi något kritiskt?"
    - Om JA: lägg till Del/sektion innan present_files

## Output-format

- Markdown med YAML-frontmatter
- Plats: `tasks/sessions/<YYYY-MM-DD>-session-<N>-mini-overlamning-<X>.md`
- Levereras som filartefakt + `present_files` för Marcus' kopiering till repo
- Storlek: 700-1500 rader beroende på sessions-komplexitet
- Format-disciplin: rubrik-hierarki Del 0 till Del N + Avslut

## Anti-pattern-katalog

| Anti-pattern | L_AAA-instans | Mitigation |
|---|---|---|
| Multi-del leverans utan inline-källor | L_AAA-22 | EN komplett filartefakt, alla källor inline |
| Gissning på datum/SHA/titel | L_AAA-21/26 | Empirisk verifikation FÖRST |
| Fiktiv ADR/spec-referens | L_AAA-23 | `project_knowledge_search` FÖRST |
| Intra-fil-konsistens-drift | L_AAA-28 (NY mini-5) | Post-skapelse forensisk granskning (Steg 13) |
| Saknad sessions-numrerings-klargöring | (mini-5-precedent) | Explicit tabell över sessions-tree |
| Scope-duplikation mot framtida session | (mini-5-precedent) | Defer-tabell + scope-separation |
| Saknad web-research vid arkitektur-claim | L_AAAQ | Web-research FÖRE design (Lager 2 v1.0 #7) |
| CLAUDE.md-bloat-rekommendation | (mini-5 pre-revision-precedent) | Anti-bloat-konsensus-medvetenhet |
| **Cross-scope Code-instruktion vs Chat-trail i samma prompt** | **L_AAAD (NY mini-5)** | **Code-prompt = instrumentella instruktioner. Chat-trail = reflektiv dokumentation i mini-överlämning, ej i Code-prompt** |
| **Lessons-kandidater "stannar i Chat-kontext"** | **L_AAAE (NY mini-5) — KRITISK** | **ALLA lessons-kandidater + design-insikter bakas in i mini-överlämning FÖRE Chat-session avslutas. Chat-trail är efemär, endast filartefakter överlever sessions-byte** |
| **Arkitektonisk konsekvens-resonemang utan empirisk falsifiering på alla scope-instanser** | **L_AAAB (NY mini-5)** | **Per-scope empirisk verifikation FÖRE bulk-fix kräver actuella fynd, inte härledd risk** |
| **Anti-bloat-bias-läckage från CLAUDE.md-domän till Code-prompt-domän** | **L_AAAC (NY mini-5)** | **Code-prompts har ingen instruction budget — fullständighet > komprimering. Block I-VI + Lager 2 + STOPPA-OCH-FRÅGA + transparens är 11/10-krav** |

## Mini-överlämning-storlekens semantik

Empirisk data från mini-1-5:

| Mini | Storlek (rader) | Scope-domän | Paradigm-skifte? |
|---|---|---|---|
| Mini-1 | ~500-600 | K1.1-K2.6.2.D.4 v1-trail | Nej |
| Mini-2 | ~700-800 | K2.6.2.D-pivot + reconciliation v1 | Nej |
| Mini-3 | ~800-900 | K3.1.b-K3.4 + reconciliation v2-final | Delvis (L_X.2-empiri etablering) |
| Mini-4 | ~700-800 | K0-trail + K3.5-prep + Lager 2 v0.1-skuld | Nej |
| Mini-5 | 924 | K3.5+K3.6-trail + arkitektur-revision + scope-separation | **Ja** |

**Bedömningsregel:** Paradigm-skifte → större mini-överlämning. Standard sessions-paus → mindre. Aldrig truncate kritisk kontext för "kortare läs-tid"-skäl.

## Källor

- `tasks/sessions/2026-05-16-session-6-6-6-mini-overlamning.md` — mini-1 (precedent)
- `tasks/sessions/2026-05-17-session-6-6-6-mini-overlamning-2.md` — mini-2 (precedent)
- `tasks/sessions/2026-05-17-session-6-6-6-mini-overlamning-3.md` — mini-3 (precedent)
- `tasks/sessions/2026-05-18-session-6-6-6-mini-overlamning-4.md` — mini-4 (precedent)
- `tasks/sessions/2026-05-20-session-6-6-6-mini-overlamning-5.md` — **mini-5 (REFERENS-IMPLEMENTATION)**
- L_AAA-klassen som anti-pattern-katalog (lessons.md L_AAA + sub-instanser 21-28)
- Lager 2-checklist v1.0 som extern skydds-mekanism (8 utvidgningar inkl. web-research + kontinuitet-arkitektur)
- ADR-030 (frontmatter-policy) för YAML-format-spec
- L_ZZ pair-programming-precedent (Code-fångst > Chat-self-fångst empiriskt 75-100%)
- Anti-bloat-konsensus web-research (mini-5 Del 3 — empirisk grund för CLAUDE.md-storlek-disciplin)
```

### Pre-leverans-grind för sessions-handoff (NY — empirisk från V2-prompt-debaclet)

Empirisk källa: En sessions-start-prompt ("V2") levererad mellan Chat-
sessioner var felkonstruerad på tre sätt. Den nya Chat-sessionen fångade
felen via STOPPA-OCH-FRÅGA innan något arbete utfördes. Felen är empirisk
grund för en obligatorisk pre-leverans-grind.

**Kärninsikt:** Lessons i en fil skyddar inte mot upprepning — samma chat
dokumenterade cross-scope-blandning, efemär trail och state-drift, och
byggde sedan en prompt som bröt alla tre. Externa grindar slår intern
disciplin (jfr Code-fångst 96-100% vs Chat-self-fångst 0%). Skillen måste
därför vara en GRIND som passeras före leverans, inte prosa som läses.

**De tre felklasserna:**

| Fel | Beskrivning | Hör hemma |
|---|---|---|
| A — Miljö-förväxling | Code-instruktioner (git, SHA-verifikation, repo-state) placerade i en Chat-prompt. Chat har project_knowledge + designtänk, inte git/repo-skrivning. | session-handoff.skill pre_delivery_gate |
| B — Datum-hårdkodning | Prompt stämplade ett TODAY-datum som var sant vid skrivtid men fel vid körtid (3 dagars drift over-weekend). | session-handoff.skill pre_delivery_gate |
| C — Lesson-namn utan kollisionskoll | Nya lesson-namn (L_AAAF/G/H) tilldelade utan katalog-sökning — kolliderade med kanoniska namn i reconciliation v2-final §3.7. | EJ handoff-skill — separat lessons-katalog-disciplin (lessons-hub-sync.skill eller CLAUDE.md-regel) |

**pre_delivery_gate — obligatorisk checklista för session-handoff.skill
(formaliseras Session 6.7 K4):**

Varje handoff-prompt MÅSTE passera samtliga punkter före leverans:

0. Målmiljö explicit deklarerad överst i prompten — Chat ELLER Code.
1. Varje instruktion är utförbar i den deklarerade målmiljön. Code-
   instruktioner (git, fil-läsning på disk, commits, push, repo-state-
   verifikation) får ALDRIG ligga i en Chat-prompt, och vice versa.
2. Noll hårdkodade datum. Handoffs instruerar mottagaren att verifiera
   TODAY i sin egen miljö vid körtillfället.
3. Noll nya lesson-namn tilldelade i prompten (se Fel C — namngivning
   sker först efter full katalog-läsning).
4. Varje refererad fil är åtkomlig i mottagarens miljö. En Chat-prompt
   refererar bara projektkunskap; den får inte bero på filer i ~/Downloads
   eller live-repo som Chat inte kan nå.
5. Räkningar och SHA:n som prompten anger är antingen (a) verifierbara av
   mottagaren själv, eller (b) explicit märkta som "overifierat — bekräfta
   vid körtid". Aldrig presenterade som fakta mottagaren inte kan stå för.

**Öppen fråga för Session 6.7 (utvärderas, ej avgjord):** Eftersom Chat-
self-fångst empiriskt är 0%, kan en grind som Chat kör på sig själv vara
otillräcklig. Starkare alternativ: handoff-prompter avsedda för en annan
session passerar Code eller Marcus som extern granskare före leverans.
Beslut tas i 6.7 K4 vid skill-formalisering.

**Kandidat-observationer för K-sista-0 (UTAN bokstavsnamn — namngivning i
K-sista-0 efter full katalog-läsning):**

- Obs A: Chat-prompt-design måste explicit deklarera målmiljö och endast
  innehålla instruktioner den miljön kan utföra.
- Obs B: Datum-stämplar i prompter som levereras över tid måste instruera
  mottagaren att verifiera TODAY själv, aldrig hårdkoda.
- Obs C: Nya lesson-namn får aldrig tilldelas utan föregående sökning av
  hela auktoritativa katalogen för kollision.
- Obs D: Filer en prompt refererar måste vara åtkomliga i mottagarens
  miljö (Chat når projektkunskap, ej Downloads eller live-repo).

### Bake-in-mekanism för Session 6.7-prep-fil (utvidgar K-sista-1-F)

Mini-överlämning 5 Del 8 (Session 6.7-prep-fil-uppdatering K-sista-1-F) utökas med en ny sub-§:

```markdown
### NY sub-§ 1.7 — `session-handoff.skill` (NY från Session 6.6.6 K-sista-1)

Mini-överlämning 5 (2026-05-20) är empirisk referens-implementation för `session-handoff.skill`. Skill-spec preliminär finns i mini-överlämning 5 Del 13.

**Session 6.7 K4 skill-design-arbete:**

- Läs mini-1 till mini-5 som empirisk grund
- Mini-5 har 13-stegs procedur inkl. POST-skapelse forensisk granskning (Steg 13 NY)
- Anti-pattern-katalog bake in från L_AAA-21 till L_AAA-28 + mini-5-precedent-instanser
- Storleks-semantik per empirisk mini-1-5-data (500-1500 rader, paradigm-skifte → större)

Status: Preliminär spec ✅ (mini-5 Del 13). Formell design i Session 6.7 K4.
```

### Konsekvens för Session 6.7 Del 1.2 Skills-tabell

Total skills-att-skapa-lista efter Session 6.6.6 K-sista-1:

| Skill | Källa | Status |
|---|---|---|
| `session-start.skill` | Session 6.7-prep ursprunglig | Ursprunglig scope |
| `session-end.skill` | Session 6.7-prep ursprunglig | Ursprunglig scope |
| `phase-end-verify.skill` | Session 6.7-prep ursprunglig | Ursprunglig scope |
| `lessons-hub-sync.skill` | Session 6.7-prep ursprunglig | Ursprunglig scope |
| `pre-commit-biome.skill` | Session 6.7-prep ursprunglig | Ursprunglig scope |
| `chat-self-review.skill` | Session 6.6 K-sista.1 lesson | Etablerad |
| `web-research-discipline.skill` | **NY Session 6.6.6 mini-5 (Marcus' Punkt 1)** | **NY scope-tillägg** |
| `session-handoff.skill` | **NY Session 6.6.6 mini-5 (denna Del 13)** | **NY scope-tillägg** |

**Total: 8 skills för Session 6.7 K4 skill-design** (6 ursprungliga + 2 NYA från mini-5).

### Lessons-konsekvens (för K-sista-0)

Lägg till i Del 6 Lessons-kandidat-tabell:

| Namn | Källa | Beskrivning |
|---|---|---|
| L_AAA-28 | Mini-5 post-skapelse forensisk granskning | Intra-fil-konsistens-drift i meta-dokument om L_AAA — 6 instanser fångade via grep + str_replace |
| L_AAAT | Mini-5 storleks-semantik-insikt | Paradigm-skifte-leverans → större mini-överlämning (>900 rader). Standard sessions-paus → mindre (~700-800). Bedömningsregel etablerad. |
| L_AAAU | Mini-5 session-handoff-skill-design | Mini-överlämning-skapande har genrekonventioner värda formalisering — 13-stegs procedur inkl. post-skapelse granskning |

**Total nya lessons från mini-5 + denna Del 13:** 14 (mini-5-bas) + 3 (denna Del 13) = **17 nya lessons-kandidater** för K-sista-0.

**Total post-K3.6 + denna Chat + Del 13: 94 + 20 = 114 lessons-kandidater att konsolidera (bas-räkning före Del 14).**

---

## Del 14 — Lessons-kandidater från mini-5-skapelse-iteration (2026-05-20 Chat-trail)

### Bakgrund

Marcus' direktiv 2026-05-20 post-mini-5-leverans + post-Code-rapport: "INGET kan stanna i denna chat... ALLT måste in i dokumentationen ALLTID." Empirisk insikt om fundamental arkitektur-disciplin: Chat-trail är efemär, endast filartefakter överlever sessions-byte.

Denna Del 14 fångar **7 nya lessons-kandidater som uppstod under mini-5-skapelse-iteration själv** (post-K3.6 Code-rapport-integration + post-mini-5-add Code-pre-commit-fångst-trail + Chat-self-granskning-iterationer). Alla MÅSTE in i mini-överlämning 5 INNAN den committas till repot, annars går de förlorade.

### Trail-rekonstruktion

Mini-5-skapelse-iteration omfattade följande Chat-design-cykler:

1. **Initial design** — Mini-5 utkast med Del 0-12 baserat på K3.5+K3.6-trail
2. **Post-Marcus-kontroll-fråga 1** — Forensisk granskning + 6 L_AAA-28-instanser fixade
3. **Post-Marcus-direktiv** — Del 13 (`session-handoff.skill`) tillagd
4. **Post-Code-rapport-integration** — 7 fix-områden uppdaterade (K3.6 5 commits + L_AAA-trajektoria harmoniserad + L_AAAV-AAAX tillagda)
5. **Post-Code mini-5-add-prompt** — Code's M5-pre-commit Vale.Repetition-fångst på rad 466
6. **Post-Marcus-kontroll-fråga 2** ("Varför blev inte CI grön?") — Forensisk falsifierings-test via mini-4-precedent
7. **Post-Code V.1-V.6-rapport** — Empirisk pinpoint av Vale Core-rule-arkitektur
8. **Post-Marcus-kontroll-fråga 3** ("Verklig 11/10 lösning?") — Chat-self-granskning A'.2 → A'.1
9. **Post-Marcus-kontroll-fråga 4** ("Varför kortare?") — A'.1 → A'.1 v2 utvidgning
10. **Post-Marcus-kontroll-fråga 5** ("Var ska Code addera lessons?") — A'.1 v2 → A'.1 v3 cross-scope-fix
11. **Post-Marcus-direktiv** ("INGET kan stanna i denna chat") — Denna Del 14

Total: 5 Marcus-kontroll-frågor + 1 direktiv triggade Chat-self-granskning-pass. Var och en fångade L_AAA-instanser hos Chat. Empirisk validering av L_ZZ pair-programming-precedent extended to Chat-side (75-100% extern fångst, 0% Chat-self-fångst).

### 7 nya lessons-kandidater

| Namn | Källa | Beskrivning |
|---|---|---|
| **L_AAAY** | Code's V.6 ls-config (mini-5-add pre-commit forensisk pinpoint) | Vale Core-rules är globala, inte per-scope BasedOnStyles-omfattade. `BasedOnStyles =` (tom) deaktiverar STYLES (Vale, Miranon, Vale.Terms-canonical) men INTE Core-rules (Vale.Repetition, Vale.Spelling). Per-scope explicit deaktivering krävs för Core-rules. Empirisk källa: Session 6.6.6 mini-5-add V.6 ls-config + V.5 1-rads minimal-repro "Vale .vale.ini" trigger-konstruktion |
| **L_AAAZ** | Code's M5-pre-commit-fångst (lokal-test vs CI-prediktion) | Empirisk lokal-test ≠ CI-prediktion utan ekvivalens-verifikation. Code's lokal-test rapporterade Vale.Repetition på rad 466, men slutsats "CI kommer falla" krävde empirisk verifikation av test-procedur-ekvivalens (V.1 path-verifikation + V.5 CI-kommando-verifikation). L_AAA-instans från Code-sidan, mitigerat via Marcus' "varför blev inte CI grön"-fråga som triggade forensisk pinpoint-pass |
| **L_AAAÅ** | Chat-self initial-falsifiering (mini-4-precedent-misstolkning) | Forensisk falsifierings-test via precedent kräver djup-analys av varför precedent är giltig. Chat-hypotes "mini-4 grön → BasedOnStyles=tom deaktiverar Vale.Repetition" var fel slutsats från korrekt precedent — korrekt slutsats var "mini-4 saknade Word.Word-trigger-konstruktion". Lesson: empirisk precedent kräver mekanism-djupanalys, inte ytlig analys |
| **L_AAAB** | Chat-self-granskning A'.2 → A'.1 (post-Marcus-kontroll-fråga 3) | Arkitektonisk konsekvens-resonemang utan empirisk falsifiering på alla scope-instanser är L_AAA-mönster. Per-scope verifikation FÖRE bulk-fix kräver actuella fynd, inte härledd risk. Min A'.2 (alla 6 BasedOnStyles=tom-zoner) var arkitektoniskt resonerad men empiriskt obevisad på 5 av 6 zoner. A'.1 (endast 1 zon, mini-5-specifik) är empiriskt grundad |
| **L_AAAC** | Chat-self A'.1 → A'.1 v2 (post-Marcus-kontroll-fråga 4) | Anti-bloat-konsensus för CLAUDE.md gäller INTE Code-prompts. Code-prompts ska vara så långa som uppgiften kräver för 11/10-disciplin (Block I-VI struktur + Lager 2 + STOPPA-OCH-FRÅGA + transparens-rapport). Kort prompt-design = potentiell anti-bloat-bias-läckage från CLAUDE.md-domän till Code-prompt-domän |
| **L_AAAD** | Chat-self A'.1 v2 → A'.1 v3 (post-Marcus-kontroll-fråga 5) | Chat-prompt-design blandar Code-instruktioner med Chat-trail-dokumentation. Code är instrumentell (vad ska göras), Chat-trail är reflektiv (vad lärdes). Lessons-kandidater hör inte hemma i Code-prompt — Code har ingen giltig plats att addera dem. L_T-mönster (Chat-prompt cross-scope-värden är design-bug) |
| **L_AAAE** | Marcus' direktiv "INGET kan stanna i denna chat" (post-A'.1 v3) | **KRITISK ARKITEKTUR-DISCIPLIN.** Chat-trail är efemär — försvinner vid sessions-byte. Endast filartefakter (mini-överlämningar, sessionsdok, lessons.md, ADRs) överlever. Alla lessons-kandidater MÅSTE bakas in i filartefakter INNAN sessions-byte, annars går de förlorade. Chat-kontext är arbete-i-flygande, filer är arbete-säkrat. Detta är hela kontinuitet-arkitekturen — hub-spoke-portabilitet, sessions-handoff, lessons.md, ADRs bygger på "filartefakter är sanningskällan" |

### Klassificering för K-sista-0-konsolidering

Per Del 6 klass-pattern-tabell, dessa 7 nya kandidater faller i:

| Klass | Nya instanser |
|---|---|
| Empirisk-disciplin-klass | L_AAAÅ, L_AAAB |
| Tooling-disciplin-klass | L_AAAY |
| Disciplin-meta-klass (L_AAA-klassen) | L_AAAZ, L_AAAD |
| Web-research-klass | L_AAAC (anti-bloat-bias-läckage är web-research-relaterad insikt) |
| **Kontinuitet-arkitektur-klass (NY)** | **L_AAAE** — egen klass pga fundamental arkitektur-implikation |

L_AAAE är så kritisk att den motiverar **ny klass-pattern-kategori** för K-sista-0: "Kontinuitet-arkitektur-disciplin". Total klass-pattern-tabell nu 13 kategorier (12 från Del 6 + 1 NY från L_AAAE).

### Uppdaterad räkning

**Total post-Del-14: 94 + 27 = 121 lessons-kandidater att konsolidera i K-sista-0.**

Räkning per källa:

- 94 från reconciliation v2-final (bas-räkning pre-mini-5)
- 4 från mini-4 Del 5 K3.5 design + K3.5 V.B.6 (L_AAAM-L_AAAP)
- 7 från denna Chat-iteration pre-Del-13 (L_AAA-21 till L_AAA-27)
- 3 från web-research 2026-05-20 (L_AAAQ-L_AAAS)
- 3 från Del 13 mini-handoff-skill-design (L_AAA-28, L_AAAT, L_AAAU)
- 3 från Code Block VII.5 K3.6-emergent (L_AAAV-L_AAAX)
- **7 från Del 14 mini-5-skapelse-iteration (L_AAAY-L_AAAE)**

Total: 94 + 4 + 7 + 3 + 3 + 3 + 7 = **121**

### Konsekvens för K-sista-1-E (Lager 2 v0.1 → v1.0)

L_AAAE etablerar **NY operativ disciplin** som ska in i Lager 2 v1.0 som **utvidgning #8**:

> **§NY (#8) — Kontinuitet-arkitektur-disciplin.** Allt som ska överleva sessions-byte MÅSTE bakas in i filartefakter INNAN Chat-session avslutas. Lessons-kandidater i Chat-output är inkompletta tills de finns i mini-överlämning / lessons.md / ADRs / Lager 2-checklist. Chat-trail är arbete-i-flygande, filer är arbete-säkrat. Pre-sessions-byte verifikation: "Är allt nytt från denna Chat säkrat i filer?"

**Lager 2 v0.1 har nu 8 v1.0-skuld-utvidgningar** (6 från mini-4 + 1 web-research från mini-5-bas + 1 NY kontinuitet-arkitektur från Del 14 / L_AAAE). K-sista-1-E bumpar med ALLA 8 utvidgningar internaliserade.

### Konsekvens för `session-handoff.skill` (Del 13)

L_AAAE + L_AAAD adresserar direkt skill-spec. Del 13 anti-pattern-katalog utökas med:

| Anti-pattern | L_AAA-instans | Mitigation |
|---|---|---|
| Lessons-kandidater "stannar i Chat-kontext" | L_AAAE (NY) | ALLA lessons-kandidater bakas in i mini-överlämning FÖRE Chat-session avslutas |
| Cross-scope Code-instruktion vs Chat-trail i samma prompt | L_AAAD (NY) | Code-prompt = instrumentella instruktioner. Chat-trail = reflektiv dokumentation i mini-överlämning, ej i Code-prompt |

Del 13 procedur utökas med Steg 14 (post-Steg-13):

> **14. Pre-leverans verifikation — "Är allt nytt säkrat i fil?"**
>
> FÖRE filartefakt levereras till Marcus: granska Chat-iteration-trail för insikter, designval, kontroll-fråge-svar, L_AAA-fångster som UPPSTÅTT under skapelse-iterationen själv. Säkerställ att de är bakade in i mini-överlämningen (egen Del eller utvidgning av befintlig Del). L_AAAE är empirisk precedent: 7 lessons-kandidater uppstod under mini-5-skapelse-iteration själv som hade gått förlorade utan post-skapelse-trail-fångst.

### Konsekvens för hub-CLAUDE.md (K-sista-1-D scope-utökning)

L_AAAE motiverar potentiell **NY "Ristat i sten"-bullet** i hub-CLAUDE.md (utöver web-research-rule):

> **Kontinuitet-arkitektur-disciplin.** Chat-trail är efemär (försvinner vid sessions-byte). Endast filartefakter (CLAUDE.md, lessons.md, sessionsdok, ADRs, checklist) överlever. Insikter / lessons / designval som uppstår under Chat-iteration MÅSTE bakas in i filartefakter INNAN sessions-byte. Pre-sessions-byte verifikation: "Är allt nytt säkrat i fil?" Etablerad Session 6.6.6 K-sista-1 (2026-05-20) efter Marcus' direktiv post-mini-5-Code-rapport-iteration.

**Defer-beslut för K-sista-1-D:** Web-research-rule ska in i K-sista-1-D per bekräftat scope. Kontinuitet-arkitektur-rule (L_AAAE) kan antingen:

- **Alt α** — paketeras MED web-research-rule i samma K-sista-1-D-commit (båda är "Ristat i sten"-bullets, samma semantik-domän)
- **Alt β** — defer till Session 6.7 K2 hub-CLAUDE.md-audit för formell bake-in

**Min rek:** Alt α. Skäl: båda reglerna är fundamentala kontinuitet-discipliner, hör semantiskt ihop, K-sista-1-D är naturlig hem-commit. K7 atomic-disciplin tillämpat: samma semantik-domän = samma commit. Nästa Chat avgör slutligen.

### Spårbarhet

| Källa | Form |
|---|---|
| L_AAAY-L_AAAÅ | Chat-trail 2026-05-20 post-Code V.1-V.6-rapport |
| L_AAAB-L_AAAD | Chat-trail 2026-05-20 Chat-self-granskning A'.2 → A'.1 → A'.1 v2 → A'.1 v3 |
| L_AAAE | Chat-trail 2026-05-20 post-Marcus-direktiv "INGET kan stanna i denna chat" |

Alla 7 lessons-kandidater finns nu **bakade i denna mini-överlämning 5 Del 14**. Sessions-byte kommer inte förlora dem.

---

## Avslut

> **Slut på mini-överlämning 5.**
>
> Detta dokument är komplett sessions-state-snapshot post-K3.6 +
> arkitektur-revision pre-K-sista-0. Vid sessionsbyte: nästa Chat-
> iteration läser DENNA fil + auktoritativa filartefakter per Del 10,
> applicerar Lager 2 v0.1 med 8 utvidgningar från första prompt,
> börjar K-sista-0 lessons-konsolidering.
>
> Session 6.6.6 är inte avslutad — paus pre-K-sista-0 pga Chat-
> bandwidth-bevarande för lessons-konsoliderings-design-tunga arbete.
> Naturlig pausnivå.
>
> **Kritisk leverans denna mini-överlämning:**
>
> 1. **Web-research-syntes** — empirisk grund för arkitektur-revision
> 2. **"Var lever reglerna"-karta** — distribuerad arkitektur tydligt
> 3. **K-sista-1 scope-revision** — defer 5 aktiviteter till Session 6.7
> 4. **Web-research-rule** — NY hub-rule etableras i K-sista-1
> 5. **Session 6.7-prep-uppdatering** — NY scope för K-sista-1-F
> 6. **L_AAA-25/26/27 + L_AAAM-AAAS + L_AAA-28 + L_AAAT-AAAU + L_AAAV-AAAX + L_AAAY-L_AAAE** — 27 nya lessons-kandidater (121 totalt för K-sista-0)
> 7. **`session-handoff.skill` referens-implementation (Del 13)** — 13-stegs procedur + anti-pattern-katalog + bake-in-mekanism för Session 6.7 K4
> 8. **K3.6 5 commits inkl. emergent K3.6-E** (broken-link errata-ai → vale-cli) — CI grön bekräftad run `26175893903`
> 9. **L_AAA-trajektoria harmoniserad** — Code's empiriska 25/26 = 96.2% (primär) + Chat-design-instans-räkning (sekundär)
> 10. **Vale-baseline 0/0/0 FÖRSTA gången** sedan Vale-aktivering Session 6.6 K6
> 11. **Del 14 mini-5-skapelse-iteration-trail** — 7 lessons-kandidater (L_AAAY-L_AAAE) bakade i fil per L_AAAE-disciplin
> 12. **Lager 2 v1.0 utvidgning #8** (NY från L_AAAE) — Kontinuitet-arkitektur-disciplin specat för K-sista-1-E
> 13. **Vale-config M5-A pre-fix dokumenterad** — `Vale.Repetition = NO` i `[tasks/sessions/**/*.md]`-scope per ADR-023 frozen trail-zon, empirisk grund V.1-V.6 pinpoint
> 14. **Hub-CLAUDE.md K-sista-1-D scope-tillägg** (Alt α rek) — Kontinuitet-arkitektur-rule paketeras MED web-research-rule
>
> **Marcus' direktiv 2026-05-20:**
>
> - Punkt 1: Web-research "stenhård regel" — ✅ adresserad via K-sista-1-D
> - Punkt 2: Session 6.7-medvetenhet — ✅ adresserad via scope-separation
> - Bekräftelse 1: Sessions-numrering klar (Session 6.7 inte 6.6.7) — ✅
> - Bekräftelse 2: Smalare K-sista-1-scope — ✅
> - Bekräftelse 3: Web-research-rule placering K-sista-1 — ✅
> - Kontroll-fråga 1 (Code-rapport-integration) — ✅ 7 fix-områden integrerade
> - Kontroll-fråga 2 ("Varför inte CI grön?") — ✅ V.1-V.6 forensisk pinpoint
> - Kontroll-fråga 3 ("Verklig 11/10?") — ✅ A'.2 → A'.1 empirisk-grundad
> - Kontroll-fråga 4 ("Varför kortare?") — ✅ A'.1 → A'.1 v2 anti-bloat-bias fix
> - Kontroll-fråga 5 ("Var ska Code addera lessons?") — ✅ A'.1 v2 → A'.1 v3 cross-scope-fix
> - Direktiv ("INGET kan stanna i denna chat") — ✅ Del 14 bakat in 7 lessons-kandidater
>
> **Nästa Chat-iteration börjar:** K-sista-0 lessons-konsolidering 121 → 10-15 hub-lessons med denna mini-överlämning som auktoritativ kontext.
