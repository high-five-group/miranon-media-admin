---
id: TASK-310
title: >-
  Fynd: task create kostar ~3 min per kort — 287 grenar skannas av
  check_active_branches; elva kort tog över 30 min
status: To Do
assignee: []
created_date: '2026-08-23 14:55'
updated_date: '2026-08-24 12:58'
labels:
  - ready-for-agent
dependencies: []
ordinal: 573000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-08-23 (S108 resume 8): elva task create i följd tog >30 min i ett träd med 287 grenar (git branch -a | wc -l), ~3 min per kort; Bash-anropet dog mot 10-minuterstaket efter tre kort. CLAUDE.md § Kortnummer mätte 0,69→7,09 s vid 43 refs — kostnaden växer med antalet grenar, och fleet-drift producerar grenar utan att någon tar bort dem. Förväntat: task create under ~10 s i normal drift. Blockerar ej (korten skapades i bakgrund), värdefullt → kort (ADR-053).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mätserie bokförd: task create-tid mot antal grenar (git branch -a | wc -l), före/efter städning av landade remote-grenar
- [x] #2 Rotorsak adresserad utan att röra backlog/config.yml: antingen (a) rutin/skript som tar bort LANDADE remote-grenar (gh pr list --state merged → git push --delete) med torrkörning + allowlist för aktiva sessioners grenar, eller (b) GitHubs 'Automatically delete head branches' aktiverad — valet bokfört med precedent
- [x] #3 CLAUDE.md § Kortnummer uppdaterad med den nya mätningen (per-kort-kostnaden vid 287 grenar) och vägen framåt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Utfört 2026-08-24 (bygg-agent, S112 städsessionen).

AC1 — Mätserie (raw node_modules/.bin/backlog, ej npm run bl-wrappern; wrappern
kör list/view mot isolerad check_active_branches:false och hade dolt effekten):

| Läge | grenar (lokala/totalt) | task list --plain | task create |
|---|---|---|---|
| Före | 289/345 | 39,20 s | - |
| Efter lokal städning (235x git branch -d, 0 fel) | 54/110 | 18,57 s | - |
| + fjärr-tracking-prune (git remote prune origin, 37 st) | 54/72 | 18,51 s | 21,08 s |

Loadavg steg 5,15->15,71 under fönstret (fleet-samtidighet) - talen är inte en
ren branch-count-funktion, men riktningen är entydig: lokal städning ~2x,
fjärr-prune ~0 (brus).

AC2 — Rotorsak: EMPIRISKT är lokala grenar drivaren, inte fjärrgrenar (se
ovan). Option (b) i AC2 var redan uppfylld INNAN detta pass: delete_branch_on_merge
= true, satt av TASK-70.6 (2026-07-29), verifierat oförändrat 2026-08-24 via
gh repo view --json deleteBranchOnMerge. De 37 prunade var redan raderade PÅ
GITHUB - pruningen tog bara bort lokala cache-pekare. Option (a) (git push
--delete mot fjärren) utfördes INTE - uppdragets säkerhetsregel kräver
STOPPA-och-rapportera för det, och (b) räcker för AC2:s antingen/eller-krav.
Men (b) löser INTE den uppmätta kostnaden (se AC1) - det är en sekundär
hygienfråga. Faktisk åtgärd denna gång: 235 lokala grenar raderade via
git branch -d (safe delete, samtliga bevisat --merged origin/main, 0 fel,
0 -D-fall) + git remote prune origin (37 stale tracking-refs, ren lokal
operation, ingen origin-skrivning). Kvarlämnat: docs/s108-*, feat/s108-*,
proto/s108-*, task-309.8-skiva7-promoveringen, samtliga worktree-checked-out
grenar (git skyddar dessa ändå) - konservativt tolkat bredare än de två
uppdragsgivna mönstren (även feat/s108-* och proto/s108-* skonades, inte
bara docs/s108-*/s108-*).

AC3 — CLAUDE.md § Kortnummer uppdaterad med hela mätserien + "Vägen framåt":
ingen mekanism raderar lokala grenar efter att en worktree-agent landat (git
worktree remove rör aldrig grenen) - ett återkommande lokalt gren-svep är
flaggad, obetald skuld, inte byggt i detta pass.
<!-- SECTION:NOTES:END -->
