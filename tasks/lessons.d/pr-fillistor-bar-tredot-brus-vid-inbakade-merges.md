# PR-fillistor bär tredot-brus när grenen har inbakade merges

**En PR:s fillista räknas normalt mot tredot-diffen (`branchA...branchB`) —
skillnaden sedan grenarnas GEMENSAMMA anfader (merge-base), inte sedan
`branchA`:s spets. Har grenen egna inbakade merges (t.ex. `main` mergad in i
featuregrenen, eller flera grenar som delar en äldre gemensam bas) kan
fillistan innehålla filer som redan landat på `main` via en HELT ANNAN väg —
utan att de två grenarna faktiskt är i konflikt om innehållet. Verifiera mot
`git merge-base` innan en sådan överlappning tolkas som en konflikt.**
`[UNIVERSAL]`

**Empiri (S91, tjugoförsta/tjugoandra resumen, 2026-08-01).** `#551` och
`#553` redigerade synligt samma tre filer (`README.md`-räknaren,
`docs/decisions/README.md`, `tasks/threads/README.md`) och bar båda en
räknare-bump 86→87 — vid första anblick en rak innehållskonflikt som skulle
kräva manuell sammanslagning av två parallella räkneuppdateringar. Den
faktiska lösningen (`Paushistorikens steg 1`) körde en `git rebase --onto`
över den gren som bar bruset i stället för att lösa konflikten rad för rad
mot den skenbara diffen — och landade rätt facit (88 filer) på första
försöket, exakt som förutsagt innan rebasen kördes. Tre konflikter löstes mot
**härledd fakta** (vad räknaren FAKTISKT skulle bli efter båda landat), inte
mot vad den råa fillistan påstod var i konflikt.

**Mekanismen:** en trestreck-diff (`...`) beräknas mot merge-base, så en gren
som inte är uppdaterad mot `main` sedan innan en annan PR landade kan visa
filer som "ändrade" enbart för att `main` gått om den — inte för att
innehållet faktiskt krockar. Radera aldrig antagandet om konflikt utan att
först fråga var de två grenarnas gemensamma anfader faktiskt ligger
(`git merge-base branchA branchB`) och diffa DÄRIFRÅN. Särskilt relevant i ett
flöde med merge queue och många kortlivade PR-grenar (`ADR-076`), där grenar
rutinmässigt skapas från olika punkter i `main`:s historik.
