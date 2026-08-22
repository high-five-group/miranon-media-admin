---
id: TASK-294
title: >-
  Plugin-cachen släpar efter hubben utan att någon rutin ser det — session-end
  körde 1.33.0 utan sessions-worktree-klassen
status: To Do
assignee: []
created_date: '2026-08-22 12:56'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 536000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EFTERFYND vid S110:s stängning (2026-08-22). session-end-rutinen körde hub-pluginets stada-worktrees.sh ur cache 1.33.0 (scope: bara agent-*), trots att task-211 (Done 2026-08-14, hub b112257) levererade en sessions-worktree-klass i 1.34.0 och uppdaterade session-paus/end-skillsen därefter. Installerad version enligt 'claude plugin list': 1.33.0; hubbens plugin.json: 1.34.0. Följd: sessions-worktrees ackumuleras igen (mätt: hubbens 1.34.0-skript i torrkörning skulle ta bort s102-resume, s104-segment-passet, s107-utredningspasset, s108-bilagesparet — alla landade + rena + utan levande process), och rutinens text i 1.33.0 säger fortfarande 'utanför agent-* → STOPPA' som om klassen inte fanns. ROTORSAK: ingen rutin jämför installerad plugin-version mot hubbens. CLAUDE.md § Operativ procedur säger 'saknas pluginet … flagga det' men inte 'släpar versionen'. Session-start-skillen (hub) är rätt hemvist för kontrollen (hub-arbete: oisolerad agent eller hub-commit-disciplin). Åtgärd nu (Marcus terminal): 'claude plugin update marcus-system@marcus-hub' — bestäms vid sessionsstart, når S111. Besläktat: T138 (gren-/worktree-livscykeln), ADR-035 (plugin-aktivering user-scope), task-211.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 session-start (hub-skill) jämför 'claude plugin list'-versionen mot marketplace/hubbens plugin.json och flaggar drift i LÄS-rapporten; kontrollen är mekaniserad (skript eller hook), inte prosa
- [ ] #2 Marcus har uppdaterat pluginen till ≥ 1.34.0 och nästa session-end/paus kör sessions-worktree-klassen skarpt (torrkörning först)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
