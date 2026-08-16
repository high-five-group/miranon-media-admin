---
id: TASK-238
title: >-
  Backlog-stängningsgrinden: driften (bevisat-klara kort) + körtiden korsade
  sitt tak
status: To Do
assignee: []
created_date: '2026-08-16 07:07'
updated_date: '2026-08-16 12:49'
labels:
  - ready-for-agent
dependencies: []
ordinal: 438000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-16 (R3): fyra nätter i rad Backlog-DRIFT (kort vars arbete är bevisat klart står öppna bortom karensen; 08-15-täckning: 53 prövade mot AC, 36 kort UTAN stängningssignal, 128 öppna totalt) OCH körtiden växer monotont 7m26s→8m54s→8m48s→9m34s→10m15s — natt 08-16 cancelled mot timeout-minutes: 10 ('Terminate orphan process… backlog'). Trolig körtidsrot: check_active_branches: true (TASK-93) kostar ~6,5 s per list/create (CLAUDE.md § Kortnummer); grinden gör list+view och allokerar aldrig ID:n — flaggan skyddar inget där. Larm #1190/#1243/#1268/#1309/#1373 stängda mot detta kort (backlog-benen). TVÅ separata åtgärder — blanda dem inte.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Driften: bevisat-klara kort stängda via CLI (aldrig handredigering av task-filer)
- [x] #2 Körtiden: grinden åter under sitt tak — rekommenderad väg är check_active_branches AV i grindens CI-kontext (config-driven); takhöjning endast med öppen motivering
- [x] #3 De 36 signal-lösa korten (noll AC, inga barn) listade för Marcus-beslut — stängs ALDRIG blint
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
DRIFTEN (AC1): grindens skript kört lokalt (fixad väg, config-driven check_active_branches AV). Endast 2 bevisat-klara-men-öppna kort (invariant 1) i aktuell state: TASK-208 (7 AC) och TASK-209 (6 AC) — stängda via `backlog task edit --check-dod … -s Done --final-summary` med källbelagd final-summary (PR-nummer + commit-SHA för respektive landning). Ett tredje kort, TASK-226, matchar strukturellt invariant 1 (4/4 AC bockade, DoD 3 obockad, utanför karens) men bär en EXPLICIT not på kortet självt: "Kortet stängs av orkestreraren efter CI-verifikat — INTE av bygg-agenten" — hoppat över med flit, listat i slutrapporten i stället för stängt blint.

KÖRTIDEN (AC2): backlog-CLI:t (v1.49.1) saknar en per-anrops-flagga/env-var för check_active_branches (verifierat mot --help + strängarna i den kompilerade binären). `backlog config set` är dessutom BEVISAT förlustfullt vid round-trip (mätt live: omserialiserar hela config.yml, t.ex. definition_of_done YAML-lista → inline JSON-array, trots identiskt booleskt värde). Vald väg: CLI:ts dokumenterade "ROOT_CONFIG"-mekanism — en backlog.config.yml i projektroten äger ALLA inställningar när den finns (verifierat live: `config get checkActiveBranches` läser den, `task list` löser fortfarande riktiga backlog/-mappen). Skriptet skriver en byte-kopia av config.yml dit med check_active_branches: false, kör, tar bort filen igen (trap). Riktiga backlog/config.yml (TASK-93-flaggan, interaktiv task create-skydd) rörs ALDRIG. Mätt: en isolerad enkel-anrops-A/B under lugn last (uptime load avg ~4) gav 28,5 s → 1,96 s per `task view`-anrop (~14,5x) — direkt motbevis mot CLAUDE.md § Kortnummers påstående att view-anrop är "opåverkade"; det stämde vid ursprungsmätningen men inte längre med dagens grenantal. Full grind-körning (468 kort, lugn last): fixad ~16m46s, ofixad avbruten efter >60m32s utan att vara klar. shellcheck-strict (samma flaggor som CI): 0 fel.

36→40-LISTAN (AC3): talet i uppdraget (36, 08-15) var stale — aktuellt (08-16, efter driftens stängningar) är 40. Full lista med kort-ID:n i slutrapporten till Marcus/orkestreraren, ej i detta kort (för att undvika en andra sanningskälla som driftar — samma princip som redan gäller för BACKLOG_UNDANTAGNA_STATUSAR i policy-filen).
<!-- SECTION:NOTES:END -->
