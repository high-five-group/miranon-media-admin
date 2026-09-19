# En dev-server lämnad igång för en ögonmätning ockuperar en delad, odelbar port

`[UNIVERSAL]`

**En dev-server som lämnas igång åt Marcus "ifall han vill titta igen"
ockuperar port 5173, som är CORS-låst och odelbar — den blockerade en
bygg-agents staging-bevis i 17 minuter (`TASK-481`). Dev-servern för en
ögonmätning stoppas i samma stund som beskedet kommit, och varje order
som kräver staging-e2e föregås av en kontroll att 5173 är fri.**

Varför `[UNIVERSAL]`: mönstret — en delad, exklusiv, icke-parallelliserbar
resurs (en port, ett lås, en semafor) som en agent lämnar upptagen "ifall
den behövs igen" i stället för att släppa den direkt efter sitt syfte är
uppfyllt — är ett generellt AFK-multiagent-koordineringsproblem, inte
specifikt för dev-servrar eller för denna app.

Källa: orkestrerarens fynd, S127 (2026-09-19), citerat i uppdraget till
denna stängningsbatch som Kandidat 24.
