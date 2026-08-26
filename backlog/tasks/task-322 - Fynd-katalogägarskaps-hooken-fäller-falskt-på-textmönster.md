---
id: TASK-322
title: 'Fynd: katalogägarskaps-hooken fäller falskt på textmönster'
status: To Do
assignee: []
created_date: '2026-08-26 04:42'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 595000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`scripts/deny-frammande-huvudkatalog.sh` matchar huvudkatalogens sökväg + git-underkommando som STRÄNGAR i kommandot/cwd-läget vid anropstillfället, inte det faktiska målet efter en inbäddad `cd`. Källmärkt (S112 resume 1, 2026-08-26): VERIFIERAT mot koden (rad 564-577, 508-514): Väg 1 ('arbetskatalogen är huvudkatalogen') läser hookens cwd-fält SATT VID ANROPSTILLFÄLLET — en inbäddad 'cd <egen worktree> && git checkout' fälls alltså felaktigt om anropande sessions cwd var huvudkatalogen, trots att git-skrivningen sker i worktreen. _prova_segment fångar bara underkommandots NAMN (sub=branch) och hoppar över flaggor efteråt — 'git branch --merged' (ren läsning) matchar därför samma väg som en skrivande git branch. BÅDA REPRODUCERADE LIVE i denna session: 'git branch --list' mot huvudkatalogen nekades av hooken med skälet 'kommandot pekar explicit på huvudkatalogen' trots att --list är en läsning. DIVERGENS, FLAGGAD: uppdragstextens instans-attribuering (orkestreraren x4, bunt A/D-agenterna, research-passet x3, review-agenter x2) hittas INTE i den citerade källan (docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md paragraf Sidofynd 2 dokumenterar bara 3 instanser, samtliga från research-passet). Huvudkatalogens .claude/hook-fallningar.jsonl (mätt 2026-08-26, 18 nekanden idag för denna hook) saknar agent-identitetsfält och kan inte styrka den specifika fördelningen — HYPOTES, obelagd, pröva vidare vid genomförande. DIVERGENS, TEKNISK: 'for-loopar och mapfile som för komplexa' matchar INTE denna scripts kod (ingen komplexitetsheuristik finns i deny-frammande-huvudkatalog.sh). Den matchar i stället Claude Code-HARNESSENS egen, separata worktree-isoleringsspärr (engelsk text 'too complex to verify', se CLAUDE.md paragraf Worktree-isoleringens gräns) — en mekanism UTANFÖR detta repos scripts, ej fixbar av AC 1:s testsvit. Självupplevt denna session på ett kommando helt utan git. Nästa agent bör skilja hook-buggen (fixbar här) från harness-begränsningen (ej fixbar här) innan AC 1 påbörjas. 'git worktree remove <path>' + 'prune' i samma kommando och kommandon med arbetskatalog i /private/tmp: delvis korroborerat i huvudkatalogens hook-fallningar.jsonl (1 resp. 5 träffar 2026-08-26) men inte oberoende kod-verifierat som falska (worktree remove av EGEN worktree-post är en legitim skrivning till delat tillstånd per skriptets egen definition — den semantiska frågan om det BORDE räknas som riktat mot huvudkatalogen är öppen, inte kod-bevisad här).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 hookens klassning läser MÅLET (upplöst sökväg/cwd vid faktisk git-exekvering), inte strängförekomst vid anropstillfället, med tvåsidig testsvit för instansklasserna: cd+git-checkout, branch --merged, worktree remove+prune, /private/tmp-arbetskatalog
- [ ] #2 läskommandon (branch --merged, worktree list, status, log) fälls aldrig — bevisat med testsvit
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
