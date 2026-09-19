# "Räknaren räknar settlade, inte lyckade" döljer det vanligaste felfallet

`[UNIVERSAL]`

**En förloppsindikator som observability lutar sig mot måste skilja
utfall (lyckad/misslyckad), annars är det vanligaste felfallet osynligt.**
En räknare som ökar i `.finally()` (settlad, oavsett om anropet kastade)
ser identisk ut vid "alla lyckades" och "alla misslyckades" — baren når
100 % i båda fallen, och den enda observability-kanalen (Sentry) fyrade i
detta fall bara vid en annan avgörandegrund (timeout), inte vid detta.

Varför `[UNIVERSAL]`: mönstret är generellt för varje förloppsräknare/
progress-bar som backas av async-hämtningar med felhantering — inte
specifikt för Airtable eller denna app. En räknare som mäter "avslutat"
i stället för "lyckat" är en klassisk observability-blind fläck.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 2, Lesson-kandidat 3
(landad i `TASK-451.2`, PR #2534).
