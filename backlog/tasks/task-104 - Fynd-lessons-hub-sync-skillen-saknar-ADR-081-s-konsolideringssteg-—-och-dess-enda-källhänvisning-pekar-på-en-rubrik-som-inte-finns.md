---
id: TASK-104
title: >-
  Fynd: lessons-hub-sync-skillen saknar ADR-081:s konsolideringssteg — och dess
  enda källhänvisning pekar på en rubrik som inte finns
status: To Do
assignee: []
created_date: '2026-07-31 08:24'
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
- [ ] #1 Konsolideringssteget skrivet i skillen: fragment i tasks/lessons.d/ → numrerad post i tasks/lessons.md, med H1→### L<nnn>-bytet utskrivet
- [ ] #2 Skillen säger att nästa lediga nummer läses ur tasks/lessons.md (högsta + 1) och ALDRIG ur grindens post-räkning — med det mätta motexemplet 342 vs L360 utskrivet
- [ ] #3 Skillen slår fast att fragmentets text BEVARAS vid konsolidering — numret tilldelas, texten skrivs inte om
- [ ] #4 Alla fyra [UNIVERSAL]-markörformer utskrivna i skillen med ett läsmönster som fångar samtliga 328 — inte bara den kanoniska formen
- [ ] #5 Källhänvisningen rättad: valet mellan att återuppliva rubriken i hub-CLAUDE.md och att peka på det som faktiskt bär formen är motiverat, och det förkastade alternativet rivet öppet med skäl
- [ ] #6 Verbatim-vs-kondenserat avgjort och utskrivet i skillen för framtida lyft — praxis på disk (historiska lyft kondenserade) vs 2026-07-31 (verbatim) får ett uttalat framåt-svar
- [ ] #7 Plugin-bumpad enligt husets praxis och claude plugin update kört i SAMMA landning — version före och efter redovisad, verifierad mot install-recordet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
