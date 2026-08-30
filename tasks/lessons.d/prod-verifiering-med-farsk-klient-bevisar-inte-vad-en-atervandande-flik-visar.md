# Prod-verifiering med färsk klient bevisar inte vad en återvändande flik visar

**[UNIVERSAL] En headless-mätning mot prod går alltid som NY klient — utan
service worker, utan precache — och bevisar därför bara att den DEPLOYADE
koden är rätt, aldrig att användarens öppna flik kör den.** Mätt
2026-08-30 (S113 resume 3, `TASK-309.45`): orkestreraren prod-verifierade tre
fixar (radie i `@layer base`, menypost-släckare, ränna över kortet) med
smoke-kontot i både Chromium och WebKit — allt grönt — och sade "titta".
Marcus såg fortfarande de gamla felen: *"Hur tusan kunde du släppa igenom
det?"* Orsaken var inte koden utan appens egen uppdateringsväg
(`src/lib/app-uppdatering.ts`, S105-beslut): service workern precachar
`index.html`, en ny version tvingar ALDRIG en omladdning, så en återvändande
flik kör bundlen från före deployen tills användaren laddar om — Marcus
rensade site data och *"nu funkar det perfekt"*. Regel: efter varje
prod-landning av en UI-ändring ska beskedet till granskaren bära
omladdnings-instruktionen (⌘⇧R / rensa site data) i samma andetag som
"titta", och verifieringen ska SÄGA att den gjordes som färsk klient. En
uppdateringsväg utan synlig signal till användaren (ingen komponent lyssnar
på `APP_UPPDATERING_EVENT` i `src/components/`, grep 2026-08-30) är en egen
fråga för Marcus veto-lista — Lotta kommer också att sitta med en gammal
flik utan att veta om det.
