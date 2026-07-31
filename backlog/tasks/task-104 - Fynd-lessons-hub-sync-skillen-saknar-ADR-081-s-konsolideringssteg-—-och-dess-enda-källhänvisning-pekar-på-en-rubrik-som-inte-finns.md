---
id: TASK-104
title: >-
  Fynd: lessons-hub-sync-skillen saknar ADR-081:s konsolideringssteg — och dess
  enda källhänvisning pekar på en rubrik som inte finns
status: Done
assignee: []
created_date: '2026-07-31 08:24'
updated_date: '2026-07-31 10:44'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 182000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Två sammanhängande brister i `plugins/marcus-system/skills/lessons-hub-sync/SKILL.md` (hub-repot `marcus-system`). Restlistepost `A2:10` i `tasks/s91-restlistan.md` § A2 bär den första; den blockerar Spår C:s konsolidering.

## Brist 1 — konsolideringssteget saknas helt

`ADR-081` flyttade nummertilldelningen till landningen: lärdomar skrivs som nummerlösa fragment i `tasks/lessons.d/` och får sitt `L`-nummer först vid konsolidering in i `tasks/lessons.md`. ADR-081 § Konsekvenser bokför bristen som **öppen post**: skillen *"känner ännu inte fragment-vägen och behöver uppdateras med ett konsolideringssteg (plugin-bump)"*.

Skillen talar i dag bara om `[UNIVERSAL]`-poster som **redan är numrerade**. Mätt i spoken 2026-07-31 (`bash scripts/check-lesson-numbers.sh`): **65 nummerlösa fragment** väntar, **342 unika poster** i `tasks/lessons.md`.

**Nummer-fällan är mätt, inte befarad.** Grinden skriver ut *"342 unika poster … 65 nummerlösa fragment"*. Det första talet är antal poster — **inte** nästa lediga nummer:

| Storhet | Värde |
|---|---|
| Unika poster (grindens tal) | 342 |
| Högsta faktiska nummer | **L359** |
| Nästa lediga nummer | **L360** |
| `### L342` finns redan? | **Ja** — rad 5081 |

Divergensen är 17 och har en exakt orsak: ett hål i serien, `L103`–`L119` saknas (359 − 17 = 342). Talen sammanfaller bara vid kontinuerlig numrering.

## Brist 2 — källhänvisningen pekar på något som inte finns

`SKILL.md` § Källor anger `hub-CLAUDE.md '## Synkrutin: Hub <- Spoke' (rad 507-526)`. Hubbens `CLAUDE.md` är **196 rader** och saknar den rubriken — verifierat 2026-07-31 (`grep -n 'Synkrutin' CLAUDE.md` → exit 1). Forensik: `git log -S 'Synkrutin'` pekar ut `2a4a8c7` (Session 6.7 konstitutions-refactorn), som **flyttade** blockets tre procedur-avsnitt in i skillen. Källhänvisningen är därmed en självreferens till skillens eget upphov, inte en levande källa.

Samma klass som `ADR-083`: prosa som påstår en källa som inte finns. En skill vars källa inte går att slå upp kan inte granskas — hub-lyftets agent fick 2026-07-31 härleda formen ur H2-blocken på disk i stället.

## Vad en läsning måste tåla — [UNIVERSAL]-markören har fyra former

Mätt mot spokens `tasks/lessons.md` 2026-07-31:

| Form | Mönster | Antal |
|---|---|---|
| A | `### Lnnn [UNIVERSAL] — Titel` | 256 |
| B | `### Lnnn — [UNIVERSAL] Titel` | 33 |
| C | `### Lnnn [UNIVERSAL, hub-lyft]` | 26 |
| D | `### Lnnn` naken + markör efter fet titel | 13 |

Summa **328** av 342 poster. En läsning som antar den kanoniska formen A hittar 256 och **missar 72**. Form D (`L347`–`L359`) hamnar på egen rad i 3 fall och i slutet av titelns sista rad i 10 — radbrytningen avgör, inte formen, så ett rad-ankrat mönster hittar 3 av 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Konsolideringssteget skrivet i skillen: fragment i tasks/lessons.d/ → numrerad post i tasks/lessons.md, med H1→### L<nnn>-bytet utskrivet
- [x] #2 Skillen säger att nästa lediga nummer läses ur tasks/lessons.md (högsta + 1) och ALDRIG ur grindens post-räkning — med det mätta motexemplet 342 vs L360 utskrivet
- [x] #3 Skillen slår fast att fragmentets text BEVARAS vid konsolidering — numret tilldelas, texten skrivs inte om
- [x] #4 Alla fyra [UNIVERSAL]-markörformer utskrivna i skillen med ett läsmönster som fångar samtliga 328 — inte bara den kanoniska formen
- [x] #5 Källhänvisningen rättad: valet mellan att återuppliva rubriken i hub-CLAUDE.md och att peka på det som faktiskt bär formen är motiverat, och det förkastade alternativet rivet öppet med skäl
- [x] #6 Verbatim-vs-kondenserat avgjort och utskrivet i skillen för framtida lyft — praxis på disk (historiska lyft kondenserade) vs 2026-07-31 (verbatim) får ett uttalat framåt-svar
- [x] #7 Plugin-bumpad enligt husets praxis och claude plugin update kört i SAMMA landning — version före och efter redovisad, verifierad mot install-recordet
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Hub-ändringen landad som PR #10 i marcus-system (gren skill/task-104-lessons-hub-sync-konsolideringssteget, commit fb01767). Plugin bumpad 1.23.0 → 1.24.0.

AC #7 är MEDVETET OBOCKAD. Den kräver 'claude plugin update kört i SAMMA landning'. Marketplacen marcus-hub hämtar från GitHub-repot high-five-group/marcus-system default branch — verifierat i ~/.claude/plugins/known_marketplaces.json. Marketplace-cachen står därför på 1.23.0 så länge PR #10 inte är mergad, och en update nu skulle bara re-installera 1.23.0 och ge en falsk klar-signal.

ÅTGÄRD FÖR ORKESTRERAREN efter merge av hub-PR #10:
  claude plugin update marcus-system@marcus-hub
  claude plugin list   # ska visa 1.24.0 enabled
Bocka därefter AC #7.

AC #7 uppfylld och bockad 2026-07-31 av räddningsagenten för PR #506: hub-PR #10 mergad 08:41:07Z (merge-commit 7b084a2fc91edac3a1b22c6d0913cd858217999c), claude plugin update kört i samma landning — install-recordet (~/.claude/plugins/installed_plugins.json) visar version 1.24.0, lastUpdated 2026-07-31T08:41:23.705Z, gitCommitSha exakt lika med hubbens merge-commit. claude plugin list visar 1.24.0 enabled (user-scope).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Skillen plugins/marcus-system/skills/lessons-hub-sync/SKILL.md fick ADR-081:s konsolideringssteg (AC 1: fragment i tasks/lessons.d/ till numrerad post, H1-till-### L<nnn>-bytet utskrivet), nästa-lediga-nummer-regeln med det mätta motexemplet 342 poster vs L360 (AC 2), verbatim-bevarandet vid konsolidering (AC 3), alla fyra UNIVERSAL-markörformerna med läsmönster som fångar samtliga 328 (AC 4), rättad källhänvisning med det förkastade alternativet rivet öppet (AC 5) och verbatim-vs-kondenserat avgjort framåt (AC 6). Hub-ändringen landade som PR #10 i marcus-system (merge-commit 7b084a2), plugin bumpad 1.23.0 till 1.24.0; claude plugin update kört i samma landning och verifierat mot install-recordet — gitCommitSha 7b084a2fc91edac3a1b22c6d0913cd858217999c, lastUpdated 2026-07-31T08:41:23Z, claude plugin list visar 1.24.0 enabled (AC 7). Spoke-kortet bar registrering + AC-bokföring och landade via PR #506 (merge-SHA 57c61ac80a42a3bf28f48153b9f4c746046bf469); PR:ns röda Docs link check var en infra-flake (curl exit 35 vid nedladdning av lychee-binären — ingen bruten länk; lokal lychee 0.24.2 med CI:s exakta argument: 2490 länkar, 0 fel, exit 0), löst med re-run. merge_group-run 30624359219 grön per jobb.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
