# Biomes utskrift trunkeras vid 20 diagnostiker — det enda felet kan ligga bland de dolda

**[UNIVERSAL] `biome check .` skriver högst 20 diagnostiker som default
(`--max-diagnostics`) och listar dem i filordning, inte efter allvar. Med 14
warnings + 81 infos i repot fyller bruset kvoten, och raden "Found 1 error"
pekar på ett fel vars utskrift aldrig visas. CI-loggen ser då ut som att bara
kända warnings finns.** Mätt 2026-09-03 (S116, PR `#2241`, run
`33737419765`): jobbet Lint + Audit + TypeCheck rött, loggen visade 19
warning/info-poster + "Diagnostics not shown: 76" + "Found 1 error"; felet
var ett format-fel i en ny testfil som bygg-agenten redigerat EFTER sitt
`--write`-pass. Diagnos: kör lokalt `npx @biomejs/biome check <rörda
kataloger> --diagnostic-level=error --max-diagnostics=50` — bara errors,
inget brus. Två regler: (1) formatgrinden körs som ALLRA SISTA steg före
push, inte mitt i bygget; (2) läs Biomes slutrad ("Found N errors"), inte
bara exitkoden eller den synliga listan. Sessionsstart-skillens
"autofix FÖRE grind" gäller — men "före" betyder omedelbart före push, efter
sista redigeringen.
