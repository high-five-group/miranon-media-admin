---
id: TASK-160.3
title: 'Skiva: pre-compact-skillen i hub-pluginet'
status: Done
assignee: []
created_date: '2026-08-07 16:56'
updated_date: '2026-08-07 18:06'
labels:
  - ready-for-agent
dependencies:
  - TASK-160.1
parent_task_id: TASK-160
ordinal: 285000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en orkestrerare i mitt-i-flödet-läget kör skillen, får läget säkrat i fil och en fokus-instruktion, och kan sedan kompaktera kontrollerat utan att pipelinen dräneras. Täcker användarberättelser: 3, 5, 7, 9, 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skillen finns i hub-pluginet med eget kontrakt (INTE en gren i session-paus): säkra läget i fil (rent arbetsträd — lokala commits räcker, push krävs inte), sessionsdok-carry vid olandat resonemang, todo-kadens-synk, fokus-instruktion producerad ur läget (nästa mål + öppna PR-nummer + numrerings-snapshot + monitor-läge), markörfil satt som engångsbiljett
- [x] #2 Beslutsrätten kodad i skillen: HITL = Marcus GO i klartext före kompaktering; AFK = agentens eget beslut när nisch-villkoren är mätta; max EN compact per session — andra impulsen instruerar paus-vägen
- [x] #3 Hub-commit + plugin-bump + reinstall-innehållsbevis (149.4-formen); agenten kör OISOLERAT (hub-arbete)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd i S99 resume 2 (2026-08-07): hub-commit 97e4e533 pushad till marcus-system main, plugin 1.30.0→1.31.0, pre-compact-skillen (304 rader) med hela ADR-101-kontraktet — nisch-grind, säkringssekvens (commit räcker, push krävs ej), HITL/AFK-beslutsrätt, /compact med fokus-instruktion, post-compact-procedur. Reinstall-innehållsbevis per 149.4-formen: gitCommitSha == hub-HEAD (identisk sträng), cache-diff 0 rader, 18 skills i cache-katalogen, cachens plugin.json 1.31.0. DoD 3 bockad mot innehållsbeviset — hub-repot bär ingen CI (samma verifikatsform som 149.4). Markör-kontraktet konvergerade med 160.2 utan synk (PRECOMPACT_MARKOR_FILNAMN verifierad identisk). Biter från nästa session. Bifynd: SYSTEMET.md §13(a) skill-räkning 15→18 rättad öppet; agenten ärvde sessionens worktree-isolering och levererade via git -C-vägen (matrisens bokförda form).
<!-- SECTION:FINAL_SUMMARY:END -->
