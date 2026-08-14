---
id: TASK-211
title: Utvidga worktree-städmekanismen med en sessions-worktree-klass
status: In Progress
assignee: []
created_date: '2026-08-14 16:02'
updated_date: '2026-08-14 16:36'
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
- [x] #1 Städmekanismen bär en sessions-worktree-klass med samma säkerhetsgrindar som agent-klassen (scope, självskydd, förfader, rent träd, torrkörning default) där harness-låsgrinden ersätts av en process-cwd-grind (lsof -d cwd)
- [x] #2 Tvåsidigt bevis per TASK-94-mönstret: mekanismen tar bort en landad+ren sessions-worktree OCH lämnar olandad, oren respektive process-levande orörd (testskript)
- [x] #3 Paus-/end-rutinernas städanrop täcker den nya klassen, så ackumulering inte kan återuppstå tyst
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Hub-arbete (~/Repon/marcus-system) — commit b112257, pushad direkt till origin/main (hub-repot har ingen ruleset/branch-protection på main; verifierat via 'gh api repos/high-five-group/marcus-system/branches/main/protection' -> 404, och senaste 15 hub-commits landade direkt utan PR). plugin.json + marketplace.json bumpade 1.33.0 -> 1.34.0 (samma synk-mönster som 1.33.0-bumpen).

FORMVAL (AC #1): utvidgade scripts/stada-worktrees.sh med en andra scope-klass i SAMMA skript, i stället för ett systerskript. Motivering: scope-, självskydds-, förfader-, renhets- och grenpruningslogiken är ord för ord identisk mellan agent- och sessions-klassen — bekräftat genom att sessions-worktrees (s103-*, s104-*, s105-*, s96-* i spoken) bär SAMMA harness-placeholder-grenmönster worktree-KATALOGNAMN som agent-klassen (verifierat live i git worktree list --porcelain). Enda skillnaden är grind 1 (agent-* vs allt annat direkt barn till .claude/worktrees/) och grind 3 (harness-lås ersätts av en process-cwd-grind, lsof -a -d cwd, EN körning för hela skriptet — eftersom harnesset mätt INTE låser sessions-worktrees: noll locked-rader bland fyra levande kandidater).

process_cwd_i_tradet() jämför hela sökvägar (exakt eller sökväg+slash), INTE en substräng-prefix-match som referens-engångsskriptet använde (grep på ^SOKVAG) — den senare hade en latent bugg: två worktrees med delat namn-prefix (t.ex. s99-pref / s99-pref-extra) hade kunnat ge falskt skydd. Fixad och riktat regressionstestad i den permanenta implementationen.

AC #2 (tvåsidigt bevis): test-stada-worktrees.sh utvidgad med FAS 1b/2b — sju nya sessions-klass-kandidater (landad, olandad, smutsig, process-levande, prefix-kollisionsparet, samt agent-process som bevisar att process-cwd-grinden INTE läcker in i agent-klassen). 39/39 assertions gröna. FALSIFIERAT SKARPT: grinden gjordes medvetet trasig (process_cwd_i_tradet tvingad till 'ingen process funnen'), omkört — testet föll på EXAKT de 6 process-cwd-bundna assertionerna och inga andra, sedan återställd och 39/39 gröna igen. Ett latent pipefail-hål i testets egen orsak()-hjälpfunktion (tomt grep-träff kraschade skriptet under set -e i stället för att falla rent) hittades under samma falsifieringspass och fixades (tillagd || true).

AC #3: session-paus/SKILL.md + session-end/SKILL.md uppdaterade — städ-steget beskriver båda klasserna, och STOPPA-grinden (tidigare 'utanför agent-* -> STOPPA') omskriven: sessions-worktrees är nu en sanktionerad klass, inte längre en STOPPA-signal; grinden gäller numera det som är HELT utanför .claude/worktrees/. README-tabellen i pluginet synkad.

Grindar körda (mätt, foreground): shellcheck --severity=style --enable=all på båda skripten -> exit 0 (0 fynd). test-stada-worktrees.sh -> exit 0, 39/39 OK, 0 FEL.

Realvärld-verifiering (torrkörning, INGEN --utfor): körde det utvidgade skriptet mot spokens LEVANDE worktrees. Klassificeringen stämde exakt: s104-segment-passet skonades av process-cwd-grinden (en riktig vite-process, port 5175, cwd bekräftat med lsof), s105-fas65-aktivitetslogg skonades av renhets-grinden (smutsigt träd), s96-work-batch skonades av förfader-grinden (olandad gren proto/s96-konvergens-varv2).

DIVERGENS FRÅN UPPDRAGET (bokförd, ej blockerande): uppdraget källmärkte s103-resume-persondetalj-d som skyddad av en levande dev-server :5174 för Marcus granskning. Torrkörningen 2026-08-14 pekade i stället ut den som SKULLE TAS BORT (landad + rent träd, INGEN process-cwd-träff). Verifierat oberoende: 'lsof -nP -iTCP:5174 -sTCP:LISTEN' gav noll träffar, och 'ps aux' visade inga vite/npm-dev-processer alls för den katalogen — bara s104-segment-passets vite-process (port 5175) var levande. Dev-servern har alltså stängts ned sedan uppdraget skrevs (miljön har hunnit förändras, inte ett fel i grinden). INGEN --utfor kördes mot spoken i detta uppdrag; worktreen är orörd. Flaggas för orkestreraren/Marcus: nästa skarpa körning av mekanismen (vid ett kommande session-paus/session-end) kommer att ta bort den worktreen om dev-servern förblir nedstängd.

Spoke-diff denna landning: ENDAST backlog/tasks/task-211-...md (path-scopad add, verifierat mot origin/main-diff — 1 fil, 4 tillägg/3 borttagningar).
<!-- SECTION:NOTES:END -->
