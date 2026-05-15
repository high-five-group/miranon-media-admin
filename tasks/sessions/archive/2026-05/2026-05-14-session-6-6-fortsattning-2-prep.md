# Session 6.6 fortsättning #2 — Sessionsstart-prompt + handoff-kontext

> **Källa:** Session 6.6 K7.D bake-in 2026-05-15. Föregående Chat-session
> splittades efter K7.C atomic policy-rollout per hub-CLAUDE.md context-
> rot-disciplin (~28 meddelanden) + Chat:s self-assessment efter 5 Gate 2-
> fångster (4 Marcus + 1 Code).
>
> **Status pre-fortsättning-2:** Session 6.6 K1-K7 ✅ KLAR. K7.5 + K7.E +
> K9 + K-sista EJ STARTAD. HEAD `866dd7c`. CI senaste run ✅ success.
>
> **Sjukt-bra-handoff-disciplin per Marcus' explicit krav 2026-05-15:**
> ALLT som lever bara i föregående Chat-session är committat i denna fil
> + sessionsdok Del 4 K7 ✅ KLAR-rad. Ny Chat ska kunna starta utan
> tappad kontext.

---

## Sessionsstart-prompt för Session 6.6 fortsättning #2

```text
Effort: max

Session 6.6 fortsättning #2. K7.B + K7.C ✅ KLAR commit 866dd7c.
Föregående session splittades per hub-CLAUDE.md context-rot-disciplin
+ Chat self-assessment efter 5 Gate 2-fångster (4 Marcus + 1 Code).

K1-K7 ✅ KLAR. K7.5 + K7.E + K9 + K-sista återstår.

LÄS (i denna ordning):

1. ~/Repon/marcus-system/CLAUDE.md — Hub-konstitution + särskilt
   "Hur Marcus jobbar" (Code-host-bake-in target K-sista) +
   "Instruktioner — Alltid gäller" ("Ristat i sten"-rad target K-sista)
2. ~/Repon/miranon-media-admin/CLAUDE.md — Projekt-konstitution. Status
   bör vara "Session 6.5 ✅ KLAR" (uppdateras vid K-sista)
3. ~/Repon/miranon-media-admin/tasks/sessions/2026-05-14-session-6-6.md
   — AKTIVT SESSIONSDOK. K1-K7 ✅ KLAR-trail i Del 4. K7.5+K8+K9+K-sista
   EJ STARTAD. K7.D bake-in 2026-05-15.
4. ~/Repon/miranon-media-admin/docs/decisions/ADR-030 — Status: Draft.
   § Del 2 listar 7 styrande docs men K7-faktisk-scope är 9. Utvidgas
   vid K-sista. Status bumps Draft → Accepted.
5. ~/Repon/miranon-media-admin/tasks/lessons.md — Session 6.5 H2 (K2.12-
   K2.15 pattern-referens). Session 6.6 H2 ej skapad än (K-sista-arbete).
6. ~/Repon/miranon-media-admin/tasks/sessions/2026-05-14-session-6-6-fortsattning-2-prep.md
   — DENNA FIL. Innehåller komplett K1-K7-trail + 5 Gate 2-fångster
   med exakt formulering + 8 lessons-kandidater + K7.5 design-spec +
   Vale-mönster-defer + "Ristat i sten"-rad exakt + 13-stegs K-sista-
   checklista + 3 defer-paket.
7. .frontmatter-policy.conf + scripts/check-frontmatter.sh +
   .githooks/pre-commit — för K7.5 pattern-matching
8. scripts/check-public-checklists.sh — för K7.5 refactor-source

VERIFIERA projektkunskaps-färskhet per K6.5.3:
Fråga Marcus: "Har du klickat Update på Claude.ai-projektet efter
K7.D-push?" Om nej: STOPPA, Marcus klickar Update.

RAPPORTERA sedan:

Block A — Repo-state:
- Branch + HEAD (förväntat: post-866dd7c, sannolikt en eller två
  K7.D-relaterade commits)
- Uncommitted: clean
- CI senaste 3 runs (alla 5 grindvakter aktiva inkl. frontmatter-
  validator)

Block B — Session 6.6 status-bekräftelse:
- K1-K7: ✅ KLAR (commit-trail per sessionsdok Del 4)
- K7.5+K8+K9+K-sista: EJ STARTAD
- 3 defer-paket aktiva: 6.6.5 + 6.6.6 + 6.6.7

Block C — Föreslagen K7.5+K7.E+K9+K-sista plan:
- K7.5: K5 retroaktiv refactor till config-driven (analog till K7)
- K7.E: REDAN GJORT i K7.C (CI-step "Validate frontmatter on
  governing docs" är aktiv) — verifiera empiriskt
- K9: Empirisk full-CI-verifikation alla 5 grindvakter + tids-
  mätning per Strategi E-paradigm
- K-sista: 13-stegs multi-step (se denna fils § K-sista-checklista)

Block D — STOPPA-OCH-FRÅGA:
- K7.5 design-detaljer: bekräfta sub-alt B (separat .checklist-
  policy.conf) + test-suite-spec
- K-sista commit-strategi: 3 atomic commits (projekt K-sista + hub-
  commit + sessionsdok-arkivering) — verifiera ordning
- ADR-030 § Del 2-utvidgning: 7 → 9 docs vid K-sista bake-in
- Vale-mönster-hub-extraktion-flagga till Session 6.7-prep — verifiera
  scope (3 mönster: brand-pattern + stack-shift-pattern + vocab-dual-
  function)

DISCIPLINER (samma som föregående session — internalisera särskilt
#9 + #10 som tillkom i K7):

#1 — Empirisk dry-run av ALLA grindvakter FÖRE stage (nu 5 stycken
     inkl. frontmatter)
#2 — Auto-fix-verifikation via git diff (spot-check 3-5 filer) om
     fix-paket körs
#3 — Sub-alternativ för DEFERRED-FIX-MARKER per K1.13: tre nivåer
     (rad/fil/regel) — välj empiriskt
#4 — Open PR ekosystem-check post-merge (K2.5-disciplin)
#5 — Baseline-volym + fynd-typ-distribution FÖRST innan klassning
#6 — Empirisk verifikation FÖRE design-ratifikation (K3 + K6.1-K6.2-
     utvidgning + K7 Lesson #7)
#7 — Chat-prompt-granskning (K2.15 Gate 2-review) även för
     genomtänkta Chat-prompter
#8 — Hub-spoke-portabilitet är default-arkitektur (K7 Lesson #6) —
     ALL custom CI-grindvakts-logik är config-driven
#9 (NY) — Datum-stämplar i prompt-spec kategoriseras "historisk-
          stabil" vs "löpande-mekanisk" (K7 Lesson #7)
#10 (NY) — Gate 2-disciplin är inte aktör-specifik — vem som helst
           med ground truth + skarp empirisk fråga är legitim Gate 2-
           utövare (K7 Lesson #8)

GÖR INGET ANNAT än Block A-D RAPPORTERA. Vänta på Marcus' beslut
innan K7.5-IMPLEMENTERA.
```

---

## K1-K7 Komplett trail

| K | Status | Commit | Tema |
|---|---|---|---|
| K1 | ✅ KLAR | `fe5ecc5` | Sessionsdok-skelett + ADR-030 utkast + observations-pass |
| K2 | ✅ KLAR | `16ee4ec` | yamllint (uppvärmning) |
| K2.5 | ✅ KLAR | `ae306ac` | Dependabot defer → 6.6.5 |
| K3 | ✅ STÄNGD | `e74eb2f` | typos avvisat per empirisk baseline |
| K4 | ✅ KLAR | `dba0440` | markdownlint-cli2 Strategi B+ (10 570 → 0) |
| K5 | ✅ KLAR | `5df97b8` + `f408469` | scripted-checklist + MD038 hotfix |
| K6 | ✅ KLAR | `c652be6` + `a98f7ba` | Vale + Miranon-stilguide |
| K7.A | ✅ KLAR | (RAPPORTERA, no commit) | Pre-flight + observations-pass |
| K7.B | ✅ KLAR | (untracked, K7.C committade dem) | Validator + hook + test-suiter |
| K7.C | ✅ KLAR | `866dd7c` | Atomic policy-rollout (17 filer, 914+/7-) |
| K7.D | ✅ KLAR | (denna commit) | Sessionsdok-bake-in + handoff-prep |

---

## 5 Gate 2-fångster från Session 6.6 (mest värdefulla retrospektiv-domän)

[Exakt samma 5 fångster som i sessionsdok Del 4 K7-bake-in — kopierat hit
för stand-alone-läsning]

### Fångst #1 — K2.15 lessons.md rad 12 roll-blindhet (Marcus)

**Citat (Marcus):** "En fråga bara, om vi tar bort raden så går ju 'vad
hände senast?' förlorad eller, du prata ju om de?"

**Chat-fel:** Föreslog (a) "ta bort raden" eftersom innehållet (3
[UNIVERSAL]-lessons från Fas A) verifierades existera annorstans i H2-
blocken.

**Korrekt analys:** Raden har TVÅ funktioner:
- Datum-stämpel (frontmatter `updated:` ersätter mekaniskt)
- Quick-reference/orienterings-anchor (existerar bara här, kräver
  bevarande)

**Resultat:** (b) med stale-fix — behåll quick-reference-roll, bumpa
till aktuell Session 6.5-state. Bonus-fynd: rad 12 var 10 dagar stale.

**Mönster:** K2.12 polish-inom-semantik-domän — när huvud-ändring gör
annan del redundant ELLER stale, hanteras paras i samma commit.

### Fångst #2 — K2.15 alla-9-filer roll-blindhet (Marcus)

**Citat (Marcus):** "Men de andra 10 filerna då, tas alla 'vad hände
senast?' bort eller?"

**Chat-fel:** Generaliserade per-fil-tabell för fort efter Fångst #1 —
sade "ta bort prosa" eller "behåll Primär-version-flagga" utan att
fråga "vilka roller har raden per fil?".

**Korrekt analys:** Per-fil empirisk roll-analys visade 4 kategorier:
1. **Endast datum-stämpel** (hub-CLAUDE.md rad 4) → ta bort
2. **Roll-flagga + datum** (data-model.md, hur-systemet-funkar.md) →
   behåll "Primär version"-flagga, ta bort datum
3. **Quick-reference med stale-fix** (CLAUDE.md rad 3, BYGGPLAN-
   LÄTTLÄST rad 10, SECURITY-SPEC rad 902, lessons.md rad 12) → bumpa
   till aktuell + reformulera
4. **Ingen prosa** (byggplan.md, KVALITETSDEFINITIONER, decisions/
   README) → bara frontmatter-add

**Bonus-fynd:** 3 av 10 filer var empiriskt stale — CLAUDE.md rad 3
"Fas 2 startar nästa session" (8 dagar + fundamentalt fel), BYGGPLAN-
LÄTTLÄST 1 dag stale, SECURITY-SPEC potentiellt stale.

**Mönster:** Roll-bevarande > substans-renhet vid migration-arbete.
Per-fil empirisk analys istället för generalisering.

### Fångst #3 — K2.15 hub-spoke arkitektur-blindhet (Marcus)

**Citat (Marcus):** "Detta blir alltså Hårdkodat? Jag kan inte
duplicera detta till andra projekt/spokes/repon sedan?"

**Chat-fel:** Designade K7.B med hårdkodad `GOVERNING_DOCS=(...)`-
array direkt i scripts/check-frontmatter.sh + .githooks/pre-commit.
Strider mot hub-and-spoke-arkitekturen i marcus-system/CLAUDE.md.

**Korrekt analys:** Per `~/Repon/marcus-system/CLAUDE.md`:
- "Hubben äger universella principer + mallar"
- "Researcha etablerade bibliotek INNAN du designar en lösning.
  Gäller särskilt för bibliotekskod som ska bära flera produkter."
- lessons.md [UNIVERSAL]: "Korsreferens > duplicering" — "Varje
  sanning lever på ett ställe"

**Resultat:** Alt C (lokal config-fil + portabel logik, hub-lyft 6.7).
`.frontmatter-policy.conf` skapad. Skripten är config-driven.

**Mönster:** K7 Lesson #6 (UNIVERSAL).

### Fångst #4 — K2.15 klass-blindhet systematisk hårdkodning (Marcus)

**Citat (Marcus):** "Men nu blir Frontmatter återanvändbar, men de
andra verktygen då? Är hela CI flödet återanvändbart? Att vi hårdkodar
går emot ALLT vad det här projektet är, det ska vara 11/10 på
återanvändbarhet, det ska vara ristat i sten, sök i projektet får du
se."

**Chat-fel:** Applicerade portabilitet bara på K7 isolerat efter
Fångst #3. Missade att se mönstret över hela K2-K7-scopet.

**Korrekt analys (efter audit):**
- K2 yamllint: ✅ portabel (standard tool + standard scope)
- K4 markdownlint-cli2: ✅ portabel (standard tool + branschpraxis-config)
- **K5 scripted-checklist: ❌ HÅRDKODADE miranon-paths** (`docs/byggplan.md`
  + `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md`) — redan committad 5df97b8
- K6 Vale: ⚠ tool portabel, brand/terms per design projekt-specifika,
  **men mönstren (brand-pattern, stack-shift-substitution, vocab dubbel-
  funktion) saknar hub-extraktion**
- K7 frontmatter: ✅ portabel efter Alt C

**Resultat:**
1. K7.5 NY mini-K (retroaktiv K5-refactor) — schemalagd Session 6.6
   fortsättning #2
2. Vale-mönster-hub-extraktion defer Session 6.7
3. Ny "Ristat i sten"-rad i hub-CLAUDE.md "Instruktioner — Alltid
   gäller" vid K-sista
4. K7 Lesson #6 utvidgad (UNIVERSAL)

**Mönster:** Klass-tänkande > instans-tänkande för arkitektur-arbete.

### Fångst #5 — K2.15 datum-drift Code-fångad (Code)

**Citat (Code):** "TODAY=2026-05-15 + spec=updated: 2026-05-14 +
git_log alla 9 filer=2026-05-15 → validator Check 2 FAILS för alla 9
om körs INNAN commit"

**Chat-fel:** K7.C-prompt ärvde `updated: 2026-05-14` från ADR-030 +
sessionsdok-konventionen utan att verifiera att TODAY (vid Code-
exekvering) faktiskt är 2026-05-14. K7.B implementerades 2026-05-14,
K7.C exekverades 2026-05-15.

**Korrekt analys:**
- "Etablerad 2026-05-14" = historisk-stabil pekare (K1 skelett
  `fe5ecc5`)
- `updated: YYYY-MM-DD` = löpande-mekanisk (frontmatter-domän)
- Båda är korrekta i sina respektive domäner

**Resultat:** updated: 2026-05-15, review_by: 2026-11-15. "Etablerad
2026-05-14"-referenser oförändrade (historisk-stabil).

**Mönster:** K7 Lesson #7 + K7 Lesson #8 — Gate 2 inte aktör-specifik.

---

## 8 lessons-kandidater K7 (alla [UNIVERSAL] för hub-lyft)

[Samma 8 lessons som i sessionsdok Del 4 K7-bake-in — kopierat hit för
stand-alone-läsning]

1. **Frontmatter-migration är möjligt-omöjligt-test för befintlig
   prosa.** Innan föreslå "behåll info i ny form", verifiera empiriskt
   om infon redan finns annorstans. Källa: Fångst #1.

2. **Migration är möjlighet för stale-detection.** Frontmatter-
   migration audita manuella metadata-värden mot faktisk state. 3 av 10
   filer stale i K7. Källa: Fångst #2 bonus-fynd.

3. **Verifiera både INNEHÅLL och ROLL innan borttagning av metadata-
   prosa.** Rader har funktioner, inte bara substans. Källa: Fångst #1
   reviderad.

4. **Roll-bevarande > substans-renhet vid migration.** Per-fil-
   empirisk-analys > generalisering. Källa: Fångst #2.

5. **Frontmatter auto-bump täcker datum-drift, INTE kontext-drift.**
   Kontext-rader kräver semantisk uppdatering vid relevant händelse.
   Pre-commit hook = mekanisk; semantisk = sessionsavslut-checklista.
   Källa: K7-design (kontext-rader CLAUDE.md rad 3 + BYGGPLAN-LÄTTLÄST
   rad 10 + lessons.md rad 12 är inte auto-bumpbara).

6. **Hub-spoke-portabilitet är default-arkitektur, hårdkodning kräver
   explicit motivering.** Gäller nya + retroaktiva + mönster-
   extraktion. Branschpraxis-bevisning: `.eslintrc` + `.prettierrc` +
   `.markdownlintrc` + `.vale.ini` separation. Källa: Fångster #3 + #4.

7. **Datum-stämplar i Code-prompter måste verifieras mot TODAY vid
   exekverings-tid.** Kategorisera: "historisk-stabil" (ADR-domän) vs
   "löpande-mekanisk" (frontmatter-domän). Källa: Fångst #5.

8. **Gate 2-disciplin är inte aktör-specifik.** Marcus + Code + ev.
   andra aktörer med ground-truth-tillgång är legitima Gate 2-utövare.
   K2.15 generaliseras. Källa: Fångst #5.

**K7.B-specifika lessons (klassas "miljö-disciplin", flaggas men ej
nödvändigt [UNIVERSAL]):**

- BSD grep + leading-dash kräver `--` även i positional context
- SC2069 ordning `>/dev/null 2>&1` (shellcheck fångar; utan: silent fail)
- Bash 3.2 + set -u tomma array-iterations kräver guard

**2 defer-flaggor från K7.B (Session 6.6.7 eller K7.E-tillägg):**

- CRLF line-endings detection
- Symlink-handling i validator

---

## K7.5 design-spec (för Session 6.6 fortsättning #2 IMPLEMENTERA)

**Scope:** Retroaktiv refactor av `scripts/check-public-checklists.sh`
till config-driven samma pattern som K7.

**Beslut bekräftade:**
- Sub-alt **B** (separat `.checklist-policy.conf`-fil) per branschpraxis-
  konsistens
- Atomic commit per K2.12 polish-inom-semantik-domän

**Ny artefakt — `.checklist-policy.conf`** (top-of-repo, bash-source-bar):

```bash
# .checklist-policy.conf
#
# Per-projekt config för scripts/check-public-checklists.sh.
# Skriptens LOGIK är universell (kan dupliceras till andra spokes utan
# refactor); värden här är PROJEKT-SPECIFIKA.
#
# Hubliftad-design: vid Session 6.7 lyfts skriptet till
# ~/Repon/marcus-system/scripts/ eller claude-skills/. Denna config-fil
# förblir per-spoke.
#
# === Duplicera till nytt spoke (4 steg) ===
# 1. cp scripts/check-public-checklists.sh + denna fil till nytt repo
# 2. Anpassa CHECKLIST_FILES_PLAIN nedan
# 3. Anpassa CHECKLIST_FILE_WITH_EXCLUSION (typiskt CONTRIBUTING.md)
# 4. CI-step finns redan i .github/workflows/ci.yml
#
# Källa: docs/decisions/ADR-030-docs-grindvakter-frontmatter-policy.md
#        Retroaktiv K7.5 refactor (Session 6.6 fortsättning #2)
#        Per K7 Lesson #6 (UNIVERSAL) hub-spoke-portabilitet

# === Vita listan (måste vara grön, inga oavslutade `- [ ]`) ===
CHECKLIST_FILES_PLAIN=(
    "README.md"
    "CHANGELOG.md"
    "SECURITY.md"
    "docs/byggplan.md"
    "docs/specs/BYGGPLAN-LÄTTLÄST-v3.md"
)

# === Fil med sektion-baserad exklusion ===
# DoD-mall-rubriker triggar skip=1 tills nästa H2-rubrik
CHECKLIST_FILE_WITH_EXCLUSION="CONTRIBUTING.md"
```

**Refactor av `scripts/check-public-checklists.sh`:**

Ersätt:
```bash
FILES_PLAIN=(
  "README.md"
  ...
)
FILE_WITH_EXCLUSION="CONTRIBUTING.md"
```

Med config-load-pattern identiskt med check-frontmatter.sh:
```bash
CONFIG_FILE=".checklist-policy.conf"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Config saknas: $CONFIG_FILE"
    echo "Fix: skapa .checklist-policy.conf i repo-root..."
    exit 1
fi
# shellcheck source=/dev/null
source "$CONFIG_FILE"
FILES_PLAIN=("${CHECKLIST_FILES_PLAIN[@]}")
FILE_WITH_EXCLUSION="$CHECKLIST_FILE_WITH_EXCLUSION"
```

**Ny test-suite `scripts/test-check-public-checklists.sh`** (5 testfall):

- T1: Clean state → exit 0 (4 från K5 empirisk-suite)
- T2: README.md inject `- [ ]` → exit 1 + actionable output
- T3: CONTRIBUTING.md inject UNDER `## Definition of Done` → exit 0
  (exkluderad)
- T4: Marcus' caveat-test — CONTRIBUTING.md inject UNDER annan H2 efter
  DoD → exit 1 (per-sektion-skopa fungerar)
- T5: Saknad config → exit 1 + actionable Fix:-meddelande (NYTT per K7
  Lesson #6)

**ADR-030 § Del 1.5-uppdatering:** lägg till note om retroaktiv refactor:

> *"Retroaktiv refactor 2026-05-XX (Session 6.6 fortsättning #2 K7.5):
> hårdkodad fil-lista flyttad till `.checklist-policy.conf` per K7
> Lesson #6 (UNIVERSAL) hub-spoke-portabilitet. Branschpraxis-bevisning:
> separation per grindvakt analogt med `.yamllint.yml` /
> `.markdownlint-cli2.jsonc` / `.vale.ini` / `.frontmatter-policy.conf`."*

---

## "Ristat i sten"-rad — exakt formulering för hub-CLAUDE.md K-sista

Schemaläggs vid K-sista som tillägg till
`~/Repon/marcus-system/CLAUDE.md` "Instruktioner — Alltid gäller"-sektion.
**Paras med Code-host-bake-in + hub-frontmatter-add i samma atomic hub-
commit per K2.12 polish-inom-semantik-domän.**

**Exakt rad (verbatim — får INTE redigeras vid K-sista IMPLEMENTERA):**

> **Custom CI-grindvakts-logik i spokes är alltid config-driven.**
> Skriptens logik är universell (kan dupliceras till andra spokes utan
> refactor); värden lever i `.<grindvakt>-policy.conf` per-projekt.
> Hardkodning av projekt-specifika paths/listor i skript är anti-mönster.
> Branschpraxis-pattern: `.eslintrc` + `.prettierrc` + `.markdownlintrc` +
> `.vale.ini` är alla separata config-filer per grindvakt — vår konvention
> följer samma separation. Etablerat 2026-05-14 Session 6.6 K7
> (frontmatter-grindvakt) + retroaktiv K5-refactor (Session 6.6
> fortsättning #2 K7.5). Lesson #6.

---

## Vale-mönster-hub-extraktion (defer Session 6.7)

**Flaggas i Session 6.7-prep-fil vid K-sista bake-in.**

3 mönster att extrahera till `~/Repon/marcus-system/templates/` eller
`~/Repon/claude-skills/`:

1. **`vale-brand-pattern.yml`** — inline-lookbehind+lookahead mall för
   brand-name detection. Empirisk verifikation: regex stödjs av Vale's
   RE2-engine 3.14+. Brand.yml-pattern från K6.2 är referens-
   implementation.

2. **`vale-stack-shift-pattern.yml`** — substitution mall för stack-
   skiften. VueToReact.yml-pattern (11 substitutioner per ADR-027) är
   referens. Generisk över alla stack-skiften (Angular→React, jQuery→
   modern, etc.).

3. **`vale-vocab-dual-function.md`** — dokumentation av Vale's Vocab
   dubbel-funktion (spelling-bypass + canonical-substitution via Vale.
   Terms). Emergent feature från K6.2 empirisk verifikation.

Etableras som hub-mallar Session 6.7 vid skills-arkitektur.

---

## K-sista 13-stegs-checklista

Atomic ordning per Marcus' Block D-svar (D4: efter ADR-030→Accepted;
D5: efter hub-sync; D8: hub-frontmatter samma commit som Code-host-
bake-in + Ristat-i-sten-rad):

**Steg 1-7 i miranon-media-admin (samma commit):**

1. Lessons-skörd till `tasks/lessons.md` H2 "## 2026-05-14 — Session
   6.6" — 10-15 kandidater, varav 8 [UNIVERSAL] (K7 Lessons #1-#8)
2. ADR-030 Status: Draft → Accepted med:
   - § Baseline-fynd 2026-05-14 ifyllt (6 grindvakts-resultat)
   - § Del 2 utvidgning från 7 → 9 styrande docs
3. Sessionsdok Del 4 K-sista-rad + DoD bockas av
4. `tasks/todo.md` uppdaterad — Session 6.6 ✅ KLAR + 3 defer-paket
5. CONTRIBUTING.md/README.md ev. process-uppdateringar
6. CHANGELOG.md — **utelämnas** (Session 6.6 är inte fas-avslut)
7. Session 6.7-prep-fil Del 1 uppdaterad med observations-pass-data +
   Vale-mönster-hub-extraktion-flagga (3 mönster)

**Steg 8-10 i marcus-system (separat commit per ADR-018):**

8. Hub-CLAUDE.md frontmatter-add (kategori 1: ta bort blockquote-plain-
   rad 4 utan ersättning)
9. Hub-CLAUDE.md "Hur Marcus jobbar"-sektion: Code-host-bake-in
   ("Verktygsstack: Claude Code körs i VS Code, inte fristående
   terminal.")
10. Hub-CLAUDE.md "Instruktioner — Alltid gäller"-sektion: "Ristat i
    sten"-rad (exakt verbatim ovan)
11. Hub-`tasks/lessons.md` synkad: H2 "## 2026-05-14 — Session 6.6
    (miranon-media-admin)" + 4-5 konsoliderade hub-rader

**Steg 12-13 i miranon-media-admin (efter hub-sync, separat commit):**

12. Sessionsdok-arkivering: `git mv tasks/sessions/2026-05-14-session-
    6-6.md tasks/sessions/archive/2026-05/` + trail-link-uppdateringar
    atomiskt (Kandidat 1: semantisk path-ref vs mekanisk prefix-fix)
13. Sessionsstart-prompt-fil arkivering: `git mv tasks/sessions/
    2026-05-14-session-6-6-fortsattning-2-prep.md tasks/sessions/
    archive/2026-05/`

**Cleanup:**
- Marcus klickar "Update" i Claude.ai-projektet efter hub-push +
  arkiverings-push

---

## 3 defer-paket aktiva (uppdaterad)

| Paket | Scope | Status |
|---|---|---|
| **6.6.5** | Dependabot secrets-skuld (5 PR-fails) | Schemalagd |
| **6.6.6** | Vale.Terms (425 deferade) + Miranon.VueToReact (114 deferade) | Schemalagd |
| **6.6.7 (NY)** | shellcheck-grindvakt för alla `scripts/*.sh` + `.githooks/*` (egen ADR-trail per ADR-029 § Konvention) | NY (flaggad K7.B) |

---

## Meta-lessons från Session 6.6 (K-sista [UNIVERSAL]-lyft-kandidater)

**Meta-lesson #1:** K2.15 Gate 2-review ROI demonstrerad **5 gånger** i
Session 6.6 (4 Marcus + 1 Code). Pattern är empiriskt bevisat. Skördas
som dedikerad [UNIVERSAL]-lesson:

> **K2.15 Gate 2-review är empiriskt-validerad arkitektur-grindvakt med
> bevisad ROI.** Session 6.6 producerade 5 substantiella design-räddningar
> i en session från Gate 2-fångster. Disciplinen är inte teoretisk skydd —
> den är default-disciplin för all arkitektur-arbete. Generaliserbar
> regel: vid varje design-leverans, förvänta Gate 2-fångst och bjud in
> den explicit ("STOPPA-OCH-FRÅGA om...", "Innan jag levererar X, vill
> du..."). Gate 2 är inte friktion — det är 11/10-mekanism.

**Meta-lesson #2:** Gate 2 mot Chat self-assessment är legitim domän:

> **K2.15 utvidgas till meta-domän — "hur säker är Chat på sin egen
> kapacitet just nu?" är legitim Gate 2-fråga.** Marcus' kontext-rot-
> fråga 2026-05-15 efter ~28 meddelanden ("kanske bästa att starta i en
> ny session") är denna patterns första empiriska instans. Chat self-
> assessment är blindspot-domän som kräver extern Gate 2-utövare.

**Meta-lesson #3:** Klass-tänkande vs instans-tänkande är 11/10-default
för arkitektur:

> **Default-disciplin för arkitektur-arbete: lös klassen av problemet,
> inte instansen.** Chat-instinkt "lös aktuellt problem" är 9/10. Marcus-
> instinkt "är detta princip eller undantag?" är 11/10. Generaliserbar
> regel: vid varje arkitektur-design, applicera test "kan motsvarande
> problem dyka upp på andra ställen i systemet, och om ja, är min lösning
> där också?" — om nej, problem-klassen är inte täckt.

---

## Disciplin-instruktioner för Session 6.6 fortsättning #2

Internalisera särskilt #8-#10 (nya från K7):

#1 — Empirisk dry-run av ALLA grindvakter FÖRE stage (nu 5)
#2 — Auto-fix-verifikation via git diff
#3 — Sub-alternativ för DEFERRED-FIX-MARKER (rad/fil/regel)
#4 — Open PR ekosystem-check post-merge
#5 — Baseline-volym + fynd-typ-distribution FÖRST
#6 — Empirisk verifikation FÖRE design-ratifikation
#7 — Chat-prompt-granskning (K2.15 Gate 2)
#8 (K7 Lesson #6) — Hub-spoke-portabilitet är default-arkitektur
#9 (K7 Lesson #7) — Datum-stämplar kategoriseras "historisk-stabil" vs
                   "löpande-mekanisk"
#10 (K7 Lesson #8) — Gate 2 inte aktör-specifik

---

## End of handoff-fil

Allt som lever bara i föregående Chat-session är nu committat. Session
6.6 fortsättning #2 kan starta utan tappad kontext.
