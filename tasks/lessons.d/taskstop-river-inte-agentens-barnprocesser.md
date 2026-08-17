# `TaskStop` avslutar agenten, inte dess barnprocesser — servrar den startat lever vidare föräldralösa

**Att stoppa en agent river inte processer agenten startat. En dev-server, en
watcher eller en testrunner som agenten drog igång fortsätter köra utan
förälder, håller sin port och förbrukar last — osynlig för den som stoppade
agenten och för alla andra som senare försöker binda samma port. Städa
processen explicit, eller starta den så att den dör med sitt jobb.**
`[UNIVERSAL]`

Instans (S102, 2026-08-17, `task-239`-agentens fynd): en `vite`-process låg
kvar **föräldralös på port 5399** efter att agenten stoppats med `TaskStop`.
Bokförd som lesson-kandidat i Del 16-skörden.

**Två närliggande instanser samma dygn, samma familj:** flake-riggens `pkill`
dödade FRÄMMANDE agenters dev-servrar (fixat i `task-251`, PR **#1499**), och
`task-251` gav worktree-deriverade portar (basport + index × 1000) just för
att kollisionerna ska upphöra. Städningen och portderiveringen löser olika
halvor av samma problem: den ena att processer överlever sin ägare, den andra
att de krockar när de gör det.

**Det generella:** varje bakgrundsprocess en agent startar är ett tillstånd
som överlever agenten. Livstiden måste ägas av någon — antingen av agenten
själv (starta i förgrunden, eller döda explicit före leverans) eller av
orkestreraren (stoppas i pausen, som heartbeat-monitorn och preview-servern
gör). Det som inte ägs av någon ligger kvar tills en människa märker det.
