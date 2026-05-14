# Session 6.7 — Prep-dokument (CLAUDE.md-audit + skills-extraktion + checklist-trimning)

> **Trail från Session 6.6 K-sista till Session 6.7 K1.** Förberedelse-
> material producerat i samma chat som Session 6.5 K-sista (post-6.6
> prep-fil skapande), committad separat för att inte blanda trail-
> domäner.
>
> **Status:** Prep (Session 6.7 ej startad). Del 1 placeholder —
> uppdateras post-Session 6.6 K-sista med faktisk observations-pass-data.
> **Skapad:** 2026-05-14, post-Session 6.5 ✅ KLAR + Session 6.6 prep.
> **Beroende av:** Session 6.6 K-sista observations-pass-rapport.
> **Arkiveras:** Tillsammans med Session 6.7-sessionsdok vid dess
> K-sista (`tasks/sessions/archive/2026-05/`).
> **Parent-session:** Session 6.6 (Docs-grindvakter + frontmatter +
> observations-pass).

---

## Sessions-handoff (för kall sessionsstart Session 6.7)

### Var vi är (förväntat post-Session 6.6)

Session 6.6 ✅ KLAR — 5 docs-grindvakter implementerade (markdownlint-cli2,
typos, Vale, yamllint, scripted-checklist-check). Frontmatter-policy med
4 fält etablerad på styrande dokument + CI-validering + pre-commit hook
auto-bump av `updated:`. CLAUDE.md observations-pass-rapport levererad
som K-sista-output (input för denna session).

### Vad Session 6.7 ska göra

CLAUDE.md-audit (hub + projekt) + skills-extraktion + checklist-trimning.
Mål: krympa CLAUDE.md från "konstitution + kokbok" till "konstitution +
pekare till skills". Operativa procedurer flyttas till skill-filer som
anropas vid relevant trigger.

**Inte i scope:**
- Implementation av nya skills för områden utöver session-disciplin
  (det blir Session 6.8 eller senare om behov uppstår)
- Operativ transcript-implementation (kvarvarande defer från 6.5)

---

## Del 1 — Scope för Session 6.7 (PLACEHOLDER — uppdateras post-6.6)

> **OBS:** Denna sektion är spekulativ idag eftersom Session 6.6:s
> observations-pass-rapport (input) inte finns än. Vid Session 6.6
> K-sista uppdateras denna del med faktisk data innan Session 6.7 startar.
>
> Spekulativ bas: K1.3 + K1.4 av Session 6.6 prep-filen (CLAUDE.md
> observations-pass-instruktioner) + min analys i Session 6.5-chat
> om sessionsavslut-svullnad (15 steg + 14 checklista-punkter).

### 1.1 — CLAUDE.md-audit (preliminärt scope)

**Hub:** `~/Repon/marcus-system/CLAUDE.md`
- Identifiera operativa procedurer som ska bli skills
- Identifiera duplicering med projekt-CLAUDE.md
- Identifiera referens-data som ska stanna (designsystem, foundation,
  produkter, principer)

**Projekt:** `~/Repon/miranon-media-admin/CLAUDE.md`
- Identifiera operativa procedurer som ska bli skills
- Identifiera mekaniska checks som nu fångas av Session 6.6:s
  grindvakter (kan tas bort från manuell checklista)
- Identifiera Status-sektion + filstruktur-sektion som ska stanna
  (levande projekt-state, inte procedur)

### 1.2 — Skills att skapa (preliminär lista — bekräftas i K1)

| Skill | Trigger | Innehåll |
|---|---|---|
| `session-start.skill` | Vid varje sessionsstart | Läs-ordning, projektkunskaps-färskhet-check, RAPPORTERA-format |
| `session-end.skill` | Vid sessionsavslut | 15-stegs-disciplinen + 14 checklista-punkter (post-trimning) |
| `phase-end.skill` | Vid fas-avslut | Cross-doc-grep, byggplan.md, CHANGELOG, README, fas-avsluts-verifierings-rutin |
| `lessons-harvest.skill` | Vid K-sista lessons-skörd | UNIVERSAL-flagging, hub-konsolidering, format-bridge |
| `hub-sync.skill` | Vid hub-lyft | ADR-018 cross-repo, real-path för symlänkar, H2-format |

**Eventuellt fler** baserat på Session 6.6:s observations-pass-rapport
(typ `adr-creation.skill`, `sessionsdok-archiving.skill` etc.).

### 1.3 — Checklist-trimning (om inte gjort i 6.6 K8)

Mekaniska checks som nu fångas av Session 6.6:s CI-grindvakter:
- Cross-doc-konsekvens (lychee + ev. cross-doc-grep i CI)
- ADR-räkning mellan README och `ls docs/decisions/`
- Datum-konsistens (frontmatter `updated` vs git log)
- Broken markdown-länkar
- Stavfel i publika docs
- YAML-syntax i config-filer

Dessa tas bort från manuell sessionsavslut-checklistan i CLAUDE.md /
`session-end.skill`. Endast **mänskliga omdömesfrågor** bevaras
("är BUILD-LOG-formuleringen pedagogisk?", "är ADR-motiveringen tydlig
för någon utanför teamet?").

### 1.4 — ADR för skill-arkitektur

**ADR-XXX (numrering bestäms i K1):** Skill-arkitektur

- Hur skills är strukturerade (frontmatter, sektioner, exempel)
- Hur skills uppdateras (versions-hantering, deprecation, ändrings-trail)
- Hur skills testas (kall Chat-context-test, manual smoke test)
- Relation till CLAUDE.md (CLAUDE.md har pekare, skills har innehåll)
- Skills i hub vs projekt (hub-skills = universella, projekt-skills =
  domän-specifika)

---

## Del 2 — K-struktur för Session 6.7 (preliminär)

```
K1   — sessionsdok-skelett + ADR-skill-arkitektur-utkast + bekräftelse
       av observations-pass-input från 6.6 K-sista
K2   — CLAUDE.md hub-audit (klassa varje sektion: konstitution /
       procedur / checklist / referens)
K3   — CLAUDE.md projekt-audit (samma klassning)
K4   — Skill-design (kontent + format för varje skill, Chat-arbete
       med Marcus)
K5   — Skill-extraktion (flytta procedur från CLAUDE.md till skills)
K6   — CLAUDE.md-refactor (ersätt extraherade sektioner med pekare)
K7   — Checklist-trimning (mekaniska checks bort)
K8   — Empirisk verifikation (test skill med kall Chat-context-simulation)
K-sista — Lessons-skörd + ADR-bake-in + hub-sync
```

**Total estimat:** 2-4h Code-arbete + 1-2h Chat-design. Mindre än 6.6
men inte trivial. Skill-design (K4) är största Chat-arbetet.

**Skill-test-strategi (K8):** kall Chat-context öppnar `session-start.skill`,
följer instruktionerna, levererar rapport. Marcus reviewar att rapporten
matchar förväntat sessionsstart-output utan att läsa CLAUDE.md direkt.

---

## Del 3 — Skill-format-utkast (preliminärt)

Förslag på skill-fil-struktur (förfinas i K4):

```markdown
---
name: session-start
trigger: "Vid varje sessionsstart i miranon-media-admin"
input_required: ["sessions-nummer", "fas-status"]
output: "RAPPORTERA-block till Marcus"
version: 1.0
last_updated: 2026-05-14
owner: marcus803
---

# session-start

## Syfte

[Vad skillen löser]

## Trigger-villkor

[När den ska anropas]

## Procedur

[Numrerade steg]

## Output-format

[Exakt format för rapport till Marcus]

## Källor

[Pekare till CLAUDE.md-sektioner som inte extraherats]
```

**Lokalisering av skills:**

- **Hub-skills:** `~/Repon/marcus-system/skills/` (universella)
- **Projekt-skills:** `~/Repon/miranon-media-admin/skills/` (domän-specifika)

Skill-detektering via CLAUDE.md-pekare:

```markdown
## Sessionsavslut

Vid sessionsavslut, följ `skills/session-end.skill` (projekt) som i sin
tur refererar `~/Repon/marcus-system/skills/session-end.skill` (hub) för
universella delar.
```

---

## Del 4 — Förväntade lessons-kandidater (att flaggas innan, fångas i K-sista)

5-8 lessons förväntade. Domäner:

1. **Skill-extraktion-disciplin** — vad är "operativ procedur" vs
   "konstitution"? Klassnings-mönster.

2. **Skill-test-strategi** — hur testar man att en skill funkar utan
   att starta en separat session?

3. **Hub vs projekt-skill-separation** — vad är universellt (hub) vs
   domän-specifikt (projekt)? Mönsterförstärkning av K1.4 (paradigm-
   spanning utvidgning).

4. **CLAUDE.md-as-konstitution-design** — hur ska CLAUDE.md se ut
   post-extraktion? Vilka sektioner är "för viktiga för att gömmas i
   skill"?

5. **Pre-commit-friction vs auto-magic** — om frontmatter `updated:`
   auto-bumpas vid stage, vad händer om Marcus glömmer stage? Edge-
   case-mönster.

6. **Checklist-svullnads-recovery** — hur många punkter bort innan
   "trimmad" blir "för mager"? Mönster för balansering.

7. **Sessions-numrerings-konvention** — 6.5 / 6.6 / 6.7 är mini-sessioner
   av Session 6-paradigm. Vid vilken punkt blir det Session 7?
   Numreringspolicy.

---

## Del 5 — Sessionsstart-prompt för Session 6.7 (mall, justera post-6.6)

```
Effort: max

Detta är Session 6.7 — CLAUDE.md-audit + skills-extraktion + checklist-
trimning. Trail från Session 6.6 K-sista.

LÄS (i denna ordning):

1. ~/Repon/marcus-system/CLAUDE.md
   — Hub-konstitution, ## Chat output-disciplin (4-zoner-mall), ## Code
   STOPPA-OCH-FRÅGA-format
2. ~/Repon/miranon-media-admin/CLAUDE.md
   — Projekt-konstitution. Status-sektion ska säga "Session 6.6 ✅ KLAR"
3. ~/Repon/marcus-system/tasks/lessons.md — H2 "## 2026-05-14 — Session
   6.6 (miranon-media-admin)" — särskilt lessons om grindvakts-design +
   frontmatter-disciplin
4. ~/Repon/miranon-media-admin/tasks/lessons.md — Session 6.6 H2
5. ~/Repon/miranon-media-admin/docs/decisions/ADR-030 (eller motsvarande
   numrering från 6.6) — docs-grindvakter-arkitektur
6. ~/Repon/miranon-media-admin/tasks/sessions/2026-05-14-session-6-7-prep.md
   — PREP-DOKUMENT (denna fil). Innehåller komplett scope, K-struktur,
   skill-format-utkast, förväntade lessons-kandidater.
7. Session 6.6 K-sista observations-pass-rapport (lokaliseras i
   Session 6.6-sessionsdokets Del 6 eller K-sista-bake-in)

VERIFIERA projektkunskaps-färskhet per K6.5.3:
- Fråga Marcus: "har du klickat Update på Claude.ai-projektet efter
  Session 6.6 K-sista?"
- Om nej → Marcus klickar Update först, sedan rapportera när
  indexering är klar.

RAPPORTERA sedan:

Block A — Repo-state:
- Aktuell branch + HEAD-hash + uncommitted changes
- CI senaste 3 runs (verifiera grön baseline)
- Verifiera prep-dokumentet finns och är läst
- Verifiera Session 6.6 K-sista observations-pass-rapport finns och
  är läst

Block B — Session 6.7 scope-bekräftelse (baserat på 6.6 K-sista-rapport):
- Faktiskt antal skills att skapa (preliminär lista i prep Del 1.2 +
  ev. tillägg från 6.6 observations-pass)
- Faktiskt scope för checklist-trimning (vad togs i 6.6 K8 vs vad
  återstår här)
- ADR-numrering för skill-arkitektur

Block C — Föreslagen K-struktur (per prep Del 2):
- K1: sessionsdok-skelett + ADR-utkast + 6.6 input-bekräftelse
- K2: CLAUDE.md hub-audit
- K3: CLAUDE.md projekt-audit
- K4: Skill-design (Chat-arbete)
- K5: Skill-extraktion
- K6: CLAUDE.md-refactor (pekare ersätter procedur)
- K7: Checklist-trimning
- K8: Empirisk verifikation (skill-test)
- K-sista: Lessons-skörd + ADR-bake-in + hub-sync

Block D — STOPPA-OCH-FRÅGA om:
- Skill-lokalisering (~/Repon/marcus-system/skills/ för hub vs projekt-
  skills-mapp)
- Skill-format (frontmatter-fält, sektioner, exempel)
- ADR-numrering för skill-arkitektur
- Vilka skills som faktiskt behövs (preliminär lista i prep Del 1.2 +
  6.6-input)

GÖR INGET ANNAT. Skriv ingen kod. Skapa inga filer.
VÄNTA PÅ MARCUS' BEKRÄFTELSE innan K1 IMPLEMENTERA.
```

---

## Del 6 — Beroenden + uppdatering-flöde

### 6.1 — Vad måste finnas innan Session 6.7 startar

1. **Session 6.6 ✅ KLAR** — alla grindvakter implementerade, frontmatter-
   policy etablerad
2. **Session 6.6 K-sista observations-pass-rapport** — input för Del 1
   av denna prep-fil
3. **Denna prep-fil uppdaterad post-6.6** — Del 1 placeholder ersatt
   med faktisk data
4. **Marcus' manuella saker:**
   - Push hub-commit från 6.6 i `~/Repon/marcus-system/`
   - Klick "Update" på Claude.ai-projektkunskap

### 6.2 — Hur denna prep-fil uppdateras post-Session 6.6

Vid Session 6.6 K-sista:
- Chat extraherar observations-pass-rapport från 6.6-sessionsdoket
- Code uppdaterar denna prep-fils Del 1 med faktisk data
- Ersätter "PLACEHOLDER"-not med "Uppdaterad post-Session 6.6 K-sista"
- Commit-message: "docs(sessions): update 6.7 prep with 6.6 observations-pass data"

Alternativt: Session 6.7 K1 sessionsdok-skelett inkluderar denna
uppdatering som första bake-in-akt.

---

## Del 7 — Manuella saker Marcus ska göra INNAN Session 6.7 startas

Förutsätter att Session 6.6 är klar:

1. **Push hub-commit** i `~/Repon/marcus-system/` (från Session 6.6
   K-sista)
2. **Klick "Update"** på Claude.ai-projektkunskap för Session 6.6-
   trail-indexering
3. **Läs Session 6.6 K-sista observations-pass-rapport** för att förstå
   vad faktiskt scope blir för Session 6.7
4. **Uppdatera denna prep-fils Del 1** med faktisk data (eller låt
   Session 6.7 K1 göra det)

---

## Del 8 — Sammanfattning för framtida läsare

Detta prep-dokument är **trail-länken mellan Session 6.6 K-sista och
Session 6.7 K1**. Skapad samtidigt som Session 6.6 prep-filen (efter
Session 6.5 K-sista) men med medvetenhet om att Del 1 är spekulativ
och uppdateras post-6.6.

Vid Session 6.7-start:
- Code läser detta dokument som källa #6 i läs-ordningen (per Del 5
  sessionsstart-prompt)
- Sessionsstart-prompten i Del 5 är klar att klistra in (justera
  för faktiska 6.6-data)
- Del 1 har uppdaterats post-6.6 antingen via separat commit eller
  som första bake-in-akt i K1

Vid Session 6.7 K-sista:
- Detta prep-dokument arkiveras tillsammans med Session 6.7-sessionsdok
  via `git mv` till `tasks/sessions/archive/2026-05/`. Trail-link-
  uppdateringar per Kandidat 1.

Vid framtida sessions:
- CLAUDE.md är post-Session 6.7 betydligt slankare ("konstitution +
  pekare till skills")
- Skill-katalogen i `~/Repon/marcus-system/skills/` +
  `~/Repon/miranon-media-admin/skills/` är levande disciplin-katalog
- Mekaniska checks fångas av CI-grindvakterna från Session 6.6, inte
  manuell disciplin
