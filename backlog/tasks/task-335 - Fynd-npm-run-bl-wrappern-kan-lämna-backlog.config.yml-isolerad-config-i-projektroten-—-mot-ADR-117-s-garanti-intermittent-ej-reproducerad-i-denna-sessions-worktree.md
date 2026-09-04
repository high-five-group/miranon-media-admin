---
id: TASK-335
title: >-
  Fynd: npm run bl-wrappern kan lämna backlog.config.yml (isolerad config) i
  projektroten — mot ADR-117:s garanti, intermittent, ej reproducerad i denna
  sessions worktree
status: To Do
assignee: []
created_date: '2026-08-28 03:52'
updated_date: '2026-08-28 03:57'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 606000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Orkestrerarens observation (källa: uppdragstexten S108 resume 13): backlog.config.yml med innehåll = wrapperns isolerade config (check_active_branches: false) dök upp i huvudkatalogen två gånger 2026-08-28 (ca 05:1x och 05:36:18) och blockerade Marcus prod-deploy via scripts/fas4-prod-deploy.sh:s rena-träd-grind. scripts/backlog-cli.sh (läst i sin helhet) skriver EXPLICIT bara till en mktemp-genererad isoleringskatalog (nedan kallad ISO) — aldrig till ROT (repo-roten). Hypotesen (ej bekräftad mot backlog.md:s källkod i detta pass): CLI:t (node_modules/.bin/backlog), när det körs med BACKLOG_CWD=ISO och ISO/backlog är en symlänk till ROT/backlog, kan internt realpath-upplösa symlänken för att härleda projektroten och därigenom (vid någon lazy-init/migrations-väg) skriva sin egen config-fil till ROT i stället för ISO — vilket exakt skulle förklara att den läckta filens INNEHÅLL är identiskt med wrapperns egen isolerade config. REPRODUKTIONSFÖRSÖK i denna sessions egen worktree (3 körningar av npm run bl -- task 301 --plain, ls+git status före/efter varje): INGEN backlog.config.yml dök upp i worktree-roten någon gång — mekanismen reproducerades INTE här. Antingen är den miljö-/timing-beroende (fleet-last, first-run-cache-miss, race), eller specifik för huvudkatalogen (ej en worktree) — overifierat i detta pass. Fixa INTE wrappern i denna skiva (uppdragets explicita gräns). RÄTTELSE (samma session): ett tidigare utkast av denna beskrivning innehöll av misstag en FABRICERAD faktisk mktemp-sökväg (ett citeringsfel i skapelsekommandot körde $(mktemp -d) skarpt i stället för att visa det som literal text) — den sökvägen var aldrig en observerad del av det verkliga felet och har tagits bort här.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rotorsaken fastställd: läs backlog.md:s källkod (node_modules/backlog.md eller motsvarande) för realpath/symlink-hantering vid BACKLOG_CWD, alternativt instrumentera med fs-watch under en längre reproduktionskörning i huvudkatalogen
- [ ] #2 Reproduktion bekräftad eller falsifierad med en mätserie (N körningar, exakt villkor för läckan om den finns)
- [ ] #3 Vid bekräftad läcka: en fix föreslås (ADR-117 uppdateras om kontraktet ändras) — vid falsifiering: bokfört som miljöartefakt, inget kodfel
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
