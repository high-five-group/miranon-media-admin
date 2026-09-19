# Efter ett kvotavbrott: läs worktrees före uppväckning, och låt första ordern vara en lokal WIP-commit

`[UNIVERSAL]`

**Efter ett kvotavbrott: läs worktrees före uppväckning, och låt första
ordern vara en lokal WIP-commit.** Instans (S127, 2026-09-18): API:ets
sessionsgräns (HTTP 429) dödade tre bygg-agenter mitt i arbetet
(`451.7`, `455`, `451.4`). Deras worktrees lästes innan något rördes —
allt ocommittat arbete låg kvar (8 + 1 + 10 filer). Alla tre återupptogs
via sina egna transkript med första order "committa lokalt innan du gör
något annat". Inget arbete gick förlorat.

Varför `[UNIVERSAL]`: kvotavbrott/timeout-återhämtning är ett generellt
mönster för alla multiagent-orkestreringar i detta system — sekvensen
(läs tillstånd → persistera → fortsätt) gäller oavsett vilket repo eller
vilken uppgift som avbröts.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 6, Lesson-kandidat 14
och avsnittet "Kvotavbrottet".
