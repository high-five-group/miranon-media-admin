# Bygg-agentens isolering är definitionsstyrd — en uppdragstext kan inte upphäva den

**[UNIVERSAL] En agents worktree-isolering bestäms av dess definition och av
harnesset, inte av uppdragstexten: ett uppdrag som säger "kör oisolerat i
huvudkatalogen" tas inte i bruk, och agenten kan inte lämna isoleringen själv
(`ExitWorktree` avvisas: *"cannot be called from a subagent with a cwd
override … This agent is already isolated"*).** Mätt två gånger 2026-08-30
(S113 resume 3, `TASK-309.43` och `TASK-309.44`): båda bygg-agenterna fick
instruktionen att bygga i huvudkatalogen så dev-servern på 5173 skulle visa
varje commit (Del 8-formen från 2026-08-29, då agenterna spawnades med en
annan typ); båda hamnade i `.claude/worktrees/agent-…`. Kostnaden var tre
konkreta fällor som uppdraget inte hade planerat för: (1) kortfilen låg
OTRACKAD i huvudkatalogen och fanns inte i worktreen — `cp` + separat
meddelande krävdes; (2) `playwright/.auth/user.json` följer inte med
(`.worktreeinclude` listar den inte); (3) en egen dev-server på ny port
stoppas av EF:ernas CORS-allowlist (`CORS_ALLOWED_ORIGINS`, secret utanför
repot) — agenten mätte i acceptance-fixturvärlden i stället. Regel: fråga
"bestäms detta vid spawn?" innan uppdraget förutsätter motsatsen (samma klass
som hook-/MCP-/agent-definitions-laddning, `CLAUDE.md` § En ny hooks
skarpbevis), och skriv uppdraget FÖR worktree: committa kortfilen på grenen
innan spawn eller peka ut sökvägen, nämn auth-filen och fixturvärlden, och
låt orkestreraren checka ut grenen `--detach` i huvudkatalogen för sin egen
mätning (grenen är låst av worktreen, en vanlig `checkout` avvisas).
