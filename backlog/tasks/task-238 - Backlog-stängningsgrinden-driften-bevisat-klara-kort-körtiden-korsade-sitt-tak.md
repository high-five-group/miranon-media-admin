---
id: TASK-238
title: >-
  Backlog-stängningsgrinden: driften (bevisat-klara kort) + körtiden korsade
  sitt tak
status: Done
assignee: []
created_date: '2026-08-16 07:07'
updated_date: '2026-08-17 08:06'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DRIFTEN (AC1): grindens skript kört lokalt (fixad väg, config-driven check_active_branches AV). Endast 2 bevisat-klara-men-öppna kort (invariant 1) i aktuell state: TASK-208 (7 AC) och TASK-209 (6 AC) — stängda via `backlog task edit --check-dod … -s Done --final-summary` med källbelagd final-summary (PR-nummer + commit-SHA för respektive landning). Ett tredje kort, TASK-226, matchar strukturellt invariant 1 (4/4 AC bockade, DoD 3 obockad, utanför karens) men bär en EXPLICIT not på kortet självt: "Kortet stängs av orkestreraren efter CI-verifikat — INTE av bygg-agenten" — hoppat över med flit, listat i slutrapporten i stället för stängt blint.

KÖRTIDEN (AC2): backlog-CLI:t (v1.49.1) saknar en per-anrops-flagga/env-var för check_active_branches (verifierat mot --help + strängarna i den kompilerade binären). `backlog config set` är dessutom BEVISAT förlustfullt vid round-trip (mätt live: omserialiserar hela config.yml, t.ex. definition_of_done YAML-lista → inline JSON-array, trots identiskt booleskt värde). Vald väg: CLI:ts dokumenterade "ROOT_CONFIG"-mekanism — en backlog.config.yml i projektroten äger ALLA inställningar när den finns (verifierat live: `config get checkActiveBranches` läser den, `task list` löser fortfarande riktiga backlog/-mappen). Skriptet skriver en byte-kopia av config.yml dit med check_active_branches: false, kör, tar bort filen igen (trap). Riktiga backlog/config.yml (TASK-93-flaggan, interaktiv task create-skydd) rörs ALDRIG. Mätt: en isolerad enkel-anrops-A/B under lugn last (uptime load avg ~4) gav 28,5 s → 1,96 s per `task view`-anrop (~14,5x) — direkt motbevis mot CLAUDE.md § Kortnummers påstående att view-anrop är "opåverkade"; det stämde vid ursprungsmätningen men inte längre med dagens grenantal. Full grind-körning (468 kort, lugn last): fixad ~16m46s, ofixad avbruten efter >60m32s utan att vara klar. shellcheck-strict (samma flaggor som CI): 0 fel.

36→40-LISTAN (AC3): talet i uppdraget (36, 08-15) var stale — aktuellt (08-16, efter driftens stängningar) är 40. Full lista med kort-ID:n i slutrapporten till Marcus/orkestreraren, ej i detta kort (för att undvika en andra sanningskälla som driftar — samma princip som redan gäller för BACKLOG_UNDANTAGNA_STATUSAR i policy-filen).

ANDRA VARVET (2026-08-17) — AC2 var FALSIFIERAD i CI-kontext och är nu åtgärdad i grunden. Natten 2026-08-17 (run 31987759931, jobb 95265601312) cancellades grinden ändå mot timeout-minutes: 10 efter 10m16s, MED fix-commiten d5507aac bevisat i trädet (git merge-base --is-ancestor d5507aac 9f0d14c0 -> 0). Loggen: grindsteget startade 02:22:24, första fynd 02:28:44 (TASK-147.11), sedan TASK-147.12 och TASK-164 02:30:23, avbrott 02:32:14 — alltså 3 fynd och 164 av 502 kort på nästan tio minuter.

ROTORSAKEN VAR INTE GREN-SKANNINGEN, den var KVADRATISK. Mätt 2026-08-17 (check_active_branches AV, tre körningar per punkt): backlog task view kostar linjärt i KATALOGENS storlek — 10 kort 0,471 s · 50 kort 0,614 s · 150 kort 0,976 s · 300 kort 1,524 s · 502 kort 2,654 s. Ett svep är n × O(n) = O(n²): 502 × 2,654 s ~ 1332 s ~ 22 min, och växer kvadratiskt (~41 min vid 700 kort). Jämförelsetal: backlog task list --json läser ALLA 502 korten på 1,68 s — mindre än ETT enda task view (2,33 s). Ren Node-start (--version) är 0,46 s, så resten är katalogladdning per anrop.

CLI:T HAR INGEN O(n)-VÄG TILL AC/DoD. Prövat fält för fält mot 1.49.1: task list --json och search --json bär bara metadata (id, status, labels, parentTaskId, tidsstämplar); task view tar exakt ETT id ("error: too many arguments for view. Expected 1 argument but got 2"); paketet är en kompilerad plattformsbinär utan programmatiskt API.

VALD VÄG (ADR-117, mintad): fakta-insamlingen flyttad till scripts/backlog-kortfakta.mjs — task list --json i ETT anrop för metadata/relationer, AC/DoD-kryssrutorna ur task-filerna, plus KORSVALIDERING av ett deterministiskt urval (default 5) mot task view --json som fäller exit 2 vid minsta oenighet. Avvikelsen mot CLAUDE.md § ISSUE-SUBSTRAT gäller EN datapunkt och är mekaniskt bevakad, inte lovad i prosa. task create-vägens gren-skanning (TASK-93) är ORÖRD.

MÄTT UTFALL: hela grinden 502 kort på 14,57 s (mot ~1332 s) — komplett körning, inte avbruten. Grinden går exit 1 (DRIFT): 24 inkonsistenta kort, samtliga invariant 2 (Done med obockad DoD/AC). Nattens tre fynd är exakt de av dessa med ID <= 164 — den hann aldrig till resten. Listan lämnas till orkestreraren/Marcus, INTE stängd av bygg-agenten.

BEVIS I BÅDA RIKTNINGAR: (a) ekvivalens — gammal och ny grind körda mot IDENTISK delmängd om 150 verkliga kort: samma fynd (TASK-147.11, TASK-147.12), samma antal (2 av 150), identiskt täckningsblock inkl. "0 obedömbara", samma exitkod 1; enda diffen är statussträngens display-glyf (gammal "✔ Done" ur --plain-rendern, ny "Done" ur JSON) — ingen logikpåverkan, ingen konsument utanför testsviten. (b) fällning — testsviten utökad från 50 till 55 fall: T51 (fil och CLI oense om AC -> exit 2) med par T51b, T52 (AC-rubrik utan markörpar -> exit 2), T53 (källassertion: ingen per-kort-loop över BACKLOG_CMD får krypa tillbaka). T13 skrevs om: dess gamla scenario (barn i Subtasks men ej i listningen) är inte representerbart i bulk-formen och var redan strukturellt onåbart mot ett verkligt CLI (verifierat: TASK-17 listar 6 barn, completed-lagda TASK-17.6 är inte ett av dem); faran prövas nu där den ÄR nåbar och HÖGLJUTT — kort på disk utanför listningen ger exit 2 i stället för tyst utelämnande — med par T13b.

GRINDAR: shellcheck --severity=style --enable=all (CI:s exakta flaggor) exit 0 · npx @biomejs/biome check . exit 0 · npm run check:docs exit 0 (14 gröna) · scripts/test-check-backlog-closure.sh 55 passerade 0 failade · scripts/check-adr-count.sh exit 0 (116 == README).

FÖRKASTAT MED MÄTNING: parallellisering (xargs -P) — köper konstant faktor mot kvadratisk kostnad, taket nås igen vid ~650 kort, GitHub-runner har 4 vCPU mot mätmaskinens 16; körningen avbröts sedan -P 8 drivit maskinens load average till 277. Takhöjning — grinden växer kvadratiskt, ett tak som rymmer den idag spricker inom månader.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGNING (orkestreraren, 2026-08-17): PR #1503 MERGED 08:05:18Z via merge-kön, per-jobb-checks gröna — DoD betald. Kvarvarande rot efter d5507aac var KVADRATISK kostnad (502 × task view ≈ 22 min), inte gren-skanningen: löst med bulk-faktainsamling (scripts/backlog-kortfakta.mjs, 1332 s → 14,57 s), CLI-konventionsavvikelsen ADR-prövad öppet (ADR-117) och mekaniskt bevakad (korsvalidering → exit 2). Grinden rapporterar nu ÄRLIGT exit 1 på 24 invariant-2-driftare — evidens-svep pågår (eget pass). Verifikationspunkt framåt: nattens nightly-körning under 10-min-taket.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
