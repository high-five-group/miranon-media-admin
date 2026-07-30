---
id: TASK-91
title: >-
  Fynd: staging-preflightens wiring har noll test — fem ytor vars frånvaro inte
  syns
status: To Do
assignee: []
created_date: '2026-07-29 17:49'
updated_date: '2026-07-30 19:37'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 171000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`TASK-77` och `TASK-84` hakade tillsammans in preflighten på **fem ytor**:

- `api-setup` → `api-staging` + `kontraktsvakt` (Playwright setup-projekt)
- `setup` → `chromium-authenticated` (Playwright setup-projekt)
- `preview-setup` → `staging-preview` (Playwright setup-projekt)
- `purge:staging` (anrop i `main()`)
- `seed:review` + `:clean` (anrop i `main()`)

**Semaforens LOGIK är väl täckt** — `scripts/test-staging-semaphore.sh` har 19 fall. **Wiringen har noll.** `TASK-84`:s agent rapporterade det om sig själv: *"en refaktorering som tappar anropsraden i `main()` fångas inte av någon grind"*, och noterade att samma sak gäller `TASK-77`:s setup-filer.

### VARFÖR DETTA KORTAS TROTS ATT FELET ALDRIG INTRÄFFAT

Kortet bryter medvetet mot husets normala test: mekanisera när felet HAR inträffat, eller när det FÖRSTA felet vore oacceptabelt. Ingetdera gäller här.

Skälet är en tredje egenskap, belagd i primärkälla: **frånvaron syns inte.** GitLabs postmortem 2017-01-31 är det dokumenterade fallet — fyra återställningsmekanismer fanns på papperet, `pg_dump`-backuperna hade aldrig körts, **och felrapporteringen var också trasig**: *"This means we were never aware of the backups failing, until it was too late."* Motmedlet som passet namnger är att övervaka att vägen fortfarande finns.

Tappas en anropsrad här märks det först vid en kollision — och då ser det ut som ett slumpmässigt staging-fel, inte som en saknad mekanism. Det är samma signal-förstörelse som parkerade `T87`.

Källa: `docs/research/reversibilitet-som-delegeringsaxel-2026-07-29.md` § C1. Registrerat av `TASK-84`:s agent 2026-07-29.

### AVGRÄNSNING

Detta är en **deletion-vakt**, inte en ny funktionstest. Den ska svara på frågan *"finns wiringen kvar?"* — inte *"fungerar semaforen?"*, som redan är besvarad av de 19 fallen. Bygg inte om det som finns.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Vakten täcker SAMTLIGA fem ytor — de tre Playwright-dependencyn och de två main()-anropen
- [x] #2 Tvåsidigt bevis PER YTA: vakten är grön mot nuvarande träd, och RÖD när anropet/dependencyn tas bort — fem par, inte ett stickprov
- [x] #3 Vakten prövar ATT wiringen finns, inte att semaforen fungerar — ingen duplicering av de 19 befintliga fallen
- [x] #4 Vakten körs av ett CI-jobb, eller så är skälet till att den inte gör det utskrivet (jfr TASK-82: en guard-svit utan CI-bärare bevisar ingenting)
- [x] #5 Formen tål att en sjätte yta tillkommer — en ny yta ska antingen fångas automatiskt eller ge ett tydligt fel om den saknas i vaktens lista
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
