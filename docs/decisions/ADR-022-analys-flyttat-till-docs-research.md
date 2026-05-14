# ADR-022: `analys/` flyttat till `docs/research/datamodell-research/`

- Status: Accepted
- Datum: 2026-05-06
- Fas: Pre-Fas-2

## Kontext

Datamodell-research-projektet (2026-04-29 → 2026-04-30) levererade 10 filer i en mapp `analys/` som syskon till `src/`, `docs/`, `tasks/`. Code:s K1.B Block 2.5: "oväntad placering — datamodell-research-projektets 10 leveranser hade hört hemma i `docs/research/datamodell/` enligt etablerad konvention (`docs/research/` finns redan med 4 filer från Fas 0). Nu finns research utspridd i två mappar — strukturell drift."

Vid placeringstillfället 2026-04-29 fanns inte `docs/research/` än som etablerad konvention för datamodell-research (Fas 0-research låg där, men det betraktades som projekt-internt). Pre-Fas-2-verifieringen identifierar nu att research är research, oavsett källa.

## Beslut

Flytta `analys/`-mappens 10 filer till `docs/research/datamodell-research/`. Mappen `analys/` tas bort (`rmdir` efter `git mv`). Befintliga `docs/research/`-filer (Fas 0-research, 4 st) lämnas i `docs/research/`-roten.

Resulterande struktur:

```
docs/research/
├── beyond-best-practices-2026.md
├── react-headless-ui-research.md
├── react-stack-research.md
├── vue-project-analysis.md
└── datamodell-research/
    ├── 00-file-manifest.md ... 08-odoo-validation.md (10 filer)
```

Refs uppdateras i alla styrande dokument utanför arkiv-zoner.

## Alternativ som övervägdes

1. **Lämna i `analys/`** — bevara som sibling-mapp. Avvisat: strukturell drift, research hör i docs/research/.
2. **Flytta till `docs/research/datamodell/`** (kortare namn). Avvisat: namnet "datamodell-research" matchar projektets formella namn (`tasks/datamodell-research-direktiv.md`) och behåller spårbarhet.
3. **Flytta till `docs/datamodell/`** (egen kategori). Avvisat: research-naturen är primär; placering i research-mappen signalerar att leveransen är analytisk-undersökande, inte normativ-styrande.

## Konsekvenser

**Positivt:**
- Hela `docs/research/` är samlad — Fas 0-research + datamodell-research = en ingång.
- `analys/` försvinner som sibling — repo-roten har en standardform.
- Frysta filer (datamodell-research-leveranserna) bevarar git-historik via `git mv`.

**Negativt:**
- ~150 path-refs uppdateras i frysta zoner (datamodell-research-leveranser, sessions-arkiv) — riskmoment, mitigerat med per-rad-skanning innan körning.

## Fix-vs-skip-disciplin på path-refs i frysta zoner (åf-erfarenhet)

åf:s första försök antog att path-refs i frysta filer (datamodell-research-leveranser, sessions-arkiv) skulle exkluderas från sed-pass per arkiv-disciplin. Den antagandet var fel — det skulle skapat ~150 broken refs i nyligen-arkiverade filer. Per-rad-skanning visade att refs i dessa zoner är **källhänvisningar** (bare paths, "Källa: X", `[fil](path#Lrad)`), inte **relationskontext** ("ersätter X", "föregångare X"). Mekanisk substitution är därför säker — ny path pekar på samma innehåll på samma rad efter `git mv`. Distinkt från detta är **frusna externa leveranser** (Codex-/Code-rapporter, datumstämplade) där pre-flytt-spec arkiverats efter stack-skifte (ADR-027) — innehållet finns inte längre på pre-flytt-rader, så substitution bevarar inte intentionen. Kategori 4 hanterar detta fall.

Skip-disciplinen från ADR-021 ska därför skiljas i tre kategorier:

1. **Relationskontext** ("X ersätter Y", "föregångare Y") — substitution förvränger semantik. **SKIP.**
2. **Källhänvisning** ("se rad N i fil Y", `[fil](path)`) — substitution bevarar exakt intention. **FIX mekaniskt.**
3. **Beskrivning av flytt** ("X flyttad till Y") — substitution skapar nonsens. **SKIP.**
4. **Frusen extern leverans** (datum-stämplad analys-/rapport-fil där refs pekar på pre-flytt-spec som arkiverats efter stack-skifte) — substitution mot post-flytt-fil bevarar inte intentionen eftersom innehållet inte längre finns på samma rad. Retroaktiv editering av leverans-fil bryter trail-integritet. **SKIP permanent.** (Etablerad i Session 6.5 2026-05-14 efter empirisk K3-fångst av 11 refs i `Code-verification-of-codex-analysis-2026-05-07.md` som pekade på `KVALITETSDEFINITIONER-11.md` pre-ADR-027.)

`CHANGELOG.md` rad 13 (kategori 3) exkluderades från sed-passen via `find -not -path "./CHANGELOG.md"`. Alla andra refs i frysta zoner (kategori 2) uppdaterades mekaniskt. Stickprov för relationskontext-fraser (`ersätter|föregångare|fortsättning|tidigare|ursprungligen|innan` nära path-refs) gav 0 träffar i frysta zoner — D-strategin verifierades empiriskt innan körning.

En line-wrappad ref i `tasks/sessions/archive/2026-05/2026-05-04-stodspec-synk-p2.md` rad 680–681 (`tasks/sessions/2026-05-04-byggplan-\n    revision-p1.md`) fångades inte av sed (regex matchar inte över newlines) och fixades manuellt med Edit-tool.

**Spårbarhet:**
- åf commit 1: `git mv` + sed-pass + ADR-022 + ADR-023
