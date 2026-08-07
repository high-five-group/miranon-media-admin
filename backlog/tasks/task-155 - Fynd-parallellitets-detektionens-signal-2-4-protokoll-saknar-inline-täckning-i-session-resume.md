---
id: TASK-155
title: >-
  Fynd: parallellitets-detektionens signal 2-4-protokoll saknar inline-täckning
  i session-resume
status: To Do
assignee: []
created_date: '2026-08-07 11:11'
labels: []
dependencies: []
ordinal: 266000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Inventerat i TASK-149.6 (docs/research/arbetsform-reglernas-bararkarta-2026-08-07.md, Fynd 2). session-start/SKILL.md § "Sub-disciplin — parallellitets-detektion" (rad 62-76, plugin marcus-system v1.29.0) definierar FYRA signaler för parallell session (ägarlapp, git worktree list, annat aktivt dok, smutsigt huvudträd) plus det FULLA svarsprotokollet: "Träff → rapporteras som FYND i RAPPORTERA med förslaget att denna session tar egen worktree ... frågan åker i sessionsstartens befintliga kvittens-utbyte". session-resume/SKILL.md inlinar BARA signal 1 (ägarlappen) i sin helhet — uttryckligen och medvetet, med förklarande kommentar om S93-incidenten som orsakade fixen. Signal 2-4 (worktree-listan, annat aktivt dok, smutsigt träd) och framför allt det GEMENSAMMA svarsprotokollet finns BARA som samma pointer-mening som routing-tabellen (se syskonfyndet). En resumead session som stöter på signal 2, 3 eller 4 men inte signal 1 har alltså ingen inlinad vägledning för hur den ska reagera. Samma rotorsak som syskonfyndet (samma pointer-mening i källfilen) men en DISTINKT regel — vilken signal som helst utom ägarlappen kan trigga utan att protokollet finns tillgängligt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Parallellitets-detektionens fyra-signalers protokoll (eller motsvarande fulltext för signal 2-4, som redan finns för signal 1/ägarlappen) finns läsbart direkt i session-resume/SKILL.md — mekanismvalet redovisat med skäl
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
