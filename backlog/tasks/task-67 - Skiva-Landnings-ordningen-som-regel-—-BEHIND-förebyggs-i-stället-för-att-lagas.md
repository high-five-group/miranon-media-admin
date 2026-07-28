---
id: TASK-67
title: >-
  Skiva: Landnings-ordningen som regel — BEHIND förebyggs i stället för att
  lagas
status: To Do
assignee: []
created_date: '2026-07-28 13:06'
updated_date: '2026-07-28 13:14'
labels:
  - ready-for-agent
dependencies: []
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restlistans steg 4 (A2 punkt 5): landnings-ordningen är TILLÄMPAD men inte KODAD. Den lever som omdöme, och omdöme är den empiriskt svagaste mekanismen.

PROBLEMET (L328 [UNIVERSAL], S81): med 'require branches to be up to date' (strict) på required-checken måste en PR:s branch innehålla main-toppen vid merge. En PR vars svit tar ~10 min förlorar racet mot varje parallell docs-PR (~1 min CI): main flyttar sig under sviten -> BEHIND -> gh pr update-branch -> ny 10-min-svit -> main har flyttat sig igen. Tre varv i S81 innan den parallella strömmen sinade.

EMPIRIN SOM GÖR DEN AKUT: orkestreraren gick i fällan TVÅ gånger under en och samma resume 2026-07-28, trots att L328 varit nedskriven sedan S81. En nedskriven lärdom utan grind tillämpas inkonsekvent (jfr fragmentet lardom-utan-grind-tillampas-inkonsekvent.md).

OCH TRYCKET ÖKAR: worktree-isoleringen (#327) gör fler parallella agenter normalfall, alltså fler parallella PR:er, alltså mer BEHIND-tryck. Restlistan noterar uttryckligen att denna post INTE konvergerar med isoleringen — BEHIND är en annan felmekanism.

FORMEN SOM FUNGERADE NÄR DEN TILLÄMPADES (ur restlistan): låt den TYNGRE PR:en landa först, eller kör gh pr update-branch på nästa FÖRE armering i stället för att laga BEHIND efteråt.

BIKOSTNAD SOM MÅSTE MED I REGELN: en CI-vakt startad mot en SHA blir felaktig i samma stund grenen uppdateras — vakten ska stoppas och startas om mot den nya SHA:n. Utan den raden byter regeln en felklass mot en annan.

AVGRÄNSNING: detta är en REGEL-skiva, inte en automation. Den ska bo där den läses av den som sekvenserar PR-kön — CONTRIBUTING.md och/eller .claude/agents/-instruktionerna. Bygg ingen kö-automat; merge queue är en egen post (A4) och ska inte föregripas här.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Regeln är nedskriven med sin utlösare (parallella PR:er + heterogena CI-tider + strict), inte bara sitt recept
- [x] #2 Båda de fungerande formerna står: tyngre PR först, ELLER update-branch före armering
- [x] #3 CI-vaktens SHA-bikostnad är med — vakt mot gammal SHA stoppas och startas om
- [x] #4 Hemvisten är den som faktiskt läses vid PR-sekvensering; valet är motiverat i skivan
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Regeln landad som `### Landnings-ordningen — BEHIND förebyggs, det lagas inte` i `CONTRIBUTING.md`, som underrubrik till `## Pull Request-flöde`.

HEMVIST-VALET (AC #4) — `CONTRIBUTING.md`, ENSAM. Tre skäl, i fallande styrka:

1. Adjacens till armerings-kommandot. `## Pull Request-flöde` är den sektion som redan äger `gh pr merge --auto --merge`, strict-kravet och required-checkens namn. Den som är på väg att armera läser den sektionen just då; regeln står nu i samma andetag som kommandot den villkorar. En regel som ligger var som helst annars måste sökas upp av någon som inte vet att den finns.

2. Den öppna DoD-rutan pekar hit. `## Definition of Done — per session` (samma fil) har "CI grön per jobb på pushad commit" + "Commits pushade" som sista poster. Det är exakt sekvenserings-ögonblicket, och filen är alltså redan uppslagen då.

3. `.claude/agents/` VALDES BORT — medvetet, inte av förbiseende. En bygg-agent sekvenserar per definition aldrig PR-kön; `bygg-skiva.md` föreskriver tvärtom att den avstår från armering. Regeln skulle alltså bo i en fil som inte läses vid det tillfälle AC #4 pekar ut. Två ytterligare skäl förstärker: (a) en kopia av regeln i agentfilen blir en andra hemvist utan paritetsgrind — samma klass som listparitets-problemet (restlistan A3), där invarianten står i prosa på två ställen och driftar; (b) `.claude/**` står inte i `ci.yml`:s docs-allowlist, så en touch där drar hela staging-sviten (~10 min genom mutexen, mätt S91) för en fil som inte kan påverka ett enda test. Ironin vore total: regeln mot BEHIND-svält hade landat i just den långsamma lanen den varnar för.

SÖMMEN MOT AGENTFILEN: agentfilens befintliga rad lämnades ORÖRD, och regeln refererar den explicit ("Agenterna armerar inte — det är andra halvan av samma kontrakt"). De hänger ihop utan att duplicera: agenten bär avståendet, `CONTRIBUTING.md` bär receptet.

ÖPPEN SVAGHET, EJ ÅTGÄRDAD HÄR: `CONTRIBUTING.md` auto-laddas inte i en Code-session (till skillnad från `CLAUDE.md`). Regelns räckvidd vilar därför på att läsaren öppnar filen. En rad i `CLAUDE.md` som pekar hit hade stängt glappet, men `CLAUDE.md` stod inte i kortets kandidat-lista och lades inte till på eget bevåg.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
