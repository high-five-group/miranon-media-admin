---
id: TASK-94
title: 'Skiva: worktree-städning in i avslutsrutinerna — session-paus och session-end'
status: Done
assignee: []
created_date: '2026-07-30 19:11'
updated_date: '2026-07-31 06:38'
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

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Worktree-städningen mekaniserad i hub-pluginet: scripts/stada-worktrees.sh (322 rader) + scripts/test-stada-worktrees.sh (187 rader) + steg i BÅDA avslutsrutinerna (session-paus steg 5 med STOPPA-grind, session-end do-confirm-post 12). Plugin 1.22.0 to 1.23.0, claude plugin update kört i SAMMA landning och verifierat (exit 0, list visar 1.23.0 enabled) — hub-PR #8 mergad, spoke-PR #488. FEM GRINDAR PER WORKTREE: scope, självskydd, lås, förfader, rent träd; git worktree remove utan --force, git branch -d aldrig -D. MUTATIONSRUNDA: varje grind riven en i taget fäller testet (scope 4 fallna påståenden, förfader 2, självskydd 3, renhet 1, lås 1) — 22/22 gröna både i arbetskopian och ur installerade 1.23.0. Första mutationsförsöket gav falskt grönt (perl interpolerade variabeln i mönstret) och agenten hårdgjorde riggen med kontroll att exakt ett villkor patchades. AC #3:s bärare är SCOPE-grinden, inte förfader+renhet: torrkörningen mot verkliga repot höll tillbaka båda parallella sessioners worktrees på exakt den. Torrkörning: 17 worktrees, 7 kandidater, 10 behållna — inget utfört, det är Marcus beslut. AGENTEN BRÖT SITT EGET KONTRAKT och utredde det: dess worktree togs bort av harnesset MEDAN den arbetade, eftersom allt filarbete skedde i hub-repot och worktreen därför förblev oförändrad; efter API-avbrottet föll cwd till huvudkatalogen och isolerings-spärren slutade fälla i samma stund worktreen försvann. Exponering 4 min 13 s, mätt ur reflogen. Tre fynd om formen: spärren är FAIL-OPEN och upphör precis när den behövs · en agent vars kod bor i ett annat repo är maximalt utsatt för auto-borttagning, vilket är kortets egen premiss inverterad · efter en borttagen worktree finns ingen signal alls. PR #488, CI grön per jobb.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
