# Ett arbetsträd N commits bakom ljuger om INNEHÅLL, inte bara om numrering — allt som läses där är hypotes

**Ett verktyg som läser sin data ur arbetsträdet rapporterar det TRÄDETS
tillstånd, inte projektets. Står trädet bakom levereras gammalt innehåll med
exakt samma auktoritativa ton som färskt — ingen varning, ingen avvikande
form. "Du kan få fel NUMMER i en gammal checkout" är en delmängd av den
verkliga regeln: VARJE fält verktyget visar är lika gammalt som trädet.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, resume 10:s lägesmätning): huvudkatalogen stod på
ett detached `f5ed41d2`, **91 commits bakom** `origin/main`. `npm run bl --
task 309.9` körd där rapporterade AC #1 som **obockad**; samma kort läst mot
`origin/main` bar den **bockad**. Bockningen hade landat i PR **#1897**
(*"chore(TASK-309.9): bocka AC #1 — prod-schemat och seeden landade och
bokförda"*, merged 2026-08-24T13:16:46Z, en enda fil i diffen: kortet självt).
Handoffen bar en varning om precis detta träd — men den gällde kort-SERIEN,
att `task create` där skulle allokera `task-311` i stället för `task-319`.
Ingenting sade att kortens INNEHÅLL var lika gammalt. Åtgärd: resumens dokgren
togs ur `origin/main` i stället för ur huvudkatalogen, och all faktainsamling
gjordes med `git show origin/main:<fil>`. Belägg:
`tasks/sessions/2026-08-20-session-108.md` § Del 20 § A–B.

**Det generella:** ett CLI som materialiserar sitt tillstånd ur filer i
arbetsträdet — backlog-kort, changelog, versionsfiler, konfiguration,
genererade register — är en VY av den checkouten, aldrig av projektet. Den
kritiska egenskapen är att felet inte har någon egen signatur: en obockad ruta
ser identisk ut oavsett om den aldrig bockats eller bockats i en commit trädet
inte hämtat. Därför räcker det inte att känna till att trädet är gammalt; man
måste behandla varje läsning därifrån som hypotes tills den prövats mot
`origin/<huvudgren>`. Och en varning som räknar upp EN konsekvens av
föråldrat träd (numret) läser lätt som en uttömmande lista — generalisera
alltid en sådan varning till dess klass innan den används som skydd.
