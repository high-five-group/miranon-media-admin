---
id: TASK-94
title: 'Skiva: worktree-städning in i avslutsrutinerna — session-paus och session-end'
status: To Do
assignee: []
created_date: '2026-07-30 19:11'
updated_date: '2026-07-30 21:32'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 174000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Harnesset tar bort en agents git-worktree ENDAST om den är oförändrad. En bygg-agent som levererat har per definition ändrat filer, så ingen av dem städas automatiskt — och ingen av våra rutiner gör det heller.

Läget vid upptäckten (2026-07-30, S91 artonde resumen): 16 avställda agent-worktrees under `.claude/worktrees/`, samtliga från redan landade kort, plus 27 lokala grenar som inte kunde raderas medan en worktree höll dem uppcheckade. Städat för hand i samma resume — 16 borttagna, grenar 32 → 5.

Roten är att städ-disciplinen skrevs för GRENAR, som syns i `git branch`, medan worktreen är en harness-artefakt vi aldrig modellerade. Del 25 städade 282 → 17 fjärrgrenar och stannade vid 17 lokala — exakt de som satt fast i worktrees.

Marcus beslut 2026-07-30: åtgärden hör hemma i avslutsrutinerna `session-paus` och `session-end`, alltså i marcus-system-pluginets skills, inte som en spoke-lokal engångsfix.

En hub-ändring kräver plugin-bump + `claude plugin update` i samma landning (memory: plugin-bump ⇒ Code-reinstall direkt).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Formen VALD och motiverad: rutin-steg i session-paus/session-end, mekanisk grind, eller båda — förkastade alternativ bär sina skäl
- [x] #2 Städningen är SÄKER per konstruktion: endast worktrees vars gren är verifierad förfader till main och vars träd är rent tas bort — verifierat per worktree, aldrig svepande
- [x] #3 Andra sessioners och andra aktörers worktrees rörs ALDRIG — regeln är utskriven och dess mekanism visad, inte antagen
- [x] #4 Tvåsidigt bevis: rutinen tar bort en landad worktree, och lämnar en olandad eller smutsig orörd
- [x] #5 Hub-ändringen landad med plugin-bump OCH claude plugin update körd i samma landning — versionen före och efter redovisad
- [x] #6 Grenar som frigörs av borttagen worktree hanteras eller lämnas medvetet — utfallet utskrivet, inte tyst
<!-- AC:END -->



## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
