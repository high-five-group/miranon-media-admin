---
id: TASK-55
title: >-
  Fynd: incheckade linux-baselines är stale sedan S90 — T87:s visual-grind
  skulle fälla direkt vid aktivering
status: In Progress
assignee: []
created_date: '2026-07-27 15:35'
updated_date: '2026-07-27 18:08'
labels: []
dependencies: []
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Upptäckt under task-54.1 (2026-07-27) som sidofynd, ej orsakat av det arbetet.

SYMPTOM: de incheckade linux-baselines i tests/visual/__screenshots__ genererades 2026-07-24 (b9d3022, baseline-uppdatering ur CI). Därefter landade f0f11f3 (S90, prototyp-pass för personer-ytorna och check-in) som ändrade personer-ytan. Bilderna speglar alltså inte längre appens faktiska rendering.

BELÄGG: de lokala darwin-bilderna från samma datum (24 juli) föll på 4 av 12 tester efter S90-ändringen — verifierat med kontrastkörning mot BÅDA mockningsmekanismerna, vilket uteslöt att bytet var orsaken. Feltypen är höjdskillnad (t.ex. personlistan 2256px mot 3100px), alltså innehållsförändring, inte pixelbrus.

FÖRVÄNTAT BETEENDE: baselines ska spegla den rendering som anses korrekt. Så länge de inte gör det är T87:s visual-grind inte aktiverbar — den skulle fälla omedelbart på fyra tester av skäl som inte är regressioner.

ATT AVGÖRA I SKIVAN: baseline-uppdateringen kräver GRANSKNING, inte bara en dispatch. Workflowen visual-baselines.yml öppnar en PR där varje bild definierar vad som hädanefter anses korrekt, och den PR:en står i approval-required-läge just därför. Frågan är alltså inte "kör dispatchen" utan "vem granskar de fyra ändrade vyerna och när". Rimligen samma tillfälle som T87-aktiveringen övervägs, eftersom det är samma blick.

RELATERAT: T87 (visual-grindens aktivering, medvetet parkerad) — detta kort är ett faktiskt hinder för den aktiveringen och bör läsas ihop med den. Se även task-54.1:s implementation notes för kontrastbeviset.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
