---
id: TASK-211
title: Utvidga worktree-städmekanismen med en sessions-worktree-klass
status: To Do
assignee: []
created_date: '2026-08-14 16:02'
labels:
  - tooling
  - hub
dependencies: []
priority: medium
ordinal: 385000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rotorsak (källa: hubbens scripts/stada-worktrees.sh huvud, TASK-94, läst 2026-08-14): scope-grind 1 är en sökvägs-allowlist på katalognamn agent-* och antar att andra aktörers worktrees 'ligger någon annanstans (t.ex. under sessionens egen scratchpad)'. Antagandet håller inte: sessions-worktrees (s93-*, s99-*, s103-* …) landar i samma katalog .claude/worktrees/ och faller utanför varje städmekanism — de ackumuleras tills någon råkar titta.

Mätt läge 2026-08-14 (S103, hälsosvep + engångsstädning på Marcus GO): 15 sessions-worktrees med landad gren + rent träd hade ackumulerats sedan S93 (~2 veckor). Engångsstädningen tog dem med grindarna förfader-till-origin/main + rent träd (spårat+ospårat) + ej låst + ingen levande process med cwd i worktree:t (lsof -d cwd — den grinden fångade skarpt en levande dev-server i s103-resume-persondetalj-d och en process i s104-segment-passet, som skonades). Skriptet var efemärt (session-scratchpad) — detta kort permanentar mekanismen.

Hemvist: skriptet bor i hub-pluginet (marcus-system) — arbetet är hub-sidigt och kräver antingen en OISOLERAD agent (worktree-isolerings-matrisen i CLAUDE.md: hub-arbete kan delegeras oisolerat) eller hub-commit-disciplin i egen landning. Spoke-kortet bokför behovet; formvalet (utvidga befintligt skript kontra syster-skript) görs mot TASK-94:s formvals-trail i skriptets huvud — läs den FÖRE design (pre-K-forensik).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Städmekanismen bär en sessions-worktree-klass med samma säkerhetsgrindar som agent-klassen (scope, självskydd, förfader, rent träd, torrkörning default) där harness-låsgrinden ersätts av en process-cwd-grind (lsof -d cwd)
- [ ] #2 Tvåsidigt bevis per TASK-94-mönstret: mekanismen tar bort en landad+ren sessions-worktree OCH lämnar olandad, oren respektive process-levande orörd (testskript)
- [ ] #3 Paus-/end-rutinernas städanrop täcker den nya klassen, så ackumulering inte kan återuppstå tyst
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
