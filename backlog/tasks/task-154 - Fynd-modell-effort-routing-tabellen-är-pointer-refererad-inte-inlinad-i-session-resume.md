---
id: TASK-154
title: >-
  Fynd: modell/effort-routing-tabellen är pointer-refererad, inte inlinad, i
  session-resume
status: To Do
assignee: []
created_date: '2026-08-07 11:10'
labels: []
dependencies: []
ordinal: 265000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Inventerat i TASK-149.6 (docs/research/arbetsform-reglernas-bararkarta-2026-08-07.md, Fynd 1). session-start/SKILL.md § "Sub-disciplin — orkestrar-rollen vid start" (rad 40-60, plugin marcus-system v1.29.0) bär tier-policyns fulla routing-tabell (vilken agent/modell för vilken uppgiftsklass). Regeln gäller uttryckligen "Vid varje agent-spawn" — hela sessionen, inte bara starten. session-resume/SKILL.md § "Orkestrerar-roll + parallellitet" (rad 84-91) skriver bara: "modell/effort-routingen ... gäller från första väckning — fulltext i session-startens sub-discipliner" — en POINTER, ingen kopia. Att invokera session-resume-skillen laddar INTE automatiskt session-start/SKILL.md:s innehåll i samma steg. En resumead session har alltså ingen inlinad vägledning för agent/modell-val, bara en hänvisning till en fil den kanske aldrig läser. Samma riskform som T126 (prototype-skillens § 5-fall), fast på en annan regel i samma skill-par. Facit-fixen finns redan som prejudikat: ägarlappsregeln (samma sub-disciplin-familj) FICK sin inline-fix i session-resume efter en mätt S93-incident (se G5 i kartan) — routing-tabellen fick det inte, trots att den citeras i SAMMA mening som ägarlappens rubrik.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Modell/effort-routing-tabellen (eller motsvarande fulltext) finns läsbar direkt i session-resume/SKILL.md utan att kräva en separat läsning av session-start/SKILL.md — mekanismvalet (full inlining à la ägarlappen, eller annan lösning) redovisat med skäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
