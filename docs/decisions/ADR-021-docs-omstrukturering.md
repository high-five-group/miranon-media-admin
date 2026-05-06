# ADR-021: docs/-omstrukturering till specs/analysis/reference/logs/

- Status: Accepted
- Datum: 2026-05-06
- Fas: Pre-Fas-2

## Kontext

Pre-Fas-2-verifieringen 2026-05-06 visade att `docs/`-roten innehöll 25 filer i platt struktur — klassificeringsdrift som vuxit fram över Fas 0/1/A utan löpande gruppering. Code:s K1.B Block 3.3-bedömning: "platt-mapp-anti-pattern. En ny senior tappar 3 minuter på orientering."

Av de 25 filerna hör endast 4 verkligen hemma i roten: `README.md`, `byggplan.md` (styrande), `BUILD-LOG.md` (aktiv journal), `DOKUMENTATIONSSTANDARD.md` (referens-standard). Resten klustrar tydligt i fyra kategorier: specs (14), analysis (2), reference (2), logs (2). Befintliga undermappar `docs/archive/`, `docs/decisions/`, `docs/features/`, `docs/research/` lämnas orörda.

## Beslut

Strukturera `docs/` enligt:

```
docs/
├── README.md, byggplan.md, BUILD-LOG.md, DOKUMENTATIONSSTANDARD.md  (rot, 4 filer)
├── specs/      (14 filer — DESIGN-, SECURITY-, STATE-, URL-, ARIA-, ACCESSIBILITY-, FUTURE-, PERFORMANCE-, KVALITETSDEFINITIONER-, SPA-, BYGGPLAN-LÄTTLÄST-v2)
├── analysis/   (2 filer — Codex-project-analysis-after-fas-1, Code-verification-of-codex-analysis)
├── reference/  (2 filer — data-model, hur-systemet-funkar)
├── logs/       (2 filer — gap-analysis, byggplan-revision-inventory)
├── archive/    (orörd — historiska)
├── decisions/  (orörd — 24 ADR + README)
├── features/   (orörd — 1 fil)
└── research/   (orörd — Fas 0-research; analys/ flyttas hit i åf via ADR-022)
```

Filerna flyttas med `git mv` så historik bevaras. Refs uppdateras i samma commit via sed-pass (1 sed-script, 20 substitutioner). `docs/archive/`-filer exkluderas från sed-passen — historiska refs bevaras där.

I commit 2 (samma åe-klunga) hanteras dessutom:
- Arkivering av BYGGPLAN-LÄTTLÄST.md v1 till `docs/archive/BYGGPLAN-LÄTTLÄST-v1-2026-04-13.md` med ARKIVERAD-header (superceded av v2 i specs/).
- Kirurgisk fix av 8 broken refs över 6 filer (per-rad-bedömning, ingen mekanisk sed):
  - `docs/specs/BYGGPLAN-LÄTTLÄST-v2.md`:461 — markdown-länk → `../archive/conversion-plan-2026-04-14.md`
  - `docs/logs/byggplan-revision-inventory.md`:16 — backtick-path → `docs/archive/conversion-plan-2026-04-14.md`
  - `docs/reference/data-model.md`:1313 — redaktionell omformulering → `docs/byggplan.md` (refen pekade semantiskt fel — byggplan ersätter conversion-plan, archive är historisk)
  - `docs/decisions/README.md`:51 — relativ markdown-länk → `../archive/conversion-plan-2026-04-14.md`
  - `docs/decisions/README.md`:52 — relativ markdown-länk gap-analysis → `../logs/gap-analysis.md` (broken efter åe commit 1)
  - `docs/BUILD-LOG.md`:45, 49, 190 — 3 markdown-länkar → `archive/conversion-plan-2026-04-14.md`

  Initialt försök 2026-05-06 var en bred sed-pass över alla `*.md`-filer som matchade `docs/conversion-plan.md`-strängen. Den fångade både broken refs och text-mentions, vilket skapade nonsens-rader i `docs/byggplan.md` och `tasks/byggplan-direktiv.md` (typ "X arkiveras till X" eller semantisk drift där "byggplanen ersätter X" ändrades från levande conversion-plan till arkiv-versionen). Pass:en revertades med `git checkout`. Per-rad-bedömning visade att alla refs i `docs/byggplan.md` (8 rader) och `tasks/byggplan-direktiv.md` (22 rader) är text-mentions eller backtick-path-citat i historisk-relationskontext — inte klickbara broken refs. Skip-disciplin tillämpad.

## Alternativ som övervägdes

1. **Status quo** — bevara 25 filer platt. Avvisat: explicit anti-pattern, drift mot 11/10-ribba.
2. **2-kategori-modell** — `docs/specs/` + `docs/misc/`. Avvisat: misc är skräp-bin som bara skjuter problemet framåt.
3. **5+ kategorier** (specs/analysis/reference/logs/governance/process/...). Avvisat: överstrukturering — governance-filerna (4 st) är så få att de stannar i rot utan undermapp.
4. **Splitta i flera commits per kategori** (en commit per undermapp). Avvisat: ref-uppdateringar måste vara atomära — annars blir tree:n broken mellan commits.

## Konsekvenser

**Positivt:**
- `docs/`-roten har 4 styrande filer + 8 undermappar = läsbar översikt vid första anblick.
- Kategorier är intuitiva och självförklarande.
- `git mv` bevarar full historik per fil.
- README.md `Documentation map`-sektion (åd, refs ADR-024) refererar nu meningsfulla mappar.

**Negativt:**
- 20 ref-uppdateringar är riskmoment — sed-passen verifieras med post-grep att 0 gamla refs finns kvar (utanför `docs/archive/`).
- Externa länkar till specifika filer (om sådana finns) bryts. Mitigerat: privat-projekt utan externa inlänkar.

**Spårbarhet:**
- Commit 1: filflyttningar + ref-uppdateringar (`7a6ec28`)
- Commit 2: denna ADR + BYGGPLAN-LÄTTLÄST v1 arkivering + conversion-plan-refs-fix

**Skip-disciplin (refs som medvetet INTE fixades):**
- `CHANGELOG.md` historiska fil-namn (Keep-a-Changelog dokumenterar *vad som hände* — historiska namn bevaras exakt; "X → Y"-pilar är beskrivande, inte broken links).
- `docs/byggplan.md` + `tasks/byggplan-direktiv.md` text-mentions och backtick-path-citat i historisk-relationskontext (typ "ersätter `docs/conversion-plan.md` som styrande" där refen är en historisk relationsbeskrivning, inte en levande pekare). Den ursprungliga sed-passen revertades efter att text-störningar upptäcktes.
- `docs/BYGGPLAN-LÄTTLÄST.md` v1 internt content (arkiv-disciplin: snapshot bevaras med original-innehåll, endast ARKIVERAD-header läggs till).
- ADR:er, sessions-dok i `tasks/sessions/` (frusna), `analys/`-leveranser (frusen efter datamodell-research-projektets Gate 6, 2026-04-30), `tasks/datamodell-research-direktiv.md` + `-plan.md`: immutable trail-disciplin per ADR-disciplin och retrospektiv-disciplin (P3a-mönster, lessons.md 2026-05-05).

Skip-disciplinen är lika viktig som fix-disciplinen. Att inte fixa allt mekaniskt är ett aktivt val som skyddar trail-integritet och historisk korrekthet.
