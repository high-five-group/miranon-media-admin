# Session 6.7 — Prep-dokument (CLAUDE.md-audit + skills-extraktion + checklist-trimning)

> **Trail från Session 6.6 K-sista till Session 6.7 K1.** Förberedelse-
> material producerat i samma chat som Session 6.5 K-sista (post-6.6
> prep-fil skapande), committad separat för att inte blanda trail-
> domäner.
>
> **Status:** Prep (Session 6.7 ej startad). Del 1 ✅ uppdaterad
> 2026-05-15 vid Session 6.6 K-sista commit #1 (observations-pass-data
> + Vale-mönster-hub-extraktion + chat-self-review-skill från K-sista.1).
> **Skapad:** 2026-05-14, post-Session 6.5 ✅ KLAR + Session 6.6 prep.
> **Del 1 uppdaterad:** 2026-05-15 (Session 6.6 K-sista commit #1).
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

## Del 1 — Scope för Session 6.7 (uppdaterad post-Session 6.6 K-sista 2026-05-15)

> **Status:** Uppdaterad från PLACEHOLDER 2026-05-15 vid Session 6.6 K-sista
> commit #1 (Code-host). Innehåll baserat på faktisk Session 6.6 sessionsdok
> Del 3 observations-pass-rapport (12 kandidater fördelade i 4 kategorier
> A-D) + K8-defer + 2 NYA scope-domäner skördade vid K7.5/K9/K-sista
> (Vale-mönster-hub-extraktion + Chat self-review-skill).

### 1.1 — CLAUDE.md-audit (Session 6.6 observations-pass-baserat scope)

Källa: sessionsdok Del 3 rader 142-221. Kandidater fördelade i 4 kategorier.

**Kategori A — Skills-extraktion-kandidater (operativa procedurer i CLAUDE.md som hör hemma i skills):**

- A.1 Sessionsstart-procedur (6-stegs läs-ordning + RAPPORTERA-format)
- A.2 Sessionsavslut-disciplin (13-stegs sessionsavslut + transcript-disciplin + UNIVERSAL-lyft-flöde)
- A.3 Fas-avslut-rutin (cross-doc-grep + byggplan.md + CHANGELOG-uppdatering)
- A.4 ADR-skapande-procedur (numrering, format, README-katalog-uppdatering)
- A.5 Hub-sync-procedur (cross-repo, real-path för symlänkar, H2-format)

**Kategori C — "Senast uppdaterad"-prosa att ersätta med frontmatter:**

- Post-K7.C är detta REDAN gjort på 9 styrande docs (frontmatter etablerad). Återstår: ev. stale-prosa i icke-styrande docs som migration missade. Audit i Session 6.7 K2-K3.

**Kategori D — Övriga refactor-kandidater (INTE actionable Session 6.7-direct):**

- D.1 Filstruktur-sektion komprimering (växer med varje session)
- D.2 Sessions-historik-rad i todo.md (driver mot duplicering av BUILD-LOG)

### 1.2 — Skills att skapa (preliminär lista — bekräftas i K1)

| Skill | Trigger | Innehåll |
|---|---|---|
| `session-start.skill` | Vid varje sessionsstart | Läs-ordning, projektkunskaps-färskhet-check, RAPPORTERA-format |
| `session-end.skill` | Vid sessionsavslut | 13-stegs-disciplinen + DoD-checklist-bockning |
| `phase-end.skill` | Vid fas-avslut | Cross-doc-grep, byggplan.md, CHANGELOG, README, fas-avsluts-verifierings-rutin |
| `lessons-harvest.skill` | Vid K-sista lessons-skörd | UNIVERSAL-flagging, hub-konsolidering, format-bridge |
| `hub-sync.skill` | Vid hub-lyft | ADR-018 cross-repo, real-path för symlänkar, H2-format |
| `chat-self-review.skill` | **NY från K-sista.1 lesson** — Innan klass-eskalering | Pre-prompt verifikation av ADR/spec, kandidat-klass-tabell, anti-meta-blindhet-disciplin |
| `web-research-discipline.skill` | Före strategi-val, arkitektur-rekommendation, tool-val, branschstandard-claim, version-bump | Trigger-villkor + domän-checklista + output-format (källa-citation, datum, relevans) + anti-pattern-katalog. NY från Session 6.6.6 K-sista-1 (Marcus' Punkt 1 2026-05-20). |

**Eventuellt fler** baserat på K1-detalj-audit av sessionsdok Del 3 + skills-arkitektur-ADR-utforskning.

### 1.3 — Checklist-trimning (Session 6.6 K8 deferrad hit)

Session 6.6 K8 deferrad fullt till Session 6.7 K7 per Marcus' Block D #3-caveat (K1-K7 + K7.5 + K9 åt tiden). Scope:

**Helt-mekaniska checks som nu fångas av Session 6.6 grindvakter:**

- Cross-doc-konsekvens — Lychee (referenser) + frontmatter-validator (metadata)
- Broken markdown-länkar — Lychee
- YAML-syntax i config-filer — yamllint
- Markdown-hygien — markdownlint-cli2
- Stavning + Vue→React terminologi — Vale (post-6.6.6 full-aktiv)
- Publika DoD-mallar — scripted-checklist-check
- Datum-konsistens — frontmatter pre-commit auto-bump + CI Check 2

**Halv-mekaniska checks (Session 6.6 Del 3 kategori B.5-B.8):**

- B.5 ADR-räkning mellan README och `ls docs/decisions/` — möjlig grindvakt
- B.6-B.8 övriga halv-mekaniska — bekräftas i K2-K3-audit

Mänskliga omdömesfrågor bevaras: "är BUILD-LOG-formuleringen pedagogisk?", "är ADR-motiveringen tydlig för någon utanför teamet?".

### 1.4 — ADR för skill-arkitektur

**ADR-031 eller -032** (numrering bestäms i K1; ADR-031 är reserverad för Session 6.6.5 Dependabot-strategi):

- Hur skills är strukturerade (frontmatter, sektioner, exempel)
- Hur skills uppdateras (versions-hantering, deprecation, ändrings-trail)
- Hur skills testas (kall Chat-context-test, manual smoke test)
- Relation till CLAUDE.md (CLAUDE.md har pekare, skills har innehåll)
- Skills i hub vs projekt (hub-skills = universella, projekt-skills = domän-specifika)
- **NY från K-sista.1:** Skills för meta-disciplin (chat-self-review-pattern; klass-tänkande-checklist)

**NY från Session 6.6.6 K-sista-1 (2026-05-20):** Skill-arkitektur ska distingera mellan:

- **Hub-skills** (`~/Repon/marcus-system/skills/`) — Universella, alla spokes
- **Projekt-skills** (`~/Repon/<spoke>/skills/`) — Domän-specifika
- **Profile Preferences** (Claude.ai globala settings) — Universell Chat-disciplin (Marcus-personlig)
- **Project Instructions** (Claude.ai projekt-settings per spoke) — Projekt-specifik Chat-disciplin

Skill-format är samma för Hub-skills och Projekt-skills, men distinktionen mot Profile Preferences + Project Instructions är arkitektur-domän som ska adresseras i ADR-skill-arkitektur (ADR-034 sannolikt, numrering bekräftas vid skapelse).

Project Instructions / Profile Preferences är **Chat-side persistent prompts** som inte är skill-filer — de bor i Claude.ai-settings, inte i repo. Men de SPEGLAR samma operativa innehåll som relevanta skills. K-sista-1 lyfter Profile Preferences + Project Instructions som distinktion i prep-filen för Session 6.7 K4 skill-design-arbete.

### 1.5 — Vale-mönster-hub-extraktion (NY scope-domän Session 6.7)

3 Vale-mönster att extrahera till `~/Repon/marcus-system/templates/` eller `~/Repon/claude-skills/` (per K7.6 hub-spoke-portabilitet, skördad från Session 6.6 K6.2-arbete):

1. **`vale-brand-pattern.yml`** — inline-lookbehind+lookahead mall för brand-name detection (RE2-engine 3.14+). Brand.yml-pattern från Session 6.6 K6.2 är referens-implementation. Empirisk RE2-verifikation: lookbehind/lookahead stöds (mot pre-empirisk hypotes).

2. **`vale-stack-shift-pattern.yml`** — substitution mall för stack-skiften. VueToReact.yml-pattern (11 substitutioner per ADR-027) är referens. Generisk över alla framtida stack-skiften (typ TanStack-Router v1 → v2, Vite 8 → 9).

3. **`vale-vocab-dual-function.md`** — dokumentation av Vale Vocab dubbel-funktion (spelling-bypass + canonical-substitution via Vale.Terms case-folding). Emergent feature från K6.2 V2 empirisk verifikation — ej dokumenterat tydligt i Vale 3.14.1 docs.

Flaggad från Session 6.6 K-sista. Schemalägs som K-sub i Session 6.7 K4 (Skill-design).

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

**Web-research-rule etablerad i K-sista-1-D:**

Hub-CLAUDE.md och spoke-CLAUDE.md har nya "Ristat i sten"-bullets för web-research-disciplin. Aktuell formulering bor i respektive CLAUDE.md — K-sista-1-D landade efter detta avsnitts ursprungliga utkast (2026-05-20), så CLAUDE.md är sanningskälla, inte ett citat här. Session 6.7 K2/K3 CLAUDE.md-audit ska behandla bullets som redan etablerade. Session 6.7 K4 ska designa `web-research-discipline.skill` som operationaliserar regeln.

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

8. **Chat self-review-skill (NY från Session 6.6 K-sista.1 lesson)** —
   Chat:s 11/10-disciplin på Code:s output applicerades inte lika på
   Chat:s egen analys (3 instanser i Session 6.6 fortsättning #2 fångade
   av Marcus' 11/10-påminnelser). Skill-kandidat: pre-prompt self-review
   "verifiera mot ADR/spec FÖRE klass-eskalering". Mönsterförstärkning av
   K2.14 + K7.5.3.

9. **Git-amend-stage-disciplin** — `git commit --amend` utan föregående
   `git add` är en tyst no-op på working-tree-ändringar: committen
   återanvänder det gamla trädet, endast hash/timestamp ändras. Verifiera
   att en amend faktiskt fångade ändringen med `git show HEAD:<fil>`
   (eller `git show --stat HEAD`), inte enbart `git diff`. Källa: Session
   6.6.6 K-sista-1-F-korrigering 2026-05-24, Code-fångst (no-op-amend
   86709ae → korrekt 1825b3e).

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
