# Session 6.6 — Prep-dokument (Docs-grindvakter + frontmatter + observations-pass)

> **Trail från Session 6.5 till Session 6.6.** Förberedelse-material
> producerat i samma chat som Session 6.5 K-sista, committad separat
> för att inte blanda Session 6.5 trail med Session 6.6 scope.
>
> **Status:** Prep (Session 6.6 ej startad).
> **Skapad:** 2026-05-14, post-Session 6.5 ✅ KLAR.
> **Arkiveras:** Tillsammans med Session 6.6-sessionsdok vid dess K-sista
> (`tasks/sessions/archive/2026-05/`).
> **Parent-session:** Session 6.5 (Broken-links-batch + recovery).

---

## Sessions-handoff (för kall sessionsstart Session 6.6)

### Var vi är (post-Session 6.5)

Session 6.5 ✅ KLAR 2026-05-14. 54 broken refs eliminerade. Alla 6
DEFERRED-FIX-MARKER-rader borttagna ur `.lycheeignore`. ADR-022 utvidgad
med kategori 4 "Frusen extern leverans". 15 lokala lessons-kandidater
(13 [UNIVERSAL]) → 8 hub-konsoliderade rader i `marcus-system`.

### Vad Session 6.6 ska göra

Implementera 5 docs-grindvakter + frontmatter-policy + observations-pass
av CLAUDE.md för framtida skills-extraktion/refactor.

**Inte i scope:** skills-extraktion, CLAUDE.md-refactor, operativ
transcript-implementation. Dessa blir Session 6.6.5 (eller 6.7) med
input från Session 6.6 K-sista observations-pass-rapport.

---

## Del 1 — Scope för Session 6.6

### 1.1 — 5 grindvakter att implementera

| # | Verktyg | Roll | Empirisk motivering |
|---|---|---|---|
| 1 | **markdownlint-cli2** | Markdown-hygien (rubriknivåer, listor, kodblock, tabeller MD055/056/058/060) | K38 form-tolerans + K39 case-sensitivity + ADR-021 docs-omstrukturerings-drift |
| 2 | **typos** | Stavfel i .md + .ts, custom-dictionary | ADR-024 publika professionalitetssignaler |
| 3 | **Vale** | Språk, ton, terminologi-konsistens, förbjudna termer | K1.14 Vue→React-stack-skifte-drift fångas FÖREBYGGANDE istället för i efterhand (ADR-027) |
| 4 | **yamllint** | YAML-syntax + indentering | `.github/dependabot.yml`, `.lycheeignore`, ADR-019-config-filer ej validerade idag |
| 5 | **Egen scriptad check** | Oavslutade `- [ ]` i publika docs (README, CHANGELOG, SECURITY, CONTRIBUTING, docs/byggplan.md) | Marcus använder checklistor i CLAUDE.md/CONTRIBUTING.md/sessionsdok legitimt — fel i publika docs = professionalitets-tapp |

### 1.2 — Frontmatter-policy (Marcus' explicita begäran)

Minimal policy, 4 fält max:

```yaml
---
owner: marcus803
updated: 2026-05-14
review_by: 2026-11-14
status: stable  # eller: draft, deprecated
---
```

**Tillämpas på styrande dokument:**
- `~/Repon/marcus-system/CLAUDE.md` (hub-konstitution)
- `CLAUDE.md` (projekt-konstitution)
- `docs/byggplan.md`
- `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md`
- `tasks/lessons.md`
- `docs/decisions/README.md`
- `docs/specs/KVALITETSDEFINITIONER-11-REACT.md`
- Eventuella andra styrande specs som identifieras i K1

**Ej på:**
- Sessionsdok (immutable per ADR-023 vid arkivering)
- ADR-er (har redan Status/Datum/Fas i header, separat konvention)
- README/CHANGELOG/SECURITY/CONTRIBUTING (publika professionalitetssignaler, separat ADR-024-domän)

**CI-grindvakt:**
1. Validera att frontmatter finns på alla styrande docs
2. Validera att `updated` matchar `git log -1 --format=%cs <fil>`
   (mekanisk konsistens — inte gissning)
3. Validera att `review_by > today()` (failar om passerat → tvingar
   re-verifiering)

**Pre-commit hook:**
- Auto-bump `updated:` vid stage av styrande dokument
- Inget manuellt jobb för Marcus eller AI

### 1.3 — CLAUDE.md observations-pass (INTE refactor)

K1 sessionsdok-skelett inkluderar läsa-pass av CLAUDE.md (hub + projekt)
för att identifiera kandidater för framtida arbete:

**Output: lista över kandidater i K-sista-rapporten:**

A. **Skills-extraktion-kandidater:** vilka sektioner är operativ procedur
   (kokbok) snarare än konstitution (principer)? Kandidater för
   `session-start.skill`, `session-end.skill`, `phase-end.skill`,
   `lessons-harvest.skill`, `hub-sync.skill`?

B. **Mekaniska checks som blir CI-grindvakter:** vilka rader i
   sessionsavslut-checklistan fångas nu mekaniskt av Session 6.6:s
   grindvakter (cross-doc-konsekvens, ADR-räkning, datum-konsistens)?
   Kandidater för K8-trimning eller framtida 6.6.5-städning.

C. **"Senast uppdaterad"-fält att ersätta:** vilka filer har manuellt
   "Senast uppdaterad" i prosa idag som ska ersättas av frontmatter
   `updated:`-fält i K7?

D. **Övriga refactor-kandidater:** död text, duplicerade sektioner,
   inkonsekvent struktur. **INTE actionable i Session 6.6** — bara
   noterad för Session 6.6.5.

**Detta är observation, inte refactor.** Producerar en rapport, inte
en commit.

### 1.4 — K8: Checklist-trimning (om tid finns; annars 6.7)

Om Session 6.6 har tid efter K7 (frontmatter-policy), gör K8 = trimma
sessionsavslut-checklistan i CLAUDE.md (projekt) baserat på 1.3.B:s
observations-pass-fynd.

Mekaniska checks (cross-doc-konsekvens, ADR-räkning, datum-konsistens)
flyttas till CI-grindvakter. Checklistan bevarar endast **mänskliga
omdömesfrågor** ("är BUILD-LOG-formuleringen pedagogisk?").

Om tid inte finns: bryt ut K8 till egen mini-session 6.7.

---

## Del 2 — K-struktur för Session 6.6

```
K1   — sessionsdok-skelett + ADR-030-utkast (eller ADR-029-utvidgning,
       beslutas i K1) + CLAUDE.md observations-pass kandidater
K2   — yamllint (billigast, lägst risk, "uppvärmning")
K3   — typos + custom-dictionary
K4   — markdownlint-cli2 + config för svensk text
K5   — Egen scripted-checklist-check (publika docs)
K6   — Vale + projektspecifik stilguide-design (störst arbete —
       Chat-skissession med Marcus om vokabulär krävs)
K7   — Frontmatter-policy + pre-commit hook + CI-validering
       (inkluderar "Senast uppdaterad"-borttagning från prosa över repo)
K8   — Checklist-trimning i CLAUDE.md (om tid; annars 6.7)
K9   — Empirisk verifikation (full CI-run mot reduced + full scope)
K-sista — Lessons-skörd + ADR-bake-in + hub-sync + observations-pass-
          rapport för 6.6.5
```

**Total estimat:** 4-6 timmar Code-arbete fördelat över sessionen.
Större än Session 6.5 (~3h faktisk). Eventuellt 2 chat-sessioner om
scope växer (per P3a-pattern "var beredd att splitta").

**ADR-numrering:** beslutas i K1 — antingen ADR-030 (ny) eller
ADR-029-utvidgning. Min preferens: ADR-030 ny, eftersom docs-grindvakter
är konceptuellt distinkta från CI-arkitektur (Strategi E changed-files +
Actions-policy). K1.4-konsistens (utvidga befintlig) gäller när
disciplinen är samma kategori; här är de olika domäner.

---

## Del 3 — Vale-stilguide-vokabulär (förberedande)

Detta diskuteras i K6 Chat-skissession. Förberedande lista — Marcus
kompletterar/justerar i K6:

### 3.1 — Substitution-regler (Vue → React)

| Förbjudet | Korrekt |
|---|---|
| composable | hook |
| emit | callback / event handler |
| v-model | controlled component |
| .vue (filändelse) | .tsx / .jsx |
| `<script setup>` | function component |
| ref() | useRef() / useState() |
| computed() | useMemo() |
| watchEffect() | useEffect() |
| Pinia | TanStack Store / Zustand |
| Vue Router | TanStack Router |

### 3.2 — Consistency-termer (stavning)

| Term | Canonical form |
|---|---|
| Miranon / miranon | Miranon (eget produktnamn) |
| Lotta / lotta | Lotta (egennamn) |
| Roger / roger | Roger (egennamn) |
| Airtable / airtable | Airtable (varumärke) |
| Supabase / supabase | Supabase (varumärke) |
| byggplan.md | `byggplan.md` (alltid backtick + lowercase) |
| Claude / claude | Claude (egennamn) |
| TypeScript / Typescript | TypeScript (canonical) |
| GitHub / Github | GitHub (canonical) |

### 3.3 — Custom-vocabulary (godkända termer som annars flaggas som typos)

- Airtable, Supabase, TanStack, nuqs, Biome, Vite, Playwright
- FK, Lotta, Roger, Miranon
- RLS, JWT, OWASP, ARIA, CVA, OAuth, PKCE
- Edge Functions (med versal E + F)
- Dependabot

### 3.4 — Politely undvika (warning, inte error)

- "obviously" / "uppenbarligen" (försvinner när inte är uppenbart för läsaren)
- "simply" / "enkelt" (samma)
- "just" som diminutiv (jämför "just use X" → "use X")

### 3.5 — Förväntade utvidgningar (Marcus' input i K6)

- Domän-specifika termer från Airtable-arbetet
- Domän-specifika termer från Supabase Edge Functions
- Eventuella "förbjudna formuleringar" för Roger/Lotta-pedagogik
  (per ADR-025 v3 lättläst-disciplin)

---

## Del 4 — Förväntade lessons-kandidater (att flaggas innan, fångas i K-sista)

Erfarenhet från Session 6 + 6.5 indikerar 8-12 lessons-kandidater i
Session 6.6. Förväntade domäner:

1. **Pre-existing-skuld-fynd** — varje grindvakt har baseline-fynd
   (markdownlint, typos, Vale, yamllint) som blir DEFERRED-FIX-MARKER
   eller direkt-fix-paket. K1.12 success-signal i tillämpning.

2. **Pattern-design för grindvakts-config** — Vale-regex,
   markdownlint-config, etc. kan ha samma form-tolerans-svagheter som
   K2.5-fyndet (B.2-grep missade #Lxx-anchor).

3. **Frontmatter-migration-disciplin** — hur hanteras filer som inte
   har frontmatter idag men ska få det? Bulk-add eller graduellt? Hur
   väljs initial-värde för `review_by` (6 månader fram default)?

4. **Pre-commit hook-säkerhet** — auto-bump av `updated:` kan ha edge
   cases: vad om commit är `--amend`? vad om commit har ingen
   .md-ändring men hooken körs ändå? hur skiljs styrande docs från
   andra .md?

5. **CLAUDE.md observations-pass-format** — vad är rätt rapport-struktur
   för "kandidater för framtida arbete"-listor som inte är actionable
   nu? Egen format-konvention eller följa befintligt sessionsdok-format?

6. **Skills-arkitektur-design** (om observations-pass utlöser tidig
   skiss) — vilka skills behöver finnas? Hur testar vi att de funkar?

7. **Sessions-numrering 6.5/6.6/6.6.5/6.7** — när blir mini-sessioner
   sub-versionerade och hur länge håller numreringen? K1.4-paradigm-
   spanning-fråga.

---

## Del 5 — Sessionsstart-prompt för Session 6.6 (klar att klistra in)

```
Effort: max

Detta är Session 6.6 — Docs-grindvakter + frontmatter + observations-
pass av CLAUDE.md. Trail från Session 6.5 K-sista.

LÄS (i denna ordning):

1. ~/Repon/marcus-system/CLAUDE.md
   — Hub-konstitution, ## Chat output-disciplin (4-zoner-mall), ## Code
   STOPPA-OCH-FRÅGA-format
2. ~/Repon/miranon-media-admin/CLAUDE.md
   — Projekt-konstitution. Status-sektion ska säga "Session 6.5 ✅ KLAR"
3. ~/Repon/marcus-system/tasks/lessons.md — H2 "## 2026-05-14 — Session
   6.5 (miranon-media-admin)" — särskilt K6.5.2 (path-fix-disciplin) +
   K6.5.3 (Chat-sidans antaganden) + K6.5.6 (källa-pekare i nya
   disciplin-regler)
4. ~/Repon/miranon-media-admin/tasks/lessons.md — Session 6.5 H2 med
   15 lokala kandidater
5. ~/Repon/miranon-media-admin/tasks/todo.md — "Operativ skuld —
   Transcript-disciplin ej implementerad" + ev. andra defer-paket
6. ~/Repon/miranon-media-admin/docs/decisions/ADR-022 + ADR-029
   — Kategori 4 + Strategi E-baseline för CI-arkitektur
7. ~/Repon/miranon-media-admin/docs/decisions/README.md — ADR-katalog
   (vilka ADR:er finns, vad är nästa nummer för ADR-030)
8. ~/Repon/miranon-media-admin/tasks/sessions/2026-05-14-session-6-6-prep.md
   — PREP-DOKUMENT (denna fil). Innehåller komplett scope, K-struktur,
   Vale-vokabulär-utkast, frontmatter-design, observations-pass-
   instruktioner, förväntade lessons-kandidater.
9. Projektkunskap-sökning i Claude.ai: "docs-grindvakter" — där finns
   uppladdad Codex-research om markdownlint/typos/Vale/yamllint som
   var ursprung till Session 6.6-scopet.

VERIFIERA projektkunskaps-färskhet per K6.5.3:
- Fråga Marcus: "har du klickat Update på Claude.ai-projektet efter
  Session 6.5 K-sista?"
- Om nej → Marcus klickar Update först, sedan rapportera när
  indexering är klar.

RAPPORTERA sedan:

Block A — Repo-state:
- Aktuell branch + HEAD-hash + uncommitted changes
- CI senaste 3 runs (verifiera grön baseline)
- Verifiera prep-dokumentet finns och är läst

Block B — Session 6.6 scope-bekräftelse:
- 5 grindvakter (markdownlint-cli2 + typos + Vale + yamllint +
  scripted-checklist-check)
- Frontmatter-policy (4 fält: owner/updated/review_by/status)
- CLAUDE.md observations-pass (identifiering, inte refactor)
- K8 checklist-trimning (om tid finns)

Block C — Föreslagen K-struktur (per prep-dok Del 2):
- K1: sessionsdok-skelett + ADR-030-utkast + observations-pass-kandidater
- K2: yamllint
- K3: typos + dictionary
- K4: markdownlint-cli2
- K5: scripted-checklist-check
- K6: Vale + stilguide-design (Chat-skissession krävs)
- K7: Frontmatter-policy
- K8 (om tid): checklist-trimning av CLAUDE.md
- K9: empirisk verifikation
- K-sista: lessons-skörd + ADR-030-bake-in + observations-pass-rapport

Block D — STOPPA-OCH-FRÅGA om:
- ADR-numrering (ADR-030 ny eller utvidgning av ADR-029?)
- Vale-stilguide-vokabulär (verifiera prep-dok Del 3 + komplettera)
- Checklist-trimning-aggressivitet (K8 scope)

GÖR INGET ANNAT. Skriv ingen kod. Skapa inga filer.
VÄNTA PÅ MARCUS' BEKRÄFTELSE innan K1 IMPLEMENTERA.
```

---

## Del 6 — Prioritering Session 6.6 vs Session 7 K0

**Argument för Session 6.6 först:**
- Grindvakterna fångar drift i Session 7 K0-arbetet automatiskt
- "Senast uppdaterad"-frustration löses snabbare via frontmatter +
  pre-commit hook
- Lessons från Session 6.5 är färska i kontexten — bra timing för
  process-investering
- K1.16 success-signal: investering i grindvakter avslöjar emergent
  värde (vilket Session 6.5 bekräftade)

**Argument för Session 7 K0 först:**
- Fas 2.5 blockeras av 7 gap-punkter i Fas 2-verifikation
- Strategiskt arbete (appen) > processarbete (grindvakter)
- Risk att Session 6.6 växer till 2+ chat-sessioner och försenar
  Fas 2.5-start

**Min rekommendation:** Session 6.6 först. Investeringen i grindvakter
är multiplikator för all framtida arbete inkl. Session 7 K0. Lessons-
disciplinen från Session 6.5 (K6.5.2 path-fix-disciplin + K6.5.3
Chat-sidans antaganden) är direkt tillämpbar på Session 6.6:s pattern-
design — om vi tappar momentet får vi göra om K-disciplin-internalisering
i Session 7 K0.

Marcus beslutar i sessionsstart.

---

## Del 7 — Manuella saker Marcus ska göra INNAN Session 6.6 startas

Per Session 6.5 K-sista.4-rapport:

1. **Push hub-commit** i `~/Repon/marcus-system/`:
   ```bash
   cd ~/Repon/marcus-system/
   git push
   ```
   Synkar `4faf93c` (Session 6.5 hub-sync, 8 hub-rader) till GitHub.

2. **Klick "Update"** på Claude.ai-projektet så Session 6.5-trail
   indexeras i projektkunskapen. Per K6.5.3 är projektkunskap inte
   realtid-synkad mot HEAD.

3. **Bestäm prioritering:** Session 6.6 direkt eller Session 7 K0 först
   (per Del 6 ovan).

4. **Tänk på Vale-vokabulär** (per Del 3.5) — vad ska kompletteras i
   K6-skissession utöver utkastet i Del 3.1-3.4?

---

## Del 8 — Sammanfattning för framtida läsare

Detta prep-dokument är **trail-länken mellan Session 6.5 K-sista och
Session 6.6 K1**. Innehållet är producerat i samma chat som Session 6.5
K-sista men committad separat för att inte blanda trail-domäner.

Vid Session 6.6-start:
- Code läser detta dokument som källa #8 i läs-ordningen (per Del 5
  sessionsstart-prompt)
- Sessionsstart-prompten i Del 5 är klar att klistra in direkt
- Vale-vokabulär-utkastet i Del 3 är input till K6-skissession

Vid Session 6.6 K-sista:
- Detta prep-dokument arkiveras tillsammans med Session 6.6-sessionsdoket
  via `git mv` till `tasks/sessions/archive/2026-05/`. Trail-link-
  uppdateringar per Kandidat 1.

Vid Session 6.7:
- Observations-pass-rapporten från Session 6.6 K-sista är input.
  Skills-extraktion + CLAUDE.md-refactor + checklist-trimning hanteras
  där.
- Prep-fil finns redan: `tasks/sessions/2026-05-14-session-6-7-prep.md`
  (skapad samtidigt som denna prep-fil, Del 1 placeholder uppdateras
  post-6.6 K-sista).
- Beroende av denna sessions K-sista observations-pass-rapport för att
  scope ska kunna konkretiseras.
